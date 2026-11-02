package uz.maktab.watch.presentation

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.ButtonDefaults
import androidx.wear.compose.material.CircularProgressIndicator
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.ScalingLazyColumn
import androidx.wear.compose.material.Text
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import uz.maktab.watch.data.remote.NetworkClient
import uz.maktab.watch.presentation.theme.MaktabWatchTheme
import uz.maktab.watch.service.TrackingService
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : ComponentActivity() {

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val fineLocation = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
        if (fineLocation) {
            startTrackingService()
        } else {
            Toast.makeText(this, "GPS ruxsati zarur!", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        checkAndRequestPermissions()

        setContent {
            MaktabWatchTheme {
                WatchAppScreen(
                    onSosTrigger = { triggerSos() },
                    onToggleTracking = { toggleTracking() }
                )
            }
        }
    }

    private fun checkAndRequestPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT_WATCH) {
            permissions.add(Manifest.permission.BODY_SENSORS)
        }

        val allGranted = permissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }

        if (allGranted) {
            startTrackingService()
        } else {
            permissionLauncher.launch(permissions.toTypedArray())
        }
    }

    private fun startTrackingService() {
        val intent = Intent(this, TrackingService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }

    private fun toggleTracking() {
        val isRunning = TrackingService.serviceState.value.isRunning
        val intent = Intent(this, TrackingService::class.java)
        if (isRunning) {
            stopService(intent)
        } else {
            startTrackingService()
        }
    }

    private fun triggerSos() {
        val intent = Intent(this, TrackingService::class.java)
        startTrackingService()
        // Servis orqali SOS chaqirish
        TrackingService.instance?.triggerSos()
        Toast.makeText(this, "🚨 SOS SIGNAL YUBORILDI!", Toast.LENGTH_LONG).show()
    }
}

