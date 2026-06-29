// Deep linking via React Navigation + native Universal Links (iOS) / App Links
// (Android). No third-party SDK.
//
// Behavior:
//   - App installed  → tapping a shared link opens that exact ad in-app.
//   - Not installed  → the link opens the web page, which sends the user to the
//     store. (Plain native links can't auto-open the exact ad AFTER install —
//     that lands on Home. Use a paid service like Branch/AppsFlyer if that
//     deferred step becomes a requirement.)
//
// Setup that must exist on the web domain (see BRANCH_DEEPLINKS_SETUP.md, now
// the native-links guide):
//   https://evnzo.com/.well-known/apple-app-site-association   (iOS)
//   https://evnzo.com/.well-known/assetlinks.json              (Android)
//   https://evnzo.com/event/:id  and  /vendor/:id              (web pages)

// Domain that hosts the ad redirect pages + the association files. Served by
// the backend at api.evnzo.com (see evanzo-BE/src/routes/deeplinks.route.js).
// Keep in sync with the iOS entitlements + AndroidManifest App Links host.
export const WEB_BASE_URL = 'https://api.evnzo.com';

// Passed to NavigationContainer. Maps the https links AND the evnzo:// scheme
// to the ad detail screens. The path param names (eventId/vendorId) match what
// the detail screens read.
export const linking = {
    prefixes: [WEB_BASE_URL, 'evnzo://'],
    config: {
        screens: {
            EventDetailView: 'event/:eventId',
            VendorAddDetail: 'vendor/:vendorId',
        },
    },
};

// Build a shareable link for an ad (https Universal/App Link).
export const createAdLink = ({ type, id }) => {
    const path = type === 'event' ? 'event' : 'vendor';
    return `${WEB_BASE_URL}/${path}/${id}`;
};

export default { linking, createAdLink, WEB_BASE_URL };
