import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import appleAuth from '@invertase/react-native-apple-authentication';
import api from './api';

class SocialAuthService {
    constructor() {
        this.initializeGoogleSignIn();
    }

    // Initialize Google Sign-In configuration
    initializeGoogleSignIn() {
        try {
            GoogleSignin.configure({
                webClientId: process.env.GOOGLE_WEB_CLIENT_ID || '10686507695-tjjlud30ivp51qmm9qnp5ld0u4hbm8hq.apps.googleusercontent.com', // Add your Web Client ID from Google Console
                offlineAccess: true,
                hostedDomain: '',
                forceCodeForRefreshToken: true,
            });
            console.log('✅ Google Sign-In configured');
        } catch (error) {
            console.error('Error configuring Google Sign-In:', error);
        }
    }

    // Google Sign-In
    async signInWithGoogle() {
        try {
            // Check if device supports Google Play Services (Android)
            await GoogleSignin.hasPlayServices({
                showPlayServicesUpdateDialog: true,
            });

            // Get user info from Google
            const userInfo = await GoogleSignin.signIn();
            console.log('Google user info:', userInfo);

            // Get ID token
            const tokens = await GoogleSignin.getTokens();
            const idToken = tokens.idToken;

            if (!idToken) {
                throw new Error('No ID token received from Google');
            }

            console.log('Google ID Token:', idToken);

            // Send ID token to backend for verification and authentication
            const response = await api.post('/auth/google-login', {
                idToken: idToken,
            });

            if (response.data.success) {
                return {
                    success: true,
                    user: response.data.user,
                    tokens: response.data.tokens,
                };
            } else {
                return {
                    success: false,
                    error: response.data.message || 'Google login failed',
                };
            }
        } catch (error) {
            console.error('Google Sign-In Error:', error);

            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                return {
                    success: false,
                    error: 'Sign in cancelled by user',
                };
            } else if (error.code === statusCodes.IN_PROGRESS) {
                return {
                    success: false,
                    error: 'Sign in is already in progress',
                };
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                return {
                    success: false,
                    error: 'Google Play Services not available',
                };
            } else {
                return {
                    success: false,
                    error: error.message || 'Google login failed. Please try again.',
                };
            }
        }
    }

    // Sign out from Google
    async signOutFromGoogle() {
        try {
            await GoogleSignin.signOut();
            console.log('✅ Signed out from Google');
        } catch (error) {
            console.error('Error signing out from Google:', error);
        }
    }

    // Apple Sign-In (iOS only)
    async signInWithApple() {
        try {
            // Check if Apple Authentication is available
            if (Platform.OS !== 'ios') {
                return {
                    success: false,
                    error: 'Apple Sign-In is only available on iOS devices',
                };
            }

            // Check if device supports Apple Authentication
            const isSupported = await appleAuth.isSupported();
            if (!isSupported) {
                return {
                    success: false,
                    error: 'Apple Sign-In is not supported on this device',
                };
            }

            // Perform sign in request
            const appleAuthRequestResponse = await appleAuth.performRequest({
                requestedOperation: appleAuth.Operation.LOGIN,
                requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
            });

            // Get credential state
            const credentialState = await appleAuth.getCredentialStateForUser(
                appleAuthRequestResponse.user
            );

            // Use the credential state response to ensure the user is authenticated
            if (credentialState === appleAuth.State.AUTHORIZED) {
                const { identityToken, email, fullName } = appleAuthRequestResponse;

                if (!identityToken) {
                    return {
                        success: false,
                        error: 'No identity token received from Apple',
                    };
                }

                console.log('Apple Identity Token:', identityToken);
                console.log('Apple Email:', email);
                console.log('Apple Full Name:', fullName);

                // Send identity token to backend for verification
                const response = await api.post('/auth/apple-login', {
                    identityToken: identityToken,
                    email: email,
                    fullName: {
                        givenName: fullName?.givenName || '',
                        familyName: fullName?.familyName || '',
                    },
                });

                if (response.data.success) {
                    return {
                        success: true,
                        user: response.data.user,
                        tokens: response.data.tokens,
                    };
                } else {
                    return {
                        success: false,
                        error: response.data.message || 'Apple login failed',
                    };
                }
            } else {
                return {
                    success: false,
                    error: 'Apple authorization failed',
                };
            }
        } catch (error) {
            console.error('Apple Sign-In Error:', error);

            if (error.code === appleAuth.Error.CANCELED) {
                return {
                    success: false,
                    error: 'Sign in cancelled by user',
                };
            } else if (error.code === appleAuth.Error.FAILED) {
                return {
                    success: false,
                    error: 'Apple Sign-In failed',
                };
            } else if (error.code === appleAuth.Error.NOT_HANDLED) {
                return {
                    success: false,
                    error: 'Apple Sign-In not handled',
                };
            } else {
                return {
                    success: false,
                    error: error.message || 'Apple login failed. Please try again.',
                };
            }
        }
    }

    // Check Apple Sign-In credential state
    async checkAppleCredentialState(userID) {
        try {
            if (Platform.OS !== 'ios') {
                return null;
            }

            const credentialState = await appleAuth.getCredentialStateForUser(userID);
            return credentialState;
        } catch (error) {
            console.error('Error checking Apple credential state:', error);
            return null;
        }
    }
}

const socialAuthService = new SocialAuthService();
export default socialAuthService;
