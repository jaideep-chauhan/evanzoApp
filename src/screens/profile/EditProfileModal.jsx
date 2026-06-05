import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../ThemeContext';
import userProfileService from '../../services/userProfileService';
import { useAuth } from '../../context/AuthContext';
import LocationSearchModal from '../vendors/LocationSearchModal';
import { icons } from '../../assets/icons';

// Translate a Nominatim/Photon payload into the flat shape the backend expects.
// Returns null fields when only a popular-location string was picked.
const extractLocationFields = (structured) => {
    if (!structured) return null;
    const addr = structured.address || {};
    return {
        country: addr.country || null,
        state: addr.state || addr.state_district || addr.region || null,
        city: addr.city || addr.town || addr.village || addr.municipality || addr.hamlet || null,
        latitude: structured.lat ?? null,
        longitude: structured.lon ?? null,
    };
};

export default function EditProfileModal({ visible, onClose, onUpdate }) {
    const theme = useTheme();
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        location: '',
        bio: '',
    });
    // Structured location data captured when the user picks an API result in
    // the modal. Stays null when only a popular-location string was picked.
    const [locationData, setLocationData] = useState(null);
    const [showLocationModal, setShowLocationModal] = useState(false);

    useEffect(() => {
        const loadUserData = async () => {
            if (visible && user) {
                // Pre-populate structured location from whatever the user
                // already has saved, so a Save without re-picking the modal
                // doesn't wipe their existing country/state/city/lat/lon.
                const hasStructured =
                    user.country || user.state || user.city ||
                    user.latitude != null || user.longitude != null;
                setLocationData(hasStructured ? {
                    country: user.country || null,
                    state: user.state || null,
                    city: user.city || null,
                    latitude: user.latitude ?? null,
                    longitude: user.longitude ?? null,
                } : null);

                console.log('📝 EditProfileModal - User data from context:', {
                    full_name: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    location: user.location,
                    bio: user.bio,
                    allKeys: Object.keys(user)
                });

                // Try to get additional data from AsyncStorage
                try {
                    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                    const userData = await AsyncStorage.getItem('userData');
                    if (userData) {
                        const parsedData = JSON.parse(userData);
                        console.log('📝 EditProfileModal - User data from storage:', {
                            phone_number: parsedData.phone_number,
                            phone: parsedData.phone,
                            location: parsedData.location,
                            allKeys: Object.keys(parsedData)
                        });

                        // Merge data from storage with context
                        setFormData({
                            full_name: user.full_name || parsedData.full_name || parsedData.name || '',
                            email: user.email || parsedData.email || '',
                            phone: user.phone || parsedData.phone || parsedData.phone_number || '',
                            location: user.location || parsedData.location || '',
                            bio: user.bio || parsedData.bio || '',
                        });
                    } else {
                        // Just use context data
                        setFormData({
                            full_name: user.full_name || '',
                            email: user.email || '',
                            phone: user.phone || '',
                            location: user.location || '',
                            bio: user.bio || '',
                        });
                    }
                } catch (error) {
                    console.error('Error loading user data from storage:', error);
                    // Fallback to context data
                    setFormData({
                        full_name: user.full_name || '',
                        email: user.email || '',
                        phone: user.phone || '',
                        location: user.location || '',
                        bio: user.bio || '',
                    });
                }
            }
        };

        loadUserData();
    }, [visible, user]);

    const handleUpdate = async () => {
        if (!formData.full_name.trim()) {
            Alert.alert('Error', 'Full name is required');
            return;
        }

        setLoading(true);
        try {
            // Build payload — only include structured fields when the user
            // actually picked an API result. Backend validation tolerates
            // either presence or absence (allow('', null) + .unknown(true)).
            const payload = {
                full_name: formData.full_name.trim(),
                phone: formData.phone.trim(),
                location: formData.location.trim(),
                bio: formData.bio.trim(),
            };
            if (locationData) {
                if (locationData.country) payload.country = locationData.country;
                if (locationData.state) payload.state = locationData.state;
                if (locationData.city) payload.city = locationData.city;
                if (locationData.latitude != null) payload.latitude = locationData.latitude;
                if (locationData.longitude != null) payload.longitude = locationData.longitude;
            }

            const response = await userProfileService.updateProfile(payload);

            if (response.success) {
                // Update user context with new data
                updateUser({
                    ...user,
                    full_name: formData.full_name.trim(),
                    phone: formData.phone.trim(),
                    location: formData.location.trim(),
                    bio: formData.bio.trim(),
                    ...(locationData || {}),
                });
                
                Alert.alert('Success', 'Profile updated successfully');
                if (onUpdate) onUpdate();
                onClose();
            } else {
                Alert.alert('Error', response.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView 
                style={styles.modalOverlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>
                            Edit Profile
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name="close" size={28} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Form */}
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Full Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name *</Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.colors.borderLight }]}
                                value={formData.full_name}
                                onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                                placeholder="Enter your full name"
                                placeholderTextColor={theme.colors.textSecondary}
                            />
                        </View>

                        {/* Email (Non-editable) */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <View style={[styles.input, styles.disabledInput, { borderColor: theme.colors.borderLight }]}>
                                <Text style={styles.disabledText}>{formData.email}</Text>
                                <Icon name="lock-closed-outline" size={16} color={theme.colors.textSecondary} />
                            </View>
                            <Text style={styles.helperText}>Email cannot be changed</Text>
                        </View>

                        {/* Phone Number */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.colors.borderLight }]}
                                value={formData.phone}
                                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                placeholder="Enter your phone number"
                                placeholderTextColor={theme.colors.textSecondary}
                                keyboardType="phone-pad"
                            />
                        </View>

                        {/* Location — uses the same picker as the create-ad form
                            so structured country/state/city/lat/lon are captured. */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Location</Text>
                            <TouchableOpacity
                                style={[styles.input, styles.locationPicker, { borderColor: theme.colors.borderLight }]}
                                onPress={() => setShowLocationModal(true)}
                                activeOpacity={0.8}
                            >
                                <Image source={icons.location} style={styles.locationPin} />
                                <Text
                                    style={[
                                        styles.locationText,
                                        { color: formData.location ? theme.colors.text : theme.colors.textSecondary },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {formData.location || 'Choose location'}
                                </Text>
                                <Icon name="search" size={18} color={theme.colors.textSecondary} style={{ marginLeft: 'auto' }} />
                            </TouchableOpacity>
                        </View>

                        {/* Bio */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Bio</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { borderColor: theme.colors.borderLight }]}
                                value={formData.bio}
                                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                                placeholder="Tell us about yourself"
                                placeholderTextColor={theme.colors.textSecondary}
                                multiline={true}
                                numberOfLines={4}
                                maxLength={500}
                            />
                            <Text style={styles.charCount}>{formData.bio.length}/500</Text>
                        </View>
                    </ScrollView>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity 
                            style={[styles.button, styles.cancelButton]} 
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.button, styles.saveButton, { backgroundColor: theme.colors.primary }]} 
                            onPress={handleUpdate}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Location picker — same component used by the create-ad form */}
            <LocationSearchModal
                visible={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                currentLocation={formData.location}
                screenType="vendors"
                onLocationSelect={(formatted, structured) => {
                    setFormData((prev) => ({ ...prev, location: formatted || '' }));
                    setLocationData(extractLocationFields(structured));
                }}
            />
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        maxWidth: 500,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
    locationPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    locationPin: {
        width: 18,
        height: 18,
        resizeMode: 'contain',
    },
    locationText: {
        flex: 1,
        fontSize: 16,
    },
    disabledInput: {
        backgroundColor: '#f5f5f5',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    disabledText: {
        color: '#999',
        fontSize: 16,
    },
    textArea: {
        height: 100,
        paddingTop: 12,
        textAlignVertical: 'top',
    },
    helperText: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
        fontStyle: 'italic',
    },
    charCount: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
        marginTop: 5,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});