@Composable
fun WatchAppScreen(
    onSosTrigger: () -> Unit,
    onToggleTracking: () -> Unit
) {
    val serviceState by TrackingService.serviceState.collectAsState()
    val context = LocalContext.current
    val deviceId = remember { NetworkClient.getDeviceId(context) }

    ScalingLazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item {
            Text(
                text = "MAKTAB NAZORATI",
                style = MaterialTheme.typography.title1,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF00E5FF),
                modifier = Modifier.padding(top = 16.dp)
            )
        }

        // QURILMA VA ALOQA HOLATI
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Online/Offline indikatori
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(if (serviceState.isOnline) Color(0xFF00E676) else Color(0xFFFFEA00))
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = if (serviceState.isOnline) "Online" else "Oflayn",
                        fontSize = 10.sp,
                        color = Color.LightGray
                    )
                }

                // Batareya foizi
                Text(
                    text = "🔋 ${serviceState.batteryLevel}%",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (serviceState.batteryLevel < 20) Color(0xFFFF1744) else Color.White
                )
            }
        }

        // KATTA SOS TUGMASI (3 soniya bosib turish progress halqasi bilan)
        item {
            SosHoldButton(onSosTrigger = onSosTrigger)
        }

        // GEOFENCE HOLATI
        item {
            val statusColor = when (serviceState.geofenceStatus) {
                "INSIDE" -> Color(0xFF00E676)
                "OUTSIDE" -> Color(0xFFFF1744)
                else -> Color(0xFFFFEA00)
            }
            val statusText = when (serviceState.geofenceStatus) {
                "INSIDE" -> "YASHIL: Maktab hududida"
                "OUTSIDE" -> "QIZIL: Maktabdan tashqarida"
                else -> "SARIQ: Noma'lum"
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth(0.9f)
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0xFF1E1E1E))
                    .padding(vertical = 6.dp, horizontal = 8.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = statusText,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = statusColor,
                    textAlign = TextAlign.Center
                )
            }
        }

        // GPS KOORDINATALARI
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth(0.9f)
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0xFF1E1E1E))
                    .padding(6.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                val lat = serviceState.latitude
                val lng = serviceState.longitude
                val acc = serviceState.accuracy

                if (lat != null && lng != null) {
                    Text(
                        text = "GPS: ${String.format(Locale.US, "%.5f", lat)}, ${String.format(Locale.US, "%.5f", lng)}",
                        fontSize = 9.sp,
                        color = Color.White
                    )
                    Text(
                        text = "Aniqlik: ±${acc?.toInt() ?: 0}m | Kesh: ${serviceState.unsyncedCount} ta",
                        fontSize = 9.sp,
                        color = Color.Gray
                    )
                } else {
                    Text(
                        text = "GPS sun'iy yo'ldosh qidirilmoqda...",
                        fontSize = 9.sp,
                        color = Color(0xFFFFEA00)
                    )
                }
            }
        }

        // XIZMATNI YOQISH / O'CHIRISH TUGMASI
        item {
            Button(
                onClick = onToggleTracking,
                colors = ButtonDefaults.buttonColors(
                    backgroundColor = if (serviceState.isRunning) Color(0xFF263238) else Color(0xFF00B0FF)
                ),
                modifier = Modifier
                    .fillMaxWidth(0.85f)
                    .height(36.dp)
            ) {
                Text(
                    text = if (serviceState.isRunning) "Xizmatni to'xtatish" else "Kuzatuvni boshlash",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // QURILMA IDSI
        item {
            Text(
                text = "ID: $deviceId",
                fontSize = 8.sp,
                color = Color.DarkGray,
                modifier = Modifier.padding(bottom = 16.dp)
            )
        }
    }
}

@Composable
fun SosHoldButton(onSosTrigger: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var progress by remember { mutableFloatStateOf(0f) }
    var isHolding by remember { mutableStateOf(false) }
    var holdJob by remember { mutableStateOf<Job?>(null) }

    val animatedProgress by animateFloatAsState(targetValue = progress, label = "sosProgress")

    Box(
        modifier = Modifier
            .size(96.dp)
            .pointerInput(Unit) {
                detectTapGestures(
                    onPress = {
                        isHolding = true
                        progress = 0f
                        holdJob = scope.launch {
                            val startTime = System.currentTimeMillis()
                            val duration = 3000L // 3 soniya

                            while (System.currentTimeMillis() - startTime < duration) {
                                val elapsed = System.currentTimeMillis() - startTime
                                progress = elapsed.toFloat() / duration
                                delay(50)
                            }
                            progress = 1f
                            // 3 soniya to'lganda vibratsiya va signal
                            vibrateDevice(context)
                            onSosTrigger()
                            delay(500)
                            progress = 0f
                            isHolding = false
                        }

                        tryAwaitRelease()
                        // Barmoq olinsa bekor qilish
                        holdJob?.cancel()
                        progress = 0f
                        isHolding = false
                    }
                )
            },
        contentAlignment = Alignment.Center
    ) {
        // Aylana progress halqasi (3 soniyani ko'rsatadi)
        if (isHolding) {
            CircularProgressIndicator(
                progress = animatedProgress,
                modifier = Modifier.fillMaxSize(),
                indicatorColor = Color(0xFFFF1744),
                trackColor = Color(0x33FF1744),
                strokeWidth = 5.dp
            )
        }

        // Markazdagi qizil SOS doirasi
        Box(
            modifier = Modifier
                .size(80.dp)
                .clip(CircleShape)
                .background(if (isHolding) Color(0xFFD50000) else Color(0xFFFF1744)),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "SOS",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White
                )
                Text(
                    text = if (isHolding) "${((1f - progress) * 3).toInt() + 1}s" else "3s bosing",
                    fontSize = 9.sp,
                    color = Color.White.copy(alpha = 0.8f)
                )
            }
        }
    }
}

private fun vibrateDevice(context: android.content.Context) {
    try {
        val vibrator = context.getSystemService(android.content.Context.VIBRATOR_SERVICE) as? Vibrator
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator?.vibrate(VibrationEffect.createOneShot(500, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator?.vibrate(500)
        }
    } catch (_: Exception) {}
}
