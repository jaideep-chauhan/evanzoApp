import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { logout } from './navigationService';

const BASE_URL = Platform.select({
    ios: 'http://10.98.233.131:3000/api', // Your machine's IP for iOS Simulator
    android: 'http://10.0.2.2:3000/api',
});

export const API_BASE_URL = BASE_URL; // Export for socket service

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
        } else {
            // For regular JSON data, set Content-Type to application/json
            config.headers['Content-Type'] = 'application/json';
        }
        
        const token = await AsyncStorage.getItem('authToken');
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
                    const refreshToken = await AsyncStorage.getItem('refreshToken');
                    
                    if (!refreshToken) {
                        processQueue(error, null);
                        isRefreshing = false;
                        
                        // Force logout
                        setTimeout(async () => {
                            await logout();
                        }, 100);
                        
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
                    
                    await AsyncStorage.setItem('authToken', accessToken);
                    if (newRefreshToken) {
                        await AsyncStorage.setItem('refreshToken', newRefreshToken);
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
                    
                    // Force logout
                    setTimeout(async () => {
                        await logout();
                    }, 100);
                    
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