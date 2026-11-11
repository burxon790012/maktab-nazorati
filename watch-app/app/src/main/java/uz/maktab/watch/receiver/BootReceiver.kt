package uz.maktab.watch.receiver

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import uz.maktab.watch.data.remote.NetworkClient
import uz.maktab.watch.service.TrackingService

/**
 * Item 8 talabi: Soat qayta yoqilganda (reboot) agar qurilma biriktirilgan
 * (paired) va GPS ruxsatlari mavjud bo'lsa, TrackingService ni avtomatik qayta ishga tushirish.
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == "android.intent.action.QUICKBOOT_POWERON" ||
            action == "com.htc.intent.action.QUICKBOOT_POWERON"
        ) {
            val isPaired = NetworkClient.isPaired(context)
            val hasFineLocation = ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED

            if (isPaired && hasFineLocation) {
                val serviceIntent = Intent(context, TrackingService::class.java).apply {
                    this.action = TrackingService.ACTION_START
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
            }
        }
    }
}

