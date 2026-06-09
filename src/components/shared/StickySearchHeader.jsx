import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

/**
 * Sticky search header that fades in as the main header scrolls off.
 *
 * Goes beyond just a search bar — also exposes Location and Category quick-
 * filter chips so the user doesn't have to scroll all the way back up just to
 * change a filter. Tapping a chip opens the same modal the main header uses;
 * when a filter is active, an ✕ on the chip clears it in-place.
 *
 * Shared between Vendors and Events screens.
 */
export default function StickySearchHeader({
    scrollY,
    insets,
    searchQuery = '',
    searchType = 'vendors',
    navigation,
    primaryColor = '#2C3D5B',
    inputRange = [150, 200],
    // Filter state from useListFilters
    selectedLocation = null,
    selectedCategoryNames = [],
    onLocationPress,
    onCategoryPress,
    onClearLocation,
    onClearCategory,
}) {
    const opacity = scrollY.interpolate({
        inputRange,
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const translateY = scrollY.interpolate({
        inputRange,
        outputRange: [-50, 0],
        extrapolate: 'clamp',
    });

    const hasLocation = !!selectedLocation;
    const hasCategory = selectedCategoryNames && selectedCategoryNames.length > 0;
    const categoryLabel = hasCategory
        ? (selectedCategoryNames.length > 1
            ? `${selectedCategoryNames[0]} +${selectedCategoryNames.length - 1}`
            : selectedCategoryNames[0])
        : 'Category';

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    paddingTop: insets.top + 8,
                    opacity,
                    transform: [{ translateY }],
                },
            ]}
            pointerEvents="box-none"
        >
            {/* Row 1 — search input + chat icon */}
            <View style={styles.row}>
                <TouchableOpacity
                    style={[styles.searchBar, { backgroundColor: primaryColor + '10' }]}
                    activeOpacity={0.7}
                    onPress={() =>
                        navigation?.navigate('Search', {
                            searchType,
                            initialQuery: searchQuery,
                        })
                    }
                >
                    <Icon name="search-outline" size={20} color={primaryColor} style={{ marginRight: 8 }} />
                    <Text
                        style={[styles.placeholder, { color: searchQuery ? primaryColor : primaryColor + '80' }]}
                        numberOfLines={1}
                    >
                        {searchQuery || 'Search by name, location, category...'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.chatIcon, { backgroundColor: primaryColor }]}
                    onPress={() => navigation?.navigate('ChatList')}
                    activeOpacity={0.85}
                >
                    <Icon name="chatbubble-ellipses-outline" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Row 2 — quick filter chips */}
            <View style={styles.chipRow}>
                <FilterChip
                    iconName="location-outline"
                    label={hasLocation ? selectedLocation : 'Location'}
                    active={hasLocation}
                    primaryColor={primaryColor}
                    onPress={onLocationPress}
                    onClear={hasLocation ? onClearLocation : undefined}
                />
                <FilterChip
                    iconName="grid-outline"
                    label={categoryLabel}
                    active={hasCategory}
                    primaryColor={primaryColor}
                    onPress={onCategoryPress}
                    onClear={hasCategory ? onClearCategory : undefined}
                />
            </View>
        </Animated.View>
    );
}

function FilterChip({ iconName, label, active, primaryColor, onPress, onClear }) {
    const bg = active ? primaryColor : primaryColor + '10';
    const fg = active ? '#fff' : primaryColor;
    return (
        <TouchableOpacity
            style={[styles.chip, { backgroundColor: bg, borderColor: active ? primaryColor : 'transparent' }]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Icon name={iconName} size={14} color={fg} style={{ marginRight: 6 }} />
            <Text style={[styles.chipText, { color: fg }]} numberOfLines={1}>
                {label}
            </Text>
            {onClear ? (
                <TouchableOpacity
                    onPress={onClear}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    style={styles.chipClear}
                >
                    <Icon name="close" size={14} color={fg} />
                </TouchableOpacity>
            ) : null}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingBottom: 10,
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 100,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 25,
        paddingHorizontal: 14,
        paddingVertical: 11,
    },
    placeholder: {
        fontSize: 14,
        flexShrink: 1,
    },
    chatIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 18,
        borderWidth: 1,
        maxWidth: '60%',
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
        flexShrink: 1,
    },
    chipClear: {
        marginLeft: 6,
    },
});
