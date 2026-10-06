import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useUploadProgress } from '../utils/uploadProgressStore';

const formatSize = (bytes) => {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const value = bytes / Math.pow(1024, i);
    return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
};

// "1.2 MB / 3.4 MB" while uploading, "Waiting…" while queued behind another upload.
const describe = (progress, size) => {
    if (!progress || progress.state === 'queued') return 'Waiting…';
    const percent = progress.percent || 0;
    if (!size) return `${percent}%`;
    return `${formatSize((size * percent) / 100)} / ${formatSize(size)}`;
};

// Dimmed overlay on top of a photo / video bubble while it uploads.
export const MediaUploadOverlay = ({ messageId, size }) => {
    const progress = useUploadProgress(messageId);
    const uploading = progress?.state === 'uploading';
    return (
        <View style={styles.overlay} pointerEvents="none">
            <View style={styles.badge}>
                <ActivityIndicator size="small" color="#fff" />
                {uploading && <Text style={styles.percent}>{progress.percent || 0}%</Text>}
            </View>
            <View style={styles.caption}>
                <Text style={styles.captionText}>{describe(progress, size)}</Text>
            </View>
        </View>
    );
};

// One-line status under a document's name while it uploads.
export const FileUploadStatus = ({ messageId, size, style }) => {
    const progress = useUploadProgress(messageId);
    const uploading = progress?.state === 'uploading';
    return (
        <View style={styles.fileRow}>
            <ActivityIndicator size="small" color={style?.color || '#fff'} style={styles.fileSpinner} />
            <Text style={style} numberOfLines={1}>
                {uploading ? `${progress.percent || 0}% · ` : ''}{describe(progress, size)}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.38)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        minWidth: 56,
        height: 56,
        paddingHorizontal: 10,
        borderRadius: 28,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    percent: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        marginTop: 2,
    },
    caption: {
        position: 'absolute',
        left: 8,
        bottom: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    captionText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    fileRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fileSpinner: {
        transform: [{ scale: 0.7 }],
        marginRight: 4,
        marginLeft: -4,
    },
});
