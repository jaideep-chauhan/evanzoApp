import api from './api';

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

    // Update user profile
    async updateProfile(profileData) {
        try {
            // Filter out email as it's not editable
            const { email, ...updateData } = profileData;
            
            const response = await api.put('/profile/update', updateData);
            return {
                success: true,
                message: 'Profile updated successfully',
                data: response.data.data
            };
        } catch (error) {
            console.error('Update profile error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to update profile',
                data: null
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