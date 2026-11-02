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
import android.net.NetworkRequest
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
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.maktab.watch.R
import uz.maktab.watch.data.local.AppDatabase
import uz.maktab.watch.data.local.LocationEntity
import uz.maktab.watch.data.model.BatchSyncPayload
import uz.maktab.watch.data.model.TelemetryPayload
import uz.maktab.watch.data.remote.NetworkClient
import uz.maktab.watch.presentation.MainActivity
import uz.maktab.watch.sensor.HealthTracker

class TrackingService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + Job())
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var db: AppDatabase
    private lateinit var healthTracker: HealthTracker
    private lateinit var connectivityManager: ConnectivityManager

    private var isSosMode = false
    private var lastKnownLocation: Location? = null
    private var batteryLevel: Int = 100
    private var isCharging: Boolean = false
    private var isOnline: Boolean = false

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

    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            isOnline = true
            _serviceState.value = _serviceState.value.copy(isOnline = true)
            // Internet qaytishi bilan oflayn saqlangan nuqtalarni serverga yuborish
            syncOfflineData()
        }

        override fun onLost(network: Network) {
            isOnline = false
            _serviceState.value = _serviceState.value.copy(isOnline = false)
        }
    }

    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            val location = result.lastLocation ?: return
            lastKnownLocation = location

            _serviceState.value = _serviceState.value.copy(
                latitude = location.latitude,
                longitude = location.longitude,
                accuracy = location.accuracy,
                lastUpdated = System.currentTimeMillis()
            )

            processLocation(location, isSos = isSosMode)
        }
    }

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        db = AppDatabase.getDatabase(this)
        healthTracker = HealthTracker(this)
        healthTracker.startTracking()

        connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()
        connectivityManager.registerNetworkCallback(request, networkCallback)

        registerReceiver(batteryReceiver, IntentFilter(Intent.ACTION_BATTERY_CHANGED))

        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification("Xizmat ishga tushirildi"))
        startLocationUpdates(intervalMs = NORMAL_INTERVAL_MS)
        _serviceState.value = _serviceState.value.copy(isRunning = true)
    }

    @SuppressLint("MissingPermission")
    private fun startLocationUpdates(intervalMs: Long) {
        fusedLocationClient.removeLocationUpdates(locationCallback)

        val priority = if (isSosMode) Priority.PRIORITY_HIGH_ACCURACY else Priority.PRIORITY_BALANCED_POWER_ACCURACY
        val locationRequest = LocationRequest.Builder(priority, intervalMs)
            .setMinUpdateIntervalMillis(intervalMs / 2)
            .setMinUpdateDistanceMeters(if (isSosMode) 0f else 5f)
            .build()

        fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper())
    }

    private fun processLocation(loc: Location, isSos: Boolean) {
        serviceScope.launch {
            val deviceId = NetworkClient.getDeviceId(this@TrackingService)
            val deviceToken = NetworkClient.getDeviceToken(this@TrackingService)
            val heartRate = healthTracker.heartRate.value
            val steps = healthTracker.stepCount.value

            val payload = TelemetryPayload(
                deviceId = deviceId,
                deviceToken = deviceToken,
                latitude = loc.latitude,
                longitude = loc.longitude,
                accuracy = loc.accuracy,
                speed = loc.speed,
                altitude = loc.altitude,
                batteryLevel = batteryLevel,
                isCharging = isCharging,
                heartRate = heartRate,
                bodyTemperature = healthTracker.bodyTemperature.value,
                stepCount = steps,
                heading = if (loc.hasBearing()) loc.bearing else null,
                isSos = isSos,
                recordedAt = System.currentTimeMillis()
            )

            if (isOnline) {
                try {
                    val api = NetworkClient.getApi(this@TrackingService)
                    val response = if (isSos) api.sendSos(payload) else api.sendTelemetry(payload)
                    if (!response.isSuccessful) {
                        saveToLocalDb(payload)
                    } else {
                        _serviceState.value = _serviceState.value.copy(
                            lastServerContact = System.currentTimeMillis(),
                            geofenceStatus = response.body()?.geofenceStatus ?: "INSIDE"
                        )
                    }
                } catch (e: Exception) {
                    saveToLocalDb(payload)
                }
            } else {
                saveToLocalDb(payload)
            }
        }
    }

    private suspend fun saveToLocalDb(payload: TelemetryPayload) {
        val entity = LocationEntity(
            latitude = payload.latitude,
            longitude = payload.longitude,
            accuracy = payload.accuracy,
            speed = payload.speed,
            altitude = payload.altitude,
            batteryLevel = payload.batteryLevel,
            isCharging = payload.isCharging,
            heartRate = payload.heartRate,
            stepCount = payload.stepCount,
            isSos = payload.isSos,
            recordedAt = payload.recordedAt
        )
        db.locationDao().insert(entity)
        val count = db.locationDao().getUnsyncedCount()
        _serviceState.value = _serviceState.value.copy(unsyncedCount = count)
    }

    private fun syncOfflineData() {
        serviceScope.launch {
            try {
                val unsynced = db.locationDao().getUnsyncedLocations(limit = 50)
                if (unsynced.isEmpty()) return@launch

                val deviceId = NetworkClient.getDeviceId(this@TrackingService)
                val deviceToken = NetworkClient.getDeviceToken(this@TrackingService)

                val payload = BatchSyncPayload(
                    deviceId = deviceId,
                    deviceToken = deviceToken,
                    items = unsynced.map { it.toPayload(deviceId, deviceToken) }
                )

                val response = NetworkClient.getApi(this@TrackingService).syncBatch(payload)
                if (response.isSuccessful) {
                    db.locationDao().deleteLocationsByIds(unsynced.map { it.id })
                    val count = db.locationDao().getUnsyncedCount()
                    _serviceState.value = _serviceState.value.copy(
                        unsyncedCount = count,
                        lastServerContact = System.currentTimeMillis()
                    )
                }
            } catch (_: Exception) {
                // Keyingi ulanishda qayta urinadi
            }
        }
    }

    fun triggerSos() {
        isSosMode = true
        vibrateSos()

        // SOS paytida har 5 soniyada GPS yangilanishiga o'tish
        startLocationUpdates(intervalMs = SOS_INTERVAL_MS)

        // Eng so'nggi ma'lum joylashuv bo'lsa darhol jo'natish
        lastKnownLocation?.let {
            processLocation(it, isSos = true)
        }

        // 3 daqiqadan so'ng avtomatik oddiy rejimga qaytish
        serviceScope.launch {
            kotlinx.coroutines.delay(180_000L)
            isSosMode = false
            startLocationUpdates(intervalMs = NORMAL_INTERVAL_MS)
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
            .setContentTitle("Maktab Nazorati")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_dialog_map)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        fusedLocationClient.removeLocationUpdates(locationCallback)
        healthTracker.stopTracking()
        try {
            unregisterReceiver(batteryReceiver)
            connectivityManager.unregisterNetworkCallback(networkCallback)
        } catch (_: Exception) {}
        _serviceState.value = _serviceState.value.copy(isRunning = false)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    data class ServiceUiState(
        val isRunning: Boolean = false,
        val isOnline: Boolean = false,
        val batteryLevel: Int = 100,
        val latitude: Double? = null,
        val longitude: Double? = null,
        val accuracy: Float? = null,
        val unsyncedCount: Int = 0,
        val geofenceStatus: String = "INSIDE",
        val lastServerContact: Long? = null,
        val lastUpdated: Long? = null
    )

    companion object {
        private const val CHANNEL_ID = "maktab_tracking_channel"
        private const val NOTIFICATION_ID = 1001

        private const val NORMAL_INTERVAL_MS = 60_000L // 60 soniya
        private const val SOS_INTERVAL_MS = 5_000L    // 5 soniya

        private val _serviceState = MutableStateFlow(ServiceUiState())
        val serviceState = _serviceState.asStateFlow()

        var instance: TrackingService? = null
            private set
    }
}
