import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
} from 'react-native';

/**
 * UploadProgressBar - Visual progress indicator for compression and upload
 *
 * @param {string} stage - Current stage: 'compressing' | 'uploading' | 'processing'
 * @param {number} progress - Progress percentage (0-100)
 * @param {number} currentItem - Current item being processed (for compression)
 * @param {number} totalItems - Total items to process (for compression)
 * @param {string} color - Primary color for the progress bar
 */
const UploadProgressBar = ({
    stage = 'uploading',
    progress = 0,
    currentItem = 0,
    totalItems = 0,
    color = '#2C3D5B',
}) => {
    // Clamp progress between 0 and 100
    const clampedProgress = Math.min(100, Math.max(0, progress));

    // Generate status text based on stage
    const getStatusText = () => {
        switch (stage) {
            case 'compressing':
                if (totalItems > 0) {
                    return `Compressing ${currentItem}/${totalItems} images...`;
                }
                return `Compressing... ${clampedProgress}%`;
            case 'uploading':
                return `Uploading... ${clampedProgress}%`;
            case 'processing':
                return 'Processing...';
            default:
                return `${clampedProgress}%`;
        }
    };

    return (
        <View style={styles.container}>
            {/* Progress bar background */}
            <View style={styles.progressBarBg}>
                {/* Progress bar fill */}
                <View
                    style={[
                        styles.progressBarFill,
                        {
                            width: `${clampedProgress}%`,
                            backgroundColor: color,
                        },
                    ]}
                />
            </View>

            {/* Status text */}
            <Text style={[styles.statusText, { color }]}>
                {getStatusText()}
            </Text>
        </View>
    );
};

/**
 * UploadProgressOverlay - Full screen overlay with progress bar
 * Use this when you want to block user interaction during upload
 */
export const UploadProgressOverlay = ({
    visible = false,
    stage = 'uploading',
    progress = 0,
    currentItem = 0,
    totalItems = 0,
    color = '#2C3D5B',
}) => {
    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <View style={styles.overlayContent}>
                <UploadProgressBar
                    stage={stage}
                    progress={progress}
                    currentItem={currentItem}
                    totalItems={totalItems}
                    color={color}
                />
            </View>
        </View>
    );
};

/**
 * CompactUploadProgress - Inline progress indicator for buttons
 */
export const CompactUploadProgress = ({
    progress = 0,
    color = '#2C3D5B',
    textColor = '#fff',
}) => {
    const clampedProgress = Math.min(100, Math.max(0, progress));

    return (
        <View style={styles.compactContainer}>
            <View style={[styles.compactProgressBg, { borderColor: color }]}>
                <View
                    style={[
                        styles.compactProgressFill,
                        {
                            width: `${clampedProgress}%`,
                            backgroundColor: color,
                        },
                    ]}
                />
            </View>
            <Text style={[styles.compactText, { color: textColor }]}>
                {clampedProgress}%
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingVertical: 8,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
        minWidth: 4, // Ensure visibility even at low percentages
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 6,
        textAlign: 'center',
    },
    // Overlay styles
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    overlayContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        width: '80%',
        maxWidth: 300,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    // Compact styles (for button inline)
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    compactProgressBg: {
        flex: 1,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    compactProgressFill: {
        height: '100%',
        borderRadius: 2,
    },
    compactText: {
        fontSize: 12,
        fontWeight: '600',
        minWidth: 36,
        textAlign: 'right',
    },
});

export default UploadProgressBar;
