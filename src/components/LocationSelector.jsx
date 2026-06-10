import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    TextInput,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { searchLocations as photonSearch } from '../services/photonService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.85;
const DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

const LocationSelector = ({
    onLocationChange,
    initialCountry = '',
    initialState = '',
    initialCity = '',
    style,
    inputStyle,
    // Externally-controlled mode for list-screen filters:
    //   <LocationSelector externallyControlled visible={open} onClose={...} />
    // Skips rendering the trigger button and uses parent-driven visibility,
    // so the same picker UI is reused without the inline dropdown button.
    externallyControlled = false,
    visible: visibleProp,
    onClose,
}) => {
    const [selected, setSelected] = useState(() => {
        // Show initial value if any of the initial fields were provided
        const display = [initialCity, initialState, initialCountry].filter(Boolean).join(', ');
        return display ? { display_name: display, name: initialCity || initialState || initialCountry } : null;
    });
    const [internalShow, setInternalShow] = useState(false);
    // Parent controls visibility when externallyControlled, else this component owns it.
    const showModal = externallyControlled ? !!visibleProp : internalShow;
    const setShowModal = (next) => {
        if (externallyControlled) {
            if (!next && onClose) onClose();
        } else {
            setInternalShow(next);
        }
    };
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeoutRef = useRef(null);
    const lastQueryRef = useRef('');
    const lastEmittedRef = useRef(null);

    // Emit initial location data if provided
    useEffect(() => {
        if ((initialCountry || initialState || initialCity) && onLocationChange) {
            const formatted = [initialCity, initialState, initialCountry].filter(Boolean).join(', ');
            const payload = {
                country: initialCountry || '',
                countryCode: '',
                state: initialState || '',
                stateCode: '',
                city: initialCity || '',
                formattedLocation: formatted,
                latitude: null,
                longitude: null,
            };
            const key = JSON.stringify(payload);
            if (lastEmittedRef.current !== key) {
                lastEmittedRef.current = key;
                onLocationChange(payload);
            }
        }
    }, [initialCountry, initialState, initialCity]);

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
                if (lastQueryRef.current === q) setResults(places);
            } catch (e) {
                if (lastQueryRef.current === q) setResults([]);
            } finally {
                if (lastQueryRef.current === q) setIsSearching(false);
            }
        }, DEBOUNCE_MS);
    }, []);

    const handleSelect = (place) => {
        setSelected(place);
        setShowModal(false);
        setQuery('');
        setResults([]);
        if (onLocationChange) {
            const payload = {
                country: place.country || '',
                countryCode: place.country_code || '',
                state: place.state || '',
                stateCode: '',
                city: place.city || place.name || '',
                formattedLocation: place.display_name,
                latitude: place.lat,
                longitude: place.lon,
            };
            const key = JSON.stringify(payload);
            if (lastEmittedRef.current !== key) {
                lastEmittedRef.current = key;
                onLocationChange(payload);
            }
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setQuery('');
        setResults([]);
    };

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, []);

    return (
        <View style={[styles.container, style]}>
            {/* Trigger button is only for inline (Create Ad) usage. In
                externally-controlled mode the parent (a filter chip on the
                listing page) decides when the modal opens, so we skip the
                button entirely. */}
            {!externallyControlled && (
                <TouchableOpacity
                    style={[styles.dropdownButton, inputStyle]}
                    onPress={() => setShowModal(true)}
                    activeOpacity={0.8}
                >
                    <View style={styles.dropdownContent}>
                        <Text style={styles.dropdownLabel}>Location</Text>
                        <Text
                            style={[styles.dropdownText, !selected && styles.placeholderText]}
                            numberOfLines={1}
                        >
                            {selected?.display_name || 'Search city, region or country'}
                        </Text>
                    </View>
                    <Icon name="search" size={20} color="#ffffff80" />
                </TouchableOpacity>
            )}

            <Modal
                visible={showModal}
                transparent
                animationType="slide"
                onRequestClose={handleClose}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={handleClose}
                    />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Location</Text>
                            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                                <Icon name="close" size={24} color="#2C3D5B" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchContainer}>
                            <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Type city, region or country..."
                                placeholderTextColor="#999"
                                value={query}
                                onChangeText={(t) => { setQuery(t); runSearch(t); }}
                                autoCapitalize="words"
                                autoCorrect={false}
                                autoFocus
                                returnKeyType="search"
                            />
                            {isSearching && (
                                <ActivityIndicator size="small" color="#2C3D5B" style={{ marginLeft: 6 }} />
                            )}
                            {!isSearching && query.length > 0 && (
                                <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
                                    <Icon name="close-circle" size={20} color="#999" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {results.length > 0 ? (
                            <FlatList
                                data={results}
                                keyExtractor={(item) => item.id}
                                keyboardShouldPersistTaps="handled"
                                contentContainerStyle={styles.listContent}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.listItem}
                                        onPress={() => handleSelect(item)}
                                    >
                                        <Icon name="location-outline" size={20} color="#2C3D5B" />
                                        <View style={styles.listItemTextWrap}>
                                            <Text style={styles.listItemMain} numberOfLines={1}>
                                                {item.main_text}
                                            </Text>
                                            {item.secondary_text ? (
                                                <Text style={styles.listItemSecondary} numberOfLines={1}>
                                                    {item.secondary_text}
                                                </Text>
                                            ) : null}
                                        </View>
                                    </TouchableOpacity>
                                )}
                            />
                        ) : query.trim().length >= MIN_QUERY_LENGTH && !isSearching ? (
                            <View style={styles.emptyState}>
                                <Icon name="location-outline" size={48} color="#ccc" />
                                <Text style={styles.emptyText}>No results found</Text>
                            </View>
                        ) : (
                            <View style={styles.emptyState}>
                                <Icon name="search" size={48} color="#ccc" />
                                <Text style={styles.emptyText}>Start typing to search</Text>
                                <Text style={styles.emptySubtext}>
                                    Works for any city, region or country worldwide.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { width: '100%' },
    dropdownButton: {
        backgroundColor: '#41547A',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ffffff30',
        shadowColor: '#000',
        shadowOpacity: 0.10,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    dropdownContent: { flex: 1 },
    dropdownLabel: {
        color: '#ffffff90',
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dropdownText: { color: '#ffffff', fontSize: 15 },
    placeholderText: { color: '#ffffff60' },
    modalContainer: { flex: 1, justifyContent: 'flex-end' },
    modalBackdrop: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: MODAL_HEIGHT,
        elevation: 20,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: -5 },
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 18,
        borderBottomWidth: 1, borderBottomColor: '#E5E5E5',
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#2C3D5B' },
    closeButton: { padding: 4 },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F5F5F5', margin: 16,
        borderRadius: 12, paddingHorizontal: 12,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#333' },
    listContent: { paddingBottom: 20 },
    listItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    },
    listItemTextWrap: { flex: 1, marginLeft: 12 },
    listItemMain: { fontSize: 15, fontWeight: '600', color: '#2C3D5B' },
    listItemSecondary: { fontSize: 13, color: '#666', marginTop: 2 },
    emptyState: {
        paddingVertical: 60, paddingHorizontal: 20,
        alignItems: 'center', justifyContent: 'center',
    },
    emptyText: { fontSize: 16, color: '#999', fontWeight: '600', marginTop: 16, textAlign: 'center' },
    emptySubtext: { fontSize: 13, color: '#bbb', marginTop: 8, textAlign: 'center' },
});

export default LocationSelector;
