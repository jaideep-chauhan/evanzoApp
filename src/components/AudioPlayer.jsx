import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';
import audioManager from '../services/audioManager';
import { fixLocalUrl } from '../services/api';

const AudioPlayer = ({ audioUrl: rawAudioUrl, duration, isMe }) => {
    // Fix old local IP addresses in the URL
    const audioUrl = useMemo(() => fixLocalUrl(rawAudioUrl), [rawAudioUrl]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState(duration || 0);

    const soundRef = useRef(null);
    const intervalRef = useRef(null);

    // Generate unique ID for this audio player instance
    const audioId = useMemo(() => audioUrl || `audio_${Date.now()}_${Math.random()}`, [audioUrl]);

    // Stop playback function (called by audioManager when another audio starts)
    const stopPlayback = useCallback(() => {
        if (soundRef.current) {
            soundRef.current.pause();
            soundRef.current.setCurrentTime(0);
        }
        setIsPlaying(false);
        setCurrentTime(0);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        // Enable playback in silence mode (iOS)
        // Use 'Playback' for normal playback - don't mix with other audio to avoid conflicts
        Sound.setCategory('Playback', false);

        // Register this audio player with the audio manager
        audioManager.register(audioId, stopPlayback);

        return () => {
            // Unregister from audio manager
            audioManager.unregister(audioId);

            if (soundRef.current) {
                soundRef.current.release();
                soundRef.current = null;
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [audioId, stopPlayback]);

    // Download remote audio file to local cache for reliable playback on iOS
    const downloadAudioToCache = async (url) => {
        try {
            // Generate a cache filename from the URL - ensure it has .m4a extension
            let urlHash = url.split('/').pop() || `audio_${Date.now()}.m4a`;
            // Ensure the file has proper extension
            if (!urlHash.endsWith('.m4a') && !urlHash.endsWith('.mp3') && !urlHash.endsWith('.wav')) {
                urlHash = `${urlHash}.m4a`;
            }
            const cacheDir = RNFS.CachesDirectoryPath;
            const localPath = `${cacheDir}/${urlHash}`;


            // Check if file already exists in cache
            const exists = await RNFS.exists(localPath);
            if (exists) {
                const fileInfo = await RNFS.stat(localPath);
                // Return file:// URL for iOS
                return Platform.OS === 'ios' ? localPath : `file://${localPath}`;
            }


            // Download the file
            const downloadResult = await RNFS.downloadFile({
                fromUrl: url,
                toFile: localPath,
                background: false,
                discretionary: false,
            }).promise;


            if (downloadResult.statusCode === 200) {
                const fileInfo = await RNFS.stat(localPath);
                // Return file:// URL for iOS
                return Platform.OS === 'ios' ? localPath : `file://${localPath}`;
            } else {
                throw new Error(`Download failed: ${downloadResult.statusCode}`);
            }
        } catch (error) {
            throw error;
        }
    };

    const loadSound = () => {
        return new Promise(async (resolve, reject) => {
            // Validate and fix URL if needed
            let validUrl = audioUrl;

            // Fix various malformed URL patterns
            if (validUrl) {
                // Fix duplicate domain (e.g., https://api.evnzo.com.evnzo.com -> https://api.evnzo.com)
                if (validUrl.includes('api.evnzo.com.evnzo.com')) {
                    validUrl = validUrl.replace('api.evnzo.com.evnzo.com', 'api.evnzo.com');
                }

                // Fix malformed protocol (e.g., https:/.evnzo.com -> https://api.evnzo.com)
                if (validUrl.includes('https:/.') || validUrl.includes('https:/e')) {
                    // Extract just the path starting from /uploads or /api
                    const uploadsIndex = validUrl.indexOf('/uploads');
                    const apiIndex = validUrl.indexOf('/api/uploads');
                    const pathStart = apiIndex !== -1 ? apiIndex : uploadsIndex;

                    if (pathStart !== -1) {
                        let path = validUrl.substring(pathStart);
                        // Remove /api prefix if present since static files don't need it
                        if (path.startsWith('/api/uploads')) {
                            path = path.replace('/api/uploads', '/uploads');
                        }
                        validUrl = `https://api.evnzo.com${path}`;
                    }
                }
            }

            // Ensure URL has proper protocol
            if (validUrl && !validUrl.startsWith('http://') && !validUrl.startsWith('https://') && !validUrl.startsWith('file://')) {
                // If it's a path starting with /, prepend the base URL
                if (validUrl.startsWith('/')) {
                    validUrl = `https://api.evnzo.com${validUrl}`;
                }
            }


            if (!validUrl) {
                reject(new Error('No valid audio URL'));
                return;
            }

            const isRemoteUrl = validUrl.startsWith('http://') || validUrl.startsWith('https://');
            let audioPath = validUrl;
            let basePath = isRemoteUrl ? null : '';


            // On iOS, download remote audio files to cache for reliable playback
            // This fixes the OSStatus -10875 error with M4A files
            if (isRemoteUrl) {
                try {
                    audioPath = await downloadAudioToCache(validUrl);
                    basePath = ''; // Local file, empty base path
                } catch (downloadError) {
                    // Fall back to direct streaming
                    audioPath = validUrl;
                    basePath = null;
                }
            }


            // Add timeout for loading audio
            const loadTimeout = setTimeout(() => {
                reject(new Error('Audio load timeout'));
            }, 30000); // 30 second timeout

            const sound = new Sound(audioPath, basePath, (error) => {
                clearTimeout(loadTimeout);
                if (error) {
                    // If the error is about file type, try with different extension hint
                    if (error.code === 'ENSOSSTATUSERRORDOMAIN-10875' ||
                        (error.message && error.message.includes('10875'))) {
                    }
                    reject(error);
                    return;
                }
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
                    // Notify audio manager that this audio stopped
                    audioManager.onStop(audioId);
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                }
            } else {
                // Play
                setIsLoading(true);

                // Notify audio manager - this will stop any other playing audio
                audioManager.onPlay(audioId);

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
                    } else {
                        // Release and reload the sound for next play
                        if (soundRef.current) {
                            soundRef.current.release();
                            soundRef.current = null;
                        }
                    }
                    setIsPlaying(false);
                    setCurrentTime(0);
                    // Notify audio manager that playback finished
                    audioManager.onStop(audioId);
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
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
            setIsLoading(false);
            setIsPlaying(false);
            // Notify audio manager of stop on error
            audioManager.onStop(audioId);
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
