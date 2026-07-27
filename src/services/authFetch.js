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

// ─────────────────────────────────────────────────────────────────────────
// authUpload — multipart upload with REAL progress.
//
// fetch() can't report upload progress, so the ad-create screens showed a
// fake 10%→100% jump and sat "frozen" for the whole upload. This uses raw
// XMLHttpRequest (which is what RN's fetch is built on, so multipart/form-data
// boundaries are handled correctly by the native layer — the axios breakage
// noted above does NOT apply to raw XHR) and exposes upload.onprogress.
//
// Returns { ok, status, json, timeout?, networkError? }. onProgress(percent)
// is called with real 0–95 during byte transfer; the caller bumps to 100 once
// the server has responded (the last 5% covers server-side image processing).
// ─────────────────────────────────────────────────────────────────────────
const UPLOAD_TIMEOUT_MS = 180000; // 3 min ceiling so a stuck upload fails instead of hanging forever

const xhrUpload = (url, formData, token, onProgress) =>
    new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader('X-Client-Type', 'mobile');
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        // Deliberately DON'T set Content-Type — the native layer must inject
        // the multipart boundary itself. Setting it breaks the upload.
        xhr.timeout = UPLOAD_TIMEOUT_MS;

        if (onProgress && xhr.upload) {
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    // Cap at 95 while bytes stream; reserve 95→100 for the
                    // server finishing (sharp resize) after the body lands.
                    onProgress(Math.min(95, Math.round((e.loaded / e.total) * 95)));
                }
            };
        }

        xhr.onload = () => {
            let json = {};
            try { json = JSON.parse(xhr.responseText || '{}'); } catch (_) {}
            resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, json });
        };
        xhr.onerror = () => resolve({ ok: false, status: xhr.status || 0, json: {}, networkError: true });
        xhr.ontimeout = () => resolve({ ok: false, status: 0, json: {}, timeout: true });

        xhr.send(formData);
    });

export const authUpload = async (url, formData, { onProgress } = {}) => {
    const token = await secureStorage.getItem('authToken');

    let result = await xhrUpload(url, formData, token, onProgress);
    if (result.status !== 401 || !token) return result;

    // 401 → refresh once and retry (same policy as authFetch).
    let newAccess;
    try {
        newAccess = await startRefresh();
    } catch (refreshErr) {
        if (__DEV__) console.log('[authUpload] refresh failed:', refreshErr?.message);
        return result; // surface the original 401
    }
    return xhrUpload(url, formData, newAccess, onProgress);
};

export default authFetch;
