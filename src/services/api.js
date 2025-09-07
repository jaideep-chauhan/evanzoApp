import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BASE_URL = Platform.select({
    ios: 'http://localhost:3000/api',
    android: 'http://10.0.2.2:3000/api',
});

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'X-Client-Type': 'mobile',
    },
});

api.interceptors.request.use(
    async (config) => {
        console.log('🌐 API Request:', config.method?.toUpperCase(), config.url);
        console.log('🌐 Request data:', config.data);
        
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('🔑 Token added to request');
        }
        return config;
    },
    (error) => {
        console.error('🌐 Request error:', error);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        console.log('✅ API Response:', response.config.url, response.status);
        return response;
    },
    async (error) => {
        console.error('❌ API Error:', error.config?.url, error.response?.status);
        console.error('❌ Error details:', error.response?.data);
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = await AsyncStorage.getItem('refreshToken');
                if (!refreshToken) {
                    await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'userData']);
                    return Promise.reject(error);
                }
                
                const response = await axios.post(`${BASE_URL}/auth/refresh-tokens`, {
                    refreshToken: refreshToken
                });
                
                const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;
                
                await AsyncStorage.setItem('authToken', accessToken);
                await AsyncStorage.setItem('refreshToken', newRefreshToken);
                
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                
                return api(originalRequest);
            } catch (refreshError) {
                await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'userData']);
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;