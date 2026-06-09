import mobileAds, {
    MaxAdContentRating,
} from 'react-native-google-mobile-ads';
import { initInterstitialController } from './interstitialController';

let initialized = false;

// Call this once at app start (App.jsx mount effect).
// Safe to call multiple times — guarded internally.
export const initAds = async () => {
    if (initialized) return;
    initialized = true;

    try {
        // Family-safe defaults. Adjust later if you want full inventory.
        await mobileAds().setRequestConfiguration({
            maxAdContentRating: MaxAdContentRating.PG,
            tagForChildDirectedTreatment: false,
            tagForUnderAgeOfConsent: false,
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
