import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNITS } from '../../services/adsConfig';

/**
 * In-list ad slot. Uses a Medium Rectangle banner (300x250) which has high
 * fill rates and renders well between vendor/event cards.
 *
 * Note: True Native Ads are only available in react-native-google-mobile-ads v16+.
 * We're on v14 (which doesn't have codegen issues with the current setup), so we
 * fall back to a Medium Rectangle banner that visually fits the same in-list slot.
 * Quietly removes itself on load failure.
 */
export default function NativeAdCard({ style }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <View style={[styles.card, style]}>
      <Text style={styles.adLabel}>Ad</Text>
      <BannerAd
        unitId={AD_UNITS.banner}
        size={BannerAdSize.MEDIUM_RECTANGLE}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        onAdFailedToLoad={(err) => {
          if (__DEV__) console.log('[NativeAdCard] failed:', err?.message);
          setFailed(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 10,
    marginVertical: 8,
    paddingTop: 10,
    paddingBottom: 14,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  adLabel: {
    alignSelf: 'flex-start',
    marginLeft: 12,
    marginBottom: 8,
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: '#F0AD4E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
