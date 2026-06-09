import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Fix for AsyncStorage corruption on iOS
 * Creates the missing directory structure when AsyncStorage fails
 */
export const fixAsyncStorage = async () => {
    if (Platform.OS !== 'ios') {
        return; // Only needed on iOS
    }

    try {
        // Try a simple write operation
        await AsyncStorage.setItem('__test_fix__', 'test');
        await AsyncStorage.removeItem('__test_fix__');
        console.log('[AsyncStorageFix] ✅ AsyncStorage is working');
        return true;
    } catch (error) {
        console.log('[AsyncStorageFix] ⚠️ AsyncStorage is corrupted, attempting to fix...');

        try {
            // Clear all data to force recreation of directory structure
            await AsyncStorage.clear();

            // Try write again
            await AsyncStorage.setItem('__test_fix__', 'test');
            await AsyncStorage.removeItem('__test_fix__');

            console.log('[AsyncStorageFix] ✅ AsyncStorage fixed successfully!');
            return true;
        } catch (fixError) {
            console.error('[AsyncStorageFix] ❌ Failed to fix AsyncStorage:', fixError.message);
            console.error('[AsyncStorageFix] Please delete the app from simulator and reinstall');
            return false;
        }
    }
};

/**
 * Safe wrapper for AsyncStorage.setItem with automatic recovery
 */
export const safeSetItem = async (key, value, retries = 1) => {
    try {
        await AsyncStorage.setItem(key, value);
        return true;
    } catch (error) {
        if (retries > 0 && error.message?.includes('manifest.json')) {
            console.log('[AsyncStorageFix] Attempting to fix storage and retry...');
            const fixed = await fixAsyncStorage();
            if (fixed) {
                return safeSetItem(key, value, retries - 1);
            }
        }
        throw error;
    }
};

/**
 * Safe wrapper for AsyncStorage.getItem
 */
export const safeGetItem = async (key) => {
    try {
        return await AsyncStorage.getItem(key);
    } catch (error) {
        console.error('[AsyncStorageFix] Failed to get item:', key, error.message);
        return null;
    }
};

/**
 * Safe wrapper for AsyncStorage.multiSet
 */
export const safeMultiSet = async (keyValuePairs, retries = 1) => {
    try {
        await AsyncStorage.multiSet(keyValuePairs);
        return true;
    } catch (error) {
        if (retries > 0 && error.message?.includes('manifest.json')) {
            console.log('[AsyncStorageFix] Attempting to fix storage and retry...');
            const fixed = await fixAsyncStorage();
            if (fixed) {
                return safeMultiSet(keyValuePairs, retries - 1);
            }
        }
        throw error;
    }
};
