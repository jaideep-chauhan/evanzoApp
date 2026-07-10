import { Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';

// One-shot startup permission request. Asks for the permissions the app needs
// to actually work — notifications, gallery/media, and location — right after
// launch, so the features that depend on them (push, image upload, nearby
// vendors/events) work the first time instead of silently failing.
//
// Why not rely on messaging().requestPermission() alone: on Android 13+ (API
// 33) POST_NOTIFICATIONS is a RUNTIME permission that must be requested through
// PermissionsAndroid. messaging().requestPermission() does not reliably show
// that OS dialog, so users "granted notifications" on the Firebase side but the
// Android runtime permission was never actually asked → no notifications.
//
// Each PermissionsAndroid.request is a no-op if already granted (or permanently
// denied), so this is safe to call on every cold start — the OS only shows a
// dialog when it's actually needed.
const androidApiLevel = () =>
  typeof Platform.Version === 'number'
    ? Platform.Version
    : parseInt(Platform.Version, 10) || 0;

export const requestStartupPermissions = async () => {
  try {
    // 1) Notifications --------------------------------------------------------
    if (Platform.OS === 'android' && androidApiLevel() >= 33) {
      // Android 13+ runtime notification permission (the real dialog).
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    }
    // Firebase-side permission (shows the iOS dialog; registers the app for
    // remote messages on both platforms). Kept so FCM is authorised too.
    try {
      await messaging().requestPermission();
    } catch (_) {
      // Firebase not configured / unavailable — non-fatal.
    }

    // 2) Gallery / media ------------------------------------------------------
    if (Platform.OS === 'android') {
      if (androidApiLevel() >= 33) {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
        ]);
      } else {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        );
      }
    }
    // iOS gallery/camera prompts are driven by the picker libs + Info.plist
    // usage strings the first time they're used — nothing to pre-request here.

    // 3) Location -------------------------------------------------------------
    if (Platform.OS === 'android') {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
    }
  } catch (e) {
    // Never let a permission hiccup break startup.
    console.warn('[startupPermissions] request failed:', e?.message || e);
  }
};

export default requestStartupPermissions;
