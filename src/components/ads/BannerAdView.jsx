import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNITS } from '../../services/adsConfig';

if (__DEV__) {
    // One-time log of the unit ID we're actually requesting against, so it's
    // obvious whether the right env (iOS vs Android, real vs test) is loaded.
    console.log('[Ads] BannerAdView unitId:', AD_UNITS.banner);
}

/**
 * Reusable inline banner. Renders nothing while the unit is loading or if it
 * errors out (so we don't show an empty bar). Drop anywhere a normal View
 * would fit — between cards, above a footer, etc.
 *
 *   <BannerAdView style={{ marginVertical: 12 }} />
 */
// After a failed load (often "no fill" for new AdMob apps), try again after
// these delays instead of hiding the slot for good.
const RETRY_DELAYS_MS = [30000, 60000, 120000];

export default function BannerAdView({ style, size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER }) {
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const retryTimer = useRef(null);

    useEffect(() => () => clearTimeout(retryTimer.current), []);

    const scheduleRetry = () => {
        if (attempt >= RETRY_DELAYS_MS.length) return; // give up on this slot
        retryTimer.current = setTimeout(() => {
            setAttempt((a) => a + 1);
            setFailed(false);
        }, RETRY_DELAYS_MS[attempt]);
    };

    if (failed) return null;

    return (
        <View style={[styles.wrap, style]}>
            <BannerAd
                // New key per attempt = fresh ad request
                key={attempt}
                unitId={AD_UNITS.banner}
                size={size}
                requestOptions={{ requestNonPersonalizedAdsOnly: false }}
                onAdLoaded={() => {
                    if (__DEV__) console.log('[Ads] Banner loaded');
                }}
                onAdFailedToLoad={(err) => {
                    // Always log (not just __DEV__) so production no-show can be
                    // diagnosed from device logs (logcat / Console.app). AdMob
                    // codes: 0=internal, 1=invalid-request (unit/app-id mismatch),
                    // 2=network, 3=no-fill (no ad available — common for new apps).
                    console.warn('[Ads] Banner failed to load:', {
                        code: err?.code,
                        message: err?.message,
                        domain: err?.domain,
                        unitId: AD_UNITS.banner,
                        attempt,
                    });
                    setFailed(true);
                    scheduleRetry();
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
