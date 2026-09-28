import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { AD_UNITS, INTERSTITIAL_FREQUENCY } from './adsConfig';

// One global interstitial. Preloaded on init; reloaded after every show()
// so the next call is always instant.
let interstitial = null;
let loaded = false;
let counter = 0; // counts events that trigger maybe-show
let failures = 0; // consecutive load failures, for back-off
let retryTimer = null;

// Reload after a failed load: 30s, 60s, 2m, … capped at 5 minutes.
const scheduleReload = () => {
    clearTimeout(retryTimer);
    const delay = Math.min(30000 * 2 ** Math.max(0, failures - 1), 300000);
    retryTimer = setTimeout(() => {
        if (!interstitial) loadNext();
    }, delay);
};

const loadNext = () => {
    try {
        interstitial = InterstitialAd.createForAdRequest(AD_UNITS.interstitial, {
            requestNonPersonalizedAdsOnly: false,
        });

        const onLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
            loaded = true;
            failures = 0;
            if (__DEV__) console.log('[Ads] Interstitial loaded');
        });
        const onClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
            // Preload the next one immediately after dismissal.
            cleanup();
            loadNext();
        });
        const onError = interstitial.addAdEventListener(AdEventType.ERROR, (err) => {
            console.warn('[Ads] Interstitial error:', err?.message || err);
            cleanup();
            // Try again on a back-off timer so one is ready by the next show
            // (previously it waited for the next Nth tick, then N more).
            failures += 1;
            scheduleReload();
        });

        // Track unsub fns for cleanup
        interstitial.__unsubs = [onLoaded, onClosed, onError];

        loaded = false;
        interstitial.load();
    } catch (e) {
        console.warn('[Ads] Failed to create interstitial:', e?.message || e);
        interstitial = null;
        loaded = false;
    }
};

const cleanup = () => {
    if (interstitial?.__unsubs) {
        interstitial.__unsubs.forEach((u) => {
            try { u(); } catch (_) {}
        });
    }
    interstitial = null;
    loaded = false;
};

export const initInterstitialController = () => {
    if (!interstitial) loadNext();
};

// Call from any screen where you want to "count an event" — every Nth call
// will show the interstitial (if loaded). Returns true if an ad was shown.
export const tickAndMaybeShow = () => {
    counter += 1;
    if (counter % INTERSTITIAL_FREQUENCY !== 0) return false;
    if (!loaded || !interstitial) {
        // Not ready yet; lazily kick off a load so it'll be ready next time.
        if (!interstitial) loadNext();
        return false;
    }
    try {
        interstitial.show();
        return true;
    } catch (e) {
        console.warn('[Ads] Failed to show interstitial:', e?.message || e);
        return false;
    }
};

export default { initInterstitialController, tickAndMaybeShow };
