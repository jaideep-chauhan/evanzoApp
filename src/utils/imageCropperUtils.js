import ImagePicker from 'react-native-image-crop-picker';

/**
 * Opens image picker with cropper enabled
 * Allows user to select and crop images with preview of how they will appear
 *
 * @param {Object} options - Cropping options
 * @param {number} options.width - Desired width (default: 1080)
 * @param {number} options.height - Desired height (default: 1080)
 * @param {boolean} options.multiple - Allow multiple selection (default: false)
 * @param {number} options.maxFiles - Max files when multiple is true (default: 10)
 * @param {boolean} options.cropping - Enable cropping (default: true)
 * @param {boolean} options.freeStyleCropEnabled - Allow free-form cropping (default: true)
 * @returns {Promise<Array>} Array of selected and cropped images with uri, width, height, mime
 */
export const openImagePickerWithCropper = async (options = {}) => {
    const {
        width = 1080,
        height = 1080,
        multiple = false,
        maxFiles = 10,
        freeStyleCropEnabled = true,
        cropperCircleOverlay = false,
        compressImageQuality = 0.8,
    } = options;

    try {
        // First, let user select images without cropping
        const pickerOptions = {
            multiple,
            maxFiles: multiple ? maxFiles : undefined,
            mediaType: 'photo',
            includeBase64: false,
            includeExif: false,
            forceJpg: false,
            cropping: false, // Disable cropping during selection
        };

        const result = await ImagePicker.openPicker(pickerOptions);

        // Handle both single and multiple selection
        const selectedImages = Array.isArray(result) ? result : [result];

        // Now crop each selected image individually
        const croppedImages = [];
        for (const image of selectedImages) {
            try {
                const cropped = await ImagePicker.openCropper({
                    path: image.path,
                    width,
                    height,
                    freeStyleCropEnabled,
                    cropperCircleOverlay,
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
                    hideBottomControls: false,
                });

                croppedImages.push({
                    uri: cropped.path,
                    width: cropped.width,
                    height: cropped.height,
                    mime: cropped.mime,
                    size: cropped.size,
                });
            } catch (cropError) {
                if (cropError.code === 'E_PICKER_CANCELLED') {
                    console.log('User cancelled cropping for one image');
                    // Skip this image if user cancels cropping
                    continue;
                } else {
                    console.error('Error cropping image:', cropError);
                    // If cropping fails, use original image
                    croppedImages.push({
                        uri: image.path,
                        width: image.width,
                        height: image.height,
                        mime: image.mime,
                        size: image.size,
                    });
                }
            }
        }

        return croppedImages.length > 0 ? croppedImages : null;
    } catch (error) {
        if (error.code === 'E_PICKER_CANCELLED') {
            console.log('User cancelled image picker');
            return null;
        }
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
