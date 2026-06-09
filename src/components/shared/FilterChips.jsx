import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

/**
 * Shared filter chips component for Vendors and Events screens.
 * Shows active filters as dismissible chips.
 */
export default function FilterChips({
    searchQuery,
    selectedLocation,
    selectedCategoryNames = [],
    selectedDateRange,
    onClearSearch,
    onClearLocation,
    onClearCategory,
    onClearDateRange,
    primaryColor = '#2C3D5B',
}) {
    const hasFilters = searchQuery || selectedLocation ||
        selectedCategoryNames.length > 0 ||
        (selectedDateRange?.startDate && selectedDateRange?.endDate);

    if (!hasFilters) return null;

    const formatDate = (date) => {
        if (!date) return '';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <View style={[styles.container, { backgroundColor: '#f0f4ff', borderColor: primaryColor + '33' }]}>
            <View style={styles.chips}>
                {searchQuery ? (
                    <TouchableOpacity
                        style={[styles.chip, { backgroundColor: primaryColor + '15', borderColor: primaryColor + '30' }]}
                        onPress={onClearSearch}
                    >
                        <Text style={[styles.chipText, { color: primaryColor }]}>Search: {searchQuery}</Text>
                        <Icon name="close-circle" size={16} color={primaryColor} style={styles.chipClose} />
                    </TouchableOpacity>
                ) : null}

                {selectedLocation ? (
                    <TouchableOpacity
                        style={[styles.chip, { backgroundColor: primaryColor + '15', borderColor: primaryColor + '30' }]}
                        onPress={onClearLocation}
                    >
                        <Text style={[styles.chipText, { color: primaryColor }]}>{selectedLocation}</Text>
                        <Icon name="close-circle" size={16} color={primaryColor} style={styles.chipClose} />
                    </TouchableOpacity>
                ) : null}

                {selectedCategoryNames.length > 0 ? (
                    <TouchableOpacity
                        style={[styles.chip, { backgroundColor: primaryColor + '15', borderColor: primaryColor + '30' }]}
                        onPress={onClearCategory}
                    >
                        <Text style={[styles.chipText, { color: primaryColor }]}>
                            {selectedCategoryNames.length > 2
                                ? `${selectedCategoryNames.length} categories`
                                : selectedCategoryNames.join(', ')}
                        </Text>
                        <Icon name="close-circle" size={16} color={primaryColor} style={styles.chipClose} />
                    </TouchableOpacity>
                ) : null}

                {selectedDateRange?.startDate && selectedDateRange?.endDate ? (
                    <TouchableOpacity
                        style={[styles.chip, { backgroundColor: primaryColor + '15', borderColor: primaryColor + '30' }]}
                        onPress={onClearDateRange}
                    >
                        <Text style={[styles.chipText, { color: primaryColor }]}>
                            {formatDate(selectedDateRange.startDate)} - {formatDate(selectedDateRange.endDate)}
                        </Text>
                        <Icon name="close-circle" size={16} color={primaryColor} style={styles.chipClose} />
                    </TouchableOpacity>
                ) : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '500',
        marginRight: 4,
    },
    chipClose: {
        marginLeft: 2,
    },
});
