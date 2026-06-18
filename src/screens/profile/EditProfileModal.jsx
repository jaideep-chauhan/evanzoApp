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
import LocationSelector from '../../components/LocationSelector';
import { icons } from '../../assets/icons';
import { openImagePickerWithCropper, openCameraWithCropper } from '../../utils/imageCropperUtils';

// extractLocationFields helper removed — LocationSelector now emits a flat
// payload directly (country/state/city/lat/lon/formattedLocation), so the
// Nominatim/Photon address-shape translation is no longer needed here.

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
    // profile_pic_uri = currently-rendered avatar (existing user.profile_pic or a
    // local file:// from the picker). pendingPicFile = the {uri,type,name} we
    // attach to the multipart PUT on save. null if the user hasn't changed it.
    const [profilePicUri, setProfilePicUri] = useState(null);
    const [pendingPicFile, setPendingPicFile] = useState(null);

    // Picker: gallery → cropper → preview. Camera path is offered too via
    // Alert so the user can take a fresh shot. The cropper utility already
    // caps the output at 1080×1080 / q=0.8 so uploads stay small.
    const handlePickProfilePic = () => {
        Alert.alert(
            'Profile picture',
            'Choose a new photo',
            [
                {
                    text: 'Take photo',
                    onPress: async () => {
                        try {
                            const result = await openCameraWithCropper({
                                width: 800,
                                height: 800,
                                cropping: true,
                                freeStyleCropEnabled: false,
                            });
                            if (result?.uri) {
                                setProfilePicUri(result.uri);
                                setPendingPicFile({
                                    uri: result.uri,
                                    type: result.mime || 'image/jpeg',
                                    name: `profile_${Date.now()}.jpg`,
                                });
                            }
                        } catch (_) { /* user cancelled */ }
                    },
                },
                {
                    text: 'Choose from library',
                    onPress: async () => {
                        try {
                            const [picked] = await openImagePickerWithCropper({ multiple: false });
                            if (picked?.uri) {
                                setProfilePicUri(picked.uri);
                                setPendingPicFile({
                                    uri: picked.uri,
                                    type: picked.mime || 'image/jpeg',
                                    name: `profile_${Date.now()}.jpg`,
                                });
                            }
                        } catch (_) { /* user cancelled */ }
                    },
                },
                { text: 'Cancel', style: 'cancel' },
            ],
        );
    };
    // showLocationModal state removed — LocationSelector owns its own
    // visibility when used inline (no externallyControlled flag).

    useEffect(() => {
        const loadUserData = async () => {
            if (visible && user) {
                // Hydrate the avatar preview from whatever the server says
                // the user's profile_pic currently is. Reset the pending file
                // so an old picked-but-not-saved image doesn't bleed across opens.
                setProfilePicUri(user.profile_pic || null);
                setPendingPicFile(null);

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
            // Attach the picked photo if the user changed it this session.
            // The service detects this and switches to multipart.
            if (pendingPicFile) {
                payload.profile_pic_file = pendingPicFile;
            }

            const response = await userProfileService.updateProfile(payload);

            if (response.success) {
                // Prefer the server-returned URL — the controller wrote the
                // absolute URL into the response, so any avatar elsewhere in
                // the app (profile header, chat list, etc.) sees the new one.
                const newProfilePic = response.data?.profile_pic || profilePicUri || user.profile_pic;

                // Update user context with new data
                updateUser({
                    ...user,
                    full_name: formData.full_name.trim(),
                    phone: formData.phone.trim(),
                    location: formData.location.trim(),
                    bio: formData.bio.trim(),
                    profile_pic: newProfilePic,
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
                        {/* Avatar — tap to pick. The pending file rides
                            along on the multipart Save; the preview shows
                            the local URI immediately. */}
                        <TouchableOpacity
                            style={styles.avatarPickerWrap}
                            onPress={handlePickProfilePic}
                            activeOpacity={0.85}
                        >
                            {profilePicUri ? (
                                <Image source={{ uri: profilePicUri }} style={styles.avatarPreview} />
                            ) : (
                                <View style={[styles.avatarPreview, styles.avatarFallback]}>
                                    <Text style={[styles.avatarFallbackText, { color: theme.colors.primary }]}>
                                        {(user?.full_name || 'U')
                                            .split(' ')
                                            .map((p) => p[0])
                                            .slice(0, 2)
                                            .join('')
                                            .toUpperCase()}
                                    </Text>
                                </View>
                            )}
                            <View style={[styles.avatarBadge, { backgroundColor: theme.colors.primary }]}>
                                <Icon name="camera" size={14} color="#fff" />
                            </View>
                        </TouchableOpacity>
                        <Text style={[styles.avatarHint, { color: theme.colors.textSecondary }]}>
                            Tap to change photo
                        </Text>

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

                        {/* Location — same LocationSelector as Create Ad form.
                            Emits a flat payload with country/state/city/lat/lon
                            + a pre-joined formattedLocation we can drop into
                            formData.location directly. */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Location</Text>
                            <LocationSelector
                                lightBackground
                                // formData.location is the fresh formatted
                                // string ("Panchkula, Haryana, India").
                                // Pass it as initialDisplay so the picker
                                // shows the current value even when the
                                // structured city/state/country fields are
                                // stale from an older save.
                                initialDisplay={formData.location}
                                initialCountry={locationData?.country || ''}
                                initialState={locationData?.state || ''}
                                initialCity={locationData?.city || ''}
                                onLocationChange={(payload) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        location: payload?.formattedLocation || '',
                                    }));
                                    setLocationData({
                                        country: payload?.country || null,
                                        state: payload?.state || null,
                                        city: payload?.city || null,
                                        latitude: payload?.latitude ?? null,
                                        longitude: payload?.longitude ?? null,
                                    });
                                }}
                            />
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

            {/* LocationSearchModal block removed — LocationSelector is
                inlined into the form above and renders its own modal. */}
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
    avatarPickerWrap: {
        alignSelf: 'center',
        marginTop: 4,
        marginBottom: 8,
        width: 96,
        height: 96,
    },
    avatarPreview: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#E5E9F0',
    },
    avatarFallback: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarFallbackText: {
        fontSize: 32,
        fontWeight: '700',
    },
    avatarBadge: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarHint: {
        textAlign: 'center',
        fontSize: 12,
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