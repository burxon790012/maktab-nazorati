# Proguard rules for Wear OS Maktab Nazorati
-keep class uz.maktab.watch.data.model.** { *; }
-keepclassmembers class * {
    @androidx.room.* <fields>;
    @androidx.room.* <methods>;
}
