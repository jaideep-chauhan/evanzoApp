# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:
# --- React Native ---
-keep class com.facebook.react.** { *; }
-dontwarn com.facebook.react.**

# --- Hermes (if enabled) ---
-keep class com.facebook.hermes.** { *; }
-dontwarn com.facebook.hermes.**

# --- React Native Modules ---
-keep class com.facebook.** { *; }
-dontwarn com.facebook.**

-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactProp <methods>;
}

# --- Google Sign-In (if used) ---
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# --- Vector Icons ---
-keep class com.oblador.** { *; }
-dontwarn com.oblador.**

# --- Safe Area Context ---
-keep class com.th3rdwave.** { *; }
-dontwarn com.th3rdwave.**

# --- General Android and Kotlin ---
-dontwarn kotlin.**
-dontwarn org.jetbrains.**
-keep class kotlin.Metadata { *; }

# --- Retrofit or OkHttp (if using) ---
-keep class okhttp3.** { *; }
-dontwarn okhttp3.**

# --- Prevent removal of any classes used by reflection ---
-keepclassmembers class * {
    public <init>(...);
}

