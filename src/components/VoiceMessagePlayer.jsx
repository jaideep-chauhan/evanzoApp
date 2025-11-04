import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import voiceMessageService from '../services/voiceMessageService';

export default function VoiceMessagePlayer({ audioUrl, duration, isMe, theme }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState(duration || 0);

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            voiceMessageService.stopAudio();
        };
    }, []);

    const handlePlayPause = async () => {
        try {
            if (!audioUrl) {
                console.error('❌ No audio URL provided for playback');
                console.error('❌ Props received:', { audioUrl, duration, isMe });
                return;
            }

            console.log('🎵 Play/Pause clicked. Current state:', { isPlaying, audioUrl });

            if (isPlaying) {
                console.log('⏸️ Pausing audio...');
                await voiceMessageService.pauseAudio();
                setIsPlaying(false);
                setCurrentTime(0);
            } else {
                setIsLoading(true);
                console.log('▶️ Playing audio from URL:', audioUrl);
                console.log('▶️ Audio URL type:', typeof audioUrl);
                console.log('▶️ Audio URL length:', audioUrl?.length);

                // Play audio - react-native-sound doesn't support progress tracking like expo-av
                await voiceMessageService.playAudio(audioUrl);

                setIsPlaying(true);
                setIsLoading(false);
                console.log('✅ Audio playback started');

                // Note: react-native-sound doesn't support real-time progress updates
                // The audio will play to completion automatically
            }
        } catch (error) {
            console.error('❌ Failed to play/pause audio:', error);
            console.error('❌ Error details:', {
                message: error?.message,
                name: error?.name,
                audioUrl: audioUrl
            });
            setIsPlaying(false);
            setIsLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const backgroundColor = isMe ? theme.colors.primary : '#F0F2F5';
    const textColor = isMe ? '#fff' : '#1C1C1E';
    const iconColor = isMe ? '#fff' : theme.colors.primary;

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <TouchableOpacity
                style={styles.playButton}
                onPress={handlePlayPause}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color={iconColor} />
                ) : (
                    <Icon
                        name={isPlaying ? 'pause' : 'play'}
                        size={24}
                        color={iconColor}
                    />
                )}
            </TouchableOpacity>

            <View style={styles.waveformContainer}>
                {/* Simple waveform visualization */}
                <View style={styles.waveform}>
                    {[...Array(20)].map((_, index) => {
                        const height = Math.random() * 20 + 10;
                        const isActive = isPlaying && (index / 20) * totalDuration <= currentTime;
                        return (
                            <View
                                key={index}
                                style={[
                                    styles.waveformBar,
                                    {
                                        height,
                                        backgroundColor: isActive ? iconColor : iconColor + '40',
                                    },
                                ]}
                            />
                        );
                    })}
                </View>

                <Text style={[styles.durationText, { color: textColor }]}>
                    {formatTime(isPlaying ? currentTime : totalDuration)}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 18,
        minWidth: 200,
        maxWidth: 280,
        gap: 12,
    },
    playButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    waveformContainer: {
        flex: 1,
        gap: 8,
    },
    waveform: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        height: 30,
    },
    waveformBar: {
        flex: 1,
        borderRadius: 2,
    },
    durationText: {
        fontSize: 12,
        fontWeight: '500',
    },
});
