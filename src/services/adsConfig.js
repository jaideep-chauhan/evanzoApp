import { Platform } from 'react-native';

// Production AdMob unit IDs. Used in BOTH dev and release builds.
// Note: simulators / emulators routinely no-fill on production units
// even with testDeviceIdentifiers set — that's expected. Real ads
// serve on real devices and TestFlight / internal-track installs.
const ANDROID = {
    banner: 'ca-app-pub-2655968575466386/4536714219',
    interstitial: 'ca-app-pub-2655968575466386/4425033573',
    native: 'ca-app-pub-2655968575466386/2363492381',
};

const IOS = {
    banner: 'ca-app-pub-2655968575466386/5466652507',
    interstitial: 'ca-app-pub-2655968575466386/2544975694',
    native: 'ca-app-pub-2655968575466386/6859625227',
};

const pick = (key) => (Platform.OS === 'ios' ? IOS[key] : ANDROID[key]);

export const AD_UNITS = {
    banner: pick('banner'),
    interstitial: pick('interstitial'),
    native: pick('native'),
};

// Show an interstitial after every Nth opening of an ad detail page.
// 4 = "see three ads, then an interstitial, then three more". Tune later.
export const INTERSTITIAL_FREQUENCY = 4;

// Insert an inline banner row after every Nth item in the vendor/event list.
export const BANNER_LIST_INTERVAL = 6;

export default AD_UNITS;
