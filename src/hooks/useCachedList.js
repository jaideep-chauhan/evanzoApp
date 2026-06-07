import { useState, useEffect, useRef, useCallback } from 'react';
import { getCached, setCached } from '../services/listCacheService';

/**
 * Stale-while-revalidate hook for list screens.
 *
 *   const { data, isLoading, isRefreshing, refresh } =
 *       useCachedList('vendors:public', () => vendorService.getPublicVendorAds());
 *
 * Behavior:
 *   1. On mount the AsyncStorage cache for `key` is read. If present, `data`
 *      is populated synchronously-ish (first paint shows cached data, no
 *      spinner). `isLoading` flips false the moment cache is read.
 *   2. The fetcher runs in the background. On success, `data` is replaced and
 *      the cache is overwritten.
 *   3. `refresh()` (pull-to-refresh) sets `isRefreshing` true and re-runs the
 *      fetcher; `isLoading` stays false because we already have data.
 *
 * isLoading is true ONLY when there's no cached data AND no fresh data yet —
 * that's the only moment a skeleton should be shown. Tab switches that have
 * cached data go straight to the rendered list with no spinner / skeleton.
 *
 * The fetcher should return `{ success: true, data: [...] }` (the existing
 * service shape) so we can persist the array.
 */
export default function useCachedList(key, fetcher, { enabled = true } = {}) {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const mountedRef = useRef(true);
    const inFlightRef = useRef(false);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const runFetcher = useCallback(async () => {
        if (inFlightRef.current) return;
        inFlightRef.current = true;
        try {
            const result = await fetcher();
            if (!mountedRef.current) return;
            if (result?.success && Array.isArray(result.data)) {
                setData(result.data);
                setError(null);
                setCached(key, result.data);
            } else if (result?.success && result.data) {
                // For shapes like { results: [...] } — pass through unchanged.
                setData(result.data);
                setError(null);
                setCached(key, result.data);
            } else {
                setError(result?.message || 'Failed to load');
            }
        } catch (e) {
            if (mountedRef.current) setError(e.message);
        } finally {
            inFlightRef.current = false;
            if (mountedRef.current) {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        }
    }, [key, fetcher]);

    // Mount: read cache, then fire the background fetch.
    useEffect(() => {
        if (!enabled) {
            setIsLoading(false);
            return;
        }
        let cancelled = false;
        (async () => {
            const cached = await getCached(key);
            if (cancelled) return;
            if (cached) {
                setData(cached);
                setIsLoading(false); // we have something to render
            }
            runFetcher();
        })();
        return () => { cancelled = true; };
    }, [key, enabled, runFetcher]);

    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        await runFetcher();
    }, [runFetcher]);

    return {
        data,
        isLoading: isLoading && !data,
        isRefreshing,
        error,
        refresh,
        setData, // exposed so screens that need optimistic updates (delete, etc.) can poke the cache
    };
}
