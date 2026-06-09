/**
 * Image Compression Utility
 * Uses react-native-compressor for efficient image compression before upload
 * Significantly reduces upload time (70-80% reduction)
 */

import { Image as ImageCompressor } from 'react-native-compressor';

/**
 * Compress a single image
 * @param {string} imageUri - URI of the image to compress
 * @param {object} options - Compression options
 * @param {number} options.quality - Quality 0-1 (default: 0.7)
 * @param {number} options.maxWidth - Max width (default: 1920)
 * @param {number} options.maxHeight - Max height (default: 1920)
 * @returns {Promise<string>} - Compressed image URI
 */
export const compressImage = async (imageUri, options = {}) => {
    const {
        quality = 0.7,
        maxWidth = 1920,
        maxHeight = 1920,
    } = options;

    try {
        const result = await ImageCompressor.compress(imageUri, {
            // 'manual' forces the library to honour our quality/dimensions every time.
            // 'auto' skips re-encoding when it thinks the image is "fine", which can leave
            // a 4MB photo from the camera untouched.
            compressionMethod: 'manual',
            // Always emit JPEG so HEIC/PNG also shrink.
            output: 'jpg',
            maxWidth,
            maxHeight,
            quality,
        });
        return result;
    } catch (error) {
        return imageUri;
    }
};

/**
 * Compress multiple images in parallel
 * @param {Array} images - Array of image objects with uri property
 * @param {object} options - Compression options
 * @param {Function} onProgress - Callback for progress updates (0-100 or object with details)
 * @returns {Promise<Array>} - Array of image objects with compressed URIs
 */
export const compressImages = async (images, options = {}, onProgress = null) => {
    if (!images || images.length === 0) {
        return images;
    }

    let completed = 0;

    const compressed = await Promise.all(
        images.map(async (image) => {
            try {
                const compressedUri = await compressImage(image.uri, options);
                completed++;
                if (onProgress) {
                    onProgress(Math.round((completed / images.length) * 100));
                }
                return { ...image, uri: compressedUri, originalUri: image.uri };
            } catch (error) {
                completed++;
                if (onProgress) {
                    onProgress(Math.round((completed / images.length) * 100));
                }
                return image;
            }
        })
    );

    return compressed;
};

/**
 * Compress multiple images in chunks to reduce memory pressure
 * Better for large batches (10+ images) on memory-constrained devices
 *
 * @param {Array} images - Array of image objects with uri property
 * @param {object} options - Compression options
 * @param {Function} onProgress - Callback with { completed, total, percent } object
 * @param {number} chunkSize - Number of images to process concurrently (default: 3)
 * @returns {Promise<Array>} - Array of image objects with compressed URIs
 */
export const compressImagesChunked = async (images, options = {}, onProgress = null, chunkSize = 3) => {
    if (!images || images.length === 0) {
        return images;
    }

    const results = [];
    let totalCompleted = 0;

    // Process images in chunks to reduce memory pressure
    for (let i = 0; i < images.length; i += chunkSize) {
        const chunk = images.slice(i, i + chunkSize);

        const compressedChunk = await Promise.all(
            chunk.map(async (image) => {
                try {
                    const compressedUri = await compressImage(image.uri, options);
                    totalCompleted++;

                    if (onProgress) {
                        onProgress({
                            completed: totalCompleted,
                            total: images.length,
                            percent: Math.round((totalCompleted / images.length) * 100),
                        });
                    }

                    return { ...image, uri: compressedUri, originalUri: image.uri };
                } catch (error) {
                    totalCompleted++;

                    if (onProgress) {
                        onProgress({
                            completed: totalCompleted,
                            total: images.length,
                            percent: Math.round((totalCompleted / images.length) * 100),
                        });
                    }

                    return image; // Return original on failure
                }
            })
        );

        results.push(...compressedChunk);

        // Small delay between chunks to allow GC to run
        if (i + chunkSize < images.length) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    return results;
};

/**
 * Compression presets for different use cases
 */
// Tuned for WhatsApp-like file sizes (~150-400 KB per photo, max ~1 MB)
// so uploads are fast and detail pages render quickly.
export const COMPRESSION_PRESETS = {
    // Vendor / event ad photos — should look sharp on a phone but not bloated
    AD_PHOTOS: {
        quality: 0.6,
        maxWidth: 1280,
        maxHeight: 1280,
    },
    // Chat images — slightly smaller, since they're displayed in-line
    CHAT: {
        quality: 0.55,
        maxWidth: 1080,
        maxHeight: 1080,
    },
    // Profile picture — small but high quality (it's circular, often tiny on screen)
    PROFILE: {
        quality: 0.75,
        maxWidth: 600,
        maxHeight: 600,
    },
    // Thumbnails — heavily compressed
    THUMBNAIL: {
        quality: 0.45,
        maxWidth: 400,
        maxHeight: 400,
    },
};

export default {
    compressImage,
    compressImages,
    compressImagesChunked,
    COMPRESSION_PRESETS,
};
