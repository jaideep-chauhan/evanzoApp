import React, { useState, useCallback, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    SafeAreaView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../ThemeContext';
import { searchLocations, getCurrentLocation, reverseGeocode } from '../../utils/locationService';
import categoryService from '../../services/categoryService';

const POPULAR_LOCATIONS = [
    'Toronto, ON',
    'Vancouver, BC',
    'Montreal, QC',
    'Calgary, AB',
    'Ottawa, ON',
    'Edmonton, AB',
    'Winnipeg, MB',
    'Quebec City, QC',
    'Hamilton, ON',
    'Kitchener, ON',
];

export default function LocationSearchModal({ visible, onClose, onLocationSelect, currentLocation, screenType = 'vendors' }) {
    const theme = useTheme();
    const [searchText, setSearchText] = useState('');
    const [filteredLocations, setFilteredLocations] = useState(POPULAR_LOCATIONS);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showApiResults, setShowApiResults] = useState(false);
    const [backendLocations, setBackendLocations] = useState([]);

    // Fetch locations when modal becomes visible
    useEffect(() => {
        if (visible) {
            fetchBackendLocations();
        }
    }, [visible, screenType]);

    const fetchBackendLocations = async () => {
        try {
            let response;
            if (screenType === 'vendors') {
                response = await categoryService.getVendorLocations();
            } else {
                response = await categoryService.getEventLocations();
            }
            
            if (response.success) {
                setBackendLocations(response.data);
                setFilteredLocations(response.data);
            } else {
                setFilteredLocations(POPULAR_LOCATIONS);
            }
        } catch (error) {
            console.error('Error fetching locations:', error);
            setFilteredLocations(POPULAR_LOCATIONS);
        }
    };

    // Debounce function to limit API calls
    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    };

    // Function to search locations using Nominatim API
    const searchLocationsAPI = async (query) => {
        if (query.trim().length < 3) {
            setSearchResults([]);
            setShowApiResults(false);
            return;
        }

        setIsSearching(true);
        try {
            const results = await searchLocations(query, {
                limit: 8,
                countryCode: null, // Search globally
            });
            setSearchResults(results);
            setShowApiResults(true);
        } catch (error) {
            console.error('Error searching locations:', error);
            setSearchResults([]);
            Alert.alert(
                'Search Error',
                'Unable to search locations. Please check your internet connection.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsSearching(false);
        }
    };

    // Handle current location
    const handleCurrentLocation = async () => {
        setIsSearching(true);
        try {
            const coords = await getCurrentLocation();
            const locationName = await reverseGeocode(coords.lat, coords.lon);
            handleLocationSelect(locationName);
        } catch (error) {
            console.error('Error getting current location:', error);
            Alert.alert(
                'Location Error',
                'Unable to get your current location. Please ensure location permissions are enabled.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsSearching(false);
        }
    };

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce((query) => searchLocationsAPI(query), 500),
        []
    );

    const handleSearch = (text) => {
        setSearchText(text);

        if (text.trim() === '') {
            setFilteredLocations(POPULAR_LOCATIONS);
            setSearchResults([]);
            setShowApiResults(false);
        } else {
            // Filter popular locations
            const filtered = POPULAR_LOCATIONS.filter(location =>
                location.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredLocations(filtered);

            // Search API for suggestions
            debouncedSearch(text);
        }
    };

    const handleLocationSelect = (location, structured = null) => {
        onLocationSelect(location, structured);
        setSearchText('');
        setFilteredLocations(POPULAR_LOCATIONS);
        setSearchResults([]);
        setShowApiResults(false);
        onClose();
    };

    const handleCustomLocationAdd = () => {
        if (searchText.trim() !== '' && !POPULAR_LOCATIONS.includes(searchText.trim())) {
            handleLocationSelect(searchText.trim());
        }
    };

    const clearLocation = () => {
        onLocationSelect(null);
        setSearchText('');
        setFilteredLocations(POPULAR_LOCATIONS);
        setSearchResults([]);
        setShowApiResults(false);
        onClose();
    };

    // Reset search when modal opens/closes
    useEffect(() => {
        if (!visible) {
            setSearchText('');
            setFilteredLocations(POPULAR_LOCATIONS);
            setSearchResults([]);
            setShowApiResults(false);
        }
    }, [visible]);

    const renderLocationItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.locationItem,
                { backgroundColor: currentLocation === item ? '#E7F0FF' : '#fff', borderColor: theme.colors.primary + (currentLocation === item ? '' : '22') },
            ]}
            onPress={() => handleLocationSelect(item)}
        >
            <Icon name="location-outline" size={20} color={theme.colors.primary} />
            <Text style={[
                styles.locationText,
                { color: currentLocation === item ? theme.colors.primary : theme.colors.text, fontWeight: currentLocation === item ? '700' : '500' }
            ]}>
                {item}
            </Text>
            {currentLocation === item && (
                <Icon name="checkmark" size={20} color={theme.colors.primary} />
            )}
        </TouchableOpacity>
    );

    const renderSearchResultItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.locationItem,
                { backgroundColor: currentLocation === item.formatted ? '#E7F0FF' : '#fff', borderColor: theme.colors.primary + (currentLocation === item.formatted ? '' : '22') },
            ]}
            // Pass the FULL Nominatim payload as the second arg so consumers (e.g.
            // CreateAddForm) can extract country/state/city/lat/lon. Existing
            // consumers that only read the first arg keep working unchanged.
            onPress={() => handleLocationSelect(item.formatted, item)}
        >
            <Icon name="search-outline" size={20} color={theme.colors.primary} />
            <View style={styles.searchResultContent}>
                <Text style={[
                    styles.locationText,
                    { color: currentLocation === item.formatted ? theme.colors.primary : theme.colors.text, fontWeight: currentLocation === item.formatted ? '700' : '500' }
                ]}>
                    {item.formatted}
                </Text>
                <Text style={styles.searchResultSubtext} numberOfLines={1}>
                    {item.display_name}
                </Text>
            </View>
            {currentLocation === item.formatted && (
                <Icon name="checkmark" size={20} color={theme.colors.primary} />
            )}
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name="close" size={24} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Select Location</Text>
                        <TouchableOpacity onPress={clearLocation}>
                            <Text style={[styles.clearText, { color: theme.colors.primary }]}>Clear</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Search Input */}
                    <View style={styles.searchContainer}>
                        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search locations worldwide..."
                            value={searchText}
                            onChangeText={handleSearch}
                            placeholderTextColor="#666"
                        />
                        {isSearching && (
                            <ActivityIndicator size="small" color={theme.colors.primary} style={styles.loadingIndicator} />
                        )}
                        {searchText.trim() !== '' && !isSearching && !showApiResults && !POPULAR_LOCATIONS.includes(searchText.trim()) && (
                            <TouchableOpacity onPress={handleCustomLocationAdd} style={[styles.addButton, { backgroundColor: theme.colors.primary }]}>
                                <Text style={styles.addButtonText}>Add</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Current Location Option */}
                    <TouchableOpacity
                        style={styles.currentLocationBtn}
                        onPress={handleCurrentLocation}
                        disabled={isSearching}
                    >
                        <Icon name="locate" size={20} color={theme.colors.primary} />
                        <Text style={[styles.currentLocationText, { color: theme.colors.primary }]}>Use Current Location</Text>
                        {isSearching && <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginLeft: 8 }} />}
                    </TouchableOpacity>

                    {/* Search Results */}
                    {showApiResults && searchResults.length > 0 && (
                        <>
                            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Search Results</Text>
                            <FlatList
                                data={searchResults}
                                renderItem={renderSearchResultItem}
                                keyExtractor={(item, index) => `search-${index}`}
                                showsVerticalScrollIndicator={false}
                                style={styles.list}
                            />
                        </>
                    )}

                    {/* Popular Locations - show when no search or no results */}
                    {(!showApiResults || searchResults.length === 0) && (
                        <>
                            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                                {searchText.trim() ? 'Popular Locations' : 'Popular Locations'}
                            </Text>
                            <FlatList
                                data={filteredLocations}
                                renderItem={renderLocationItem}
                                keyExtractor={(item) => item}
                                showsVerticalScrollIndicator={false}
                                style={styles.list}
                            />
                        </>
                    )}

                    {/* No results message */}
                    {searchText.trim() !== '' && !isSearching && showApiResults && searchResults.length === 0 && filteredLocations.length === 0 && (
                        <View style={styles.noResultsContainer}>
                            <Icon name="location-outline" size={48} color="#ccc" />
                            <Text style={[styles.noResultsText, { color: theme.colors.primary }]}>No locations found</Text>
                            <Text style={styles.noResultsSubtext}>Try a different search term or add a custom location</Text>
                            <TouchableOpacity onPress={handleCustomLocationAdd} style={[styles.customLocationBtn, { borderColor: theme.colors.primary }]}>
                                <Text style={[styles.customLocationText, { color: theme.colors.primary }]}>Add "{searchText}" as location</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    safeAreaPad: {
        // paddingTop: 18,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        // Fixed height so the sheet doesn't jump as content switches between
        // popular locations / search results / empty state.
        height: '70%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#2C3D5B',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
    },
    headerBtn: {
        padding: 6,
        borderRadius: 8,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    clearText: {
        fontSize: 14,
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        marginHorizontal: 16,
        marginVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        height: 48,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#333',
    },
    loadingIndicator: {
        marginLeft: 8,
    },
    addButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    currentLocationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    currentLocationText: {
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 6,
    },
    list: {
        flex: 1,
        paddingBottom: 20,
    },
    locationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e0e7ef',
        marginHorizontal: 8,
        marginVertical: 4,
        backgroundColor: '#fff',
        shadowColor: '#2C3D5B',
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 1,
    },
    locationText: {
        fontSize: 14,
        color: '#333',
        marginLeft: 12,
        flex: 1,
        fontWeight: '600',
    },
    searchResultContent: {
        flex: 1,
        marginLeft: 12,
    },
    searchResultSubtext: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    noResultsContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    noResultsText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#333',
        marginTop: 10,
        marginBottom: 6,
    },
    noResultsSubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 16,
    },
    customLocationBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    customLocationText: {
        fontWeight: '700',
        fontSize: 13,
    },
});
