import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { resetRefreshState } from '../services/api';
import { setAuthLogout } from '../services/navigationService';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check for existing token on app startup
    useEffect(() => {
        checkAuthState();
        // Register logout function with navigation service
        setAuthLogout(logout);
    }, []);

    const checkAuthState = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const userData = await AsyncStorage.getItem('userData');
            
            if (token && userData) {
                // Set the token in API headers
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                
                // Parse and verify user data
                const user = JSON.parse(userData);
                
                setUser(user);
                setIsAuthenticated(true);
                
                // Test token validity with a lightweight endpoint
                try {
                    await api.get('/auth/check-auth');
                } catch (testError) {
                    if (testError.response?.status === 401 || testError.shouldLogout) {
                        await logout();
                        return;
                    }
                }
            }
        } catch (error) {
            // Don't logout on error, just leave unauthenticated
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (emailOrPhone, password) => {
        try {
            // Backend expects username field, not email
            const loginPayload = {
                username: emailOrPhone,
                password,
            };
            
            
            const response = await api.post('/auth/login', loginPayload);
            

            // Check if response has the expected structure
            if (response.data && response.data.tokens) {
                // Backend returns tokens object with accessToken and refreshToken
                const { accessToken, refreshToken } = response.data.tokens;
                const user = response.data.user;
                
                
                // Clear any old data first
                await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'userData']);
                
                // Store NEW token and user data
                await AsyncStorage.setItem('authToken', accessToken);
                await AsyncStorage.setItem('refreshToken', refreshToken);
                await AsyncStorage.setItem('userData', JSON.stringify(user));
                // Store userId separately for easy access
                await AsyncStorage.setItem('userId', String(user?.user_id || user?.id));
                
                
                // Set token in API headers
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                
                // Update state
                setUser(user);
                setIsAuthenticated(true);
                
                
                return { success: true, user };
            } else if (response.data) {
                // Try alternative response structure
                
                // Maybe the response is directly in response.data
                if (response.data.user && (response.data.accessToken || response.data.token)) {
                    const token = response.data.accessToken || response.data.token;
                    const user = response.data.user;
                    
                    await AsyncStorage.setItem('authToken', token);
                    await AsyncStorage.setItem('userData', JSON.stringify(user));
                    await AsyncStorage.setItem('userId', String(user?.user_id || user?.id));
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    
                    setUser(user);
                    setIsAuthenticated(true);
                    
                    return { success: true, user };
                }
                
                return { 
                    success: false, 
                    error: response.data.message || 'Unexpected response format' 
                };
            } else {
                return { 
                    success: false, 
                    error: 'Invalid response from server' 
                };
            }
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.message || 'Network error. Please try again.' 
            };
        }
    };

    const sendOTP = async (userData) => {
        try {
            
            // Extract country code and phone number
            // Phone comes in format like "+11234567890" where +1 is country code
            let countryCode = '+1';  // default
            let phoneNumber = userData.phone;
            
            // Check if phone starts with a country code
            if (userData.phone.startsWith('+')) {
                // Try to extract country code - it could be 1-4 digits after the +
                // Common patterns: +1, +44, +91, +86, +234, +971, etc.
                const phoneWithoutPlus = userData.phone.substring(1);
                
                // Check for known country code lengths
                if (phoneWithoutPlus.length > 10) {
                    // If total length > 10, there must be a country code
                    // Try different country code lengths (1-4 digits)
                    for (let ccLength = 1; ccLength <= 4; ccLength++) {
                        const possibleCC = phoneWithoutPlus.substring(0, ccLength);
                        const remainingDigits = phoneWithoutPlus.substring(ccLength);
                        
                        // Check if remaining digits form a valid phone number (10-15 digits)
                        if (remainingDigits.length >= 10 && remainingDigits.length <= 15) {
                            countryCode = '+' + possibleCC;
                            phoneNumber = remainingDigits;
                            break;
                        }
                    }
                } else {
                    // Phone is already without country code or is US number with +1
                    if (phoneWithoutPlus.length === 10) {
                        // Just 10 digits, no country code included
                        phoneNumber = phoneWithoutPlus;
                        countryCode = '+1';
                    } else if (phoneWithoutPlus.length === 11 && phoneWithoutPlus.startsWith('1')) {
                        // US number with country code 1
                        countryCode = '+1';
                        phoneNumber = phoneWithoutPlus.substring(1);
                    }
                }
            } else {
                // No + sign, assume it's just the phone number without country code
                phoneNumber = userData.phone;
            }
            
            // Ensure phone number is just digits
            phoneNumber = phoneNumber.replace(/\D/g, '');
            
            const otpData = {
                full_name: userData.fullName,
                email: userData.email,
                phone_number: phoneNumber,
                phone_country_id: countryCode,
                password: userData.password,
                confirm_password: userData.password,
            };
            
            const response = await api.post('/auth/sign-up/send-otp', otpData);
            
            if (response.data) {
                // Store temporary registration data for use after OTP verification
                await AsyncStorage.setItem('tempRegistrationData', JSON.stringify({
                    ...userData,
                    tempUserId: response.data.tempUserId || response.data.user_id
                }));
                
                return { 
                    success: true, 
                    message: response.data.message || 'OTP sent successfully',
                    tempUserId: response.data.tempUserId || response.data.user_id
                };
            } else {
                return { 
                    success: false, 
                    error: response.data?.message || 'Failed to send OTP' 
                };
            }
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.message || 'Failed to send OTP. Please try again.' 
            };
        }
    };
    
    const verifyOTPAndRegister = async (otp) => {
        try {
            // Get stored registration data
            const tempDataStr = await AsyncStorage.getItem('tempRegistrationData');
            
            if (!tempDataStr) {
                return { success: false, error: 'Registration data not found. Please start again.' };
            }
            
            const tempData = JSON.parse(tempDataStr);
            
            // Prepare registration data with OTP
            // Backend expects only username (email) and otp for the final registration
            const registrationData = {
                username: tempData.email,
                otp: otp,
            };
            
            const response = await api.post('/auth/sign-up', registrationData);

            // Check if registration was successful and tokens are provided
            if (response.data && response.data.success && response.data.tokens) {
                const { accessToken, refreshToken } = response.data.tokens;
                const user = response.data.user;
                
                // Clear temporary data
                await AsyncStorage.removeItem('tempRegistrationData');
                
                // Store token and user data
                await AsyncStorage.setItem('authToken', accessToken);
                await AsyncStorage.setItem('refreshToken', refreshToken);
                await AsyncStorage.setItem('userData', JSON.stringify(user));
                await AsyncStorage.setItem('userId', String(user?.user_id || user?.id));
                
                // Set token in API headers
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                
                // Update state
                setUser(user);
                setIsAuthenticated(true);
                
                return { success: true, user };
            } else if (response.data && response.data.success) {
                // Registration successful but no tokens (shouldn't happen with our fix)
                // Clear temporary data
                await AsyncStorage.removeItem('tempRegistrationData');
                
                return { 
                    success: false, 
                    error: 'Registration successful but login failed. Please login manually.' 
                };
            } else {
                return { 
                    success: false, 
                    error: response.data?.message || 'Registration failed' 
                };
            }
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.message || 'Registration failed. Please try again.' 
            };
        }
    };
    
    const resendOTP = async () => {
        try {
            
            // Get stored registration data to resend OTP
            const tempDataStr = await AsyncStorage.getItem('tempRegistrationData');
            if (!tempDataStr) {
                return { success: false, error: 'Registration data not found. Please start again.' };
            }
            
            const tempData = JSON.parse(tempDataStr);
            
            // Backend expects username field for resend OTP
            const resendData = {
                username: tempData.email
            };
            
            const response = await api.post('/auth/sign-up/resend-otp', resendData);
            
            if (response.data) {
                return { 
                    success: true, 
                    message: response.data.message || 'OTP resent successfully' 
                };
            } else {
                return { 
                    success: false, 
                    error: response.data?.message || 'Failed to resend OTP' 
                };
            }
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.message || 'Failed to resend OTP' 
            };
        }
    };
    
    // Keep the old register function for backward compatibility but redirect to sendOTP
    const register = async (userData) => {
        return sendOTP(userData);
    };

    const forgotPassword = async (email) => {
        try {
            const response = await api.post('/auth/forgot-password', { email });

            if (response.data.success) {
                return { 
                    success: true, 
                    message: response.data.message || 'Password reset link sent to your email' 
                };
            } else {
                return { 
                    success: false, 
                    error: response.data.message || 'Failed to send reset link' 
                };
            }
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.message || 'Network error. Please try again.' 
            };
        }
    };

    const resetPassword = async (token, newPassword) => {
        try {
            const response = await api.post('/auth/reset-password', {
                token,
                newPassword,
            });

            if (response.data.success) {
                return { 
                    success: true, 
                    message: response.data.message || 'Password reset successfully' 
                };
            } else {
                return { 
                    success: false, 
                    error: response.data.message || 'Failed to reset password' 
                };
            }
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.message || 'Network error. Please try again.' 
            };
        }
    };

    const updateProfile = async (updates) => {
        try {
            const response = await api.put('/auth/profile', updates);

            if (response.data.success) {
                const updatedUser = response.data.data;
                
                // Update stored user data
                await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
                
                // Update state
                setUser(updatedUser);
                
                return { success: true, user: updatedUser };
            } else {
                return { 
                    success: false, 
                    error: response.data.message || 'Failed to update profile' 
                };
            }
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.message || 'Network error. Please try again.' 
            };
        }
    };

    const logout = async (navigateToLogin = false) => {
        try {
            
            // Reset refresh state to prevent any ongoing refresh attempts
            resetRefreshState();
            
            // Try to notify backend of logout (skip if we're already getting 401s)
            if (!navigateToLogin) {
                try {
                    await api.post('/auth/logout');
                } catch (logoutError) {
                    // Continue with local logout even if server call fails
                }
            }
            
            // Clear ALL auth-related data
            await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'userData', 'tempRegistrationData', 'userId', 'accessToken', 'user']);
            
            // Clear API header
            delete api.defaults.headers.common['Authorization'];
            
            // Clear state
            setUser(null);
            setIsAuthenticated(false);
            
            
            // Navigate to login if requested (for automatic logouts)
            if (navigateToLogin) {
                const { navigationRef } = require('../services/navigationService');
                setTimeout(() => {
                    if (navigationRef.isReady()) {
                        navigationRef.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        });
                    }
                }, 200);
            }
            
            return { success: true };
        } catch (error) {
            
            // Even if logout fails, clear local state and navigate
            resetRefreshState();
            await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'userData', 'tempRegistrationData', 'userId', 'accessToken', 'user']);
            delete api.defaults.headers.common['Authorization'];
            setUser(null);
            setIsAuthenticated(false);
            
            if (navigateToLogin) {
                const { navigationRef } = require('../services/navigationService');
                setTimeout(() => {
                    if (navigationRef.isReady()) {
                        navigationRef.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        });
                    }
                }, 200);
            }
            
            return { success: false, error: 'Failed to logout completely, but cleared local session' };
        }
    };


    const value = {
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        sendOTP,
        verifyOTPAndRegister,
        resendOTP,
        logout,
        forgotPassword,
        resetPassword,
        updateProfile,
        checkAuthState,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;