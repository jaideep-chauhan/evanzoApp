import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

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
    }, []);

    const checkAuthState = async () => {
        try {
            console.log('🔍 Checking authentication state...');
            const token = await AsyncStorage.getItem('authToken');
            const userData = await AsyncStorage.getItem('userData');
            
            console.log('🔑 Stored token found:', token ? 'Yes' : 'No');
            console.log('👤 Stored user data found:', userData ? 'Yes' : 'No');
            
            if (token && userData) {
                // Set the token in API headers
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                
                // Parse and verify user data
                const user = JSON.parse(userData);
                console.log('📱 Restored user from storage:', user);
                console.log('📱 User ID from storage:', user?.user_id || user?.id);
                console.log('📱 User Name from storage:', user?.full_name);
                
                setUser(user);
                setIsAuthenticated(true);
                console.log('✅ Session restored! User authenticated as:', user?.full_name, '(ID:', user?.user_id || user?.id, ')');
                
                // Optional: Test token with a lightweight endpoint
                // This is commented out for performance, uncomment if needed
                /*
                try {
                    console.log('🔄 Testing token validity...');
                    await api.get('/vendors/my-ads');
                    console.log('✅ Token is valid');
                } catch (testError) {
                    if (testError.response?.status === 401) {
                        console.log('❌ Token expired, clearing session');
                        await logout();
                        return;
                    }
                }
                */
            } else {
                console.log('📵 No stored authentication found');
            }
        } catch (error) {
            console.error('❌ Error checking auth state:', error);
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
            
            console.log('🔐 Login attempt with payload:', loginPayload);
            
            const response = await api.post('/auth/login', loginPayload);
            
            console.log('📥 Login response:', response.data);
            console.log('📥 Response structure:', JSON.stringify(response.data, null, 2));

            // Check if response has the expected structure
            if (response.data && response.data.tokens) {
                // Backend returns tokens object with accessToken and refreshToken
                const { accessToken, refreshToken } = response.data.tokens;
                const user = response.data.user;
                
                console.log('🔑 Tokens received:', { 
                    access: accessToken?.substring(0, 20) + '...', 
                    refresh: refreshToken?.substring(0, 20) + '...' 
                });
                console.log('👤 User data received from server:', user);
                console.log('👤 User ID:', user?.user_id || user?.id);
                console.log('👤 User Name:', user?.full_name);
                
                // Clear any old data first
                await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'userData']);
                
                // Store NEW token and user data
                await AsyncStorage.setItem('authToken', accessToken);
                await AsyncStorage.setItem('refreshToken', refreshToken);
                await AsyncStorage.setItem('userData', JSON.stringify(user));
                
                // Verify what was stored
                const storedUserData = await AsyncStorage.getItem('userData');
                console.log('📦 Stored user data:', JSON.parse(storedUserData));
                
                // Set token in API headers
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                
                // Update state
                setUser(user);
                setIsAuthenticated(true);
                
                console.log('✅ Login successful! User authenticated as:', user?.full_name, '(ID:', user?.user_id || user?.id, ')');
                
                return { success: true, user };
            } else if (response.data) {
                // Try alternative response structure
                console.log('⚠️ Unexpected response structure, trying alternatives...');
                
                // Maybe the response is directly in response.data
                if (response.data.user && (response.data.accessToken || response.data.token)) {
                    const token = response.data.accessToken || response.data.token;
                    const user = response.data.user;
                    
                    await AsyncStorage.setItem('authToken', token);
                    await AsyncStorage.setItem('userData', JSON.stringify(user));
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
            console.error('❌ Login error:', error);
            console.error('❌ Error response:', error.response?.data);
            console.error('❌ Error status:', error.response?.status);
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
            console.error('❌ Send OTP error:', error);
            console.error('❌ Error response:', error.response?.data);
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
            console.error('Forgot password error:', error);
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
            console.error('Reset password error:', error);
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
            console.error('Update profile error:', error);
            return { 
                success: false, 
                error: error.response?.data?.message || 'Network error. Please try again.' 
            };
        }
    };

    const logout = async () => {
        try {
            console.log('🚪 Logging out...');
            
            // Get all keys to see what's stored
            const allKeys = await AsyncStorage.getAllKeys();
            console.log('📦 All stored keys before logout:', allKeys);
            
            // Clear ALL auth-related data
            await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'userData', 'tempRegistrationData']);
            
            // Verify removal
            const remainingKeys = await AsyncStorage.getAllKeys();
            console.log('📦 Remaining keys after logout:', remainingKeys);
            
            // Clear API header
            delete api.defaults.headers.common['Authorization'];
            
            // Clear state
            setUser(null);
            setIsAuthenticated(false);
            
            console.log('✅ Logout complete');
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: 'Failed to logout' };
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