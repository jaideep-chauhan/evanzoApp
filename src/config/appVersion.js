// The app's own version, used by versionCheckService to decide whether to
// show the "update available" prompt.
//
// ⚠️ MUST be bumped on EVERY release to match:
//   - android/app/build.gradle  → versionName
//   - ios/EVNZO.xcodeproj       → MARKETING_VERSION
//
// This was left stale at "1.9" while the app shipped as 2.1.x, so once the
// backend /app-version advertised a newer `latest`, every install compared
// 1.9 < latest and prompted to update forever (an infinite update loop).
// TODO: make this dynamic via react-native-device-info's getVersion() so it
// can never go stale again.
export const APP_VERSION = '2.1.8';
