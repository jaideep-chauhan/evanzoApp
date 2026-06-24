import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

// Production AdMob unit IDs. Used in BOTH dev and release builds.
// Note: simulators / emulators routinely no-fill on production units
// even with testDeviceIdentifiers set — that's expected. Real ads
// serve on real devices and TestFlight / internal-track installs.
const ANDROID = {
    banner: 'ca-app-pub-2655968575466386/4536714219',
    interstitial: 'ca-app-pub-2655968575466386/4425033573',
    native: 'ca-app-pub-2655968575466386/2363492381',
    // No production Rewarded unit configured in AdMob yet. Falling back to
    // Google's TestIds.REWARDED so `useRewardedAd` works for dev/preview.
    // Replace once a real rewarded unit is created in AdMob console.
    rewarded: TestIds.REWARDED,
};

const IOS = {
    banner: 'ca-app-pub-2655968575466386/5466652507',
    interstitial: 'ca-app-pub-2655968575466386/2544975694',
    native: 'ca-app-pub-2655968575466386/6859625227',
    rewarded: TestIds.REWARDED,
};

// Google's official always-fill TEST units. In dev builds we use these so the
// ad UI is actually visible on simulators/emulators — production units no-fill
// on non-physical devices, which is why "ads don't show" during testing.
// Release builds always use the real production units above.
const TEST = {
    banner: TestIds.BANNER,
    interstitial: TestIds.INTERSTITIAL,
    native: 'ca-app-pub-3940256099942544/2247696110', // Google native-advanced test unit
    rewarded: TestIds.REWARDED,
};

const pick = (key) => {
    if (__DEV__) return TEST[key];
    return Platform.OS === 'ios' ? IOS[key] : ANDROID[key];
};

export const AD_UNITS = {
    banner: pick('banner'),
    interstitial: pick('interstitial'),
    native: pick('native'),
    rewarded: pick('rewarded'),
};

// Show an interstitial after every Nth opening of an ad detail page.
// 4 = "see three ads, then an interstitial, then three more". Tune later.
export const INTERSTITIAL_FREQUENCY = 4;

// Insert an inline banner row after every Nth item in the vendor/event list.
export const BANNER_LIST_INTERVAL = 6;

export default AD_UNITS;
