import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

/**
 * DownloadProgress - WhatsApp-style circular download progress indicator
 *
 * Shows a circular progress ring with percentage text in the center.
 * Used for image, video, and document downloads in chat.
 *
 * @param {number} progress - Progress percentage (0-100)
 * @param {number} size - Size of the progress circle (default: 48)
 * @param {string} strokeColor - Color of the progress stroke (default: #25D366 - WhatsApp green)
 * @param {string} backgroundColor - Background circle color (default: rgba(0,0,0,0.3))
 * @param {number} strokeWidth - Width of the progress stroke (default: 3)
 * @param {boolean} showPercentage - Whether to show percentage text (default: true)
 */
const DownloadProgress = ({
    progress = 0,
    size = 48,
    strokeColor = '#25D366',
    backgroundColor = 'rgba(0,0,0,0.3)',
    strokeWidth = 3,
    showPercentage = true,
}) => {
    // Calculate circle properties
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    // Ensure progress is within bounds
    const clampedProgress = Math.min(100, Math.max(0, progress));

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {/* Background circle */}
            <View style={[styles.backgroundCircle, { backgroundColor }]} />

            {/* SVG Progress Ring */}
            <Svg width={size} height={size} style={styles.svg}>
                {/* Background track */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                {/* Progress arc */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>

            {/* Percentage text */}
            {showPercentage && (
                <View style={styles.textContainer}>
                    <Text style={styles.percentText}>
                        {Math.round(clampedProgress)}%
                    </Text>
                </View>
            )}
        </View>
    );
};

/**
 * DownloadProgressOverlay - Full overlay version for media items
 *
 * Covers the entire media item with a semi-transparent overlay
 * and centered progress indicator.
 */
export const DownloadProgressOverlay = ({
    progress = 0,
    size = 56,
    ...props
}) => {
    return (
        <View style={styles.overlay}>
            <DownloadProgress progress={progress} size={size} {...props} />
        </View>
    );
};

/**
 * DownloadProgressCompact - Smaller version for inline use
 */
export const DownloadProgressCompact = ({ progress = 0, ...props }) => {
    return (
        <DownloadProgress
            progress={progress}
            size={32}
            strokeWidth={2}
            showPercentage={false}
            {...props}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    backgroundCircle: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 999,
    },
    svg: {
        position: 'absolute',
    },
    textContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    percentText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
});

export default DownloadProgress;
