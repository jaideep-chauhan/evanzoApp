/**
 * Crash + error reporting (Firebase Crashlytics).
 *
 * WHY: the app had NO crash reporting, so production failures on real devices
 * (e.g. "can't post vendor ad" on Samsung S24, random crashes, jank) were
 * invisible — Play Console vitals only shows *native* crashes, and iOS gives
 * almost nothing. Crashlytics captures BOTH native crashes and — via the JS
 * global handler below — the JavaScript errors that cause most RN failures,
 * with a full stack trace, device/OS, and breadcrumb trail.
 *
 * ACTIVATION (this file is inert until imported):
 *   1. yarn add @react-native-firebase/crashlytics@23.7.0   (keep existing pins)
 *   2. add `import { initCrashReporting } from './src/services/crashReporting';`
 *      to index.js and call `initCrashReporting()` once at startup.
 *   3. iOS: `cd ios && pod install`; rebuild both platforms (native module).
 *
 * Usage after init:
 *   import { logBreadcrumb, recordError, setCrashUser } from '.../crashReporting';
 *   logBreadcrumb('CreateAd: opened photo picker');
 *   recordError(err, { context: 'createVendorAd' });
 *   setCrashUser(userId);
 */
import crashlytics from '@react-native-firebase/crashlytics';

let started = false;

// Wire the global JS error handler so uncaught JS errors become Crashlytics
// non-fatals (native crashes are captured automatically). Chains the previous
// handler so RN's own red-box / logging still runs.
export const initCrashReporting = () => {
  if (started) return;
  started = true;

  try {
    crashlytics().setCrashlyticsCollectionEnabled(true);
  } catch (_) {}

  const previous =
    typeof ErrorUtils !== 'undefined' && ErrorUtils.getGlobalHandler
      ? ErrorUtils.getGlobalHandler()
      : null;

  if (typeof ErrorUtils !== 'undefined' && ErrorUtils.setGlobalHandler) {
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      try {
        crashlytics().log(`JS error (isFatal=${!!isFatal})`);
        crashlytics().recordError(
          error instanceof Error ? error : new Error(String(error)),
        );
      } catch (_) {}
      if (previous) previous(error, isFatal);
    });
  }
};

// Drop a breadcrumb that shows up in the crash's timeline — call these around
// the flaky flows (ad create, photo pick/compress/upload, chat connect) so a
// crash report shows exactly how far the user got.
export const logBreadcrumb = (message) => {
  try {
    crashlytics().log(String(message));
  } catch (_) {}
};

// Record a handled/caught error as a non-fatal, with optional key/value context.
export const recordError = (error, context = {}) => {
  try {
    Object.entries(context).forEach(([k, v]) =>
      crashlytics().setAttribute(String(k), String(v)),
    );
    crashlytics().recordError(
      error instanceof Error ? error : new Error(String(error)),
    );
  } catch (_) {}
};

// Tag reports with the signed-in user so you can see which accounts hit issues.
export const setCrashUser = (userId) => {
  try {
    if (userId != null) crashlytics().setUserId(String(userId));
  } catch (_) {}
};

export default {
  initCrashReporting,
  logBreadcrumb,
  recordError,
  setCrashUser,
};
