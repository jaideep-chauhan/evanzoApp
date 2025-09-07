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
        const token = await AsyncStorage.getItem('accessToken');
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
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = await AsyncStorage.getItem('refreshToken');
                if (!refreshToken) {
                    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
                    return Promise.reject(error);
                }
                
                const response = await axios.post(`${BASE_URL}/auth/refresh-tokens`, {
                    refreshToken: refreshToken
                });
                
                const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;
                
                await AsyncStorage.setItem('accessToken', accessToken);
                await AsyncStorage.setItem('refreshToken', newRefreshToken);
                
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                
                return api(originalRequest);
            } catch (refreshError) {
                await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;