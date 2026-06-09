import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNITS } from '../../services/adsConfig';

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
                onAdFailedToLoad={(err) => {
                    if (__DEV__) console.log('[Ads] Banner failed:', err?.message || err);
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
