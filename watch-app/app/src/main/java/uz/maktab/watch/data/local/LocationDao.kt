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
    suspend fun deleteLocationsByIds(ids: List<Long>): Int

    @Query("SELECT COUNT(*) FROM offline_locations WHERE isSynced = 0")
    suspend fun getUnsyncedCount(): Int

    /**
     * Item 6 talabi: mahalliy navbatni eng ko'pi bilan 5000 ta qatorda cheklash
     * (5000 tadan oshgan eng eski yozuvlar avtomatik o'chiriladi).
     */
    @Query("DELETE FROM offline_locations WHERE id IN (SELECT id FROM offline_locations ORDER BY recordedAt ASC LIMIT MAX(0, (SELECT COUNT(*) FROM offline_locations) - :maxCount))")
    suspend fun trimQueue(maxCount: Int = 5000): Int

    @Query("DELETE FROM offline_locations WHERE recordedAt < :timestamp")
    suspend fun clearOldData(timestamp: Long): Int
}
