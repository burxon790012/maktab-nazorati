package uz.maktab.watch.data.model

import com.google.gson.annotations.SerializedName

/**
 * Serverga yuboriladigan telemetriya ma'lumotlari
 */
data class TelemetryPayload(
    @SerializedName("device_id") val deviceId: String,
    @SerializedName("device_token") val deviceToken: String,
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
    @SerializedName("recorded_at") val recordedAt: Long = System.currentTimeMillis()
)

data class BatchSyncPayload(
    @SerializedName("device_id") val deviceId: String,
    @SerializedName("device_token") val deviceToken: String,
    @SerializedName("items") val items: List<TelemetryPayload>
)

data class ApiResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String?,
    @SerializedName("geofence_status") val geofenceStatus: String? // "INSIDE", "OUTSIDE", "UNKNOWN"
)
