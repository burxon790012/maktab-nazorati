package uz.maktab.watch.data.remote

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST
import uz.maktab.watch.data.model.ApiResponse
import uz.maktab.watch.data.model.BatchSyncPayload
import uz.maktab.watch.data.model.HeartbeatPayload
import uz.maktab.watch.data.model.TelemetryPayload

/**
 * SMART CHILD Wear OS REST API interfeysi.
 * Item 11 & 14 talablari:
 * 1. Har bir so'rovda token 'x-device-token' HTTP sarlavhasida (header) yuboriladi.
 * 2. Yo'llar backend/server.js dagi rasmiy marshrutlarga to'liq mos:
 *    - POST /api/devices/location (oddiy va SOS telemetriya)
 *    - POST /api/devices/heartbeat (muntazam yurak urishi holati)
 *    - POST /api/devices/sync (oflayn keshni partiyalab sinxronlash)
 */
interface ApiService {

    @POST("api/devices/location")
    suspend fun sendLocation(
        @Header("x-device-token") deviceToken: String,
        @Body payload: TelemetryPayload
    ): Response<ApiResponse>

    @POST("api/devices/heartbeat")
    suspend fun sendHeartbeat(
        @Header("x-device-token") deviceToken: String,
        @Body payload: HeartbeatPayload
    ): Response<ApiResponse>

    @POST("api/devices/sync")
    suspend fun syncBatch(
        @Header("x-device-token") deviceToken: String,
        @Body payload: BatchSyncPayload
    ): Response<ApiResponse>

    @POST("api/devices/pair")
    suspend fun pairDevice(
        @Body payload: uz.maktab.watch.data.model.PairDevicePayload
    ): Response<uz.maktab.watch.data.model.PairResponse>

    @POST("api/devices/activate")
    suspend fun activateDevice(
        @Header("x-device-token") deviceToken: String,
        @Body payload: uz.maktab.watch.data.model.ActivateDevicePayload
    ): Response<ApiResponse>
}
