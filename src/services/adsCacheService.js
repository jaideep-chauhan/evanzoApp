import AsyncStorage from '@react-native-async-storage/async-storage';
import FastImage from 'react-native-fast-image';
import { API_BASE_URL } from './api';

/**
 * AdsCacheService - Caching service for Vendor and Event ads
 *
 * Features:
 * - Cache vendor/event lists for instant loading
 * - Cache detail data for instant detail page loading
 * - In-memory cache layer with 5-minute TTL
 * - Image prefetching for faster detail pages
 */
class AdsCacheService {
    // Storage keys
    VENDOR_LIST_KEY = '@evanzo_vendor_ads';
    EVENT_LIST_KEY = '@evanzo_event_ads';
    VENDOR_DETAIL_PREFIX = '@evanzo_vendor_detail_';
    EVENT_DETAIL_PREFIX = '@evanzo_event_detail_';
    VENDOR_FILTERS_KEY = '@evanzo_vendor_filters';
    EVENT_FILTERS_KEY = '@evanzo_event_filters';

    // Cache limits
    MAX_CACHED_ADS = 50;
    MAX_CACHED_DETAILS = 20;

    // In-memory cache with 5-minute TTL
    MEMORY_CACHE_TTL = 5 * 60 * 1000;
    memoryCache = {
        vendorList: null,
        eventList: null,
        vendorDetails: new Map(),
        eventDetails: new Map(),
    };
    memoryCacheTimestamps = new Map();

    // ==========================================
    // VENDOR ADS CACHING
    // ==========================================

