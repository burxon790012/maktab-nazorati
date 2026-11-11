package uz.maktab.watch.data.remote

import android.content.Context
import android.content.SharedPreferences
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import uz.maktab.watch.BuildConfig
import uz.maktab.watch.security.SecureTokenManager
import java.util.UUID
import java.util.concurrent.TimeUnit

/**
 * Xavfsiz tarmoq mijozi.
 * Item 11 talabi:
 * - Token Android Keystore (SecureTokenManager) da saqlanadi.
 * - Bo'sh token bilan soxta token yaratilmaydi, null qaytariladi.
 * - HTTP interceptor NONE rejimida: koordinatalar va tokenlar logga chiqmaydi.
 * - Server manzili BuildConfig dan olinadi va release buildda qat'iy HTTPS bo'lishi talab qilinadi.
 */
object NetworkClient {

    private const val PREFS_NAME = "maktab_watch_prefs"
    private const val KEY_SERVER_URL = "server_url"
    private const val KEY_DEVICE_ID = "device_id"

    // Standart server manzili BuildConfig dan olinadi
    private val DEFAULT_SERVER_URL = BuildConfig.BASE_URL.let {
        if (it.endsWith("/")) it else "$it/"
    }

    private var apiService: ApiService? = null
    private var currentUrl: String = DEFAULT_SERVER_URL

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun getServerUrl(context: Context): String {
        var url = getPrefs(context).getString(KEY_SERVER_URL, DEFAULT_SERVER_URL) ?: DEFAULT_SERVER_URL
        // Release buildlarda xavfsizlik: faqat HTTPS talab qilinadi
        if (!BuildConfig.DEBUG && !url.startsWith("https://", ignoreCase = true)) {
            url = url.replaceFirst("http://", "https://", ignoreCase = true)
        }
        return if (url.endsWith("/")) url else "$url/"
    }

    fun setServerUrl(context: Context, url: String) {
        var cleanUrl = url.trim()
        if (!BuildConfig.DEBUG && !cleanUrl.startsWith("https://", ignoreCase = true)) {
            cleanUrl = cleanUrl.replaceFirst("http://", "https://", ignoreCase = true)
        }
        val formatted = if (cleanUrl.endsWith("/")) cleanUrl else "$cleanUrl/"
        getPrefs(context).edit().putString(KEY_SERVER_URL, formatted).apply()
        apiService = null
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

    fun getDeviceToken(context: Context): String? {
        return SecureTokenManager(context).getDeviceToken()
    }

    fun saveDeviceToken(context: Context, token: String) {
        SecureTokenManager(context).saveDeviceToken(token)
    }

    fun clearDeviceToken(context: Context) {
        SecureTokenManager(context).clearDeviceToken()
    }

    fun isPaired(context: Context): Boolean {
        return SecureTokenManager(context).isPaired()
    }

    fun getApi(context: Context): ApiService {
        val url = getServerUrl(context)
        if (apiService == null || currentUrl != url) {
            currentUrl = url

            // Item 11: Hech qachon koordinatalar yoki tokenlarni logga chiqarmaslik
            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.NONE
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
