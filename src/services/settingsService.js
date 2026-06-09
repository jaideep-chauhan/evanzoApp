import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Settings Service
 *
 * Handles all settings-related API calls including:
 * - Security settings (2FA, login alerts, login history)
 * - Privacy settings
 * - Blocked users management
 * - Support tickets
 * - Problem reports
 * - FAQs and Terms & Policies
 * - Account deletion
 */
class SettingsService {
    // ==================== SECURITY SETTINGS ====================

    /**
     * Enable or disable two-factor authentication
     * @param {boolean} enable - True to enable, false to disable
     * @param {string} password - User's password for verification
     * @returns {Promise<{success: boolean, data?: object, message?: string}>}
     */
    async toggle2FA(enable, password) {
        try {
            const response = await api.post('/settings/security/2fa', {
                enable,
                password,
            });

            if (response.data.success) {
                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to update 2FA settings',
            };
        } catch (error) {
            console.error('[SettingsService] Error toggling 2FA:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to update 2FA settings',
            };
        }
    }

    /**
     * Verify 2FA code
     * @param {string} code - 6-digit verification code
     * @returns {Promise<{success: boolean, data?: object, message?: string}>}
     */
    async verify2FA(code) {
        try {
            const response = await api.post('/settings/security/2fa/verify', {
                code,
            });

            if (response.data.success) {
                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message,
                };
            }

            return {
                success: false,
                message: response.data.message || '2FA verification failed',
            };
        } catch (error) {
            console.error('[SettingsService] Error verifying 2FA:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || '2FA verification failed',
            };
        }
    }

    /**
     * Toggle login alerts on/off
     * @param {boolean} enabled - True to enable, false to disable
     * @returns {Promise<{success: boolean, message?: string}>}
     */
    async toggleLoginAlerts(enabled) {
        try {
            const response = await api.post('/settings/security/login-alerts', {
                enable: enabled,
            });

            if (response.data.success) {
                return {
                    success: true,
                    message: response.data.message,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to update login alerts',
            };
        } catch (error) {
            console.error('[SettingsService] Error toggling login alerts:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to update login alerts',
            };
        }
    }

    /**
     * Get login history
     * @param {number} page - Page number (default: 1)
     * @param {number} limit - Items per page (default: 20)
     * @returns {Promise<{success: boolean, data?: object}>}
     */
    async getLoginHistory(page = 1, limit = 20) {
        try {
            const response = await api.get('/settings/security/login-history', {
                params: { page, limit },
            });

            if (response.data.success) {
                return {
                    success: true,
                    data: response.data.data,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to fetch login history',
                data: {
                    logins: [],
                    page: 1,
                    totalPages: 0,
                },
            };
        } catch (error) {
            console.error('[SettingsService] Error fetching login history:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to fetch login history',
                data: {
                    logins: [],
                    page: 1,
                    totalPages: 0,
                },
            };
        }
    }

    // ==================== PRIVACY SETTINGS ====================

    /**
     * Get privacy settings
     * @returns {Promise<{success: boolean, data?: object}>}
     */
    async getPrivacySettings() {
        try {
            const response = await api.get('/settings/privacy');

            if (response.data.success) {
                // Cache privacy settings locally
                await AsyncStorage.setItem(
                    'privacy_settings',
                    JSON.stringify(response.data.data)
                );

                return {
                    success: true,
                    data: response.data.data,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to fetch privacy settings',
                data: this.getDefaultPrivacySettings(),
            };
        } catch (error) {
            console.error('[SettingsService] Error fetching privacy settings:', error);

            // Try to return cached settings
            try {
                const cached = await AsyncStorage.getItem('privacy_settings');
                if (cached) {
                    return {
                        success: true,
                        data: JSON.parse(cached),
                        cached: true,
                    };
                }
            } catch (cacheError) {
                // Ignore cache error
            }

            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to fetch privacy settings',
                data: this.getDefaultPrivacySettings(),
            };
        }
    }

    /**
     * Update privacy settings
     * @param {object} settings - Privacy settings to update
     * @returns {Promise<{success: boolean, data?: object, message?: string}>}
     */
    async updatePrivacySettings(settings) {
        try {
            const response = await api.put('/settings/privacy', settings);

            if (response.data.success) {
                // Update local cache
                await AsyncStorage.setItem(
                    'privacy_settings',
                    JSON.stringify(response.data.data)
                );

                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to update privacy settings',
            };
        } catch (error) {
            console.error('[SettingsService] Error updating privacy settings:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to update privacy settings',
            };
        }
    }

    /**
     * Get default privacy settings
     * @returns {object} Default privacy settings
     */
    getDefaultPrivacySettings() {
        return {
            profile_visibility: 'public', // public, private, friends
            show_email: false,
            show_phone: false,
            show_location: true,
            allow_messages: true,
            show_online_status: true,
            display_reviews: true,
            auto_share_contact: false,
        };
    }

    // ==================== ACCOUNT MANAGEMENT ====================

    /**
     * Delete user account
     * @param {string} password - User's password for confirmation
     * @param {string} reason - Reason for deletion (optional)
     * @returns {Promise<{success: boolean, message?: string}>}
     */
    async deleteAccount(password, reason = null) {
        try {
            const response = await api.delete('/settings/account', {
                data: {
                    password,
                    reason,
                },
            });

            if (response.data.success) {
                // Clear all local storage
                await AsyncStorage.clear();

                return {
                    success: true,
                    message: response.data.message,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to delete account',
            };
        } catch (error) {
            console.error('[SettingsService] Error deleting account:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to delete account',
            };
        }
    }

    // ==================== BLOCKED USERS ====================

    /**
     * Get list of blocked users
     * @returns {Promise<{success: boolean, data?: array}>}
     */
    async getBlockedUsers() {
        try {
            const response = await api.get('/settings/blocked-users');

            if (response.data.success) {
                return {
                    success: true,
                    data: response.data.data || [],
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to fetch blocked users',
                data: [],
            };
        } catch (error) {
            console.error('[SettingsService] Error fetching blocked users:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to fetch blocked users',
                data: [],
            };
        }
    }

    /**
     * Block a user
     * @param {number} userId - User ID to block
     * @param {string} reason - Reason for blocking (optional)
     * @returns {Promise<{success: boolean, message?: string}>}
     */
    async blockUser(userId, reason = null) {
        try {
            const response = await api.post(`/settings/block/${userId}`, {
                reason,
            });

            if (response.data.success) {
                return {
                    success: true,
                    message: response.data.message,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to block user',
            };
        } catch (error) {
            console.error('[SettingsService] Error blocking user:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to block user',
            };
        }
    }

    /**
     * Unblock a user
     * @param {number} userId - User ID to unblock
     * @returns {Promise<{success: boolean, message?: string}>}
     */
    async unblockUser(userId) {
        try {
            const response = await api.delete(`/settings/block/${userId}`);

            if (response.data.success) {
                return {
                    success: true,
                    message: response.data.message,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to unblock user',
            };
        } catch (error) {
            console.error('[SettingsService] Error unblocking user:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to unblock user',
            };
        }
    }

    // ==================== SUPPORT TICKETS ====================

    /**
     * Create a support ticket
     * @param {object} ticketData - Ticket data {subject, message, category, attachments}
     * @returns {Promise<{success: boolean, data?: object, message?: string}>}
     */
    async createSupportTicket(ticketData) {
        try {
            const response = await api.post('/settings/support/tickets', {
                subject: ticketData.subject,
                message: ticketData.message,
                category: ticketData.category || 'other',
                priority: ticketData.priority || 'medium',
                attachments: ticketData.attachments || [],
            });

            if (response.data.success) {
                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to create support ticket',
            };
        } catch (error) {
            console.error('[SettingsService] Error creating support ticket:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to create support ticket',
            };
        }
    }

    /**
     * Get user's support tickets
     * @param {string} status - Filter by status (open, closed, all)
     * @param {number} page - Page number
     * @param {number} limit - Items per page
     * @returns {Promise<{success: boolean, data?: object}>}
     */
    async getSupportTickets(status = 'all', page = 1, limit = 20) {
        try {
            const params = { page, limit };
            if (status !== 'all') {
                params.status = status;
            }

            const response = await api.get('/settings/support/tickets', { params });

            if (response.data.success) {
                return {
                    success: true,
                    data: response.data.data,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to fetch support tickets',
                data: {
                    tickets: [],
                    page: 1,
                    totalPages: 0,
                },
            };
        } catch (error) {
            console.error('[SettingsService] Error fetching support tickets:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to fetch support tickets',
                data: {
                    tickets: [],
                    page: 1,
                    totalPages: 0,
                },
            };
        }
    }

    /**
     * Get specific ticket details with messages
     * @param {number} ticketId - Ticket ID
     * @returns {Promise<{success: boolean, data?: object}>}
     */
    async getTicketDetails(ticketId) {
        try {
            const response = await api.get(`/settings/support/tickets/${ticketId}`);

            if (response.data.success) {
                return {
                    success: true,
                    data: response.data.data,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to fetch ticket details',
            };
        } catch (error) {
            console.error('[SettingsService] Error fetching ticket details:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to fetch ticket details',
            };
        }
    }

    /**
     * Reply to a support ticket
     * @param {number} ticketId - Ticket ID
     * @param {string} message - Reply message
     * @param {array} attachments - Attachments (optional)
     * @returns {Promise<{success: boolean, data?: object, message?: string}>}
     */
    async replyToTicket(ticketId, message, attachments = []) {
        try {
            const response = await api.post(`/settings/support/tickets/${ticketId}/reply`, {
                message,
                attachments,
            });

            if (response.data.success) {
                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to send reply',
            };
        } catch (error) {
            console.error('[SettingsService] Error replying to ticket:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to send reply',
            };
        }
    }

    // ==================== PROBLEM REPORTS ====================

    /**
     * Report a problem
     * @param {object} problemData - Problem data {type, description, attachments}
     * @returns {Promise<{success: boolean, message?: string}>}
     */
    async reportProblem(problemData) {
        try {
            const response = await api.post('/settings/report-problem', {
                type: problemData.type,
                description: problemData.description,
                screenshots: problemData.attachments || [],
                deviceInfo: {
                    platform: String(problemData.platform || 'unknown'),
                    version: String(problemData.version || 'unknown'),
                },
            });

            if (response.data.success) {
                return {
                    success: true,
                    message: response.data.message,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to report problem',
            };
        } catch (error) {
            console.error('[SettingsService] Error reporting problem:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to report problem',
            };
        }
    }

    // ==================== FAQs & TERMS ====================

    /**
     * Get frequently asked questions
     * @param {string} category - Filter by category (optional)
     * @returns {Promise<{success: boolean, data?: array}>}
     */
    async getFAQs(category = null) {
        try {
            const params = category ? { category } : {};
            const response = await api.get('/settings/faqs', { params });

            if (response.data.success) {
                // Cache FAQs locally
                await AsyncStorage.setItem('faqs', JSON.stringify(response.data.data));

                return {
                    success: true,
                    data: response.data.data || [],
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to fetch FAQs',
                data: this.getFallbackFAQs(),
            };
        } catch (error) {
            console.error('[SettingsService] Error fetching FAQs:', error);

            // Try to return cached FAQs
            try {
                const cached = await AsyncStorage.getItem('faqs');
                if (cached) {
                    return {
                        success: true,
                        data: JSON.parse(cached),
                        cached: true,
                    };
                }
            } catch (cacheError) {
                // Ignore cache error
            }

            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to fetch FAQs',
                data: this.getFallbackFAQs(),
            };
        }
    }

    /**
     * Rate an FAQ as helpful or not
     * @param {number} faqId - FAQ ID
     * @param {boolean} helpful - True if helpful, false if not
     * @returns {Promise<{success: boolean, message?: string}>}
     */
    async rateFAQ(faqId, helpful) {
        try {
            const response = await api.post(`/settings/faqs/${faqId}/rate`, {
                helpful,
            });

            if (response.data.success) {
                return {
                    success: true,
                    message: response.data.message,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to rate FAQ',
            };
        } catch (error) {
            console.error('[SettingsService] Error rating FAQ:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to rate FAQ',
            };
        }
    }

    /**
     * Get terms and policies content
     * @returns {Promise<{success: boolean, data?: object}>}
     */
    async getTermsAndPolicies() {
        try {
            const response = await api.get('/settings/terms-and-policies');

            if (response.data.success) {
                // Cache terms and policies
                await AsyncStorage.setItem(
                    'terms_and_policies',
                    JSON.stringify(response.data.data)
                );

                return {
                    success: true,
                    data: response.data.data,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to fetch terms and policies',
            };
        } catch (error) {
            console.error('[SettingsService] Error fetching terms and policies:', error);

            // Try to return cached data
            try {
                const cached = await AsyncStorage.getItem('terms_and_policies');
                if (cached) {
                    return {
                        success: true,
                        data: JSON.parse(cached),
                        cached: true,
                    };
                }
            } catch (cacheError) {
                // Ignore cache error
            }

            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to fetch terms and policies',
            };
        }
    }

    // ==================== FALLBACK DATA ====================

    /**
     * Get fallback FAQs when API is unavailable
     * @returns {array} Fallback FAQ data
     */
    getFallbackFAQs() {
        return [
            {
                id: 1,
                category: 'general',
                question: 'How do I post an event?',
                answer: 'Go to the Events tab and click "Post Event". Fill in the details about your event including date, location, and requirements.',
            },
            {
                id: 2,
                category: 'vendors',
                question: 'What happens after I hire a vendor?',
                answer: "Once you hire a vendor, you'll be able to communicate directly with them and track the progress of your event planning.",
            },
            {
                id: 3,
                category: 'support',
                question: 'How do I report a vendor?',
                answer: 'Go to the vendor\'s profile and click on "Report" button. Fill out the form with details about the issue.',
            },
        ];
    }
}

const settingsService = new SettingsService();
export default settingsService;
