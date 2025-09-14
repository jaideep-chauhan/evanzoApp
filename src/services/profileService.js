import api from './api';

const profileService = {
    // Test endpoint to verify current user
    whoAmI: async () => {
        try {
            const response = await api.get('/test/whoami');
            console.log('WHO AM I Response:', response.data);
            return response.data;
        } catch (error) {
            console.error('WHO AM I Error:', error);
            throw error;
        }
    },
    // Get current user profile
    getUserProfile: async () => {
        try {
            const response = await api.get('/profile/me');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get user dashboard data
    getUserDashboard: async () => {
        try {
            const response = await api.get('/profile/dashboard');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Update user profile
    updateUserProfile: async (profileData) => {
        try {
            const response = await api.put('/profile/update', profileData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Upload profile picture
    uploadProfilePicture: async (imageUri) => {
        try {
            const formData = new FormData();
            formData.append('image', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'profile.jpg',
            });

            const response = await api.post('/upload/profile-picture', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Change password
    changePassword: async (currentPassword, newPassword) => {
        try {
            const response = await api.post('/profile/change-password', {
                currentPassword,
                newPassword,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get user's vendor ads
    getUserVendorAds: async (userId = null, params = {}) => {
        try {
            const url = userId ? `/profile/${userId}/vendor-ads` : '/profile/vendor-ads';
            const response = await api.get(url, { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get user's events
    getUserEvents: async (userId = null, params = {}) => {
        try {
            const url = userId ? `/profile/${userId}/events` : '/profile/events';
            const response = await api.get(url, { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get user preferences
    getUserPreferences: async () => {
        try {
            const response = await api.get('/profile/preferences');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Update user preferences
    updateUserPreferences: async (preferences) => {
        try {
            const response = await api.put('/profile/preferences', preferences);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Follow/Unfollow user
    toggleFollowUser: async (userId) => {
        try {
            const response = await api.post(`/profile/follow/${userId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get followers
    getUserFollowers: async (userId = null, page = 1, limit = 20) => {
        try {
            const url = userId ? `/profile/${userId}/followers` : '/profile/followers';
            const response = await api.get(url, { params: { page, limit } });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get following
    getUserFollowing: async (userId = null, page = 1, limit = 20) => {
        try {
            const url = userId ? `/profile/${userId}/following` : '/profile/following';
            const response = await api.get(url, { params: { page, limit } });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Save/Unsave item
    toggleSavedItem: async (itemId, itemType) => {
        try {
            const response = await api.post('/profile/saved-items/toggle', {
                itemId,
                itemType,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get saved items
    getSavedItems: async (itemType = null, page = 1, limit = 20) => {
        try {
            const params = { page, limit };
            if (itemType) params.itemType = itemType;
            
            const response = await api.get('/profile/saved-items', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get booking history
    getBookingHistory: async (filters = {}, page = 1, limit = 20) => {
        try {
            const response = await api.get('/profile/bookings', {
                params: { ...filters, page, limit },
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get payment history
    getPaymentHistory: async (filters = {}, page = 1, limit = 20) => {
        try {
            const response = await api.get('/profile/payments', {
                params: { ...filters, page, limit },
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Delete account
    deleteUserAccount: async (password) => {
        try {
            const response = await api.delete('/profile/delete-account', {
                data: { password },
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Pre-saved messages
    getPreSavedMessages: async () => {
        try {
            const response = await api.get('/settings/pre-saved-messages');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    createPreSavedMessage: async (message) => {
        try {
            const response = await api.post('/settings/pre-saved-messages', message);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    updatePreSavedMessage: async (messageId, message) => {
        try {
            const response = await api.put(`/settings/pre-saved-messages/${messageId}`, message);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    deletePreSavedMessage: async (messageId) => {
        try {
            const response = await api.delete(`/settings/pre-saved-messages/${messageId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
};

export default profileService;