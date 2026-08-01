import ImagePicker from 'react-native-image-crop-picker';
import { launchImageLibrary } from 'react-native-image-picker';

/**
 * Opens the SYSTEM photo picker (Android Photo Picker on API 33+, PHPicker on
 * iOS) WITHOUT automatic cropping. Uses react-native-image-picker rather than
 * react-native-image-crop-picker's openPicker, because the system picker
 * requires NO broad storage permission (READ_MEDIA_IMAGES / READ_MEDIA_VIDEO)
 * — which Google Play now rejects. Cropping still happens later via cropImage().
 *
 * @param {Object} options - Picker options
 * @param {boolean} options.multiple - Allow multiple selection (default: false)
 * @param {number} options.maxFiles - Max files when multiple is true (default: 10)
 * @returns {Promise<Array>} Array of selected images with uri, width, height, mime, cropped status
 */
export const openImagePickerWithCropper = async (options = {}) => {
    const {
        multiple = false,
        maxFiles = 10,
        compressImageQuality = 0.8,
        // WhatsApp-style cap: 12 MP iPhone photos shrink from 4032×3024 to
        // ≤1080 on the long edge, which lands at ~150–400 KB per JPEG. The
        // cards / carousels never render larger than ~800px on screen anyway.
        compressImageMaxWidth = 1080,
        compressImageMaxHeight = 1080,
    } = options;

    try {
        const response = await launchImageLibrary({
            mediaType: 'photo',
            selectionLimit: multiple ? maxFiles : 1,
            includeBase64: false,
            includeExtra: false,
            // Resize/compress on the way out (mirrors the old crop-picker caps).
            quality: compressImageQuality,
            maxWidth: compressImageMaxWidth,
            maxHeight: compressImageMaxHeight,
        });

        if (response?.didCancel) {
            console.log('User cancelled image picker');
            return null;
        }
        if (response?.errorCode) {
            console.error('Image picker error:', response.errorCode, response.errorMessage);
            throw new Error(response.errorMessage || response.errorCode);
        }

        const assets = response?.assets || [];
        if (assets.length === 0) return null;

        return assets.map(asset => ({
            uri: asset.uri,
            originalUri: asset.uri, // Keep original for later cropping
            width: asset.width,
            height: asset.height,
            mime: asset.type || 'image/jpeg',
            size: asset.fileSize,
            cropped: false, // Mark as not cropped yet
        }));
    } catch (error) {
        console.error('Image picker error:', error);
        throw error;
    }
};

/**
 * Opens camera with cropper enabled
 * Allows user to take photo and crop it before using
 *
 * @param {Object} options - Cropping options
 * @returns {Promise<Object>} Captured and cropped image with uri, width, height, mime
 */
export const openCameraWithCropper = async (options = {}) => {
    const {
        width = 1080,
        height = 1080,
        cropping = true,
        freeStyleCropEnabled = true,
        compressImageQuality = 0.8,
    } = options;

    try {
        const result = await ImagePicker.openCamera({
            width,
            height,
            cropping,
            freeStyleCropEnabled,
            compressImageQuality,
            includeBase64: false,
            includeExif: false,
            forceJpg: true,
            cropperToolbarTitle: 'Crop Photo',
            cropperChooseText: 'Choose',
            cropperCancelText: 'Cancel',
            showCropGuidelines: true,
            showCropFrame: true,
            enableRotationGesture: true,
        });

        return {
            uri: result.path,
            width: result.width,
            height: result.height,
            mime: result.mime,
            size: result.size,
        };
    } catch (error) {
        if (error.code === 'E_PICKER_CANCELLED') {
            console.log('User cancelled camera');
            return null;
        }
        console.error('Camera error:', error);
        throw error;
    }
};

/**
 * Crop an existing image
 *
 * @param {string} imagePath - Path to the image to crop
 * @param {Object} options - Cropping options
 * @returns {Promise<Object>} Cropped image with uri, width, height, mime
 */
export const cropImage = async (imagePath, options = {}) => {
    const {
        width = 1080,
        height = 1080,
        freeStyleCropEnabled = true,
        compressImageQuality = 0.8,
    } = options;

    try {
        const result = await ImagePicker.openCropper({
            path: imagePath,
            width,
            height,
            freeStyleCropEnabled,
            compressImageQuality,
            includeBase64: false,
            includeExif: false,
            forceJpg: true,
            cropperToolbarTitle: 'Crop Image',
            cropperChooseText: 'Choose',
            cropperCancelText: 'Cancel',
            showCropGuidelines: true,
            showCropFrame: true,
            enableRotationGesture: true,
        });

        return {
            uri: result.path,
            width: result.width,
            height: result.height,
            mime: result.mime,
            size: result.size,
        };
    } catch (error) {
        if (error.code === 'E_PICKER_CANCELLED') {
            console.log('User cancelled cropping');
            return null;
        }
        console.error('Crop error:', error);
        throw error;
    }
};

/**
 * Cleanup cached images from react-native-image-crop-picker
 */
export const cleanupImageCache = async () => {
    try {
        await ImagePicker.clean();
        console.log('Image cache cleaned');
    } catch (error) {
        console.error('Error cleaning image cache:', error);
    }
};

// Recommended dimensions for different use cases
export const IMAGE_DIMENSIONS = {
    // Square format - ideal for profile pictures, product images
    SQUARE: { width: 1080, height: 1080 },

    // Instagram portrait - good for vertical photos
    PORTRAIT: { width: 1080, height: 1350 },

    // Instagram landscape - good for horizontal photos
    LANDSCAPE: { width: 1080, height: 566 },

    // 4:3 ratio - traditional photo format
    STANDARD: { width: 1080, height: 810 },

    // 16:9 ratio - widescreen format
    WIDESCREEN: { width: 1080, height: 607 },

    // Free form - user can crop to any dimension (dynamic ratio)
    FREE: { width: 1080, height: 1080, freeStyleCropEnabled: true },

    // Fixed square ratio - maintains 1:1 aspect ratio
    FIXED_SQUARE: { width: 1080, height: 1080, freeStyleCropEnabled: false },
};
