import { Platform, PermissionsAndroid } from 'react-native';

// Gallery permission helper that works on every supported Android version.
//
// Background: Android 13 (API 33) split READ_EXTERNAL_STORAGE into
// per-type media permissions (READ_MEDIA_IMAGES / VIDEO / AUDIO). Apps
// that target SDK 33+ MUST request the per-type permission — the legacy
// one silently auto-denies with NEVER_ASK_AGAIN, so the dialog never
// appears and the user is stuck. We were hitting that exactly: target
// SDK 35 + request for READ_EXTERNAL_STORAGE = no prompt ever shown.
//
// This helper picks the right permission based on the running OS version
// and (optionally) asks for VIDEO too, so a single call covers both the
// "select photo" and "select video" flows used by Create Ad, Chat, etc.
//
// On iOS we return true — the underlying picker libraries
// (react-native-image-crop-picker, react-native-image-picker) handle the
// PHPhotoLibrary prompt themselves via Info.plist usage descriptions.
export const requestGalleryPermission = async ({ includeVideo = false } = {}) => {
  if (Platform.OS !== 'android') return true;

  const apiLevel = typeof Platform.Version === 'number'
    ? Platform.Version
    : parseInt(Platform.Version, 10) || 0;

  const dialog = {
    title: 'Gallery access',
    message: 'Evnzo needs access to your photos to upload images.',
    buttonNeutral: 'Ask me later',
    buttonNegative: 'Cancel',
    buttonPositive: 'Allow',
  };

  try {
    if (apiLevel >= 33) {
      // Android 13+: request READ_MEDIA_IMAGES (and READ_MEDIA_VIDEO
      // when callers also pick videos). requestMultiple gives us a
      // single OS prompt that lists both rather than two back-to-back.
      const perms = [PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES];
      if (includeVideo) perms.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO);

      const results = await PermissionsAndroid.requestMultiple(perms);
      return perms.every(
        (p) => results[p] === PermissionsAndroid.RESULTS.GRANTED
      );
    }

    // Android 12 and below: legacy READ_EXTERNAL_STORAGE still works
    // (and is the only thing that does).
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      dialog
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('[galleryPermission] request failed:', err?.message || err);
    return false;
  }
};

// Camera permission. Same shape as the gallery helper so call sites
// stay consistent — also iOS short-circuits to true here because
// the camera prompt is driven by Info.plist on iOS.
export const requestCameraPermission = async () => {
  if (Platform.OS !== 'android') return true;

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera access',
        message: 'Evnzo needs camera access to take photos.',
        buttonNeutral: 'Ask me later',
        buttonNegative: 'Cancel',
        buttonPositive: 'Allow',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('[cameraPermission] request failed:', err?.message || err);
    return false;
  }
};
