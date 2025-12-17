import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Alert,
    NativeModules,
    Platform,
    PermissionsAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../ThemeContext';

const { AudioRecorderModule } = NativeModules;

const VoiceRecorder = ({ onSendVoiceNote, onCancel }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordTime, setRecordTime] = useState(0);
    const theme = useTheme();

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const timerRef = useRef(null);

    // Create animated values for waveform bars (25 bars for WhatsApp-like effect)
    const waveAnims = useRef(
        Array.from({ length: 25 }, () => new Animated.Value(0.3))
    ).current;

    // Check if AudioRecorderModule is available
    useEffect(() => {
        if (!AudioRecorderModule) {
            console.error('AudioRecorderModule is not available. Please rebuild the app.');
            Alert.alert(
                'Module Not Available',
                'Audio recording module is not properly linked. Please rebuild the app.',
                [{ text: 'OK' }]
            );
        }
    }, []);

    // Auto-start recording when component mounts (WhatsApp behavior)
    useEffect(() => {
        startRecording();

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    // Simple continuous wave animation
    useEffect(() => {
        if (isRecording) {
            // Pulse animation for mic icon
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.3,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Simple continuous wave animation for each bar
            waveAnims.forEach((anim, index) => {
                // Each bar has a different phase to create wave effect
                const phase = (index / waveAnims.length) * Math.PI * 2;

                const animateBar = () => {
                    // Create a sine wave pattern
                    const minHeight = 0.2;
                    const maxHeight = 1.0;
                    const speed = 1500; // milliseconds for one complete cycle

                    // Animate to a random height for natural look
                    const targetHeight = minHeight + (Math.sin(Date.now() / speed + phase) + 1) / 2 * (maxHeight - minHeight);

                    Animated.timing(anim, {
                        toValue: targetHeight,
                        duration: 100,
                        useNativeDriver: true,
                    }).start(() => {
                        if (isRecording) {
                            animateBar(); // Continue animation
                        }
                    });
                };

                animateBar();
            });
        } else {
            pulseAnim.setValue(1);
            waveAnims.forEach(anim => anim.setValue(0.3));
        }
    }, [isRecording]);

    const requestAudioPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: 'Audio Recording Permission',
                        message: 'This app needs access to your microphone to record voice messages',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    },
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn('Permission request error:', err);
                return false;
            }
        }
        return true; // iOS handles permissions automatically
    };

    const startRecording = async () => {
        try {
            console.log('🎤 Starting recording...');
            console.log('📱 Platform:', Platform.OS);
            console.log('🔧 AudioRecorderModule available:', !!AudioRecorderModule);

            // Check if module is available
            if (!AudioRecorderModule) {
                console.error('❌ AudioRecorderModule is not available');
                Alert.alert(
                    'Module Not Available',
                    'Audio recording is not available. Please rebuild the app.',
                    [{ text: 'OK' }]
                );
                onCancel();
                return;
            }

            console.log('✅ AudioRecorderModule found, calling startRecording()...');

            // Request permission on Android
            if (Platform.OS === 'android') {
                console.log('📱 Android detected, requesting permission...');
                const hasPermission = await requestAudioPermission();
                if (!hasPermission) {
                    console.error('❌ Android permission denied');
                    Alert.alert(
                        'Permission Required',
                        'Microphone permission is required to record voice messages',
                        [{ text: 'OK' }]
                    );
                    onCancel();
                    return;
                }
                console.log('✅ Android permission granted');
            } else {
                console.log('📱 iOS detected, permission will be handled by native module');
            }

            console.log('🔄 Calling AudioRecorderModule.startRecording()...');
            const result = await AudioRecorderModule.startRecording();
            console.log('📦 startRecording result:', JSON.stringify(result));

            if (result.success) {
                setIsRecording(true);
                setRecordTime(0);

                console.log('🎙️ Recording started successfully');

                // Start timer
                timerRef.current = setInterval(() => {
                    setRecordTime(prev => prev + 1);
                }, 1000);
            }
        } catch (error) {
            console.error('❌ Failed to start recording');
            console.error('❌ Error object:', error);
            console.error('❌ Error code:', error.code);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error stack:', error.stack);

            let errorMessage = 'Failed to start recording';
            if (error.code === 'permission_denied') {
                console.error('❌ Permission was denied');
                errorMessage = 'Microphone permission was denied. Please enable it in Settings > EVNZO > Microphone';
            } else if (error.code === 'audio_session_error') {
                console.error('❌ Audio session error');
                errorMessage = 'Failed to setup audio session. Please close other apps using the microphone and try again.';
            } else if (error.code === 'recorder_init_error') {
                console.error('❌ Recorder initialization error');
                errorMessage = 'Failed to initialize audio recorder: ' + (error.message || 'Unknown error');
            } else if (error.code === 'recording_start_error') {
                console.error('❌ Recording start error');
                errorMessage = 'Failed to start recording - check microphone availability';
            } else if (error.message) {
                console.error('❌ Generic error with message');
                errorMessage = error.message;
            }

            console.error('❌ Final error message:', errorMessage);
            Alert.alert('Recording Error', errorMessage);
            setIsRecording(false);
            onCancel();
        }
    };

    const stopRecording = async () => {
        try {
            console.log('🛑 Stopping recording...');

            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }

            if (!AudioRecorderModule) {
                onCancel();
                return;
            }

            if (recordTime < 1) {
                Alert.alert('Too Short', 'Recording must be at least 1 second long');
                await AudioRecorderModule.cancelRecording();
                onCancel();
                return;
            }

            // Stop and get the recording path
            const result = await AudioRecorderModule.stopRecording();

            console.log('📁 Recording saved at:', result.path);

            // Create file object for upload
            const audioFile = {
                uri: result.path,
                type: 'audio/m4a',
                name: `voice_${Date.now()}.m4a`,
            };

            console.log('✅ Sending voice note:', audioFile);

            // Send the voice note
            onSendVoiceNote(audioFile, recordTime);

        } catch (error) {
            console.error('Failed to stop recording:', error);
            Alert.alert('Recording Error', 'Failed to save recording: ' + error.message);
            setIsRecording(false);
            try {
                await AudioRecorderModule.cancelRecording();
            } catch (e) {
                console.error('Error canceling:', e);
            }
            onCancel();
        }
    };

    const cancelRecording = async () => {
        setIsRecording(false);
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        try {
            if (AudioRecorderModule) {
                await AudioRecorderModule.cancelRecording();
            }
        } catch (error) {
            console.error('Error canceling recording:', error);
        }
        setRecordTime(0);
        onCancel();
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Always show recording UI (WhatsApp behavior - no separate button state)
    return (
        <View style={styles.recordingContainer}>
            <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelRecording}
            >
                <Icon name="close-circle" size={28} color="#FF3B30" />
            </TouchableOpacity>

            <View style={styles.recordingInfo}>
                <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]}>
                    <Icon name="mic" size={20} color="#FF3B30" />
                </Animated.View>

                {/* Animated Waveform - WhatsApp style */}
                <View style={styles.waveformContainer}>
                    {waveAnims.map((anim, index) => (
                        <Animated.View
                            key={index}
                            style={[
                                styles.waveBar,
                                {
                                    transform: [{ scaleY: anim }],
                                }
                            ]}
                        />
                    ))}
                </View>

                <Text style={styles.timerText}>{formatTime(recordTime)}</Text>
            </View>

            <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
                onPress={stopRecording}
            >
                <Icon name="send" size={20} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    micButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3F0',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 25,
        flex: 1,
    },
    cancelButton: {
        padding: 5,
        marginRight: 10,
    },
    recordingInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    pulseCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFE5E5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    waveformContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 30,
        marginRight: 12,
        gap: 2,
        flex: 1,
        maxWidth: 150,
    },
    waveBar: {
        width: 2.5,
        height: 20,
        backgroundColor: '#FF3B30',
        borderRadius: 1.5,
    },
    recordingText: {
        fontSize: 14,
        color: '#FF3B30',
        fontWeight: '600',
        marginRight: 10,
    },
    timerText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '600',
        minWidth: 45,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
});

export default VoiceRecorder;
