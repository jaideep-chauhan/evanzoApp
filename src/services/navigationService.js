import { createNavigationContainerRef } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const navigationRef = createNavigationContainerRef();

// Store the auth context logout function
let authLogout = null;

export function setAuthLogout(logoutFn) {
    authLogout = logoutFn;
}

export function navigate(name, params) {
    if (navigationRef.isReady()) {
        navigationRef.navigate(name, params);
    }
}

export async function logout() {
    console.log('🔒 Logging out user from navigation service...');
    console.log('🔒 Auth logout function available:', !!authLogout);
    console.log('🔒 Navigation ready:', navigationRef.isReady());
    
    // Call the auth context logout if available (with navigation flag)
    if (authLogout) {
        console.log('🔒 Calling auth context logout...');
        await authLogout(true); // Pass true to indicate this is an automatic logout
        console.log('🔒 Auth context logout completed');
    } else {
        console.log('🔒 No auth context logout, using fallback...');
        // Fallback: Clear all stored data manually. Tokens live in
        // Keychain/Keystore; everything else is in AsyncStorage.
        try {
            const { secureStorage } = require('../utils/secureStorage');
            await secureStorage.removeItem('authToken');
            await secureStorage.removeItem('refreshToken');
        } catch (e) {
            console.warn('🔒 secureStorage fallback clear skipped:', e?.message);
        }
        await AsyncStorage.multiRemove(['userData', 'userId', 'accessToken', 'user', 'tempRegistrationData']);
        console.log('🔒 Fallback logout completed');
    }
    
    // Navigate to login screen
    if (navigationRef.isReady()) {
        console.log('🔄 Navigating to Login screen...');
        navigationRef.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
        console.log('🔄 Navigation to Login completed');
    } else {
        console.log('❌ Navigation not ready, cannot navigate to Login');
    }
}

export default {
    navigationRef,
    navigate,
    logout
};