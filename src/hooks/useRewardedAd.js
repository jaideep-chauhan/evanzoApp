import { useEffect, useRef, useCallback, useState } from 'react';
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import { AD_UNITS } from '../services/adsConfig';

/**
 * Pre-loads a rewarded ad. Usage:
 *
 *   const { show, isLoaded } = useRewardedAd((reward) => {
 *     // grant the user the reward (e.g., free boost)
 *   });
 *   ... onPress: show()
 *
 * onReward is fired ONLY when the user finishes watching.
 */
export default function useRewardedAd(onReward) {
  const adRef = useRef(null);
  const onRewardRef = useRef(onReward);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => { onRewardRef.current = onReward; }, [onReward]);

  const load = useCallback(() => {
    const ad = RewardedAd.createForAdRequest(AD_UNITS.rewarded, {
      requestNonPersonalizedAdsOnly: false,
    });
    adRef.current = ad;
    setIsLoaded(false);

    const onLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setIsLoaded(true);
    });
    const onEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      if (typeof onRewardRef.current === 'function') {
        try { onRewardRef.current(reward); } catch (e) { console.warn('[Rewarded] callback err:', e); }
      }
    });
    const onClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      load();
    });
    const onError = ad.addAdEventListener(AdEventType.ERROR, (err) => {
      if (__DEV__) console.log('[Rewarded] error:', err?.message);
      setIsLoaded(false);
    });

    ad._unsubscribers = [onLoaded, onEarned, onClosed, onError];
    ad.load();
  }, []);

  useEffect(() => {
    load();
    return () => {
      const ad = adRef.current;
      if (ad?._unsubscribers) ad._unsubscribers.forEach((u) => u && u());
    };
  }, [load]);

  const show = useCallback(() => {
    const ad = adRef.current;
    if (ad && isLoaded) {
      ad.show();
      setIsLoaded(false);
      return true;
    }
    return false;
  }, [isLoaded]);

  return { show, isLoaded };
}
