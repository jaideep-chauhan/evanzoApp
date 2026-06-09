import mobileAds, {
    MaxAdContentRating,
    TestIds,
} from 'react-native-google-mobile-ads';
import { initInterstitialController } from './interstitialController';

let initialized = false;

// Call this once at app start (App.jsx mount effect).
// Safe to call multiple times — guarded internally.
export const initAds = async () => {
    if (initialized) return;
    initialized = true;

    try {
        // Family-safe defaults. The `testDeviceIdentifiers: ['EMULATOR']`
        // entry makes simulators / Android emulators always receive
        // real-looking test fills (AdMob otherwise returns no-fill for
        // non-physical devices). Production ads still serve normally to
        // real phones because they're not marked as test devices.
        await mobileAds().setRequestConfiguration({
            maxAdContentRating: MaxAdContentRating.PG,
            tagForChildDirectedTreatment: false,
            tagForUnderAgeOfConsent: false,
            testDeviceIdentifiers: ['EMULATOR'],
        });

        const adapterStatuses = await mobileAds().initialize();
        if (__DEV__) {
            console.log('[Ads] AdMob initialized:', Object.keys(adapterStatuses || {}));
        }
    } catch (e) {
        console.warn('[Ads] Initialization failed:', e?.message || e);
        initialized = false; // allow a retry on next call
        return;
    }

    // Preload the first interstitial so the first show() doesn't wait on network.
    try {
        initInterstitialController();
    } catch (e) {
        console.warn('[Ads] Interstitial controller init failed:', e?.message || e);
    }
};

export default { initAds };
