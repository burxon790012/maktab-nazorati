package uz.maktab.watch.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface LocationDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(location: LocationEntity): Long

    @Query("SELECT * FROM offline_locations WHERE isSynced = 0 ORDER BY recordedAt ASC LIMIT :limit")
    suspend fun getUnsyncedLocations(limit: Int = 50): List<LocationEntity>

    @Query("DELETE FROM offline_locations WHERE id IN (:ids)")
    suspend fun deleteLocationsByIds(ids: List<Long>)

    @Query("SELECT COUNT(*) FROM offline_locations WHERE isSynced = 0")
    suspend fun getUnsyncedCount(): Int

    @Query("DELETE FROM offline_locations WHERE recordedAt < :timestamp")
    suspend fun clearOldData(timestamp: Long)
}
