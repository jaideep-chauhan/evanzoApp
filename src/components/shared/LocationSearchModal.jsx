import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../ThemeContext';
import { getCurrentLocation, reverseGeocode } from '../../utils/locationService';
import categoryService from '../../services/categoryService';
import { searchLocations as photonSearch } from '../../services/photonService';

const DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

export default function LocationSearchModal({ visible, onClose, onLocationSelect, currentLocation, screenType = 'vendors' }) {
    const theme = useTheme();
    const [searchText, setSearchText] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState([]);
    const [popularLocations, setPopularLocations] = useState([]);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const searchTimeoutRef = useRef(null);
    const lastQueryRef = useRef('');

    // Track keyboard visibility
    useEffect(() => {
        const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
        return () => { show.remove(); hide.remove(); };
    }, []);

    // Reset on open / fetch popular locations
    useEffect(() => {
        if (visible) {
            setSearchText('');
            setResults([]);
            fetchPopularLocations();
        }
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [visible, screenType]);

    const fetchPopularLocations = async () => {
        try {
            const response = screenType === 'vendors'
                ? await categoryService.getVendorLocations()
                : await categoryService.getEventLocations();
            if (response?.success && Array.isArray(response.data)) {
                setPopularLocations(response.data.filter(l => l && l !== 'Current Location'));
            }
        } catch (e) {
            // non-fatal
        }
    };

    // Debounced Photon search
    const runSearch = useCallback((q) => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (!q || q.trim().length < MIN_QUERY_LENGTH) {
            setResults([]);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        lastQueryRef.current = q;
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const places = await photonSearch(q, { limit: 10 });
                // Drop the search if user has typed something newer
                if (lastQueryRef.current === q) {
                    setResults(places);
                }
            } catch (e) {
                if (lastQueryRef.current === q) setResults([]);
            } finally {
                if (lastQueryRef.current === q) setIsSearching(false);
            }
        }, DEBOUNCE_MS);
    }, []);

    const handleSearchText = (text) => {
        setSearchText(text);
        runSearch(text);
    };

    const emitSelection = (display, structured) => {
        onLocationSelect(display, structured);
        setSearchText('');
        setResults([]);
        onClose();
    };

    const handlePlaceSelect = (place) => {
        const structured = {
            displayName: place.display_name,
            city: place.city,
            state: place.state,
            country: place.country,
            countryCode: place.country_code,
            latitude: place.lat,
            longitude: place.lon,
        };
        emitSelection(place.display_name, structured);
    };

    const handlePopularSelect = (locationStr) => {
        // Re-geocode the popular string to attach lat/lon
        photonSearch(locationStr, { limit: 1 })
            .then((places) => {
                if (places && places[0]) {
                    handlePlaceSelect(places[0]);
                } else {
                    const parts = locationStr.split(',').map(p => p.trim());
                    emitSelection(locationStr, {
                        displayName: locationStr,
                        city: parts[0] || null,
                        state: parts[1] || null,
                        country: parts[2] || null,
                    });
                }
            })
            .catch(() => {
                const parts = locationStr.split(',').map(p => p.trim());
                emitSelection(locationStr, {
                    displayName: locationStr,
                    city: parts[0] || null,
                    state: parts[1] || null,
                    country: parts[2] || null,
                });
            });
    };

    const handleCurrentLocation = async () => {
        setIsSearching(true);
        try {
            const coords = await getCurrentLocation();
            const locationData = await reverseGeocode(coords.lat, coords.lon, true);
            emitSelection(locationData.formatted, {
                displayName: locationData.formatted,
                city: locationData.city,
                state: locationData.state,
                country: locationData.country,
                latitude: coords.lat,
                longitude: coords.lon,
            });
        } catch (error) {
            let msg = 'Unable to get your current location. Please ensure location permissions are enabled.';
            if (error?.message === 'Location permission denied' || error?.code === 1) {
                msg = 'Location permission denied. Please enable location access in Settings.';
            } else if (error?.code === 2) {
                msg = 'Location unavailable. Please check your device location settings.';
            } else if (error?.code === 3) {
                msg = 'Location request timed out. Please try again.';
            }
            Alert.alert('Location Error', msg, [{ text: 'OK' }]);
        } finally {
            setIsSearching(false);
        }
    };

    const clearLocation = () => {
        onLocationSelect(null, null);
        setSearchText('');
        setResults([]);
        onClose();
    };

    const showResults = results.length > 0;
    const showPopular = !searchText.trim() && popularLocations.length > 0;
    const showNoResults = searchText.trim().length >= MIN_QUERY_LENGTH && !isSearching && results.length === 0;

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={styles.modalOverlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <TouchableOpacity
                    style={styles.dismissArea}
                    activeOpacity={1}
                    onPress={() => { Keyboard.dismiss(); onClose(); }}
                />
                <View style={[styles.container, keyboardVisible && styles.containerWithKeyboard]}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name="close" size={24} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Select Location</Text>
                        <TouchableOpacity onPress={clearLocation}>
                            <Text style={[styles.clearText, { color: theme.colors.primary }]}>Clear</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchContainer}>
                        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search city, region or country..."
                            value={searchText}
                            onChangeText={handleSearchText}
                            placeholderTextColor="#666"
                            autoCapitalize="words"
                            autoCorrect={false}
                            autoFocus
                            returnKeyType="search"
                        />
                        {isSearching && (
                            <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginLeft: 6 }} />
                        )}
                        {!isSearching && searchText.length > 0 && (
                            <TouchableOpacity onPress={() => handleSearchText('')}>
                                <Icon name="close-circle" size={20} color="#666" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity
                        style={styles.currentLocationBtn}
                        onPress={handleCurrentLocation}
                        disabled={isSearching}
                    >
                        <Icon name="locate" size={20} color={theme.colors.primary} />
                        <Text style={[styles.currentLocationText, { color: theme.colors.primary }]}>
                            Use Current Location
                        </Text>
                    </TouchableOpacity>

                    {showResults && (
                        <FlatList
                            data={results}
                            keyExtractor={(item) => item.id}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.locationItem,
                                        currentLocation === item.display_name && styles.locationItemSelected,
                                    ]}
                                    onPress={() => handlePlaceSelect(item)}
                                >
                                    <Icon name="location-outline" size={20} color={theme.colors.primary} />
                                    <View style={styles.locationTextWrap}>
                                        <Text style={[styles.mainText, { color: theme.colors.primary }]} numberOfLines={1}>
                                            {item.main_text}
                                        </Text>
                                        {item.secondary_text ? (
                                            <Text style={styles.secondaryText} numberOfLines={1}>
                                                {item.secondary_text}
                                            </Text>
                                        ) : null}
                                    </View>
                                    {currentLocation === item.display_name && (
                                        <Icon name="checkmark" size={20} color={theme.colors.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                            style={styles.list}
                        />
                    )}

                    {showPopular && (
                        <>
                            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                                Popular Locations
                            </Text>
                            <FlatList
                                data={popularLocations.filter(l => l !== currentLocation)}
                                keyExtractor={(item, i) => `${item}-${i}`}
                                keyboardShouldPersistTaps="handled"
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.locationItem}
                                        onPress={() => handlePopularSelect(item)}
                                    >
                                        <Icon name="location-outline" size={20} color={theme.colors.primary} />
                                        <Text style={[styles.mainText, { color: theme.colors.primary, flex: 1, marginLeft: 12 }]}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                style={styles.list}
                            />
                        </>
                    )}

                    {showNoResults && (
                        <View style={styles.emptyContainer}>
                            <Icon name="location-outline" size={48} color="#ccc" />
                            <Text style={[styles.emptyText, { color: theme.colors.primary }]}>No locations found</Text>
                            <Text style={styles.emptySubtext}>Try a different search term</Text>
                        </View>
                    )}

                    {!searchText && popularLocations.length === 0 && (
                        <View style={styles.hintContainer}>
                            <Icon name="information-circle-outline" size={24} color="#999" />
                            <Text style={styles.hintText}>
                                Start typing to search any city, region or country worldwide.
                            </Text>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end' },
    dismissArea: { flex: 1 },
    container: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '75%', minHeight: 400 },
    containerWithKeyboard: { maxHeight: '90%', minHeight: 450 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
    },
    headerTitle: { fontSize: 17, fontWeight: '700' },
    clearText: { fontSize: 14, fontWeight: '600' },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa',
        marginHorizontal: 16, marginVertical: 12, paddingHorizontal: 12,
        borderRadius: 12, height: 48,
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 15, color: '#333' },
    currentLocationBtn: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    },
    currentLocationText: { fontSize: 15, fontWeight: '600', marginLeft: 12 },
    sectionTitle: { fontSize: 14, fontWeight: '700', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
    list: { paddingBottom: 20 },
    locationItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 12,
        borderRadius: 10, borderWidth: 1, borderColor: '#e0e7ef',
        marginHorizontal: 8, marginVertical: 4, backgroundColor: '#fff',
    },
    locationItemSelected: { backgroundColor: '#E7F0FF' },
    locationTextWrap: { flex: 1, marginLeft: 12 },
    mainText: { fontSize: 15, fontWeight: '600' },
    secondaryText: { fontSize: 12, color: '#666', marginTop: 2 },
    emptyContainer: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
    emptyText: { fontSize: 15, fontWeight: '700', marginTop: 10, marginBottom: 6 },
    emptySubtext: { fontSize: 14, color: '#666', textAlign: 'center' },
    hintContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20, gap: 12 },
    hintText: { flex: 1, fontSize: 14, color: '#999', lineHeight: 20 },
});
