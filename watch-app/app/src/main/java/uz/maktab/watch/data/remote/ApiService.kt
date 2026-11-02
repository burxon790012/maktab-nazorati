package uz.maktab.watch.data.remote

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST
import uz.maktab.watch.data.model.ApiResponse
import uz.maktab.watch.data.model.BatchSyncPayload
import uz.maktab.watch.data.model.TelemetryPayload

interface ApiService {

    @POST("api/v1/telemetry")
    suspend fun sendTelemetry(
        @Body payload: TelemetryPayload
    ): Response<ApiResponse>

    @POST("api/v1/sos")
    suspend fun sendSos(
        @Body payload: TelemetryPayload
    ): Response<ApiResponse>

    @POST("api/v1/sync")
    suspend fun syncBatch(
        @Body payload: BatchSyncPayload
    ): Response<ApiResponse>
}
