// authFetch — a thin native-fetch wrapper that injects the auth token and,
// on 401, transparently refreshes + retries the request ONCE.
//
// Used by the multipart upload paths (vendor ads, event ads, chat media,
// reviews) which can't go through the axios interceptor cleanly because
// axios XHR breaks multipart form-data on Android. Plain fetch handles
// multipart well; this wrapper just bolts the auth/refresh behavior on.
//
// Important: we DELIBERATELY don't pull in navigationService.logout() here.
// The earlier version did, and a stale-request 401 racing with a fresh
// login could wipe the new tokens. Here, if the refresh fails we just
// return the original 401 — the caller's error branch handles it.

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../utils/secureStorage';
import { API_BASE_URL } from './api';

// Shared in-flight refresh promise. If a refresh is already running,
// concurrent 401s on other uploads queue behind it and reuse the new token.
let refreshPromise = null;

const startRefresh = () => {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        const refreshToken = await secureStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(
            `${API_BASE_URL}/auth/refresh-tokens`,
            { refreshToken },
            {
                headers: {
                    'X-Client-Type': 'mobile',
                    'Content-Type': 'application/json',
                },
                timeout: 15000,
            },
        );

        const tokens = res?.data?.tokens || {};
        const newAccess = tokens.accessToken;
        const newRefresh = tokens.refreshToken;
        if (!newAccess) throw new Error('Refresh response missing accessToken');

        await secureStorage.setItem('authToken', newAccess);
        if (newRefresh) await secureStorage.setItem('refreshToken', newRefresh);
        return newAccess;
    })().finally(() => {
        // Clear so the next 401 can refresh again
        refreshPromise = null;
    });

    return refreshPromise;
};

const buildHeaders = (init, token) => {
    const headers = new Headers(init.headers || {});
    headers.set('X-Client-Type', headers.get('X-Client-Type') || 'mobile');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
};

/**
 * fetch-compatible wrapper.
 *
 *   const res = await authFetch(`${API_BASE_URL}/vendor_ad`, {
 *       method: 'POST',
 *       body: formData,
 *   });
 *
 * - Adds the Authorization + X-Client-Type headers automatically.
 * - On 401, attempts a single refresh + retry. If the refresh fails, the
 *   ORIGINAL 401 response is returned so the caller's error branch can
 *   surface "Session expired" / etc. We do not navigate or clear state.
 */
export const authFetch = async (url, init = {}) => {
    const token = await secureStorage.getItem('authToken');

    let res = await fetch(url, { ...init, headers: buildHeaders(init, token) });
    if (res.status !== 401) return res;

    // No token to begin with → nothing to refresh; just return the 401.
    if (!token) return res;

    let newAccess;
    try {
        newAccess = await startRefresh();
    } catch (refreshErr) {
        if (__DEV__) console.log('[authFetch] refresh failed:', refreshErr?.message);
        return res; // return original 401
    }

    return fetch(url, { ...init, headers: buildHeaders(init, newAccess) });
};

export default authFetch;
