import { Platform, PermissionsAndroid } from 'react-native';

// Gallery access is now handled entirely by the SYSTEM photo picker
// (react-native-image-picker's launchImageLibrary → Android Photo Picker on
// API 33+, PHPicker on iOS). The system picker grants scoped, one-shot access
// to ONLY the items the user selects and requires NO runtime permission.
//
// We removed READ_MEDIA_IMAGES / READ_MEDIA_VIDEO from the manifest to comply
// with Google Play's Photo & Video Permissions policy. Requesting them now
// would only auto-deny, so this helper is a no-op that always allows — the
// picker manages access itself. Kept as a function so existing call sites
// (Create Ad, Chat) don't need to change.
export const requestGalleryPermission = async () => true;

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
