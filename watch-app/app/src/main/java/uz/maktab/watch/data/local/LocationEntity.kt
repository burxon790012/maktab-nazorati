package uz.maktab.watch.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import uz.maktab.watch.data.model.TelemetryPayload

/**
 * Internet bo'lmaganda soat xotirasida (oflayn kesh) saqlanadigan koordinatalar
 */
@Entity(tableName = "offline_locations")
data class LocationEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float,
    val speed: Float,
    val altitude: Double,
    val batteryLevel: Int,
    val isCharging: Boolean,
    val heartRate: Int?,
    val stepCount: Int?,
    val isSos: Boolean,
    val recordedAt: Long,
    val isSynced: Boolean = false
) {
    fun toPayload(deviceId: String, deviceToken: String): TelemetryPayload {
        return TelemetryPayload(
            deviceId = deviceId,
            deviceToken = deviceToken,
            latitude = latitude,
            longitude = longitude,
            accuracy = accuracy,
            speed = speed,
            altitude = altitude,
            batteryLevel = batteryLevel,
            isCharging = isCharging,
            heartRate = heartRate,
            stepCount = stepCount,
            isSos = isSos,
            recordedAt = recordedAt
        )
    }
}
