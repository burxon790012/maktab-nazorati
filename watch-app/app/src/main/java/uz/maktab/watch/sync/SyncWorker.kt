package uz.maktab.watch.sync

import android.content.Context
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import uz.maktab.watch.data.local.AppDatabase
import uz.maktab.watch.data.model.BatchSyncPayload
import uz.maktab.watch.data.remote.NetworkClient

/**
 * Item 5 talabi: Oflayn ma'lumotlarni WorkManager orqali kafolatli sinxronlash.
 * Mutex bilan himoyalangan, navbat bo'shaguncha 50 talik partiyalarda (batch) yuboradi.
 */
class SyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val context = applicationContext
        val token = NetworkClient.getDeviceToken(context)
        if (token.isNullOrBlank()) {
            return Result.failure()
        }

        val deviceId = NetworkClient.getDeviceId(context)
        val db = AppDatabase.getDatabase(context)
        val api = NetworkClient.getApi(context)

        return try {
            syncMutex.withLock {
                while (true) {
                    val batch = db.locationDao().getUnsyncedLocations(limit = 50)
                    if (batch.isEmpty()) break

                    val payload = BatchSyncPayload(
                        deviceId = deviceId,
                        records = batch.map { it.toPayload(deviceId) }
                    )

                    val response = api.syncBatch(token, payload)
                    if (response.isSuccessful) {
                        db.locationDao().deleteLocationsByIds(batch.map { it.id })
                    } else {
                        val code = response.code()
                        if (code == 401 || code == 403) {
                            return Result.failure()
                        }
                        if (code == 408 || code == 429 || code >= 500) {
                            return Result.retry()
                        }
                        // Boshqa 4xx xatoda o'chirish (not valid)
                        db.locationDao().deleteLocationsByIds(batch.map { it.id })
                    }
                }
            }
            Result.success()
        } catch (_: Exception) {
            Result.retry()
        }
    }

    companion object {
        val syncMutex = Mutex()
        private const val WORK_NAME = "smartchild_offline_sync_work"

        fun enqueue(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val request = OneTimeWorkRequestBuilder<SyncWorker>()
                .setConstraints(constraints)
                .build()

            WorkManager.getInstance(context).enqueueUniqueWork(
                WORK_NAME,
                ExistingWorkPolicy.KEEP,
                request
            )
        }
    }
}

