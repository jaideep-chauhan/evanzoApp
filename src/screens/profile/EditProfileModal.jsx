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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../ThemeContext';
import userProfileService from '../../services/userProfileService';
import { useAuth } from '../../context/AuthContext';

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

    useEffect(() => {
        if (visible && user) {
            setFormData({
                full_name: user.full_name || '',
                email: user.email || '',
                phone: user.phone || '',
                location: user.location || '',
                bio: user.bio || '',
            });
        }
    }, [visible, user]);

    const handleUpdate = async () => {
        if (!formData.full_name.trim()) {
            Alert.alert('Error', 'Full name is required');
            return;
        }

        setLoading(true);
        try {
            const response = await userProfileService.updateProfile({
                full_name: formData.full_name.trim(),
                phone: formData.phone.trim(),
                location: formData.location.trim(),
                bio: formData.bio.trim(),
            });

            if (response.success) {
                // Update user context with new data
                updateUser({
                    ...user,
                    full_name: formData.full_name.trim(),
                    phone: formData.phone.trim(),
                    location: formData.location.trim(),
                    bio: formData.bio.trim(),
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

                        {/* Location */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Location</Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.colors.borderLight }]}
                                value={formData.location}
                                onChangeText={(text) => setFormData({ ...formData, location: text })}
                                placeholder="Enter your location"
                                placeholderTextColor={theme.colors.textSecondary}
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