import { useCallback } from 'react';
import { tickAndMaybeShow } from '../services/interstitialController';

/**
 * Lightweight hook around the global interstitial controller. Returns a
 * stable function the screen can call when the user does something that
 * should "tick" the show-every-Nth counter (e.g. opening an ad detail).
 *
 *   const tick = useInterstitialAd();
 *   useEffect(() => { tick(); }, []);
 */
export default function useInterstitialAd() {
    return useCallback(() => tickAndMaybeShow(), []);
}
