// Keep this in sync with:
//   - android/app/build.gradle  → versionName  (currently 1.9)
//   - ios/EVNZO.xcodeproj      → MARKETING_VERSION  (currently 1.9)
// Bump on every release. The version-check service compares this against
// the latest published version returned by `GET /app-version` and
// triggers the soft/force update prompt when it's older.
export const APP_VERSION = '1.9';
