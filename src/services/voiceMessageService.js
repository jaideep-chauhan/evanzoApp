import { Platform, PermissionsAndroid } from 'react-native';
import AudioRecord from 'react-native-audio-record';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';

class VoiceMessageService {
    constructor() {
        this.sound = null;
        this.audioPath = null;
        this.recordingStartTime = null;

        // Configure audio recorder
        const options = {
            sampleRate: 44100,
            channels: 1,
            bitsPerSample: 16,
            audioSource: 6, // VOICE_RECOGNITION
            wavFile: `voice-${Date.now()}.wav`
        };

        AudioRecord.init(options);
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

            // Start recording
            AudioRecord.start();
            this.recordingStartTime = Date.now();
            console.log('🎙️ Recording started');
            return true;
        } catch (error) {
            console.error('Failed to start recording:', error);
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

            console.log('✅ Recording stopped:', {
                path: audioFile,
                duration
            });

            return {
                uri: Platform.OS === 'ios' ? audioFile : `file://${audioFile}`,
                duration: duration,
            };
        } catch (error) {
            console.error('Failed to stop recording:', error);
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
            console.log('🔊 Playing audio:', uri);

            // Stop current sound if playing
            if (this.sound) {
                this.sound.stop();
                this.sound.release();
            }

            // Enable playback in silence mode
            Sound.setCategory('Playback');

            // Determine if it's a remote URL or local file
            const isRemoteUrl = uri.startsWith('http://') || uri.startsWith('https://');

            // Load and play
            return new Promise((resolve, reject) => {
                // For both remote URLs and local files, use empty string as base path
                // react-native-sound will handle URLs and local paths automatically
                this.sound = new Sound(uri, '', (error) => {
                    if (error) {
                        console.log('❌ Failed to load sound:', error);
                        console.log('Error details:', JSON.stringify(error));
                        reject(error);
                        return;
                    }

                    console.log('✅ Sound loaded successfully');
                    console.log('Duration:', this.sound.getDuration(), 'seconds');

                    // Play the sound
                    this.sound.play((success) => {
                        if (success) {
                            console.log('✅ Playback finished successfully');
                            this.sound.release();
                        } else {
                            console.log('⚠️ Playback failed due to audio decoding errors');
                        }
                    });

                    resolve(this.sound);
                });
            });
        } catch (error) {
            console.error('Failed to play audio:', error);
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
