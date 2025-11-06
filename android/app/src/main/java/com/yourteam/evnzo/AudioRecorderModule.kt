package com.yourteam.evnzo

import android.media.MediaRecorder
import android.os.Build
import com.facebook.react.bridge.*
import java.io.File
import java.io.IOException

class AudioRecorderModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var mediaRecorder: MediaRecorder? = null
    private var audioFilePath: String? = null
    private var startTime: Long = 0

    override fun getName(): String {
        return "AudioRecorderModule"
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

    @ReactMethod
    fun stopRecording(promise: Promise) {
        try {
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
        mediaRecorder?.release()
        mediaRecorder = null
    }
}
