import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { resetRefreshState } from '../services/api';
import { setAuthLogout } from '../services/navigationService';
import socialAuthService from '../services/socialAuthService';
import socketService from '../services/socketService';
import { secureStorage, migrateFromAsyncStorage } from '../utils/secureStorage';

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
            // One-time migration: copy any tokens still in AsyncStorage
            // (from before this commit) into Keychain/Keystore. Idempotent
            // — if both keys are already migrated, getItem returns null
            // and the helper no-ops. Safe to call on every startup.
            try {
                await migrateFromAsyncStorage(AsyncStorage, ['authToken', 'refreshToken']);
            } catch (e) {
                console.warn('[AuthContext] Token migration skipped:', e?.message);
            }

            const token = await secureStorage.getItem('authToken');
            const userData = await AsyncStorage.getItem('userData');

            if (token && userData) {
                // Set the token in API headers
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                // Parse and verify user data
                const user = JSON.parse(userData);
                
                // Map phone_number to phone field if it exists
                if (user && user.phone_number && !user.phone) {
                    user.phone = user.phone_number;
                    // Update stored data with the mapped field
                    await AsyncStorage.setItem('userData', JSON.stringify(user));
                }

                setUser(user);
                setIsAuthenticated(true);

                // Test token validity with a lightweight endpoint
                try {
                    await api.get('/auth/check-auth');

                    // Connect socket if auth is valid
                    try {
                        await socketService.connect();
                        socketService.setOnlineStatus(true);
                        console.log('✅ Socket connected on app startup');
                    } catch (socketError) {
                        console.log('⚠️ Socket connection failed on startup:', socketError.message);
                    }

                    // Rehydrate profile fields the login response doesn't return
                    // (profile_pic, bio, location, …). Existing sessions logged
                    // in before the login response included these fields would
                    // otherwise be stuck without an avatar until they log out.
                    // Silent — failures don't disrupt startup.
                    try {
                        const meRes = await api.get('/profile/me');
                        const fresh = meRes?.data?.data;
                        // Surface exactly what the backend says about
                        // profile_pic so we can spot bad URLs at startup.
                        console.log('[Auth] /profile/me returned profile_pic =', fresh?.profile_pic, 'full_name =', fresh?.full_name);
                        if (fresh && typeof fresh === 'object') {
                            const merged = {
                                ...user,
                                profile_pic: fresh.profile_pic ?? user.profile_pic ?? null,
                                bio: fresh.bio ?? user.bio ?? null,
                                location: fresh.location ?? user.location ?? null,
                                country: fresh.country ?? user.country ?? null,
                                state: fresh.state ?? user.state ?? null,
                                city: fresh.city ?? user.city ?? null,
                                latitude: fresh.latitude ?? user.latitude ?? null,
                                longitude: fresh.longitude ?? user.longitude ?? null,
                                website: fresh.website ?? user.website ?? null,
                                full_name:
                                    fresh.full_name ||
                                    [fresh.first_name, fresh.last_name].filter(Boolean).join(' ') ||
                                    user.full_name,
                            };
                            await AsyncStorage.setItem('userData', JSON.stringify(merged));
                            setUser(merged);
                        }
                    } catch (profileError) {
                        console.log('⚠️ Profile rehydrate skipped:', profileError?.message);
                    }
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
            console.log("Response 0-0-0-0-,", response);
            console.log("Response data structure:", JSON.stringify(response.data, null, 2));

            // Check if response has the expected structure
            if (response.data && response.data.tokens) {
                console.log("✅ Found tokens in response.data.tokens");
                // Backend returns tokens object with accessToken and refreshToken
                const { accessToken, refreshToken } = response.data.tokens;
                const user = response.data.user;

                // Map phone_number to phone field if it exists
                // This ensures consistency between registration data and profile display
                if (user && user.phone_number && !user.phone) {
                    user.phone = user.phone_number;
                }
                
                // Log user data for debugging
                console.log('✅ User logged in successfully:', {
                    id: user?.user_id || user?.id,
                    email: user?.email,
                    phone: user?.phone,
                    phone_number: user?.phone_number,
                    full_name: user?.full_name,
                    location: user?.location
                });

                try {
                    // Clear any old data first - remove items individually to avoid multiRemove issues
                    try {
                        await secureStorage.removeItem('authToken');
                        await secureStorage.removeItem('refreshToken');
                        await AsyncStorage.removeItem('userData');
                    } catch (removeError) {
                        console.log("⚠️ Error removing old data (this is OK on first login):", removeError.message);
                    }

                    // Store NEW token and user data
                    await secureStorage.setItem('authToken', accessToken);
                    await secureStorage.setItem('refreshToken', refreshToken);
                    await AsyncStorage.setItem('userData', JSON.stringify(user));
                    // Store userId separately for easy access
                    await AsyncStorage.setItem('userId', String(user?.user_id || user?.id));

                    console.log("✅ Tokens and user data stored in AsyncStorage successfully");
                } catch (storageError) {
                    console.error("❌ AsyncStorage error:", storageError);
                    // Don't throw - still set user state even if storage fails
                    console.log("⚠️ Continuing with login despite storage error...");
                }

                // Set token in API headers
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

                // Update state
                setUser(user);
                setIsAuthenticated(true);

                // Connect socket after successful login
                try {
                    await socketService.connect();
                    socketService.setOnlineStatus(true);
                    console.log('✅ Socket connected after login');
                } catch (socketError) {
                    console.log('⚠️ Socket connection failed, will retry later:', socketError.message);
                }

                console.log("✅ Login successful, returning success=true");
                return { success: true, user };
            } else if (response.data) {
                console.log("⚠️ No tokens found in response.data.tokens, trying alternative structure");
                // Try alternative response structure

                // Maybe the response is directly in response.data
                if (response.data.user && (response.data.accessToken || response.data.token)) {
                    console.log("✅ Found alternative structure: response.data.user + accessToken");
                    const token = response.data.accessToken || response.data.token;
                    const user = response.data.user;

                    await secureStorage.setItem('authToken', token);
                    await AsyncStorage.setItem('userData', JSON.stringify(user));
                    await AsyncStorage.setItem('userId', String(user?.user_id || user?.id));
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                    setUser(user);
                    setIsAuthenticated(true);

                    // Connect socket after successful login
                    try {
                        await socketService.connect();
                        socketService.setOnlineStatus(true);
                    } catch (socketError) {
                        console.log('⚠️ Socket connection failed:', socketError.message);
                    }

                    return { success: true, user };
                }

                console.log("❌ Unexpected response format - no matching structure found");
                return {
                    success: false,
                    error: response.data.message || 'Unexpected response format'
                };
            } else {
                console.log("❌ No response.data found");
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
            console.log("response 1-1-1-1-", response);
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

                // Map phone_number to phone field if it exists
                // This ensures consistency between registration data and profile display
                if (user && (user.phone_number || tempData.phone)) {
                    user.phone = user.phone || user.phone_number || tempData.phone;
                }
                
                // Log user data for debugging
                console.log('✅ User registered successfully:', {
                    id: user?.user_id || user?.id,
                    email: user?.email,
                    phone: user?.phone,
                    phone_number: user?.phone_number,
                    full_name: user?.full_name,
                    location: user?.location
                });

                // Clear temporary data
                await AsyncStorage.removeItem('tempRegistrationData');

                // Store token and user data
                await secureStorage.setItem('authToken', accessToken);
                await secureStorage.setItem('refreshToken', refreshToken);
                await AsyncStorage.setItem('userData', JSON.stringify(user));
                await AsyncStorage.setItem('userId', String(user?.user_id || user?.id));

                // Set token in API headers
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

                // Update state
                setUser(user);
                setIsAuthenticated(true);

                // Connect socket after successful registration
                try {
                    await socketService.connect();
                    socketService.setOnlineStatus(true);
                    console.log('✅ Socket connected after registration');
                } catch (socketError) {
                    console.log('⚠️ Socket connection failed:', socketError.message);
                }

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

    const forgotPassword = async (emailOrPhone) => {
        try {
            const response = await api.post('/auth/forgot-password/request', { username: emailOrPhone });

            if (response.data.success) {
                return {
                    success: true,
                    message: response.data.message || 'OTP sent successfully'
                };
            } else {
                return {
                    success: false,
                    error: response.data.message || 'Failed to send OTP'
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

    // Direct user state update function
    const updateUser = async (updatedUserData) => {
        try {
            // Update stored user data
            await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
            // Update state
            setUser(updatedUserData);
        } catch (error) {
            console.error('Error updating user data:', error);
        }
    };

    const googleLogin = async () => {
        try {
            const result = await socialAuthService.signInWithGoogle();

            if (result.success) {
                const { user, tokens } = result;

                // Store tokens and user data
                await secureStorage.setItem('authToken', tokens.accessToken);
                await secureStorage.setItem('refreshToken', tokens.refreshToken);
                await AsyncStorage.setItem('userData', JSON.stringify(user));
                await AsyncStorage.setItem('userId', String(user?.user_id || user?.id));

                // Set token in API headers
                api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;

                // Update state
                setUser(user);
                setIsAuthenticated(true);

                // Connect socket after successful Google login
                try {
                    await socketService.connect();
                    socketService.setOnlineStatus(true);
                    console.log('✅ Socket connected after Google login');
                } catch (socketError) {
                    console.log('⚠️ Socket connection failed:', socketError.message);
                }

                return { success: true, user };
            } else {
                return {
                    success: false,
                    cancelled: result.cancelled === true,
                    error: result.error || 'Google login failed',
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Google login failed. Please try again.',
            };
        }
    };

    const appleLogin = async () => {
        try {
            const result = await socialAuthService.signInWithApple();

            if (result.success) {
                const { user, tokens } = result;

                // Store tokens and user data
                await secureStorage.setItem('authToken', tokens.accessToken);
                await secureStorage.setItem('refreshToken', tokens.refreshToken);
                await AsyncStorage.setItem('userData', JSON.stringify(user));
                await AsyncStorage.setItem('userId', String(user?.user_id || user?.id));

                // Set token in API headers
                api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;

                // Update state
                setUser(user);
                setIsAuthenticated(true);

                // Connect socket after successful Apple login
                try {
                    await socketService.connect();
                    socketService.setOnlineStatus(true);
                    console.log('✅ Socket connected after Apple login');
                } catch (socketError) {
                    console.log('⚠️ Socket connection failed:', socketError.message);
                }

                return { success: true, user };
            } else {
                return {
                    success: false,
                    error: result.error || 'Apple login failed',
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Apple login failed. Please try again.',
            };
        }
    };

    const logout = async (navigateToLogin = false) => {
        try {
            // Disconnect socket first
            try {
                socketService.setOnlineStatus(false);
                socketService.disconnect();
                console.log('✅ Socket disconnected on logout');
            } catch (socketError) {
                console.log('⚠️ Socket disconnect error:', socketError.message);
            }

            // Reset refresh state to prevent any ongoing refresh attempts
            resetRefreshState();

            // Sign out from social providers
            try {
                await socialAuthService.signOutFromGoogle();
            } catch (socialLogoutError) {
                // Continue with logout even if social sign out fails
                console.log('Social sign out error:', socialLogoutError);
            }

            // Try to notify backend of logout (skip if we're already getting 401s)
            if (!navigateToLogin) {
                try {
                    await api.post('/auth/logout');
                } catch (logoutError) {
                    // Continue with local logout even if server call fails
                }
            }

            // Clear ALL auth-related data
            // Tokens live in Keychain/Keystore — clear them separately.
            await secureStorage.removeItem('authToken');
            await secureStorage.removeItem('refreshToken');
            await AsyncStorage.multiRemove(['userData', 'tempRegistrationData', 'userId', 'accessToken', 'user']);

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
            // Tokens live in Keychain/Keystore — clear them separately.
            await secureStorage.removeItem('authToken');
            await secureStorage.removeItem('refreshToken');
            await AsyncStorage.multiRemove(['userData', 'tempRegistrationData', 'userId', 'accessToken', 'user']);
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
        googleLogin,
        appleLogin,
        register,
        sendOTP,
        verifyOTPAndRegister,
        resendOTP,
        logout,
        forgotPassword,
        resetPassword,
        updateProfile,
        updateUser,
        checkAuthState,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;