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
    Modal,
    Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../ThemeContext';

const { AudioRecorderModule } = NativeModules;

const VoiceRecorder = ({ onSendVoiceNote, onCancel }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordTime, setRecordTime] = useState(0);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
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
                return false;
            }
        }
        return true; // iOS handles permissions automatically
    };

    const startRecording = async () => {
        try {

            // Check if module is available
            if (!AudioRecorderModule) {
                Alert.alert(
                    'Module Not Available',
                    'Audio recording is not available. Please rebuild the app.',
                    [{ text: 'OK' }]
                );
                onCancel();
                return;
            }


            // Request permission on Android
            if (Platform.OS === 'android') {
                const hasPermission = await requestAudioPermission();
                if (!hasPermission) {
                    Alert.alert(
                        'Permission Required',
                        'Microphone permission is required to record voice messages',
                        [{ text: 'OK' }]
                    );
                    onCancel();
                    return;
                }
            } else {
            }

            const result = await AudioRecorderModule.startRecording();

            if (result.success) {
                setIsRecording(true);
                setRecordTime(0);


                // Start timer
                timerRef.current = setInterval(() => {
                    setRecordTime(prev => prev + 1);
                }, 1000);
            }
        } catch (error) {

            // Check if it's a permission error - show modal instead of alert
            if (error.code === 'permission_denied' ||
                (error.message && error.message.toLowerCase().includes('permission'))) {
                setIsRecording(false);
                setShowPermissionModal(true);
                return;
            }

            // For other errors, show alert
            let errorMessage = 'Failed to start recording';
            if (error.code === 'audio_session_error') {
                errorMessage = 'Failed to setup audio session. Please close other apps using the microphone and try again.';
            } else if (error.code === 'recorder_init_error') {
                errorMessage = 'Failed to initialize audio recorder: ' + (error.message || 'Unknown error');
            } else if (error.code === 'recording_start_error') {
                errorMessage = 'Failed to start recording - check microphone availability';
            } else if (error.message) {
                errorMessage = error.message;
            }

            Alert.alert('Recording Error', errorMessage);
            setIsRecording(false);
            onCancel();
        }
    };

    const openSettings = () => {
        setShowPermissionModal(false);
        if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:');
        } else {
            Linking.openSettings();
        }
        onCancel();
    };

    const closePermissionModal = () => {
        setShowPermissionModal(false);
        onCancel();
    };

    const stopRecording = async () => {
        try {

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


            // Create file object for upload
            const audioFile = {
                uri: result.path,
                type: 'audio/m4a',
                name: `voice_${Date.now()}.m4a`,
            };


            // Send the voice note
            onSendVoiceNote(audioFile, recordTime);

        } catch (error) {
            Alert.alert('Recording Error', 'Failed to save recording: ' + error.message);
            setIsRecording(false);
            try {
                await AudioRecorderModule.cancelRecording();
            } catch (e) {
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
        <>
            {/* Permission Denied Modal */}
            <Modal
                visible={showPermissionModal}
                transparent={true}
                animationType="fade"
                onRequestClose={closePermissionModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalIconContainer}>
                            <Icon name="mic-off" size={50} color="#FF3B30" />
                        </View>
                        <Text style={styles.modalTitle}>Microphone Access Required</Text>
                        <Text style={styles.modalMessage}>
                            To record voice messages, please allow EVNZO to access your microphone in Settings.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={closePermissionModal}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalSettingsButton, { backgroundColor: theme.colors.primary }]}
                                onPress={openSettings}
                            >
                                <Icon name="settings-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.modalSettingsText}>Open Settings</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
        </>
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
    // Permission Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFE5E5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    modalCancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    modalSettingsButton: {
        flex: 1.5,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    modalSettingsText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});

export default VoiceRecorder;
