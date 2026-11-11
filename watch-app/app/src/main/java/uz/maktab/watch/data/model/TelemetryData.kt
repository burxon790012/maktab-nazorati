package uz.maktab.watch.data.model

import com.google.gson.annotations.SerializedName
import java.util.UUID

/**
 * Serverga yuboriladigan telemetriya ma'lumotlari.
 * Xavfsizlik talabi (Item 11): device_token JSON tanasida yuborilmaydi,
 * faqat x-device-token sarlavhasida (header) uzatiladi.
 */
data class TelemetryPayload(
    @SerializedName("record_id") val recordId: String = UUID.randomUUID().toString(),
    @SerializedName("device_id") val deviceId: String,
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("accuracy") val accuracy: Float,
    @SerializedName("speed") val speed: Float,
    @SerializedName("altitude") val altitude: Double,
    @SerializedName("battery_level") val batteryLevel: Int,
    @SerializedName("is_charging") val isCharging: Boolean,
    @SerializedName("heart_rate") val heartRate: Int?,
    @SerializedName("body_temperature") val bodyTemperature: Float? = null,
    @SerializedName("step_count") val stepCount: Int?,
    @SerializedName("heading") val heading: Float? = null,
    @SerializedName("is_sos") val isSos: Boolean = false,
    @SerializedName("recorded_at") val recordedAt: Long,
    @SerializedName("sent_at") val sentAt: Long = System.currentTimeMillis(),
    @SerializedName("stale") val stale: Boolean = false,
    @SerializedName("location_age_ms") val locationAgeMs: Long = 0L,
    @SerializedName("connection_type") val connectionType: String = "WIFI"
)

data class HeartbeatPayload(
    @SerializedName("deviceId") val deviceId: String,
    @SerializedName("batteryLevel") val batteryLevel: Int,
    @SerializedName("isCharging") val isCharging: Boolean,
    @SerializedName("lastFixTime") val lastFixTime: Long?,
    @SerializedName("connectionType") val connectionType: String,
    @SerializedName("unsyncedCount") val unsyncedCount: Int
)

data class BatchSyncPayload(
    @SerializedName("deviceId") val deviceId: String,
    @SerializedName("records") val records: List<TelemetryPayload>
)

data class ApiResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String? = null,
    @SerializedName("geofenceStatus") val geofenceStatus: String? = "UNKNOWN",
    @SerializedName("geofence_status") val geofenceStatusSnake: String? = "UNKNOWN",
    @SerializedName("serverTime") val serverTime: Long? = null,
    @SerializedName("duplicate") val duplicate: Boolean? = false
)

data class PairDevicePayload(
    @SerializedName("code") val code: String,
    @SerializedName("deviceUid") val deviceUid: String,
    @SerializedName("model") val model: String = "Samsung Galaxy Watch 5 Pro"
)

data class PairResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String? = null,
    @SerializedName("deviceId") val deviceId: String? = null,
    @SerializedName("deviceUid") val deviceUid: String? = null,
    @SerializedName("deviceToken") val deviceToken: String? = null,
    @SerializedName("token") val token: String? = null,
    @SerializedName("studentId") val studentId: String? = null
)

data class ActivateDevicePayload(
    @SerializedName("deviceId") val deviceId: String
)
