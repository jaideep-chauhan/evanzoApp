package com.x4x90studio.evnzo

import android.media.MediaRecorder
import android.os.Build
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.io.IOException
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow

class AudioRecorderModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var mediaRecorder: MediaRecorder? = null
    private var audioFilePath: String? = null
    private var startTime: Long = 0
    private val meteringHandler = Handler(Looper.getMainLooper())
    private var meteringRunnable: Runnable? = null

    override fun getName(): String {
        return "AudioRecorderModule"
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    @ReactMethod
    fun startRecording(promise: Promise) {
        try {
            // Create file path
            val outputDir = reactApplicationContext.cacheDir
            val outputFile = File.createTempFile("recording_", ".m4a", outputDir)
            audioFilePath = outputFile.absolutePath

            // Initialize MediaRecorder
            mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(reactApplicationContext)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }

            mediaRecorder?.apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioEncodingBitRate(64000)
                setAudioSamplingRate(44100)
                setOutputFile(audioFilePath)

                try {
                    prepare()
                    start()
                    startTime = System.currentTimeMillis()

                    // Start audio level metering
                    startMetering()

                    val result = Arguments.createMap()
                    result.putBoolean("success", true)
                    promise.resolve(result)
                } catch (e: IOException) {
                    promise.reject("recording_start_error", "Failed to start recording: ${e.message}", e)
                }
            }
        } catch (e: Exception) {
            promise.reject("recorder_init_error", "Failed to initialize recorder: ${e.message}", e)
        }
    }

    private fun startMetering() {
        meteringRunnable = object : Runnable {
            override fun run() {
                mediaRecorder?.let { recorder ->
                    try {
                        // Get max amplitude (0 to 32767)
                        val amplitude = recorder.maxAmplitude

                        // Convert to normalized level (0.0 to 1.0)
                        // Using logarithmic scale for better visualization
                        val normalizedLevel = if (amplitude > 0) {
                            // Convert to dB: 20 * log10(amplitude / 32767)
                            val db = 20.0 * kotlin.math.log10(amplitude.toDouble() / 32767.0)

                            // Focus on -50 dB to 0 dB range (typical speech)
                            val minDB = -50.0
                            val maxDB = 0.0
                            val clampedDB = max(minDB, min(maxDB, db))

                            // Normalize to 0.0 - 1.0
                            var level = (clampedDB - minDB) / (maxDB - minDB)

                            // Apply power curve for sensitivity boost
                            level = level.pow(0.5)

                            level
                        } else {
                            0.0
                        }

                        // Send event to React Native
                        val params = Arguments.createMap()
                        params.putDouble("level", normalizedLevel)
                        sendEvent("audioLevel", params)

                        // Schedule next update in 50ms (20 updates per second)
                        meteringHandler.postDelayed(this, 50)
                    } catch (e: Exception) {
                        // Recorder might have been stopped, ignore errors
                    }
                }
            }
        }
        meteringRunnable?.let { meteringHandler.post(it) }
    }

    private fun stopMetering() {
        meteringRunnable?.let { meteringHandler.removeCallbacks(it) }
        meteringRunnable = null
    }

    @ReactMethod
    fun stopRecording(promise: Promise) {
        try {
            // Stop metering
            stopMetering()

            mediaRecorder?.let { recorder ->
                try {
                    recorder.stop()
                    recorder.release()

                    val duration = (System.currentTimeMillis() - startTime) / 1000.0

                    val result = Arguments.createMap()
                    result.putBoolean("success", true)
                    result.putString("path", "file://$audioFilePath")
                    result.putDouble("duration", duration)

                    mediaRecorder = null
                    promise.resolve(result)
                } catch (e: RuntimeException) {
                    // Handle case where stop is called on already stopped recorder
                    promise.reject("stop_error", "Failed to stop recording: ${e.message}", e)
                }
            } ?: run {
                promise.reject("not_recording", "No active recording", null)
            }
        } catch (e: Exception) {
            promise.reject("stop_error", "Error stopping recording: ${e.message}", e)
        }
    }

    @ReactMethod
    fun cancelRecording(promise: Promise) {
        try {
            // Stop metering
            stopMetering()

            mediaRecorder?.let { recorder ->
                try {
                    recorder.stop()
                    recorder.release()
                } catch (e: RuntimeException) {
                    // Ignore errors when stopping
                }

                // Delete the file
                audioFilePath?.let { path ->
                    File(path).delete()
                }

                mediaRecorder = null
                audioFilePath = null

                val result = Arguments.createMap()
                result.putBoolean("success", true)
                promise.resolve(result)
            } ?: run {
                val result = Arguments.createMap()
                result.putBoolean("success", true)
                promise.resolve(result)
            }
        } catch (e: Exception) {
            promise.reject("cancel_error", "Error canceling recording: ${e.message}", e)
        }
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        stopMetering()
        mediaRecorder?.release()
        mediaRecorder = null
    }
}
