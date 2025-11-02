import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import voiceMessageService from '../services/voiceMessageService';

export default function VoiceRecorder({ onSend, onCancel, theme }) {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isSending, setIsSending] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const durationInterval = useRef(null);

    useEffect(() => {
        startRecording();
        return () => {
            cleanup();
        };
    }, []);

    useEffect(() => {
        if (isRecording) {
            // Animate microphone icon
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 1.2,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Update duration every second
            durationInterval.current = setInterval(async () => {
                const currentDuration = await voiceMessageService.getRecordingDuration();
                setDuration(currentDuration);
            }, 1000);
        }

        return () => {
            if (durationInterval.current) {
                clearInterval(durationInterval.current);
            }
        };
    }, [isRecording]);

    const startRecording = async () => {
        try {
            await voiceMessageService.startRecording();
            setIsRecording(true);
        } catch (error) {
            console.error('Failed to start recording:', error);
            if (onCancel) onCancel();
        }
    };

    const handleSend = async () => {
        try {
            setIsSending(true);
            const result = await voiceMessageService.stopRecording();
            setIsRecording(false);

            if (onSend) {
                await onSend(result);
            }
        } catch (error) {
            console.error('Failed to send voice message:', error);
            if (onCancel) onCancel();
        } finally {
            setIsSending(false);
        }
    };

    const handleCancel = async () => {
        await voiceMessageService.cancelRecording();
        setIsRecording(false);
        if (onCancel) onCancel();
    };

    const cleanup = () => {
        if (durationInterval.current) {
            clearInterval(durationInterval.current);
        }
        voiceMessageService.cancelRecording();
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.primary + '10' }]}>
            <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: '#FF3B30' }]}
                onPress={handleCancel}
                disabled={isSending}
            >
                <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.recordingInfo}>
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <Icon name="mic" size={32} color="#FF3B30" />
                </Animated.View>
                <View style={styles.durationContainer}>
                    <View style={styles.recordingDot} />
                    <Text style={[styles.durationText, { color: theme.colors.primary }]}>
                        {formatTime(duration)}
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSend}
                disabled={isSending || duration < 1}
            >
                {isSending ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Icon name="send" size={24} color="#fff" />
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginHorizontal: 12,
        marginBottom: 8,
    },
    cancelButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordingInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    durationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF3B30',
    },
    durationText: {
        fontSize: 18,
        fontWeight: '600',
    },
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
