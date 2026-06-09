import api, { API_BASE_URL } from './api';
import { Platform } from 'react-native';
import authFetch from './authFetch';

class UserProfileService {
    // Get user profile
    async getProfile() {
        try {
            const response = await api.get('/profile/me');
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Get profile error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch profile',
                data: null
            };
        }
    }

    // Update user profile. If `profileData.profile_pic_file` is set
    // (`{uri, type, name}`), the request goes out as multipart so the backend
    // can persist the photo. Otherwise it stays as a plain JSON PUT.
    async updateProfile(profileData) {
        try {
            // Email is read-only; never send it through.
            const { email, profile_pic_file, ...updateData } = profileData;

            if (profile_pic_file?.uri) {
                const formData = new FormData();
                // Numeric / object fields need to be stringified for multipart text parts.
                Object.entries(updateData).forEach(([key, value]) => {
                    if (value === undefined || value === null) return;
                    formData.append(
                        key,
                        typeof value === 'object' ? JSON.stringify(value) : String(value),
                    );
                });
                // Normalize Android URIs to file:// the same way the other
                // multipart paths do (createVendorAd, sendMediaMessage, etc.).
                let uri = profile_pic_file.uri;
                if (
                    Platform.OS === 'android' &&
                    uri &&
                    !uri.startsWith('file://') &&
                    !uri.startsWith('content://') &&
                    !uri.startsWith('http')
                ) {
                    uri = `file://${uri}`;
                }
                formData.append('profile_pic', {
                    uri,
                    type: profile_pic_file.type || 'image/jpeg',
                    name: profile_pic_file.name || `profile_${Date.now()}.jpg`,
                });

                const res = await authFetch(`${API_BASE_URL}/profile/update`, {
                    method: 'PUT',
                    body: formData,
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    return {
                        success: false,
                        message: data?.message || `Server error: ${res.status}`,
                        data: null,
                    };
                }
                return {
                    success: true,
                    message: data?.message || 'Profile updated successfully',
                    data: data?.data,
                };
            }

            const response = await api.put('/profile/update', updateData);
            return {
                success: true,
                message: 'Profile updated successfully',
                data: response.data.data,
            };
        } catch (error) {
            console.error('Update profile error:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to update profile',
                data: null,
            };
        }
    }

    // Get user dashboard data
    async getDashboard() {
        try {
            const response = await api.get('/profile/dashboard');
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Get dashboard error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch dashboard',
                data: null
            };
        }
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await api.post('/profile/change-password', {
                currentPassword,
                newPassword
            });
            return {
                success: true,
                message: response.data.message
            };
        } catch (error) {
            console.error('Change password error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to change password'
            };
        }
    }
}

export default new UserProfileService();