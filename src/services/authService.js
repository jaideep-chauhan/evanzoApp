import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
    async login(username, password) {
        try {
            const response = await api.post('/auth/login', { username, password });
            
            if (response.data.success) {
                const { user, tokens } = response.data;
                
                await AsyncStorage.setItem('accessToken', tokens.accessToken);
                await AsyncStorage.setItem('refreshToken', tokens.refreshToken);
                await AsyncStorage.setItem('user', JSON.stringify(user));
                
                return {
                    success: true,
                    user,
                    message: response.data.message
                };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 
                               error.message || 
                               'Login failed. Please try again.';
            return { success: false, message: errorMessage };
        }
    }

    async sendSignupOTP(email, userData) {
        try {
            // Format data to match backend expectations
            const requestData = {
                email: userData.email,
                full_name: userData.full_name,
                phone_number: userData.phone ? userData.phone.replace(/[^\d]/g, '') : '',
                phone_country_id: userData.calling_code || '+1',
                password: userData.password,
                confirm_password: userData.password // Use same password for confirmation
            };
                
            const response = await api.post('/auth/sign-up/send-otp', requestData);
            
            return {
                success: response.data.success,
                message: response.data.message,
                data: response.data.data
            };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 
                               error.message || 
                               'Failed to send OTP. Please try again.';
            return { success: false, message: errorMessage };
        }
    }

    async verifySignupOTP(email, otp, userData) {
        try {
            const response = await api.post('/auth/sign-up', {
                username: email,  // Backend expects username field for email
                otp: otp
            });
            
            if (response.data.success) {
                const { user } = response.data;
                return {
                    success: true,
                    user,
                    message: response.data.message
                };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 
                               error.message || 
                               'Registration failed. Please try again.';
            return { success: false, message: errorMessage };
        }
    }

    async resendSignupOTP(email) {
        try {
            const response = await api.post('/auth/sign-up/resend-otp', { username: email });
            return {
                success: response.data.success,
                message: response.data.message
            };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 
                               error.message || 
                               'Failed to resend OTP. Please try again.';
            return { success: false, message: errorMessage };
        }
    }

    async requestPasswordReset(username) {
        try {
            const response = await api.post('/auth/forgot-password/request', { username });
            return {
                success: response.data.success,
                message: response.data.message,
                data: response.data
            };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 
                               error.message || 
                               'Failed to send reset code. Please try again.';
            return { success: false, message: errorMessage };
        }
    }

    async verifyPasswordResetOTP(username, otp, newPassword) {
        try {
            const response = await api.post('/auth/forgot-password/verify', {
                username,
                otp,
                new_password: newPassword
            });
            
            return {
                success: response.data.success,
                message: response.data.message
            };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 
                               error.message || 
                               'Failed to reset password. Please try again.';
            return { success: false, message: errorMessage };
        }
    }

    async requestOTPLogin(username) {
        try {
            const response = await api.post('/auth/otp-login/request', { username });
            return {
                success: response.data.success,
                message: response.data.message,
                data: response.data
            };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 
                               error.message || 
                               'Failed to send OTP. Please try again.';
            return { success: false, message: errorMessage };
        }
    }

    async verifyOTPLogin(username, otp) {
        try {
            const response = await api.post('/auth/otp-login/verify', { username, otp });
            
            if (response.data.success) {
                const { user, tokens } = response.data;
                
                await AsyncStorage.setItem('accessToken', tokens.accessToken);
                await AsyncStorage.setItem('refreshToken', tokens.refreshToken);
                await AsyncStorage.setItem('user', JSON.stringify(user));
                
                return {
                    success: true,
                    user,
                    message: response.data.message
                };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 
                               error.message || 
                               'OTP verification failed. Please try again.';
            return { success: false, message: errorMessage };
        }
    }

    async checkAuth() {
        try {
            const response = await api.get('/auth/check-auth');
            return {
                success: response.data.success,
                user: response.data.user
            };
        } catch (error) {
            return { success: false };
        }
    }

    async logout() {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        }
    }

    async getStoredUser() {
        try {
            const userStr = await AsyncStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            return null;
        }
    }

    async isLoggedIn() {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            return !!token;
        } catch (error) {
            return false;
        }
    }
}

export default new AuthService();