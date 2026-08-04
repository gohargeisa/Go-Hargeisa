# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# --- Capacitor / Cordova bridge ---
# Defense-in-depth on top of the consumer-rules.pro each @capacitor/*
# plugin AAR already ships: the bridge discovers plugin classes by fully-
# qualified name via reflection (capacitor.plugins.json), and every
# @PluginMethod is invoked the same way from JS — R8 renaming/stripping
# either would silently break plugin calls without a build-time error,
# exactly the class of bug unverifiable without a real device to test on.
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.annotation.PermissionCallback <methods>;
    @com.getcapacitor.annotation.ActivityCallback <methods>;
    @com.getcapacitor.PluginMethod <methods>;
}
-keep class org.apache.cordova.** { *; }
-dontwarn com.getcapacitor.**
