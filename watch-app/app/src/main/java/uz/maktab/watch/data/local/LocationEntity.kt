package uz.maktab.watch.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import uz.maktab.watch.data.model.TelemetryPayload
import java.util.UUID

/**
 * Internet bo'lmaganda soat xotirasida (oflayn kesh) saqlanadigan koordinatalar.
 * Item 3 talabi: recordId (UUID) biriktiriladi, bodyTemperature va heading saqlanadi.
 */
@Entity(tableName = "offline_locations")
data class LocationEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val recordId: String = UUID.randomUUID().toString(),
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float,
    val speed: Float,
    val altitude: Double,
    val batteryLevel: Int,
    val isCharging: Boolean,
    val heartRate: Int?,
    val bodyTemperature: Float? = null,
    val stepCount: Int?,
    val heading: Float? = null,
    val isSos: Boolean = false,
    val recordedAt: Long,
    val sentAt: Long = System.currentTimeMillis(),
    val stale: Boolean = false,
    val locationAgeMs: Long = 0L,
    val connectionType: String = "OFFLINE_SYNC",
    val isSynced: Boolean = false
) {
    fun toPayload(deviceId: String): TelemetryPayload {
        val now = System.currentTimeMillis()
        val realAge = if (stale) locationAgeMs else (now - recordedAt)
        return TelemetryPayload(
            recordId = recordId,
            deviceId = deviceId,
            latitude = latitude,
            longitude = longitude,
            accuracy = accuracy,
            speed = speed,
            altitude = altitude,
            batteryLevel = batteryLevel,
            isCharging = isCharging,
            heartRate = heartRate,
            bodyTemperature = bodyTemperature,
            stepCount = stepCount,
            heading = heading,
            isSos = isSos,
            recordedAt = recordedAt,
            sentAt = now,
            stale = stale,
            locationAgeMs = realAge,
            connectionType = "OFFLINE_SYNC"
        )
    }
}
