package uz.maktab.watch.security

import android.content.Context
import android.content.SharedPreferences
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/**
 * Item 11 xavfsizlik talabi: Qurilma tokenini Android Keystore (AES-256 GCM) yordamida
 * apparat darajasida shifrlab saqlash.
 * Token yoki koordinatalar hech qachon loglarga chiqarilmaydi.
 */
class SecureTokenManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    init {
        ensureKeystoreKey()
    }

    private fun ensureKeystoreKey() {
        val keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER).apply { load(null) }
        if (!keyStore.containsAlias(KEY_ALIAS)) {
            val keyGenerator = KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES,
                KEYSTORE_PROVIDER
            )
            val spec = KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build()
            keyGenerator.init(spec)
            keyGenerator.generateKey()
        }
    }

    private fun getSecretKey(): SecretKey {
        val keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER).apply { load(null) }
        return (keyStore.getEntry(KEY_ALIAS, null) as KeyStore.SecretKeyEntry).secretKey
    }

    @Synchronized
    fun saveDeviceToken(token: String) {
        if (token.isBlank()) {
            clearDeviceToken()
            return
        }
        try {
            val cipher = Cipher.getInstance(TRANSFORMATION)
            cipher.init(Cipher.ENCRYPT_MODE, getSecretKey())
            val iv = cipher.iv
            val encryptedBytes = cipher.doFinal(token.toByteArray(Charsets.UTF_8))

            val ivBase64 = Base64.encodeToString(iv, Base64.NO_WRAP)
            val cipherBase64 = Base64.encodeToString(encryptedBytes, Base64.NO_WRAP)

            prefs.edit()
                .putString(KEY_ENCRYPTED_TOKEN, cipherBase64)
                .putString(KEY_TOKEN_IV, ivBase64)
                .apply()
        } catch (_: Exception) {
            // Xavfsizlik: Tokenni hech qachon logga chiqarmaslik
        }
    }

    @Synchronized
    fun getDeviceToken(): String? {
        val cipherBase64 = prefs.getString(KEY_ENCRYPTED_TOKEN, null) ?: return null
        val ivBase64 = prefs.getString(KEY_TOKEN_IV, null) ?: return null
        return try {
            val cipherBytes = Base64.decode(cipherBase64, Base64.NO_WRAP)
            val iv = Base64.decode(ivBase64, Base64.NO_WRAP)

            val cipher = Cipher.getInstance(TRANSFORMATION)
            val spec = GCMParameterSpec(128, iv)
            cipher.init(Cipher.DECRYPT_MODE, getSecretKey(), spec)

            val plainBytes = cipher.doFinal(cipherBytes)
            String(plainBytes, Charsets.UTF_8).takeIf { it.isNotBlank() }
        } catch (_: Exception) {
            null
        }
    }

    @Synchronized
    fun clearDeviceToken() {
        prefs.edit()
            .remove(KEY_ENCRYPTED_TOKEN)
            .remove(KEY_TOKEN_IV)
            .apply()
    }

    fun isPaired(): Boolean {
        val token = getDeviceToken()
        return !token.isNullOrBlank()
    }

    companion object {
        private const val PREFS_NAME = "smartchild_secure_keystore_prefs"
        private const val KEYSTORE_PROVIDER = "AndroidKeyStore"
        private const val KEY_ALIAS = "smart_child_watch_device_master_key"
        private const val TRANSFORMATION = "AES/GCM/NoPadding"

        private const val KEY_ENCRYPTED_TOKEN = "enc_token_cipher"
        private const val KEY_TOKEN_IV = "enc_token_iv"
    }
}

