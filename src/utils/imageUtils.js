import { Platform } from 'react-native';

// Get machine IP dynamically - you might want to update this with your actual IP
const MACHINE_IP = '10.169.115.131'; // Your machine's IP address

/**
 * Fix localhost URLs for mobile simulators/devices
 * @param {string} url - The image URL to fix
 * @returns {string} - Fixed URL that works on mobile devices
 */
export const fixImageUrl = (url) => {
    if (typeof url !== 'string') {
        return url;
    }
    
    // Replace localhost with appropriate IP for each platform
    if (url.includes('localhost:3000')) {
        if (Platform.OS === 'ios') {
            return url.replace('localhost:3000', `${MACHINE_IP}:3000`);
        }
        if (Platform.OS === 'android') {
            return url.replace('localhost:3000', '10.0.2.2:3000');
        }
    }
    
    return url;
};

/**
 * Process an array of image URLs
 * @param {Array} imageArray - Array of image URLs
 * @returns {Array} - Array of fixed image URLs
 */
export const fixImageArray = (imageArray) => {
    if (!Array.isArray(imageArray)) {
        return imageArray;
    }
    
    return imageArray.map(fixImageUrl);
};

/**
 * Append an on-the-fly resize query to a backend `/uploads` image URL so the
 * server (sharp middleware) returns a smaller thumbnail instead of the full-
 * resolution original — large originals drop ~60-94% in bytes and ~10x in
 * decode pixels, which is the main scroll-jank cost in image lists.
 *
 * No-op for non-/uploads URLs (avatars from other hosts, data URIs, local
 * require()s) and URLs that already request a width, so it's always safe to
 * wrap a source uri. Backward compatible: a backend without the resize
 * middleware just ignores the query and serves the original.
 *
 * @param {string} url - image URL
 * @param {number} width - target max width px (default 600 for cards; ~150 for avatars)
 * @param {number} quality - JPEG quality 30-95 (default 70)
 * @returns {string}
 */
export const thumbnailUrl = (url, width = 600, quality = 70) => {
    if (typeof url !== 'string' || !url.includes('/uploads/')) {
        return url;
    }
    if (/[?&]w=/.test(url)) {
        return url; // already sized
    }
    return `${url}${url.includes('?') ? '&' : '?'}w=${width}&q=${quality}`;
};

/**
 * Get image source object for React Native Image component
 * @param {string|number|object} image - Image source (URL, require(), or object)
 * @param {any} fallback - Fallback image if source is invalid
 * @returns {object|number} - Valid image source for React Native
 */
export const getImageSource = (image, fallback = null) => {
    if (!image) {
        return fallback;
    }
    
    // If it's a number (require() result), return as is
    if (typeof image === 'number') {
        return image;
    }
    
    // If it's already an object with uri, fix the uri if needed
    if (typeof image === 'object' && image.uri) {
        return {
            ...image,
            uri: fixImageUrl(image.uri)
        };
    }
    
    // If it's a string URL, fix it and return as uri object
    if (typeof image === 'string') {
        const fixedUrl = fixImageUrl(image);
        if (fixedUrl.startsWith('http') || fixedUrl.startsWith('https') || fixedUrl.startsWith('file://')) {
            return { uri: fixedUrl };
        }
    }
    
    // Return fallback if nothing matches
    return fallback;
};

/**
 * Get the base URL for API requests (matches the pattern used in api.js)
 * @returns {string} - Base URL for API requests
 */
export const getApiBaseUrl = () => {
    return Platform.select({
        ios: `http://${MACHINE_IP}:3000`,
        android: 'http://10.0.2.2:3000',
        default: 'http://localhost:3000'
    });
};

/**
 * Check if an image URL is valid
 * @param {string} url - Image URL to validate
 * @returns {boolean} - True if URL appears valid
 */
export const isValidImageUrl = (url) => {
    if (typeof url !== 'string') {
        return false;
    }
    
    return url.startsWith('http') || url.startsWith('https') || url.startsWith('file://') || url.startsWith('data:');
};

export default {
    fixImageUrl,
    fixImageArray,
    getImageSource,
    thumbnailUrl,
    getApiBaseUrl,
    isValidImageUrl
};