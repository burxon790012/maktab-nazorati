package uz.maktab.watch.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

/**
 * Item 3 talabi: Room migration v1 -> v2 (recordId, bodyTemperature, heading, sentAt, stale, locationAgeMs, connectionType)
 */
@Database(entities = [LocationEntity::class], version = 2, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {

    abstract fun locationDao(): LocationDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE offline_locations ADD COLUMN recordId TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE offline_locations ADD COLUMN bodyTemperature REAL")
                db.execSQL("ALTER TABLE offline_locations ADD COLUMN heading REAL")
                db.execSQL("ALTER TABLE offline_locations ADD COLUMN sentAt INTEGER NOT NULL DEFAULT 0")
                db.execSQL("ALTER TABLE offline_locations ADD COLUMN stale INTEGER NOT NULL DEFAULT 0")
                db.execSQL("ALTER TABLE offline_locations ADD COLUMN locationAgeMs INTEGER NOT NULL DEFAULT 0")
                db.execSQL("ALTER TABLE offline_locations ADD COLUMN connectionType TEXT NOT NULL DEFAULT 'OFFLINE_SYNC'")
            }
        }

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "maktab_watch_db"
                )
                    .addMigrations(MIGRATION_1_2)
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
