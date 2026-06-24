import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { secureStorage } from '../utils/secureStorage';

// Production URL - LIVE SERVER (ACTIVE)
const BASE_URL = 'https://api.evnzo.com/api';

// Local development URL - (commented out)
// Note: iOS Simulator can use 'localhost' or your Mac's IP address
// Android emulator must use 10.0.2.2 for host machine
// const BASE_URL = Platform.select({
//     ios: 'http://localhost:3000/api', // iOS Simulator/Device - use localhost
//     android: 'http://10.0.2.2:3000/api', // Android emulator uses 10.0.2.2 for host machine
// });

// Log the active configuration on startup
console.log('🌐 API Configuration:', {
    platform: Platform.OS,
    baseURL: BASE_URL,
    environment: BASE_URL.includes('localhost') || BASE_URL.includes('10.0.2.2') ? 'LOCALHOST' : 'PRODUCTION'
});

export const API_BASE_URL = BASE_URL; // Export for socket service

// Host WITHOUT the "/api" suffix — for static assets the backend serves off
// the domain root (e.g. https://api.evnzo.com/uploads/...). Computed once here
// so callers never strip "/api" themselves; a naive `.replace('/api','')`
// matches the "/api" inside "https://api..." and corrupts the host.
export const MEDIA_BASE_URL = BASE_URL.replace(/\/api\/?$/, '');

// Pass-through URL fixer kept for compatibility with screens that grew up
// against an older dev setup where localhost ↔ machine-IP rewriting lived
// here. In production it's a no-op — the URL is already absolute.
export const fixLocalUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    return url;
};

// Track if we're currently refreshing token to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });

    failedQueue = [];
};

// Function to reset refresh state (useful for manual logout)
export const resetRefreshState = () => {
    isRefreshing = false;
    failedQueue = [];
};

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000, // Reduced timeout to fail faster on network issues
    headers: {
        'X-Client-Type': 'mobile',
    },
    // Add retry configuration
    validateStatus: function (status) {
        // Consider 2xx and 3xx as success, but 4xx and 5xx as errors
        // This ensures 401 errors are caught by the error interceptor
        return status >= 200 && status < 400;
    }
});

api.interceptors.request.use(
    async (config) => {

        // Check if the data is FormData
        if (config.data instanceof FormData) {
            // For FormData, let axios set the Content-Type with boundary
            // Remove any preset Content-Type to allow multipart/form-data with boundary
            delete config.headers['Content-Type'];

            // Increase timeout for file uploads (images, documents, etc.)
            // Large files need more time to upload, especially on slower connections
            config.timeout = 60000; // 60 seconds for file uploads
        } else {
            // For regular JSON data, set Content-Type to application/json
            config.headers['Content-Type'] = 'application/json';
        }

        const token = await secureStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Check if this is a 401 error and we haven't already tried to refresh for this request
        if (error.response?.status === 401 && !originalRequest._retry) {

            // Check if this is an authentication error
            const errorMessage = error.response?.data?.message || '';

            const isAuthError = errorMessage.includes('expired') ||
                errorMessage.includes('authenticate') ||
                errorMessage.includes('jwt expired') ||
                errorMessage.includes('Please authenticate') ||
                errorMessage === 'Please authenticate' ||
                error.response?.status === 401;


            if (isAuthError) {
                // If we're already refreshing, queue this request
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    }).then(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    }).catch(err => {
                        return Promise.reject(err);
                    });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    const refreshToken = await secureStorage.getItem('refreshToken');

                    if (!refreshToken) {
                        processQueue(error, null);
                        isRefreshing = false;

                        // Don't force-navigate to Login. Guests routinely hit
                        // auth-required endpoints at startup (FCM token
                        // register, notification inbox prefetch, etc.) and
                        // yanking them to Login would break the guest-mode
                        // browsing flow. Just signal the caller via
                        // shouldLogout — the in-app LoginPrompt component
                        // catches users when they explicitly tap a feature
                        // that requires auth.
                        return Promise.reject({
                            ...error,
                            shouldLogout: true,
                            message: 'Session expired. Please login again.'
                        });
                    }

                    const response = await axios.post(`${BASE_URL}/auth/refresh-tokens`, {
                        refreshToken: refreshToken
                    }, {
                        headers: {
                            'X-Client-Type': 'mobile',
                            'Content-Type': 'application/json'
                        }
                    });

                    const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;

                    await secureStorage.setItem('authToken', accessToken);
                    if (newRefreshToken) {
                        await secureStorage.setItem('refreshToken', newRefreshToken);
                    }

                    // Update the authorization header for all pending requests
                    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                    // Process the queue with the new token
                    processQueue(null, accessToken);
                    isRefreshing = false;

                    return api(originalRequest);

                } catch (refreshError) {

                    // Process queue with error and reset state
                    processQueue(refreshError, null);
                    isRefreshing = false;

                    // Same as the no-refresh-token branch: don't yank the
                    // user to Login. Refresh failed → they're effectively a
                    // guest now; let the LoginPrompt catch them on the next
                    // auth-required tap.
                    return Promise.reject({
                        ...refreshError,
                        shouldLogout: true,
                        message: 'Session expired. Please login again.'
                    });
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;