# ProGuard / R8 rules for the Sri Vidya Peetam release build.
# R8 (minifyEnabled) is ON, so anything reached only via reflection / JNI /
# native-module registration must be kept explicitly or the release build can
# crash at runtime (issues that never show in debug). Most libraries ship their
# own consumer rules; the keeps below are belt-and-suspenders for the ones in
# this app.

# ── React Native core + Hermes + JNI ────────────────────────────────────────
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * { @com.facebook.proguard.annotations.DoNotStrip *; }
-keepclassmembers class * { @com.facebook.proguard.annotations.KeepGettersAndSetters *; }
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-dontwarn com.facebook.react.**
-dontwarn com.facebook.hermes.**

# Keep native-method bearers and JS-callable module members.
-keepclasseswithmembernames class * { native <methods>; }
-keepclassmembers class * { @com.facebook.react.bridge.ReactMethod <methods>; }
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keep class * extends com.facebook.react.uimanager.ViewManager { *; }

# ── Networking (OkHttp / Okio, used by RN + Supabase fetch) ──────────────────
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn org.conscrypt.**
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase

# ── react-native-reanimated ─────────────────────────────────────────────────
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# ── react-native-svg ────────────────────────────────────────────────────────
-keep public class com.horcrux.svg.** { *; }

# ── react-native-safe-area-context ──────────────────────────────────────────
-keep class com.th3rdwave.safeareacontext.** { *; }

# ── react-native-image-picker ───────────────────────────────────────────────
-keep class com.imagepicker.** { *; }

# ── Google Mobile Ads (AdMob) ───────────────────────────────────────────────
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.android.gms.internal.ads.** { *; }
-dontwarn com.google.android.gms.**

# ── Firebase (Cloud Messaging / push) ───────────────────────────────────────
-keep class com.google.firebase.** { *; }
-keep class com.google.android.datatransport.** { *; }
-dontwarn com.google.firebase.**

# ── react-native-video (in-app devotional audio, ExoPlayer/media3) ──────────
-keep class com.brentvatne.** { *; }
-dontwarn com.brentvatne.**
-keep class androidx.media3.** { *; }
-dontwarn androidx.media3.**

# ── Certificates: react-native-view-shot + camera-roll (save to gallery) ────
-keep class fr.greweb.reactnativeviewshot.** { *; }
-dontwarn fr.greweb.reactnativeviewshot.**
-keep class com.reactnativecommunity.cameraroll.** { *; }
-dontwarn com.reactnativecommunity.cameraroll.**

# ── AsyncStorage ────────────────────────────────────────────────────────────
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# Keep annotations, generics and enum internals (reflection safety).
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod
-keepclassmembers enum * { public static **[] values(); public static ** valueOf(java.lang.String); }
