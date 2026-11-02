package uz.maktab.watch.data.remote

import android.content.Context
import android.content.SharedPreferences
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.UUID
import java.util.concurrent.TimeUnit

object NetworkClient {

    private const val PREFS_NAME = "maktab_watch_prefs"
    private const val KEY_SERVER_URL = "server_url"
    private const val KEY_DEVICE_ID = "device_id"
    private const val KEY_DEVICE_TOKEN = "device_token"

    // Standart test server manzili (Lokal Wi-Fi yoki domen uchun o'zgartiriladi)
    private const val DEFAULT_SERVER_URL = "http://192.168.1.100:3000/"

    private var apiService: ApiService? = null
    private var currentUrl: String = DEFAULT_SERVER_URL

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun getServerUrl(context: Context): String {
        return getPrefs(context).getString(KEY_SERVER_URL, DEFAULT_SERVER_URL) ?: DEFAULT_SERVER_URL
    }

    fun setServerUrl(context: Context, url: String) {
        val formatted = if (url.endsWith("/")) url else "$url/"
        getPrefs(context).edit().putString(KEY_SERVER_URL, formatted).apply()
        apiService = null // URL o'zgarganda yangi Retrofit yaratish uchun
        currentUrl = formatted
    }

    fun getDeviceId(context: Context): String {
        val prefs = getPrefs(context)
        var id = prefs.getString(KEY_DEVICE_ID, null)
        if (id == null) {
            id = "W5P-" + UUID.randomUUID().toString().substring(0, 8).uppercase()
            prefs.edit().putString(KEY_DEVICE_ID, id).apply()
        }
        return id
    }

    fun getDeviceToken(context: Context): String {
        val prefs = getPrefs(context)
        var token = prefs.getString(KEY_DEVICE_TOKEN, null)
        if (token == null) {
            token = "DEV_TOKEN_" + UUID.randomUUID().toString().replace("-", "")
            prefs.edit().putString(KEY_DEVICE_TOKEN, token).apply()
        }
        return token
    }

    fun getApi(context: Context): ApiService {
        val url = getServerUrl(context)
        if (apiService == null || currentUrl != url) {
            currentUrl = url
            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }

            val okHttpClient = OkHttpClient.Builder()
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(15, TimeUnit.SECONDS)
                .writeTimeout(15, TimeUnit.SECONDS)
                .addInterceptor(logging)
                .build()

            val retrofit = Retrofit.Builder()
                .baseUrl(url)
                .client(okHttpClient)
                .addConverterFactory(GsonConverterFactory.create())
                .build()

            apiService = retrofit.create(ApiService::class.java)
        }
        return apiService!!
    }
}
