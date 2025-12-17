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
                webClientId: '1075894285533-6tnc0osfup96pogem7p940ht6vn5u8tv.apps.googleusercontent.com',
                iosClientId: '1075894285533-cu18n2ip03k8glui687tvkspb7qsi35g.apps.googleusercontent.com',
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
            console.error('Error response data:', error.response?.data);
            console.error('Error response status:', error.response?.status);
            console.error('Error message:', error.message);

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
            console.log('🍎 ===== APPLE SIGN-IN START (FRONTEND) =====');

            // Check if Apple Authentication is available
            if (Platform.OS !== 'ios') {
                console.log('❌ Not on iOS platform');
                return {
                    success: false,
                    error: 'Apple Sign-In is only available on iOS devices',
                };
            }

            console.log('✅ Platform is iOS');

            // Check if device supports Apple Authentication
            const isSupported = appleAuth.isSupported;
            console.log('Apple Auth isSupported:', isSupported);

            if (!isSupported) {
                console.log('❌ Apple Sign-In not supported on this device');
                return {
                    success: false,
                    error: 'Apple Sign-In is not supported on this device. Please sign in to iCloud in Settings first.',
                };
            }

            console.log('✅ Apple Sign-In is supported');
            console.log('Performing Apple Sign-In request...');

            // Perform sign in request
            const appleAuthRequestResponse = await appleAuth.performRequest({
                requestedOperation: appleAuth.Operation.LOGIN,
                requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
            });

            console.log('✅ Apple Sign-In request completed');
            console.log('Apple Auth Response:', {
                user: appleAuthRequestResponse.user,
                email: appleAuthRequestResponse.email,
                fullName: appleAuthRequestResponse.fullName,
                hasIdentityToken: !!appleAuthRequestResponse.identityToken
            });

            const { identityToken, email, fullName } = appleAuthRequestResponse;

            if (!identityToken) {
                console.error('❌ No identity token received from Apple');
                return {
                    success: false,
                    error: 'No identity token received from Apple',
                };
            }

            console.log('✅ Identity token received');
            console.log('Apple Identity Token (first 50 chars):', identityToken.substring(0, 50) + '...');
            console.log('Apple Email:', email || 'Not provided (subsequent login)');
            console.log('Apple Full Name:', fullName);

            // Get credential state (for logging purposes)
            console.log('Getting credential state for user:', appleAuthRequestResponse.user);
            const credentialState = await appleAuth.getCredentialStateForUser(
                appleAuthRequestResponse.user
            );

            console.log('Credential state:', credentialState);
            console.log('State meanings: REVOKED=0, AUTHORIZED=1, NOT_FOUND=2, TRANSFERRED=3');
            console.log('Expected state (AUTHORIZED):', appleAuth.State.AUTHORIZED);

            // NOTE: On subsequent sign-ins, Apple may return state 0 (REVOKED) but still provide a valid identity token
            // This is because Apple only provides email/name on the FIRST sign-in
            // We should trust the identity token if it exists, regardless of credential state
            console.log('ℹ️ Proceeding with identity token (credential state check skipped for compatibility)');

            console.log('Sending request to backend /auth/apple-login...');

            // Send identity token to backend for verification
            const response = await api.post('/auth/apple-login', {
                identityToken: identityToken,
                email: email,
                fullName: {
                    givenName: fullName?.givenName || '',
                    familyName: fullName?.familyName || '',
                },
            });

            console.log('✅ Backend response received');
            console.log('Response status:', response.status);
            console.log('Response data:', response.data);

            if (response.data.success) {
                console.log('🍎 ===== APPLE SIGN-IN SUCCESS =====');
                return {
                    success: true,
                    user: response.data.user,
                    tokens: response.data.tokens,
                };
            } else {
                console.error('❌ Backend returned success: false');
                console.error('Error message:', response.data.message);
                return {
                    success: false,
                    error: response.data.message || 'Apple login failed',
                };
            }
        } catch (error) {
            console.error('🍎 ===== APPLE SIGN-IN ERROR (FRONTEND) =====');
            console.error('Error type:', error.constructor.name);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Full error:', error);
            console.error('Error response data:', error.response?.data);
            console.error('Error response status:', error.response?.status);
            console.error('Error response headers:', error.response?.headers);

            // Error 1000 is user cancellation or configuration issue
            if (error.code === '1000' || error.message?.includes('1000')) {
                console.error('Error 1000: iCloud sign-in required');
                return {
                    success: false,
                    error: 'Please sign in to iCloud in Settings > Sign in to your iPhone, then try again',
                };
            } else if (error.code === appleAuth.Error.CANCELED) {
                console.log('User cancelled Apple Sign-In');
                return {
                    success: false,
                    error: 'Sign in cancelled by user',
                };
            } else if (error.code === appleAuth.Error.FAILED) {
                console.error('Apple Sign-In failed');
                return {
                    success: false,
                    error: 'Apple Sign-In failed',
                };
            } else if (error.code === appleAuth.Error.NOT_HANDLED) {
                console.error('Apple Sign-In not handled');
                return {
                    success: false,
                    error: 'Apple Sign-In not handled',
                };
            } else {
                console.error('Unknown Apple Sign-In error');
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
