import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Sound from 'react-native-sound';

const AudioPlayer = ({ audioUrl, duration, isMe }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState(duration || 0);

    const soundRef = useRef(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        // Enable playback in silence mode (iOS)
        // Use 'Playback' for normal playback, 'Ambient' for background
        Sound.setCategory('Playback', true); // true enables mixing with other audio

        return () => {
            if (soundRef.current) {
                soundRef.current.release();
                soundRef.current = null;
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const loadSound = () => {
        return new Promise((resolve, reject) => {
            console.log('Loading audio from:', audioUrl);

            // For remote URLs, pass null as basePath
            // For local files, pass empty string
            const isRemoteUrl = audioUrl.startsWith('http://') || audioUrl.startsWith('https://');
            const basePath = isRemoteUrl ? null : '';

            const sound = new Sound(audioUrl, basePath, (error) => {
                if (error) {
                    console.error('Failed to load sound:', error);
                    reject(error);
                    return;
                }
                console.log('Sound loaded successfully, duration:', sound.getDuration());
                setTotalDuration(Math.floor(sound.getDuration()));
                soundRef.current = sound;
                resolve(sound);
            });
        });
    };

    const togglePlayback = async () => {
        try {
            if (isPlaying) {
                // Pause
                if (soundRef.current) {
                    soundRef.current.pause();
                    setIsPlaying(false);
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                    }
                }
            } else {
                // Play
                setIsLoading(true);

                // If sound is already loaded, reset it
                if (soundRef.current) {
                    soundRef.current.setCurrentTime(0);
                } else {
                    // Load the sound
                    await loadSound();
                }

                if (!soundRef.current) {
                    throw new Error('Failed to load sound');
                }

                soundRef.current.play((success) => {
                    if (success) {
                        console.log('Playback finished successfully');
                    } else {
                        console.log('Playback failed - reloading sound');
                        // Release and reload the sound for next play
                        if (soundRef.current) {
                            soundRef.current.release();
                            soundRef.current = null;
                        }
                    }
                    setIsPlaying(false);
                    setCurrentTime(0);
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                    }
                });

                setIsPlaying(true);
                setIsLoading(false);

                // Update progress
                intervalRef.current = setInterval(() => {
                    if (soundRef.current) {
                        soundRef.current.getCurrentTime((seconds) => {
                            setCurrentTime(Math.floor(seconds));
                        });
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Error playing audio:', error);
            setIsLoading(false);
            setIsPlaying(false);
            // Release sound on error
            if (soundRef.current) {
                soundRef.current.release();
                soundRef.current = null;
            }
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

    return (
        <View style={[styles.container, isMe ? styles.myAudio : styles.theirAudio]}>
            <TouchableOpacity
                style={[styles.playButton, isMe ? styles.myPlayButton : styles.theirPlayButton]}
                onPress={togglePlayback}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color={isMe ? '#fff' : '#2C3D5B'} />
                ) : (
                    <Icon
                        name={isPlaying ? 'pause' : 'play'}
                        size={20}
                        color={isMe ? '#fff' : '#2C3D5B'}
                    />
                )}
            </TouchableOpacity>

            <View style={styles.waveformContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }, isMe ? styles.myProgress : styles.theirProgress]} />
                </View>
                <Text style={[styles.timeText, isMe ? styles.myTimeText : styles.theirTimeText]}>
                    {formatTime(isPlaying ? currentTime : totalDuration)}
                </Text>
            </View>

            <Icon
                name="mic"
                size={16}
                color={isMe ? '#2C3D5B' : '#8B95A5'}
                style={styles.micIcon}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        minWidth: 200,
    },
    myAudio: {
        backgroundColor: '#E9F1FF',
    },
    theirAudio: {
        backgroundColor: '#E9F1FF',
    },
    playButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    myPlayButton: {
        backgroundColor: '#2C3D5B',
    },
    theirPlayButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#2C3D5B',
    },
    waveformContainer: {
        flex: 1,
        marginRight: 8,
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(44, 61, 91, 0.2)',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    myProgress: {
        backgroundColor: '#2C3D5B',
    },
    theirProgress: {
        backgroundColor: '#2C3D5B',
    },
    timeText: {
        fontSize: 11,
        fontWeight: '500',
    },
    myTimeText: {
        color: '#2C3D5B',
    },
    theirTimeText: {
        color: '#8B95A5',
    },
    micIcon: {
        opacity: 0.6,
    },
});

export default AudioPlayer;
