# Ad Sharing & Deep Links (native, free — served from api.evnzo.com)

Share an ad → the link opens that ad in the app if installed, otherwise sends
the user to the App Store / Play Store. No third-party SDK, no monthly cost.

Link format: `https://api.evnzo.com/event/<id>` and `/vendor/<id>`
(plus the `evnzo://event/<id>` custom scheme).

> Limitation: plain native links can't auto-open the *exact* ad **after** a
> fresh install (that lands on Home). Only a paid service (Branch/AppsFlyer)
> does that.

---

## How it works
1. **Share** puts `https://api.evnzo.com/vendor/<id>` in the share sheet.
2. **App installed**: iOS Universal Links / Android App Links open the ad
   directly. (Even without verified links, the redirect page below opens the
   app via the `evnzo://` scheme.)
3. **Not installed**: the backend's redirect page sends the user to the store.

## Already done in code
- **App**: `deepLinkService.js` (`linking` + `createAdLink`), `linking` on
  `NavigationContainer`, share methods, detail screens accept `eventId`/`vendorId`.
  iOS: `evnzo://` scheme + `applinks:api.evnzo.com` entitlement + AppDelegate
  forwards to `RCTLinkingManager` (bridging header imports it). Android: scheme +
  App Links intent-filter for `api.evnzo.com` `/event/*` `/vendor/*`.
- **Backend** (`evanzo-BE/src/routes/deeplinks.route.js`, mounted at root): serves
  `/event/:id`, `/vendor/:id` (smart redirect) and `/.well-known/
  apple-app-site-association` + `/.well-known/assetlinks.json`.

## What you still need to do

### 1. Set backend env vars (then deploy the backend)
```
IOS_TEAM_ID=ABCDE12345                 # Apple Developer → Membership
IOS_APP_STORE_URL=https://apps.apple.com/app/id0000000000
ANDROID_SHA256=AA:BB:CC:...            # Play Console → App integrity → SHA-256
# optional (sensible defaults already set):
# IOS_BUNDLE_ID=com.4x90studio.evnzo
# ANDROID_PACKAGE=com.x4x90studio.evnzo
# ANDROID_STORE_URL=https://play.google.com/store/apps/details?id=com.x4x90studio.evnzo
```
Verify after deploy:
- `https://api.evnzo.com/.well-known/apple-app-site-association` returns JSON
  (Content-Type `application/json`, no redirect).
- `https://api.evnzo.com/.well-known/assetlinks.json` returns JSON.
- `https://api.evnzo.com/vendor/1` returns the redirect HTML.

### 2. Enable the Associated Domains capability (iOS)
Apple Developer portal → your App ID → enable **Associated Domains**. The
entitlements file already lists `applinks:api.evnzo.com`.

### 3. Rebuild + reinstall the apps
Universal/App Links only work for a build that shipped with this config — the
copy currently on your phone is older, so **you must install the new build**:
```bash
cd ios && pod install && cd ..
npx react-native run-ios       # or a TestFlight build for a real device
npx react-native run-android
```

### 4. Test
- Tap **Share** on an ad → link is `https://api.evnzo.com/vendor/<id>`.
- On a device with the **new** build installed → opening it opens the ad.
- `evnzo://vendor/<id>` opens it too.
- Android verify: `adb shell pm get-app-links com.x4x90studio.evnzo`.

---

## Known follow-up
Links carry only the ad **id**; detail screens render best from a full ad
object. From a link they get a stub `{ id }`, and `/api/event_ad/:id` is thin
(no `user`/`attachments`). Enrich that endpoint (or fetch the full row in the
detail screens) so link-opened ads show full images + organizer.
