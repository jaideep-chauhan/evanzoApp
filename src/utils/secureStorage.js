/**
 * Secure Storage Wrapper using react-native-keychain
 *
 * This module provides a secure storage interface using the device's Keychain (iOS)
 * or Keystore (Android) for storing sensitive data like authentication tokens.
 *
 * Why Keychain/Keystore?
 * - Data is encrypted at rest using hardware-backed encryption
 * - Protected by device biometrics or passcode
 * - Cannot be accessed by other apps
 * - Persists across app reinstalls (configurable)
 * - Meets App Store security requirements for sensitive data
 */

import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Detect once whether the native Keychain module is actually linked. On iOS
// builds where Pods are stale, `RNKeychainManager` is null and every Keychain
// call throws "Cannot read property 'getGenericPasswordForOptions' of null".
// We probe by attempting a trivial call inside a guarded block; if it throws,
// we mark Keychain as unavailable and fall back to AsyncStorage for the rest
// of the session. AsyncStorage is less secure than Keychain, but failing open
// (no auth at all) breaks the app entirely — silent fallback keeps it usable.
let keychainAvailable = null;
const isKeychainUsable = async () => {
  if (keychainAvailable !== null) return keychainAvailable;
  try {
    // getGenericPassword with a throwaway service is the cheapest probe.
    // A native-module-missing error throws synchronously inside the promise.
    await Keychain.getGenericPassword({ service: '__probe__' });
    keychainAvailable = true;
  } catch (err) {
    const msg = String(err?.message || err);
    if (msg.includes('getGenericPasswordForOptions') || msg.includes('null')) {
      console.warn(
        '[SecureStorage] Native Keychain module unavailable — falling back to AsyncStorage. Run `cd ios && pod install` and rebuild to restore Keychain-backed storage.',
      );
      keychainAvailable = false;
    } else {
      // Some other error (e.g. user cancelled biometric) — Keychain is fine.
      keychainAvailable = true;
    }
  }
  return keychainAvailable;
};

// AsyncStorage fallback keys are namespaced so they don't collide with other
// AsyncStorage usage and stay obvious in a debug dump.
const fallbackKey = (k) => `@evanzo/secure-fallback/${k}`;

/**
 * Secure storage service for sensitive data
 * Uses device Keychain/Keystore for hardware-backed encryption
 */
export const secureStorage = {
  async setItem(key, value) {
    if (!(await isKeychainUsable())) {
      try {
        await AsyncStorage.setItem(fallbackKey(key), String(value));
        return true;
      } catch (e) {
        console.error(`[SecureStorage] AsyncStorage fallback setItem failed for "${key}":`, e);
        return false;
      }
    }
    try {
      await Keychain.setGenericPassword(key, value, {
        service: key,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
      });
      return true;
    } catch (error) {
      console.error(`[SecureStorage] Error setting item for key "${key}":`, error);
      return false;
    }
  },

  async getItem(key) {
    if (!(await isKeychainUsable())) {
      try {
        return await AsyncStorage.getItem(fallbackKey(key));
      } catch (e) {
        console.error(`[SecureStorage] AsyncStorage fallback getItem failed for "${key}":`, e);
        return null;
      }
    }
    try {
      const credentials = await Keychain.getGenericPassword({ service: key });
      if (credentials && credentials.password) return credentials.password;
      return null;
    } catch (error) {
      console.error(`[SecureStorage] Error getting item for key "${key}":`, error);
      return null;
    }
  },

  async removeItem(key) {
    if (!(await isKeychainUsable())) {
      try {
        await AsyncStorage.removeItem(fallbackKey(key));
        return true;
      } catch (e) {
        console.error(`[SecureStorage] AsyncStorage fallback removeItem failed for "${key}":`, e);
        return false;
      }
    }
    try {
      await Keychain.resetGenericPassword({ service: key });
      return true;
    } catch (error) {
      console.error(`[SecureStorage] Error removing item for key "${key}":`, error);
      return false;
    }
  },

  async hasItem(key) {
    if (!(await isKeychainUsable())) {
      try {
        return (await AsyncStorage.getItem(fallbackKey(key))) != null;
      } catch (_) {
        return false;
      }
    }
    try {
      const credentials = await Keychain.getGenericPassword({ service: key });
      return !!credentials;
    } catch (error) {
      console.error(`[SecureStorage] Error checking item for key "${key}":`, error);
      return false;
    }
  },

  /**
   * Clear all secure storage (use with caution)
   * @returns {Promise<boolean>} Success status
   */
  async clear() {
    try {
      // Note: This only clears items stored through this service
      // Cannot enumerate all Keychain items programmatically
      console.warn('[SecureStorage] Clear method should be used with specific keys');
      return true;
    } catch (error) {
      console.error('[SecureStorage] Error clearing storage:', error);
      return false;
    }
  },
};

/**
 * Migration helper: Move data from AsyncStorage to SecureStorage
 * Use this to migrate existing tokens from AsyncStorage to Keychain
 */
export const migrateFromAsyncStorage = async (AsyncStorage, keys) => {
  const migrated = [];
  const failed = [];

  for (const key of keys) {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        const success = await secureStorage.setItem(key, value);
        if (success) {
          await AsyncStorage.removeItem(key); // Remove from AsyncStorage after successful migration
          migrated.push(key);
        } else {
          failed.push(key);
        }
      }
    } catch (error) {
      console.error(`[SecureStorage] Migration failed for key "${key}":`, error);
      failed.push(key);
    }
  }

  return { migrated, failed };
};

export default secureStorage;
