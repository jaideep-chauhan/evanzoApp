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
    
    // Call the auth context logout if available
    if (authLogout) {
        await authLogout();
    } else {
        // Fallback: Clear all stored data manually
        await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'userData']);
    }
    
    // Navigate to login screen
    if (navigationRef.isReady()) {
        console.log('🔄 Navigating to Login screen...');
        navigationRef.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    }
}

export default {
    navigationRef,
    navigate,
    logout
};