import { useState, useRef, useCallback } from 'react';
import eventService from '../../services/eventService';
import adsCacheService from '../../services/adsCacheService';

const PAGE_SIZE = 5;

/**
 * Hook for event ad fetching, pagination, and caching.
 */
export default function useEventFetch() {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [networkError, setNetworkError] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMoreData, setHasMoreData] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, totalPages: 1, totalResults: 0 });

    // Tracks the latest fetch so a slow earlier request can't overwrite a newer one
    const latestRequestIdRef = useRef(0);

    const fetchEvents = async (filters = {}, resetResults = false, clearAllFilters = false, currentFilters = {}) => {
        const requestId = ++latestRequestIdRef.current;

        try {
            setIsFetching(true);
            setNetworkError(false);

            if (resetResults) {
                const cached = await adsCacheService.getCachedEventAds();
                if (cached && cached.length > 0) {
                    setEvents(cached);
                } else {
                    setIsLoading(true);
                }
                setCurrentPage(1);
                setHasMoreData(true);
            }

            const searchFilters = clearAllFilters
                ? { page: 1, limit: PAGE_SIZE }
                : { ...currentFilters, ...filters, page: resetResults ? 1 : (filters.page || 1), limit: PAGE_SIZE };

            let response;
            const hasFilters = Object.keys(searchFilters).some(k => k !== 'page' && k !== 'limit' && searchFilters[k]);

            if (!hasFilters) {
                response = await eventService.getPublicEventAds();
                if (response.success && response.data) {
                    const approved = response.data.filter(e => e.approval_status === 'approved');
                    response = {
                        success: true,
                        data: approved.map(e => eventService.formatEventForDisplay(e)),
                        pagination: { page: 1, limit: 10, totalPages: 1, totalResults: approved.length }
                    };
                }
            } else {
                try {
                    response = await eventService.searchEventAds({
                        keyword: searchFilters.keyword,
                        location: searchFilters.location,
                        eventType: searchFilters.category,
                        dateFrom: searchFilters.dateFrom,
                        dateTo: searchFilters.dateTo,
                        page: searchFilters.page,
                        limit: searchFilters.limit
                    });
                    if (response.success && response.data) {
                        const approved = response.data.filter(e => e.approval_status === 'approved');
                        response = {
                            success: true,
                            data: approved.map(e => eventService.formatEventForDisplay(e)),
                            pagination: response.pagination || { page: 1, limit: 10, totalPages: 1, totalResults: approved.length }
                        };
                    }
                } catch {
                    // Fallback: client-side filtering
                    const allRes = await eventService.getPublicEventAds();
                    if (allRes.success && allRes.data) {
                        let filtered = allRes.data.filter(e => e.approval_status === 'approved');
                        if (searchFilters.keyword) {
                            const kw = searchFilters.keyword.toLowerCase();
                            filtered = filtered.filter(e =>
                                e.title?.toLowerCase().includes(kw) || e.description?.toLowerCase().includes(kw) ||
                                e.location?.toLowerCase().includes(kw) || e.event_type?.toLowerCase().includes(kw)
                            );
                        }
                        if (searchFilters.location) {
                            filtered = filtered.filter(e => e.location?.includes(searchFilters.location));
                        }
                        if (searchFilters.dateFrom && searchFilters.dateTo) {
                            const start = new Date(searchFilters.dateFrom);
                            const end = new Date(searchFilters.dateTo);
                            end.setHours(23, 59, 59, 999);
                            filtered = filtered.filter(e => {
                                if (!e.date) return false;
                                try { const d = new Date(e.date); return d >= start && d <= end; } catch { return false; }
                            });
                        }
                        response = {
                            success: true,
                            data: filtered.map(e => eventService.formatEventForDisplay(e)),
                            pagination: { page: 1, limit: 10, totalPages: 1, totalResults: filtered.length }
                        };
                    } else {
                        response = allRes;
                    }
                }
            }

            // Discard stale responses — only the latest fetch may update state
            if (requestId !== latestRequestIdRef.current) {
                return;
            }

            if (response.success) {
                const newData = response.data || [];
                if (resetResults) {
                    setEvents(newData);
                    await adsCacheService.setCachedEventAds(newData);
                } else {
                    setEvents(prev => {
                        const ids = new Set(prev.map(e => e._original?.event_ad_id || e.id));
                        return [...prev, ...newData.filter(e => !ids.has(e._original?.event_ad_id || e.id))];
                    });
                }
                setPagination(response.pagination || { page: 1, limit: 10, totalPages: 1, totalResults: 0 });
                setHasMoreData(newData.length >= 10);
            } else {
                if (resetResults) setEvents([]);
                setNetworkError(true);
            }
        } catch (error) {
            if (requestId !== latestRequestIdRef.current) return;
            console.error('[Events] Fetch error:', error.message);
            setNetworkError(true);
            if (resetResults) setEvents([]);
        } finally {
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
            const hasFilters = Object.keys(currentFilters).some(k => k !== 'page' && k !== 'limit' && currentFilters[k]);
            let response;

            if (!hasFilters) {
                response = await eventService.getPublicEventAds({ page: nextPage, limit: PAGE_SIZE });
                if (response.success && response.data) {
                    const approved = response.data.filter(e => e.approval_status === 'approved');
                    response.data = approved.map(e => eventService.formatEventForDisplay(e));
                }
            } else {
                response = await eventService.searchEventAds({ ...currentFilters, page: nextPage, limit: 10 });
                if (response.success && response.data) {
                    const approved = response.data.filter(e => e.approval_status === 'approved');
                    response.data = approved.map(e => eventService.formatEventForDisplay(e));
                }
            }

            if (response.success && response.data) {
                setEvents(prev => {
                    const ids = new Set(prev.map(e => e._original?.event_ad_id || e.id));
                    const unique = response.data.filter(e => !ids.has(e._original?.event_ad_id || e.id));
                    adsCacheService.appendEventAds(unique);
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
        await fetchEvents(currentFilters, true);
        setRefreshing(false);
    }, []);

    return {
        events, setEvents,
        isLoading, setIsLoading, isFetching, networkError, refreshing,
        loadingMore, hasMoreData, currentPage, pagination,
        fetchEvents, loadMore, onRefresh,
        setNetworkError,
        PAGE_SIZE,
    };
}
