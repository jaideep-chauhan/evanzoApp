import React, { useState, useEffect } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    FlatList,
    Text,
    StyleSheet,
    ActivityIndicator,
    Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// Google Places API configuration
const GOOGLE_PLACES_API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY'; // Replace with your API key

const LocationAutocomplete = ({ value, onChangeText, placeholder, style, placeholderTextColor }) => {
    const [searchText, setSearchText] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        setSearchText(value || '');
    }, [value]);

    // Debounce search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchText && searchText.length > 2) {
                fetchLocationSuggestions(searchText);
            } else {
                setSuggestions([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchText]);

    const fetchLocationSuggestions = async (text) => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
                    text
                )}&key=${GOOGLE_PLACES_API_KEY}&types=(cities)&components=country:us|country:ca`
            );
            const data = await response.json();

            if (data.predictions) {
                setSuggestions(data.predictions);
                setShowSuggestions(true);
            }
        } catch (error) {
            console.error('Error fetching location suggestions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectLocation = (location) => {
        const locationText = location.description;
        setSearchText(locationText);
        onChangeText(locationText);
        setSuggestions([]);
        setShowSuggestions(false);
        setShowModal(false);
    };

    const handleTextChange = (text) => {
        setSearchText(text);
        onChangeText(text);
    };

    const handleFocus = () => {
        if (suggestions.length > 0) {
            setShowModal(true);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <TextInput
                    style={[styles.input, style]}
                    value={searchText}
                    onChangeText={handleTextChange}
                    placeholder={placeholder}
                    placeholderTextColor={placeholderTextColor}
                    onFocus={handleFocus}
                />
                {isLoading && (
                    <ActivityIndicator
                        size="small"
                        color="#4CAF50"
                        style={styles.loadingIndicator}
                    />
                )}
                {searchText.length > 0 && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => {
                            setSearchText('');
                            onChangeText('');
                            setSuggestions([]);
                            setShowSuggestions(false);
                        }}
                    >
                        <Icon name="close-circle" size={20} color="#ffffff80" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Suggestions Modal */}
            <Modal
                visible={showModal && suggestions.length > 0}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={() => setShowModal(false)}
                >
                    <View style={styles.suggestionsModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Location</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Icon name="close" size={24} color="#2C3D5B" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={suggestions}
                            keyExtractor={(item) => item.place_id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.suggestionItem}
                                    onPress={() => handleSelectLocation(item)}
                                >
                                    <Icon
                                        name="location-outline"
                                        size={20}
                                        color="#2C3D5B"
                                        style={styles.locationIcon}
                                    />
                                    <View style={styles.suggestionTextContainer}>
                                        <Text style={styles.suggestionMainText}>
                                            {item.structured_formatting.main_text}
                                        </Text>
                                        <Text style={styles.suggestionSecondaryText}>
                                            {item.structured_formatting.secondary_text}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            style={styles.suggestionsList}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Inline suggestions (when not modal) */}
            {showSuggestions && !showModal && suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    <FlatList
                        data={suggestions.slice(0, 5)}
                        keyExtractor={(item) => item.place_id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.suggestionItemInline}
                                onPress={() => handleSelectLocation(item)}
                            >
                                <Icon
                                    name="location-outline"
                                    size={18}
                                    color="#ffffff80"
                                    style={styles.locationIcon}
                                />
                                <View style={styles.suggestionTextContainer}>
                                    <Text style={styles.suggestionMainTextInline}>
                                        {item.structured_formatting.main_text}
                                    </Text>
                                    <Text style={styles.suggestionSecondaryTextInline}>
                                        {item.structured_formatting.secondary_text}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        style={styles.suggestionsListInline}
                        nestedScrollEnabled={true}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        width: '100%',
    },
    inputContainer: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        paddingRight: 40,
    },
    loadingIndicator: {
        position: 'absolute',
        right: 40,
    },
    clearButton: {
        position: 'absolute',
        right: 12,
        padding: 4,
    },
    suggestionsContainer: {
        backgroundColor: '#41547A',
        borderRadius: 12,
        marginTop: 4,
        maxHeight: 200,
        borderWidth: 1,
        borderColor: '#ffffff30',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
    },
    suggestionsListInline: {
        maxHeight: 200,
    },
    suggestionItemInline: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ffffff10',
    },
    suggestionMainTextInline: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    suggestionSecondaryTextInline: {
        color: '#ffffff80',
        fontSize: 12,
        marginTop: 2,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    suggestionsModal: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        width: '85%',
        maxHeight: '70%',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2C3D5B',
    },
    suggestionsList: {
        maxHeight: 400,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    locationIcon: {
        marginRight: 12,
    },
    suggestionTextContainer: {
        flex: 1,
    },
    suggestionMainText: {
        color: '#2C3D5B',
        fontSize: 15,
        fontWeight: '600',
    },
    suggestionSecondaryText: {
        color: '#666',
        fontSize: 13,
        marginTop: 2,
    },
});

export default LocationAutocomplete;
