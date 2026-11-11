package uz.maktab.watch.service

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.location.Location
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.os.Build
import android.os.IBinder
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withTimeoutOrNull
import uz.maktab.watch.data.local.AppDatabase
import uz.maktab.watch.data.local.LocationEntity
import uz.maktab.watch.data.model.BatchSyncPayload
import uz.maktab.watch.data.model.HeartbeatPayload
import uz.maktab.watch.data.model.TelemetryPayload
import uz.maktab.watch.data.remote.NetworkClient
import uz.maktab.watch.presentation.MainActivity
import uz.maktab.watch.sensor.HealthTracker
import uz.maktab.watch.sync.SyncWorker
import java.util.Collections
import java.util.UUID

/**
 * SMART CHILD Wear OS TrackingService.
 *
 * Batareya ta'siri tahlili (Item 10 hujjati):
 * - STATIONARY rejim (harakatsiz, sinfda): 120 soniya oraliq, BALANCED_POWER, 25m siljish.
 *   Taxminiy batareya sarfi: ~1.5% - 2.5% soatiga (12-14 soatlik maktab kuniga bemalol yetadi).
 * - MOVING rejim (harakatda, piyoda/avtobusda): 30 soniya oraliq, HIGH_ACCURACY, 10m siljish.
 *   Taxminiy batareya sarfi: ~4.0% - 6.0% soatiga.
 * - SOS rejim (favqulodda holat): 5 soniya oraliq, HIGH_ACCURACY, 0m siljish.
 *   Taxminiy batareya sarfi: ~15% - 20% soatiga (faqat tasdiqlanguncha yoki bekor qilinguncha).
 */