    /**
     * Get cached vendor ads - instant loading
     */
    async getCachedVendorAds() {
        try {
            // Check memory cache first
            if (this.memoryCache.vendorList && this.isCacheValid('vendorList')) {
                return this.memoryCache.vendorList;
            }

            // Fall back to AsyncStorage
            const cached = await AsyncStorage.getItem(this.VENDOR_LIST_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                this.memoryCache.vendorList = parsed;
                this.memoryCacheTimestamps.set('vendorList', Date.now());
                return parsed;
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Save vendor ads to cache
     */
    async setCachedVendorAds(vendors) {
        try {
            if (!vendors || !Array.isArray(vendors)) return;

            // Limit to max cached ads
            const trimmedVendors = vendors.slice(0, this.MAX_CACHED_ADS);

            // Update memory cache
            this.memoryCache.vendorList = trimmedVendors;
            this.memoryCacheTimestamps.set('vendorList', Date.now());

            // Persist to AsyncStorage
            await AsyncStorage.setItem(this.VENDOR_LIST_KEY, JSON.stringify(trimmedVendors));
        } catch (error) {
        }
    }

    /**
     * Append more vendor ads (for pagination)
     */
    async appendVendorAds(newVendors) {
        try {
            if (!newVendors?.length) return;

            const existing = await this.getCachedVendorAds() || [];

            // Remove duplicates based on vendor_ad_id or id
            const existingIds = new Set(existing.map(v => v._original?.vendor_ad_id || v.id));
            const uniqueNew = newVendors.filter(v => !existingIds.has(v._original?.vendor_ad_id || v.id));

            const merged = [...existing, ...uniqueNew];
            await this.setCachedVendorAds(merged);

            return merged;
        } catch (error) {
            return null;
        }
    }

    // ==========================================
    // EVENT ADS CACHING
    // ==========================================

    /**
     * Get cached event ads - instant loading
     */
    async getCachedEventAds() {
        try {
            // Check memory cache first
            if (this.memoryCache.eventList && this.isCacheValid('eventList')) {
                return this.memoryCache.eventList;
            }

            // Fall back to AsyncStorage
            const cached = await AsyncStorage.getItem(this.EVENT_LIST_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                this.memoryCache.eventList = parsed;
                this.memoryCacheTimestamps.set('eventList', Date.now());
                return parsed;
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Save event ads to cache
     */
    async setCachedEventAds(events) {
        try {
            if (!events || !Array.isArray(events)) return;

            // Limit to max cached ads
            const trimmedEvents = events.slice(0, this.MAX_CACHED_ADS);

            // Update memory cache
            this.memoryCache.eventList = trimmedEvents;
            this.memoryCacheTimestamps.set('eventList', Date.now());

            // Persist to AsyncStorage
            await AsyncStorage.setItem(this.EVENT_LIST_KEY, JSON.stringify(trimmedEvents));
        } catch (error) {
        }
    }

    /**
     * Append more event ads (for pagination)
     */
    async appendEventAds(newEvents) {
        try {
            if (!newEvents?.length) return;

            const existing = await this.getCachedEventAds() || [];

            // Remove duplicates based on event_ad_id or id
            const existingIds = new Set(existing.map(e => e._original?.event_ad_id || e.id));
            const uniqueNew = newEvents.filter(e => !existingIds.has(e._original?.event_ad_id || e.id));

            const merged = [...existing, ...uniqueNew];
            await this.setCachedEventAds(merged);

            return merged;
        } catch (error) {
            return null;
        }
    }

    // ==========================================
    // DETAIL CACHING
    // ==========================================

    /**
     * Get cached vendor detail
     */
    async getCachedVendorDetail(vendorId) {
        try {
            if (!vendorId) return null;

            const cacheKey = `vendorDetail_${vendorId}`;

            // Check memory cache first
            if (this.memoryCache.vendorDetails.has(vendorId) && this.isCacheValid(cacheKey)) {
                return this.memoryCache.vendorDetails.get(vendorId);
            }

            // Fall back to AsyncStorage
            const storageKey = `${this.VENDOR_DETAIL_PREFIX}${vendorId}`;
            const cached = await AsyncStorage.getItem(storageKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                this.memoryCache.vendorDetails.set(vendorId, parsed);
                this.memoryCacheTimestamps.set(cacheKey, Date.now());
                return parsed;
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Save vendor detail to cache
     */
    async setCachedVendorDetail(vendorId, data) {
        try {
            if (!vendorId || !data) return;

            const cacheKey = `vendorDetail_${vendorId}`;
            const storageKey = `${this.VENDOR_DETAIL_PREFIX}${vendorId}`;

            // Update memory cache
            this.memoryCache.vendorDetails.set(vendorId, data);
            this.memoryCacheTimestamps.set(cacheKey, Date.now());

            // Limit cached details count
            if (this.memoryCache.vendorDetails.size > this.MAX_CACHED_DETAILS) {
                const firstKey = this.memoryCache.vendorDetails.keys().next().value;
                this.memoryCache.vendorDetails.delete(firstKey);
            }

            // Persist to AsyncStorage
            await AsyncStorage.setItem(storageKey, JSON.stringify(data));
        } catch (error) {
        }
    }

    /**
     * Get cached event detail
     */
    async getCachedEventDetail(eventId) {
        try {
            if (!eventId) return null;

            const cacheKey = `eventDetail_${eventId}`;

            // Check memory cache first
            if (this.memoryCache.eventDetails.has(eventId) && this.isCacheValid(cacheKey)) {
                return this.memoryCache.eventDetails.get(eventId);
            }

            // Fall back to AsyncStorage
            const storageKey = `${this.EVENT_DETAIL_PREFIX}${eventId}`;
            const cached = await AsyncStorage.getItem(storageKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                this.memoryCache.eventDetails.set(eventId, parsed);
                this.memoryCacheTimestamps.set(cacheKey, Date.now());
                return parsed;
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Save event detail to cache
     */
    async setCachedEventDetail(eventId, data) {
        try {
            if (!eventId || !data) return;

            const cacheKey = `eventDetail_${eventId}`;
            const storageKey = `${this.EVENT_DETAIL_PREFIX}${eventId}`;

            // Update memory cache
            this.memoryCache.eventDetails.set(eventId, data);
            this.memoryCacheTimestamps.set(cacheKey, Date.now());

            // Limit cached details count
            if (this.memoryCache.eventDetails.size > this.MAX_CACHED_DETAILS) {
                const firstKey = this.memoryCache.eventDetails.keys().next().value;
                this.memoryCache.eventDetails.delete(firstKey);
            }

            // Persist to AsyncStorage
            await AsyncStorage.setItem(storageKey, JSON.stringify(data));
        } catch (error) {
        }
    }

    // ==========================================
    // IMAGE PREFETCHING
    // ==========================================

    /**
     * Prefetch images for faster loading
     */
    prefetchImages(urls) {
        if (!urls || !Array.isArray(urls) || urls.length === 0) return;

        const validUrls = urls
            .filter(url => typeof url === 'string' && url.startsWith('http'))
            .map(url => ({ uri: url }));

        if (validUrls.length > 0) {
            FastImage.preload(validUrls);
        }
    }

    /**
     * Prefetch vendor images before navigation
     */
    prefetchVendorImages(vendor) {
        if (!vendor) return;

        const imageUrls = [];

        // Collect all possible image URLs
        if (vendor.images && Array.isArray(vendor.images)) {
            vendor.images.forEach(img => {
                if (typeof img === 'string') {
                    imageUrls.push(img);
                } else if (img?.url) {
                    imageUrls.push(img.url);
                }
            });
        }

        // Add avatar/logo if exists
        if (vendor.avatar) imageUrls.push(vendor.avatar);
        if (vendor.logo) imageUrls.push(vendor.logo);

        this.prefetchImages(imageUrls);
    }

    /**
     * Prefetch event images before navigation
     */
    prefetchEventImages(event) {
        if (!event) return;

        const imageUrls = [];

        // Collect all possible image URLs
        if (event.attachments && Array.isArray(event.attachments)) {
            event.attachments.forEach(att => {
                if (typeof att === 'string') {
                    imageUrls.push(att);
                } else if (att?.url) {
                    imageUrls.push(att.url);
                } else if (att?.path) {
                    imageUrls.push(`${API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL}${att.path}`);
                }
            });
        }

        if (event.images && Array.isArray(event.images)) {
            event.images.forEach(img => {
                if (typeof img === 'string') {
                    imageUrls.push(img);
                }
            });
        }

        // Add organizer avatar if exists
        if (event.organizer?.avatar) imageUrls.push(event.organizer.avatar);

        this.prefetchImages(imageUrls);
    }

    // ==========================================
    // CACHE MANAGEMENT
    // ==========================================

    /**
     * Check if memory cache is still valid
     */
    isCacheValid(key) {
        const timestamp = this.memoryCacheTimestamps.get(key);
        if (!timestamp) return false;
        return (Date.now() - timestamp) < this.MEMORY_CACHE_TTL;
    }

    /**
     * Invalidate cache by type
     */
    invalidateCache(type = 'all') {
        if (type === 'all' || type === 'vendorList') {
            this.memoryCache.vendorList = null;
            this.memoryCacheTimestamps.delete('vendorList');
        }
        if (type === 'all' || type === 'eventList') {
            this.memoryCache.eventList = null;
            this.memoryCacheTimestamps.delete('eventList');
        }
        if (type === 'all' || type === 'vendorDetails') {
            this.memoryCache.vendorDetails.clear();
            for (const key of this.memoryCacheTimestamps.keys()) {
                if (key.startsWith('vendorDetail_')) {
                    this.memoryCacheTimestamps.delete(key);
                }
            }
        }
        if (type === 'all' || type === 'eventDetails') {
            this.memoryCache.eventDetails.clear();
            for (const key of this.memoryCacheTimestamps.keys()) {
                if (key.startsWith('eventDetail_')) {
                    this.memoryCacheTimestamps.delete(key);
                }
            }
        }
    }

    /**
     * Clear all caches
     */
    async clearAllCache() {
        try {
            // Get all keys
            const keys = await AsyncStorage.getAllKeys();

            // Filter ads-related keys
            const adsKeys = keys.filter(key =>
                key === this.VENDOR_LIST_KEY ||
                key === this.EVENT_LIST_KEY ||
                key.startsWith(this.VENDOR_DETAIL_PREFIX) ||
                key.startsWith(this.EVENT_DETAIL_PREFIX)
            );

            if (adsKeys.length > 0) {
                await AsyncStorage.multiRemove(adsKeys);
            }

            // Clear memory cache
            this.memoryCache.vendorList = null;
            this.memoryCache.eventList = null;
            this.memoryCache.vendorDetails.clear();
            this.memoryCache.eventDetails.clear();
            this.memoryCacheTimestamps.clear();

        } catch (error) {
        }
    }

    /**
     * Get cache statistics (for debugging)
     */
    getCacheStats() {
        return {
            vendorListCached: !!this.memoryCache.vendorList,
            vendorListCount: this.memoryCache.vendorList?.length || 0,
            eventListCached: !!this.memoryCache.eventList,
            eventListCount: this.memoryCache.eventList?.length || 0,
            cachedVendorDetails: this.memoryCache.vendorDetails.size,
            cachedEventDetails: this.memoryCache.eventDetails.size,
        };
    }
}

// Singleton instance
const adsCacheService = new AdsCacheService();
export default adsCacheService;
