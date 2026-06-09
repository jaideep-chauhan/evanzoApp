import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * Shared empty list state for Vendors and Events screens.
 * Shows loading skeletons, "no results", network error, or "clear filters".
 */
export default function EmptyListState({
    isLoading,
    isFetching,
    networkError,
    hasFilters,
    entityName = 'items',
    primaryColor = '#2C3D5B',
    onRetry,
    onClearFilters,
    renderSkeletons,
}) {
    if (isLoading || isFetching) {
        return renderSkeletons ? renderSkeletons() : null;
    }

    const title = networkError
        ? `Unable to load ${entityName}`
        : hasFilters
            ? `No ${entityName} match your filters`
            : `No ${entityName} found`;

    const subtitle = networkError
        ? 'Check your internet connection'
        : hasFilters
            ? `Try adjusting your filters or clear them to see all ${entityName}`
            : 'Pull down to refresh';

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            {networkError && onRetry && (
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: primaryColor, marginTop: 16 }]}
                    onPress={onRetry}
                    disabled={isFetching}
                >
                    <Text style={styles.buttonText}>
                        {isFetching ? 'Retrying...' : 'Retry'}
                    </Text>
                </TouchableOpacity>
            )}

            {!networkError && hasFilters && onClearFilters && (
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: primaryColor, marginTop: 16 }]}
                    onPress={onClearFilters}
                >
                    <Text style={styles.buttonText}>Clear All Filters</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingVertical: 60,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3D5B',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#8B95A5',
        textAlign: 'center',
        lineHeight: 20,
    },
    button: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
});
