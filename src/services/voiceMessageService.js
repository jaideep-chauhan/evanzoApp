import { Platform, PermissionsAndroid } from 'react-native';
import AudioRecord from 'react-native-audio-record';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';

class VoiceMessageService {
    constructor() {
        this.sound = null;
        this.audioPath = null;
        this.recordingStartTime = null;
        // Don't initialize AudioRecord here - do it when starting recording
        // This ensures each recording gets a fresh configuration
    }

    // Request microphone permission
    async requestPermission() {
        try {
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: 'Microphone Permission',
                        message: 'EVNZO needs access to your microphone to record voice messages',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } else {
                // iOS permission is handled automatically via Info.plist
                return true;
            }
        } catch (error) {
            console.error('Error requesting microphone permission:', error);
            return false;
        }
    }

    // Start recording
    async startRecording() {
        try {
            // Request permission
            const hasPermission = await this.requestPermission();
            if (!hasPermission) {
                throw new Error('Microphone permission not granted');
            }

            // Configure audio recorder with a unique filename for each recording
            const options = {
                sampleRate: 44100,
                channels: 1,
                bitsPerSample: 16,
                audioSource: 6, // VOICE_RECOGNITION
                wavFile: `voice-${Date.now()}.wav`
            };

            console.log('🎙️ Initializing AudioRecord with options:', options);
            AudioRecord.init(options);

            // Start recording
            AudioRecord.start();
            this.recordingStartTime = Date.now();
            console.log('🎙️ Recording started at:', this.recordingStartTime);
            return true;
        } catch (error) {
            console.error('❌ Failed to start recording:', error);
            throw error;
        }
    }

    // Stop recording and return file URI
    async stopRecording() {
        try {
            console.log('🛑 Stopping recording...');

            const audioFile = await AudioRecord.stop();
            const duration = Math.floor((Date.now() - this.recordingStartTime) / 1000);

            this.audioPath = audioFile;

            // Check file size
            try {
                const fileStats = await RNFS.stat(audioFile);
                console.log('📊 Audio file stats:', {
                    size: fileStats.size,
                    sizeInKB: Math.round(fileStats.size / 1024),
                    path: audioFile
                });

                if (fileStats.size < 10000) {
                    console.warn('⚠️ Audio file is very small, recording might have failed!');
                }
            } catch (statsError) {
                console.error('Failed to get file stats:', statsError);
            }

            // Ensure proper file URI format for both platforms
            let fileUri = audioFile;

            // For iOS, AudioRecord returns full path, may need file:// prefix
            if (Platform.OS === 'ios') {
                if (!fileUri.startsWith('file://')) {
                    fileUri = `file://${fileUri}`;
                }
            }
            // For Android, ensure file:// prefix
            else if (Platform.OS === 'android') {
                if (!fileUri.startsWith('file://')) {
                    fileUri = `file://${fileUri}`;
                }
            }

            console.log('✅ Recording stopped:', {
                originalPath: audioFile,
                formattedUri: fileUri,
                duration,
                platform: Platform.OS
            });

            return {
                uri: fileUri,
                duration: duration,
            };
        } catch (error) {
            console.error('❌ Failed to stop recording:', error);
            throw error;
        }
    }

    // Cancel recording
    async cancelRecording() {
        try {
            await AudioRecord.stop();
            this.recordingStartTime = null;
            console.log('❌ Recording cancelled');
        } catch (error) {
            console.error('Failed to cancel recording:', error);
        }
    }

    // Get recording duration in real-time
    async getRecordingDuration() {
        try {
            if (this.recordingStartTime) {
                return Math.floor((Date.now() - this.recordingStartTime) / 1000);
            }
            return 0;
        } catch (error) {
            console.error('Failed to get recording duration:', error);
            return 0;
        }
    }

    // Play audio file
    async playAudio(uri) {
        try {
            console.log('🔊 VoiceMessageService.playAudio called');
            console.log('🔊 Audio URI:', uri);
            console.log('🔊 URI type:', typeof uri);
            console.log('🔊 URI length:', uri?.length);

            // Stop current sound if playing
            if (this.sound) {
                console.log('🛑 Stopping existing sound...');
                this.sound.stop();
                this.sound.release();
            }

            // Enable playback in silence mode
            Sound.setCategory('Playback');

            // Determine if it's a remote URL or local file
            const isRemoteUrl = uri.startsWith('http://') || uri.startsWith('https://');
            console.log('🔊 Is remote URL:', isRemoteUrl);

            // Load and play
            return new Promise((resolve, reject) => {
                console.log('🔊 Creating Sound object with URI:', uri);
                // For both remote URLs and local files, use empty string as base path
                // react-native-sound will handle URLs and local paths automatically
                this.sound = new Sound(uri, '', (error) => {
                    if (error) {
                        console.error('❌ Failed to load sound:', error);
                        console.error('❌ Error details:', JSON.stringify(error));
                        console.error('❌ Attempted URI:', uri);
                        reject(error);
                        return;
                    }

                    console.log('✅ Sound loaded successfully');
                    console.log('✅ Duration:', this.sound.getDuration(), 'seconds');

                    // Play the sound
                    this.sound.play((success) => {
                        if (success) {
                            console.log('✅ Playback finished successfully');
                            this.sound.release();
                        } else {
                            console.error('⚠️ Playback failed due to audio decoding errors');
                        }
                    });

                    resolve(this.sound);
                });
            });
        } catch (error) {
            console.error('❌ Failed to play audio:', error);
            console.error('❌ Error message:', error?.message);
            throw error;
        }
    }

    // Stop audio playback
    async stopAudio() {
        try {
            if (this.sound) {
                this.sound.stop();
                this.sound.release();
                this.sound = null;
                console.log('🛑 Audio stopped');
            }
        } catch (error) {
            console.error('Failed to stop audio:', error);
        }
    }

    // Pause audio playback
    async pauseAudio() {
        try {
            if (this.sound) {
                this.sound.pause();
                console.log('⏸️ Audio paused');
            }
        } catch (error) {
            console.error('Failed to pause audio:', error);
        }
    }

    // Resume audio playback
    async resumeAudio() {
        try {
            if (this.sound) {
                this.sound.play();
                console.log('▶️ Audio resumed');
            }
        } catch (error) {
            console.error('Failed to resume audio:', error);
        }
    }

    // Get audio duration from file
    async getAudioDuration(uri) {
        try {
            return new Promise((resolve) => {
                const sound = new Sound(uri, '', (error) => {
                    if (error) {
                        resolve(0);
                        return;
                    }
                    const duration = Math.floor(sound.getDuration());
                    sound.release();
                    resolve(duration);
                });
            });
        } catch (error) {
            console.error('Failed to get audio duration:', error);
            return 0;
        }
    }

    // Format duration to MM:SS
    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Convert audio file to base64 for upload
    async convertToBase64(uri) {
        try {
            const base64 = await RNFS.readFile(uri, 'base64');
            return base64;
        } catch (error) {
            console.error('Failed to convert audio to base64:', error);
            throw error;
        }
    }

    // Clean up resources
    async cleanup() {
        try {
            if (this.sound) {
                this.sound.release();
                this.sound = null;
            }
            this.recordingStartTime = null;
        } catch (error) {
            console.error('Failed to cleanup voice service:', error);
        }
    }
}

const voiceMessageService = new VoiceMessageService();
export default voiceMessageService;
