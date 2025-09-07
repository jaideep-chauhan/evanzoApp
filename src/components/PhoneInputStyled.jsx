import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Modal,
    FlatList,
    SafeAreaView,
} from 'react-native';
import { useTheme } from '../ThemeContext';
import Icon from 'react-native-vector-icons/Feather';
import countryCodes from '../data/countryCodes.json';

const CustomPhoneInputStyled = ({
    value = '',
    onChangeText,
    onChangeFormattedText,
    onChangeCountry,
    placeholder = 'Enter phone number',
    editable = true,
    error = false,
    defaultCountry = 'US',
    style,
    containerStyle,
    ...props
}) => {
    const theme = useTheme();
    const [phoneNumber, setPhoneNumber] = useState(value);
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCountry, setSelectedCountry] = useState(
        countryCodes.find(c => c.code === defaultCountry) || countryCodes[0]
    );

    useEffect(() => {
        if (value !== phoneNumber) {
            setPhoneNumber(value);
        }
    }, [value]);

    useEffect(() => {
        // Notify parent about initial country
        if (onChangeCountry && selectedCountry) {
            onChangeCountry({
                countryCode: selectedCountry.code,
                callingCode: selectedCountry.dialCode,
                country: selectedCountry
            });
        }
    }, []);

    const handleChangeText = (text) => {
        // Only allow numbers
        const cleanedText = text.replace(/[^\d]/g, '');
        setPhoneNumber(cleanedText);
        
        if (onChangeText) {
            onChangeText(cleanedText);
        }
        
        if (onChangeFormattedText) {
            const formatted = `${selectedCountry.dialCode}${cleanedText}`;
            onChangeFormattedText(formatted);
        }
    };

    const handleSelectCountry = (country) => {
        setSelectedCountry(country);
        setShowCountryPicker(false);
        setSearchQuery('');
        
        if (onChangeCountry) {
            onChangeCountry({
                countryCode: country.code,
                callingCode: country.dialCode,
                country: country
            });
        }
        
        // Update formatted text with new country code
        if (onChangeFormattedText && phoneNumber) {
            const formatted = `${country.dialCode}${phoneNumber}`;
            onChangeFormattedText(formatted);
        }
    };

    const filteredCountries = countryCodes.filter(country => {
        const query = searchQuery.toLowerCase();
        return (
            country.name.toLowerCase().includes(query) ||
            country.code.toLowerCase().includes(query) ||
            country.dialCode.includes(query)
        );
    });

    const renderCountryItem = ({ item }) => (
        <TouchableOpacity
            style={styles.countryItem}
            onPress={() => handleSelectCountry(item)}
        >
            <Text style={styles.countryFlag}>{item.flag}</Text>
            <View style={styles.countryDetails}>
                <Text style={[styles.countryName, { color: theme.colors.primary }]}>
                    {item.name}
                </Text>
                <Text style={styles.countryCode}>{item.dialCode}</Text>
            </View>
            {selectedCountry.code === item.code && (
                <Icon name="check" size={20} color={theme.colors.primary} />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, containerStyle]}>
            <View style={[
                styles.inputContainer,
                { 
                    borderColor: error ? '#ff6b6b' : '#ccc',
                    backgroundColor: '#fff'
                },
                style
            ]}>
                <TouchableOpacity
                    style={styles.countrySelector}
                    onPress={() => setShowCountryPicker(true)}
                    disabled={!editable}
                >
                    <Text style={styles.flag}>{selectedCountry.flag}</Text>
                    <Text style={[styles.dialCode, { color: theme.colors.primary }]}>
                        {selectedCountry.dialCode}
                    </Text>
                    <Icon name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
                
                <View style={styles.divider} />
                
                <TextInput
                    style={[styles.phoneInput, { color: theme.colors.primary }]}
                    placeholder={placeholder}
                    placeholderTextColor="#aaa"
                    value={phoneNumber}
                    onChangeText={handleChangeText}
                    keyboardType="phone-pad"
                    editable={editable}
                    {...props}
                />
            </View>

            <Modal
                visible={showCountryPicker}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowCountryPicker(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => {
                                setShowCountryPicker(false);
                                setSearchQuery('');
                            }}
                        >
                            <Icon name="x" size={24} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>
                            Select Country
                        </Text>
                        <View style={styles.closeButton} />
                    </View>

                    <View style={styles.searchContainer}>
                        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.colors.primary }]}
                            placeholder="Search country..."
                            placeholderTextColor="#aaa"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity
                                onPress={() => setSearchQuery('')}
                                style={styles.clearButton}
                            >
                                <Icon name="x-circle" size={18} color="#666" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <FlatList
                        data={filteredCountries}
                        keyExtractor={(item) => item.code}
                        renderItem={renderCountryItem}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                    />
                </SafeAreaView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderRadius: 10,
        borderWidth: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 0,
        overflow: 'hidden',
    },
    countrySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 6,
    },
    flag: {
        fontSize: 24,
    },
    dialCode: {
        fontSize: 15,
        fontWeight: '500',
    },
    divider: {
        width: 1,
        height: '60%',
        backgroundColor: '#E5E5E5',
        marginHorizontal: 4,
    },
    phoneInput: {
        flex: 1,
        fontSize: 15,
        paddingHorizontal: 12,
        height: '100%',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginVertical: 12,
        paddingHorizontal: 12,
        height: 44,
        backgroundColor: '#F4F6FA',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5EAF2',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        paddingVertical: 0,
    },
    clearButton: {
        padding: 4,
    },
    listContainer: {
        paddingBottom: 20,
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    countryDetails: {
        flex: 1,
        marginLeft: 12,
    },
    countryName: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 2,
    },
    countryCode: {
        fontSize: 13,
        color: '#666',
    },
    separator: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginHorizontal: 16,
    },
});

export default CustomPhoneInputStyled;