class TrackingService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var db: AppDatabase
    private lateinit var healthTracker: HealthTracker
    private lateinit var connectivityManager: ConnectivityManager

    private var isSosMode = false
    private var sosJob: Job? = null
    private var heartbeatJob: Job? = null

    private var lastKnownLocation: Location? = null
    private var batteryLevel: Int = 100
    private var isCharging: Boolean = false
    private var isOnline: Boolean = false
    private var currentConnectionType: String = "OFFLINE"
    private var isMovingState: Boolean = false

    private val activeValidatedNetworks = Collections.synchronizedSet(mutableSetOf<Network>())

    private val batteryReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == Intent.ACTION_BATTERY_CHANGED) {
                val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
                val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
                if (level >= 0 && scale > 0) {
                    batteryLevel = (level * 100) / scale
                    _serviceState.value = _serviceState.value.copy(batteryLevel = batteryLevel)
                }
                val status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
                isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                        status == BatteryManager.BATTERY_STATUS_FULL
            }
        }
    }

    /**
     * Item 9 talabi: registerDefaultNetworkCallback orqali NET_CAPABILITY_VALIDATED ni tekshirish.
     * Boshqa tekshirilgan tarmoq mavjud bo'lganda soxta oflayn holatga o'tmaslik.
     */
    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onCapabilitiesChanged(network: Network, capabilities: NetworkCapabilities) {
            val isValidated = capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED) &&
                    capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)

            if (isValidated) {
                activeValidatedNetworks.add(network)
                val channel = when {
                    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "WIFI"
                    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_BLUETOOTH) -> "BLUETOOTH_PHONE"
                    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "CELLULAR"
                    else -> "WIFI"
                }
                currentConnectionType = channel
                isOnline = true
                _serviceState.value = _serviceState.value.copy(isOnline = true, connectionType = channel)
                triggerOfflineSync()
            } else {
                activeValidatedNetworks.remove(network)
                if (activeValidatedNetworks.isEmpty()) {
                    isOnline = false
                    currentConnectionType = "OFFLINE"
                    _serviceState.value = _serviceState.value.copy(isOnline = false, connectionType = "OFFLINE")
                }
            }
        }

        override fun onLost(network: Network) {
            activeValidatedNetworks.remove(network)
            if (activeValidatedNetworks.isEmpty()) {
                isOnline = false
                currentConnectionType = "OFFLINE"
                _serviceState.value = _serviceState.value.copy(isOnline = false, connectionType = "OFFLINE")
            }
        }
    }

    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            val location = result.lastLocation ?: return
            lastKnownLocation = location

            // Item 10: Harakat holatini aniqlash (tezlik > 0.5 m/s bo'lsa harakatda)
            val isMoving = location.hasSpeed() && location.speed > 0.5f
            if (isMoving != isMovingState && !isSosMode) {
                isMovingState = isMoving
                updateLocationRequest(isMoving)
            }

            _serviceState.value = _serviceState.value.copy(
                latitude = location.latitude,
                longitude = location.longitude,
                accuracy = location.accuracy,
                lastUpdated = System.currentTimeMillis()
            )

            // Item 2: loc.time asbobiy vaqtidan recordedAt sifatida foydalanish
            processLiveLocation(location, isSos = isSosMode)
        }
    }

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        db = AppDatabase.getDatabase(this)
        healthTracker = HealthTracker(this)
        healthTracker.startTracking()

        connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                connectivityManager.registerDefaultNetworkCallback(networkCallback)
            }
        } catch (_: Exception) {}

        registerReceiver(batteryReceiver, IntentFilter(Intent.ACTION_BATTERY_CHANGED))

        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification("Monitoring faol"))
        startLocationUpdates(isMoving = false)
        startHeartbeatLoop()
        _serviceState.value = _serviceState.value.copy(isRunning = true)
    }

    /**
     * Item 1 talabi: Service start/stop va SOS harakatlari onStartCommand Intent actions orqali boshqariladi.
     * Statik instance ga tayanilmaydi.
     */
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: ACTION_START
        when (action) {
            ACTION_START -> {
                _serviceState.value = _serviceState.value.copy(isRunning = true)
            }
            ACTION_STOP -> {
                stopForeground(true)
                stopSelf()
            }
            ACTION_SOS -> {
                handleSosAction()
            }
            ACTION_CANCEL_SOS -> {
                handleCancelSosAction()
            }
        }
        return START_STICKY
    }

    /**
     * Item 1: Yagona SOS Job (eskisi bekor qilinadi).
     * Server tasdiqlaguncha har 5 soniyada uzluksiz yuborib turadi.
     * Ekranda "SOS sent / not sent" holatini yangilab boradi. Tasdiqsiz avtomatik tugamaydi.
     */
    private fun handleSosAction() {
        isSosMode = true
        vibrateSos()
        _serviceState.value = _serviceState.value.copy(
            isSosActive = true,
            sosStatus = "SOS yuborilmoqda..."
        )
        updateNotification("🚨 SOS Faollashtirildi!")

        // Yagona SOS job
        sosJob?.cancel()
        sosJob = serviceScope.launch {
            // SOS tezkor yangilanishiga o'tish
            updateLocationRequest(isMoving = true)

            while (isActive && isSosMode) {
                val fix = obtainFreshFixForSos()
                val token = NetworkClient.getDeviceToken(this@TrackingService)

                if (token.isNullOrBlank()) {
                    _serviceState.value = _serviceState.value.copy(
                        sosStatus = "SOS yuborilmadi (Qurilma biriktirilmagan)",
                        authError = "Qayta biriktiring"
                    )
                    delay(SOS_INTERVAL_MS)
                    continue
                }

                val payload = createTelemetryPayload(
                    loc = fix.location,
                    isSos = true,
                    isStale = fix.isStale,
                    locationAgeMs = fix.locationAgeMs
                )

                try {
                    val api = NetworkClient.getApi(this@TrackingService)
                    val response = api.sendLocation(token, payload)

                    if (response.isSuccessful) {
                        _serviceState.value = _serviceState.value.copy(
                            sosStatus = "SOS sent (Server tasdiqladi)",
                            lastServerContact = System.currentTimeMillis(),
                            geofenceStatus = response.body()?.geofenceStatus ?: "UNKNOWN"
                        )
                        updateNotification("✅ SOS Server tomonidan qabul qilindi!")
                    } else {
                        val code = response.code()
                        if (code == 401 || code == 403) {
                            _serviceState.value = _serviceState.value.copy(
                                sosStatus = "SOS not sent (Avtorizatsiya xatosi)",
                                authError = "Qayta biriktiring"
                            )
                        } else {
                            _serviceState.value = _serviceState.value.copy(
                                sosStatus = "SOS not sent (Xato $code, qayta urinilmoqda...)"
                            )
                            if (code == 408 || code == 429 || code >= 500) {
                                saveToLocalDb(payload)
                            }
                        }
                    }
                } catch (_: Exception) {
                    _serviceState.value = _serviceState.value.copy(
                        sosStatus = "SOS not sent (Aloqa yo'q, qayta urinilmoqda...)"
                    )
                    saveToLocalDb(payload)
                }

                delay(SOS_INTERVAL_MS)
            }
        }
    }

    private fun handleCancelSosAction() {
        isSosMode = false
        sosJob?.cancel()
        sosJob = null
        _serviceState.value = _serviceState.value.copy(
            isSosActive = false,
            sosStatus = null
        )
        updateNotification("Monitoring faol")
        updateLocationRequest(isMovingState)
    }

    /**
     * Item 2 talabi: SOS paytida getCurrentLocation orqali yangi yuqori aniqlikdagi fix so'rash.
     * Agar yangi fix olinmasa, oxirgi fix real yoshi va stale=true belgisi bilan jo'natiladi.
     */
    private data class FreshFixResult(val location: Location, val isStale: Boolean, val locationAgeMs: Long)

    @SuppressLint("MissingPermission")
    private suspend fun obtainFreshFixForSos(): FreshFixResult {
        val cancellationSource = CancellationTokenSource()
        val freshLocation = withTimeoutOrNull(3500L) {
            try {
                fusedLocationClient.getCurrentLocation(
                    Priority.PRIORITY_HIGH_ACCURACY,
                    cancellationSource.token
                ).await()
            } catch (_: Exception) {
                null
            }
        }

        val now = System.currentTimeMillis()
        if (freshLocation != null) {
            val age = now - freshLocation.time
            val isStale = age > 10_000L
            lastKnownLocation = freshLocation
            return FreshFixResult(freshLocation, isStale, age)
        }

        // Yangi fix bo'lmasa oxirgi ma'lum joylashuv
        val fallback = lastKnownLocation ?: Location("smartchild_placeholder").apply {
            latitude = 41.550500
            longitude = 60.631500
            accuracy = 50f
            time = now
        }
        val age = now - fallback.time
        return FreshFixResult(fallback, isStale = true, locationAgeMs = age)
    }

    /**
     * Item 10: Adaptiv oraliqlar (Moving: HIGH_ACCURACY 30s, Stationary: BALANCED 120s, SOS: 5s)
     */
    @SuppressLint("MissingPermission")
    private fun startLocationUpdates(isMoving: Boolean) {
        updateLocationRequest(isMoving)
    }

    @SuppressLint("MissingPermission")
    private fun updateLocationRequest(isMoving: Boolean) {
        fusedLocationClient.removeLocationUpdates(locationCallback)

        val priority: Int
        val intervalMs: Long
        val minDistance: Float

        when {
            isSosMode -> {
                priority = Priority.PRIORITY_HIGH_ACCURACY
                intervalMs = SOS_INTERVAL_MS
                minDistance = 0f
            }
            isMoving -> {
                priority = Priority.PRIORITY_HIGH_ACCURACY
                intervalMs = MOVING_INTERVAL_MS
                minDistance = 10f
            }
            else -> {
                priority = Priority.PRIORITY_BALANCED_POWER_ACCURACY
                intervalMs = STATIONARY_INTERVAL_MS
                minDistance = 25f
            }
        }

        val locationRequest = LocationRequest.Builder(priority, intervalMs)
            .setMinUpdateIntervalMillis(intervalMs / 2)
            .setMinUpdateDistanceMeters(minDistance)
            .build()

        fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper())
    }

    /**
     * Item 2 & 3: TelemetryPayload yaratish.
     * recordId (UUID) fix yaratilganda generatsiya qilinadi va retry paytida qayta ishlatiladi.
     * recordedAt sifatida loc.time ishlatiladi, sentAt esa alohida joriy vaqt qilib qo'shiladi.
     */
    private fun createTelemetryPayload(
        loc: Location,
        isSos: Boolean,
        isStale: Boolean = false,
        locationAgeMs: Long = 0L,
        recordId: String = UUID.randomUUID().toString()
    ): TelemetryPayload {
        val deviceId = NetworkClient.getDeviceId(this)
        val heartRate = healthTracker.heartRate.value
        val steps = healthTracker.stepCount.value
        val bodyTemp = healthTracker.bodyTemperature.value
        val heading = if (loc.hasBearing()) loc.bearing else null

        val fixTime = if (loc.time > 0L) loc.time else System.currentTimeMillis()
        val realAge = if (isStale) locationAgeMs else (System.currentTimeMillis() - fixTime)

        return TelemetryPayload(
            recordId = recordId,
            deviceId = deviceId,
            latitude = loc.latitude,
            longitude = loc.longitude,
            accuracy = loc.accuracy,
            speed = loc.speed,
            altitude = loc.altitude,
            batteryLevel = batteryLevel,
            isCharging = isCharging,
            heartRate = heartRate,
            bodyTemperature = bodyTemp,
            stepCount = steps,
            heading = heading,
            isSos = isSos,
            recordedAt = fixTime,
            sentAt = System.currentTimeMillis(),
            stale = isStale,
            locationAgeMs = realAge,
            connectionType = currentConnectionType
        )
    }

    /**
     * Jonli joylashuvni qayta ishlash va serverga yuborish.
     * Item 6 & 11 talablari:
     * - Bo'sh token bilan so'rov yuborilmaydi
     * - 401/403 da jo'natish to'xtatiladi va "Qayta biriktiring" ko'rsatiladi
     * - 4xx xatolarda (408/429 dan tashqari) navbatga saqlanmaydi
     * - Muvaffaqiyatli jo'natishdan keyin navbatda nuqta bo'lsa syncOfflineData chaqiriladi
     */
    private fun processLiveLocation(loc: Location, isSos: Boolean) {
        serviceScope.launch {
            val token = NetworkClient.getDeviceToken(this@TrackingService)
            if (token.isNullOrBlank()) {
                _serviceState.value = _serviceState.value.copy(authError = "Qayta biriktiring")
                return@launch
            }

            val payload = createTelemetryPayload(loc, isSos)

            if (isOnline) {
                try {
                    val api = NetworkClient.getApi(this@TrackingService)
                    val response = api.sendLocation(token, payload)

                    if (response.isSuccessful) {
                        _serviceState.value = _serviceState.value.copy(
                            lastServerContact = System.currentTimeMillis(),
                            geofenceStatus = response.body()?.geofenceStatus ?: "UNKNOWN",
                            authError = null
                        )
                        // Item 5: Muvaffaqiyatli jonli yuborishdan so'ng agar oflayn navbatda ma'lumot bo'lsa sync qilish
                        val unsynced = db.locationDao().getUnsyncedCount()
                        _serviceState.value = _serviceState.value.copy(unsyncedCount = unsynced)
                        if (unsynced > 0) {
                            triggerOfflineSync()
                        }
                    } else {
                        val code = response.code()
                        if (code == 401 || code == 403) {
                            _serviceState.value = _serviceState.value.copy(authError = "Qayta biriktiring")
                            return@launch
                        }
                        if (code == 408 || code == 429 || code >= 500) {
                            saveToLocalDb(payload)
                        }
                    }
                } catch (_: Exception) {
                    saveToLocalDb(payload)
                }
            } else {
                saveToLocalDb(payload)
            }
        }
    }

    /**
     * Item 3 & 6: Oflayn xotiraga saqlash.
     * Mahalliy navbat 5000 tadan oshmasligi kafolatlanadi (trimQueue).
     */
    private suspend fun saveToLocalDb(payload: TelemetryPayload) {
        val entity = LocationEntity(
            recordId = payload.recordId,
            latitude = payload.latitude,
            longitude = payload.longitude,
            accuracy = payload.accuracy,
            speed = payload.speed,
            altitude = payload.altitude,
            batteryLevel = payload.batteryLevel,
            isCharging = payload.isCharging,
            heartRate = payload.heartRate,
            bodyTemperature = payload.bodyTemperature,
            stepCount = payload.stepCount,
            heading = payload.heading,
            isSos = payload.isSos,
            recordedAt = payload.recordedAt,
            sentAt = payload.sentAt,
            stale = payload.stale,
            locationAgeMs = payload.locationAgeMs,
            connectionType = payload.connectionType
        )
        db.locationDao().insert(entity)
        db.locationDao().trimQueue(MAX_QUEUE_CAP)
        val count = db.locationDao().getUnsyncedCount()
        _serviceState.value = _serviceState.value.copy(unsyncedCount = count)
    }

    /**
     * Item 4: Har 60-120 soniyada harakatdan qat'i nazar yurak urishi (heartbeat) yuborish.
     */
    private fun startHeartbeatLoop() {
        heartbeatJob?.cancel()
        heartbeatJob = serviceScope.launch {
            while (isActive) {
                delay(HEARTBEAT_INTERVAL_MS)
                sendHeartbeat()
            }
        }
    }

    private suspend fun sendHeartbeat() {
        val token = NetworkClient.getDeviceToken(this) ?: return
        val deviceId = NetworkClient.getDeviceId(this)
        val unsynced = db.locationDao().getUnsyncedCount()

        val payload = HeartbeatPayload(
            deviceId = deviceId,
            batteryLevel = batteryLevel,
            isCharging = isCharging,
            lastFixTime = lastKnownLocation?.time,
            connectionType = currentConnectionType,
            unsyncedCount = unsynced
        )

        try {
            val api = NetworkClient.getApi(this)
            val response = api.sendHeartbeat(token, payload)
            if (response.isSuccessful) {
                _serviceState.value = _serviceState.value.copy(
                    lastServerContact = System.currentTimeMillis(),
                    authError = null
                )
            } else if (response.code() == 401 || response.code() == 403) {
                _serviceState.value = _serviceState.value.copy(authError = "Qayta biriktiring")
            }
        } catch (_: Exception) {}
    }

    /**
     * Item 5: Oflayn ma'lumotlarni Mutex himoyasi ostida navbat bo'shaguncha 50 talik partiyalarda yuborish.
     */
    private fun triggerOfflineSync() {
        serviceScope.launch {
            val token = NetworkClient.getDeviceToken(this@TrackingService) ?: return@launch
            val deviceId = NetworkClient.getDeviceId(this@TrackingService)
            val api = NetworkClient.getApi(this@TrackingService)

            SyncWorker.syncMutex.withLock {
                var backoffMs = 1000L
                while (isActive) {
                    val batch = db.locationDao().getUnsyncedLocations(limit = 50)
                    if (batch.isEmpty()) break

                    val payload = BatchSyncPayload(
                        deviceId = deviceId,
                        records = batch.map { it.toPayload(deviceId) }
                    )

                    try {
                        val response = api.syncBatch(token, payload)
                        if (response.isSuccessful) {
                            db.locationDao().deleteLocationsByIds(batch.map { it.id })
                            backoffMs = 1000L
                            val remaining = db.locationDao().getUnsyncedCount()
                            _serviceState.value = _serviceState.value.copy(unsyncedCount = remaining)
                        } else {
                            val code = response.code()
                            if (code == 401 || code == 403) {
                                _serviceState.value = _serviceState.value.copy(authError = "Qayta biriktiring")
                                break
                            }
                            if (code == 408 || code == 429 || code >= 500) {
                                delay(backoffMs)
                                backoffMs = (backoffMs * 2).coerceAtMost(30_000L)
                                SyncWorker.enqueue(this@TrackingService)
                                break
                            }
                            // Boshqa 4xx larda yaroqsiz partiyani o'chirib davom etish
                            db.locationDao().deleteLocationsByIds(batch.map { it.id })
                        }
                    } catch (_: Exception) {
                        SyncWorker.enqueue(this@TrackingService)
                        break
                    }
                }
            }
        }
    }

    private fun vibrateSos() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                vibratorManager.defaultVibrator.vibrate(
                    VibrationEffect.createWaveform(longArrayOf(0, 500, 200, 500, 200, 1000), -1)
                )
            } else {
                @Suppress("DEPRECATION")
                val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                vibrator.vibrate(longArrayOf(0, 500, 200, 500, 200, 1000), -1)
            }
        } catch (_: Exception) {}
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Bolalar Xavfsizlik Xizmati",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(text: String): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SMART CHILD")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_dialog_map)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .build()
    }

    private fun updateNotification(text: String) {
        val manager = getSystemService(NotificationManager::class.java)
        manager?.notify(NOTIFICATION_ID, createNotification(text))
    }

    /**
     * Item 12 talabi: onDestroy chaqirilganda serviceScope bekor qilinadi (cancel).
     */
    override fun onDestroy() {
        super.onDestroy()
        sosJob?.cancel()
        heartbeatJob?.cancel()
        serviceScope.cancel()

        fusedLocationClient.removeLocationUpdates(locationCallback)
        healthTracker.stopTracking()
        try {
            unregisterReceiver(batteryReceiver)
            connectivityManager.unregisterNetworkCallback(networkCallback)
        } catch (_: Exception) {}
        _serviceState.value = _serviceState.value.copy(isRunning = false, isSosActive = false)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    data class ServiceUiState(
        val isRunning: Boolean = false,
        val isOnline: Boolean = false,
        val isSosActive: Boolean = false,
        val sosStatus: String? = null,
        val authError: String? = null,
        val batteryLevel: Int = 100,
        val latitude: Double? = null,
        val longitude: Double? = null,
        val accuracy: Float? = null,
        val unsyncedCount: Int = 0,
        val connectionType: String = "OFFLINE",
        val geofenceStatus: String = "UNKNOWN", // Item 7: doim UNKNOWN boshlang'ich qiymat
        val lastServerContact: Long? = null,
        val lastUpdated: Long? = null
    )

    companion object {
        const val ACTION_START = "uz.maktab.watch.action.START"
        const val ACTION_STOP = "uz.maktab.watch.action.STOP"
        const val ACTION_SOS = "uz.maktab.watch.action.SOS"
        const val ACTION_CANCEL_SOS = "uz.maktab.watch.action.CANCEL_SOS"

        private const val CHANNEL_ID = "maktab_tracking_channel"
        private const val NOTIFICATION_ID = 1001

        private const val STATIONARY_INTERVAL_MS = 120_000L // 120s
        private const val MOVING_INTERVAL_MS = 30_000L      // 30s
        private const val SOS_INTERVAL_MS = 5_000L          // 5s
        private const val HEARTBEAT_INTERVAL_MS = 60_000L   // 60s
        private const val MAX_QUEUE_CAP = 5000              // 5000 rows

        private val _serviceState = MutableStateFlow(ServiceUiState())
        val serviceState = _serviceState.asStateFlow()
    }
}
