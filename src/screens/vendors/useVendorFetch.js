import { useState, useRef, useCallback } from 'react';
import vendorService from '../../services/vendorService';
import filterService from '../../services/filterService';
import adsCacheService from '../../services/adsCacheService';

const PAGE_SIZE = 5;

/**
 * Hook for vendor ad fetching, pagination, and caching.
 * Extracts all fetch logic from the vendors index screen.
 */
export default function useVendorFetch() {
    const [vendors, setVendors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [networkError, setNetworkError] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMoreData, setHasMoreData] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [retryAttempts, setRetryAttempts] = useState(0);
    const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, totalPages: 1, totalResults: 0 });
    const fetchTimeoutRef = useRef(null);
    // Each call increments this; when a response returns, we check it's still the latest
    // so a slow unfiltered fetch can't overwrite a fast filtered one.
    const latestRequestIdRef = useRef(0);

    const fetchVendors = async (filters = {}, resetResults = false, clearAllFilters = false, currentFilters = {}) => {
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);

        const requestId = ++latestRequestIdRef.current;

        try {
            setIsFetching(true);
            setNetworkError(false);

            const searchFilters = clearAllFilters
                ? { page: 1, limit: PAGE_SIZE }
                : {
                    ...currentFilters,
                    ...filters,
                    page: resetResults ? 1 : (filters.page || currentFilters.page || 1),
                    limit: PAGE_SIZE
                };

            const hasActiveFilters = Object.keys(searchFilters).some(
                key => key !== 'page' && key !== 'limit' && key !== 'sortBy' && searchFilters[key]
            );

            if (resetResults) {
                if (!hasActiveFilters) {
                    const cachedVendors = await adsCacheService.getCachedVendorAds();
                    if (cachedVendors && cachedVendors.length > 0) {
                        setVendors(cachedVendors);
                    } else {
                        setIsLoading(true);
                    }
                } else {
                    setVendors([]);
                    setIsLoading(true);
                }
                setCurrentPage(1);
                setHasMoreData(true);
            }

            let response;
            const hasFilters = Object.keys(searchFilters).some(
                key => key !== 'page' && key !== 'limit' && searchFilters[key]
            );

            if (!hasFilters) {
                response = await vendorService.getPublicVendorAds();
                if (response.success && response.data) {
                    const approved = response.data.filter(v => v.approval_status === 'approved');
                    response = {
                        success: true,
                        data: approved.map(v => vendorService.formatVendorForDisplay(v)),
                        pagination: { page: 1, limit: 10, totalPages: 1, totalResults: approved.length }
                    };
                }
            } else {
                console.log('[SEARCH][useVendorFetch] calling searchVendors with:', JSON.stringify(searchFilters));
                response = await filterService.searchVendors(searchFilters);
                console.log('[SEARCH][useVendorFetch] searchVendors returned: success=', response.success, 'data.length=', response.data?.length || 0);
                if (response.success && response.data) {
                    const beforeFilter = response.data.length;
                    const approved = response.data.filter(v => v.approval_status === 'approved');
                    console.log('[SEARCH][useVendorFetch] approved filter:', beforeFilter, '→', approved.length);
                    response.data = approved.map(v => vendorService.formatVendorForDisplay(v));
                }
            }

            // Discard stale responses — only the latest fetch may update state
            if (requestId !== latestRequestIdRef.current) {
                return;
            }

            if (response.success) {
                const newData = response.data || [];
                if (resetResults) {
                    setVendors(newData);
                    await adsCacheService.setCachedVendorAds(newData);
                } else {
                    setVendors(prev => {
                        const ids = new Set(prev.map(v => v._original?.vendor_ad_id || v.id));
                        return [...prev, ...newData.filter(v => !ids.has(v._original?.vendor_ad_id || v.id))];
                    });
                }
                setPagination(response.pagination || { page: 1, limit: 10, totalPages: 1, totalResults: 0 });
                setHasMoreData(newData.length >= 10);
                setRetryAttempts(0);
            } else {
                if (resetResults) setVendors([]);
                setNetworkError(true);
                setRetryAttempts(prev => prev + 1);
            }
        } catch (error) {
            if (requestId !== latestRequestIdRef.current) return;
            console.error('[Vendors] Fetch error:', error.message);
            setNetworkError(true);
            if (resetResults) setVendors([]);
            setRetryAttempts(prev => prev + 1);
        } finally {
            // Only flip these off when this IS the latest request — otherwise the latest
            // request is still loading and we don't want to clear its spinner.
            if (requestId === latestRequestIdRef.current) {
                setIsLoading(false);
                setIsFetching(false);
            }
        }
    };

    const loadMore = useCallback(async (currentFilters = {}) => {
        if (loadingMore || !hasMoreData || isFetching) return;

        setLoadingMore(true);
        const nextPage = currentPage + 1;

        try {
            const hasFilters = Object.keys(currentFilters).some(
                key => key !== 'page' && key !== 'limit' && currentFilters[key]
            );

            let response;
            if (!hasFilters) {
                response = await vendorService.getPublicVendorAds({ page: nextPage, limit: PAGE_SIZE });
                if (response.success && response.data) {
                    const approved = response.data.filter(v => v.approval_status === 'approved');
                    response.data = approved.map(v => vendorService.formatVendorForDisplay(v));
                }
            } else {
                response = await filterService.searchVendors({ ...currentFilters, page: nextPage, limit: 10 });
                if (response.success && response.data) {
                    const approved = response.data.filter(v => v.approval_status === 'approved');
                    response.data = approved.map(v => vendorService.formatVendorForDisplay(v));
                }
            }

            if (response.success && response.data) {
                setVendors(prev => {
                    const ids = new Set(prev.map(v => v._original?.vendor_ad_id || v.id));
                    const unique = response.data.filter(v => !ids.has(v._original?.vendor_ad_id || v.id));
                    adsCacheService.appendVendorAds(unique);
                    return [...prev, ...unique];
                });
                setCurrentPage(nextPage);
                setHasMoreData(response.data.length >= 10);
            } else {
                setHasMoreData(false);
            }
        } catch {
            setHasMoreData(false);
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, hasMoreData, isFetching, currentPage]);

    const onRefresh = useCallback(async (currentFilters = {}) => {
        setRefreshing(true);
        await fetchVendors(currentFilters, true);
        setRefreshing(false);
    }, []);

    return {
        vendors, setVendors,
        isLoading, isFetching, networkError, refreshing,
        loadingMore, hasMoreData, currentPage, retryAttempts,
        pagination,
        fetchVendors, loadMore, onRefresh,
        setIsLoading, setRetryAttempts, setNetworkError,
        PAGE_SIZE,
    };
}
