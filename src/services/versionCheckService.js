import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_VERSION } from '../config/appVersion';
import { API_BASE_URL } from './api';

const LAST_CHECK_KEY = '@updatePrompt:lastShownAt';
const SNOOZE_HOURS = 24; // After "Later", don't prompt again for this many hours

// Numeric-aware semver compare: returns -1 if a<b, 0 if equal, 1 if a>b
const compareVersions = (a, b) => {
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
};

/**
 * Fetches the latest published version from the backend and decides whether
 * to prompt the user. Honors a 24h snooze if the user previously tapped
 * "Later" — but force-update mode bypasses snooze.
 *
 * Returns:
 *   { shouldShow, forceUpdate, latest, storeUrl, releaseNotes }
 * or null if no update is needed / check fails.
 */
export const checkForUpdate = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/app-version`, {
      headers: { 'X-Client-Type': 'mobile' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data;
    if (!data) return null;

    const platformKey = Platform.OS === 'ios' ? 'ios' : 'android';
    const entry = data[platformKey];
    if (!entry?.latest) return null;

    const isBelowLatest = compareVersions(APP_VERSION, entry.latest) < 0;
    const isBelowMinimum = entry.minimum
      ? compareVersions(APP_VERSION, entry.minimum) < 0
      : false;

    if (!isBelowLatest) return null; // already on latest or newer

    // Honor snooze for soft updates only — never for force updates
    if (!isBelowMinimum) {
      try {
        const lastShown = await AsyncStorage.getItem(LAST_CHECK_KEY);
        if (lastShown) {
          const hoursSince = (Date.now() - Number(lastShown)) / (1000 * 60 * 60);
          if (hoursSince < SNOOZE_HOURS) return null;
        }
      } catch (_) {}
    }

    return {
      shouldShow: true,
      forceUpdate: isBelowMinimum,
      currentVersion: APP_VERSION,
      latest: entry.latest,
      storeUrl: entry.storeUrl,
      releaseNotes: data.releaseNotes || null,
    };
  } catch (e) {
    if (__DEV__) console.log('[VersionCheck] failed:', e?.message);
    return null;
  }
};

// Called when user taps "Later" — snoozes the soft-update prompt for SNOOZE_HOURS
export const snoozeUpdatePrompt = async () => {
  try {
    await AsyncStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
  } catch (_) {}
};

// Open the appropriate store. Tries the native deep link first
// (market:// on Android, itms-apps:// on iOS) so it goes directly to the store app.
export const openStore = async (storeUrl) => {
  if (!storeUrl) return;
  let nativeUrl = storeUrl;
  if (Platform.OS === 'android' && storeUrl.includes('play.google.com')) {
    const idMatch = storeUrl.match(/[?&]id=([^&]+)/);
    if (idMatch) nativeUrl = `market://details?id=${idMatch[1]}`;
  } else if (Platform.OS === 'ios' && storeUrl.includes('apps.apple.com')) {
    nativeUrl = storeUrl.replace('https://', 'itms-apps://');
  }
  try {
    const supported = await Linking.canOpenURL(nativeUrl);
    await Linking.openURL(supported ? nativeUrl : storeUrl);
  } catch (_) {
    try { await Linking.openURL(storeUrl); } catch (__) {}
  }
};

export default { checkForUpdate, snoozeUpdatePrompt, openStore };
