import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * LoadingFooter - Reusable loading indicator for infinite scroll
 *
 * Shows a centered loading spinner with optional text.
 * Used at the bottom of FlatList when loading more items.
 *
 * @param {boolean} visible - Whether to show the footer
 * @param {string} text - Text to display (default: 'Loading more...')
 * @param {string} color - Color of the spinner (default: '#2C3D5B')
 */
const LoadingFooter = ({
    visible = true,
    text = 'Loading more...',
    color = '#2C3D5B',
}) => {
    if (!visible) return null;

    return (
        <View style={styles.container}>
            <ActivityIndicator size="small" color={color} />
            {text && <Text style={[styles.text, { color }]}>{text}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        gap: 10,
    },
    text: {
        fontSize: 14,
        fontWeight: '500',
    },
});

export default LoadingFooter;
