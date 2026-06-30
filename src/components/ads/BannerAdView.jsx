import React, { useState } from 'react';
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
export default function BannerAdView({ style, size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER }) {
    const [failed, setFailed] = useState(false);
    if (failed) return null;

    return (
        <View style={[styles.wrap, style]}>
            <BannerAd
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
                    });
                    setFailed(true);
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
