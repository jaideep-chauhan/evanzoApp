import { useQuery } from '@tanstack/react-query';
import filterService from '../services/filterService';
import vendorService from '../services/vendorService';
import eventService from '../services/eventService';

/**
 * Hook for searching vendors with filters
 * Uses debouncing and smart caching
 */
export const useSearchVendors = (filters) => {
  return useQuery({
    queryKey: ['search-vendors', filters],
    queryFn: async () => {
      // If no filters, return empty
      if (!filters || Object.keys(filters).length === 0) {
        return [];
      }

      const response = await filterService.searchVendors(filters);
      if (!response.success) {
        throw new Error(response.message || 'Search failed');
      }

      // Filter approved and format
      const approvedVendors = response.data.filter(v => v.approval_status === 'approved');
      return approvedVendors.map(v => vendorService.formatVendorForDisplay(v));
    },
    enabled: !!filters && Object.keys(filters).length > 0,
    staleTime: 2 * 60 * 1000, // Cache search results for 2 minutes
    // Keep previous data while fetching new results (smooth UX)
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Hook for searching events with filters
 */
export const useSearchEvents = (filters) => {
  return useQuery({
    queryKey: ['search-events', filters],
    queryFn: async () => {
      if (!filters || Object.keys(filters).length === 0) {
        return [];
      }

      const response = await eventService.searchEventAds(filters);
      if (!response.success) {
        throw new Error(response.message || 'Search failed');
      }

      const approvedEvents = response.data.filter(e => e.approval_status === 'approved');
      return approvedEvents.map(e => eventService.formatEventForDisplay(e));
    },
    enabled: !!filters && Object.keys(filters).length > 0,
    staleTime: 2 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Hook for autocomplete suggestions
 */
export const useSearchSuggestions = (query, type = 'vendors') => {
  return useQuery({
    queryKey: ['search-suggestions', type, query],
    queryFn: async () => {
      if (!query || query.length < 2) {
        return [];
      }

      // Get suggestions based on type
      const response = await filterService.getSearchSuggestions(query, type);
      if (!response.success) {
        return [];
      }

      return response.data || [];
    },
    enabled: !!query && query.length >= 2,
    staleTime: 5 * 60 * 1000, // Cache suggestions for 5 minutes
  });
};

/**
 * Hook for recent searches (stored locally)
 */
export const useRecentSearches = (type = 'vendors') => {
  return useQuery({
    queryKey: ['recent-searches', type],
    queryFn: async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const key = `@recent_searches_${type}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          return [];
        }
      }
      return [];
    },
    staleTime: Infinity, // Local data doesn't expire
  });
};

/**
 * Hook for popular/trending searches
 */
export const useTrendingSearches = (type = 'vendors') => {
  return useQuery({
    queryKey: ['trending-searches', type],
    queryFn: async () => {
      const response = await filterService.getTrendingSearches(type);
      if (!response.success) {
        return [];
      }
      return response.data || [];
    },
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
  });
};

/**
 * USAGE EXAMPLES:
 *
 * // In SearchScreen
 * const [searchQuery, setSearchQuery] = useState('');
 * const [filters, setFilters] = useState({});
 *
 * // Search with filters
 * const { data: vendors, isLoading } = useSearchVendors({
 *   keyword: searchQuery,
 *   location: selectedLocation,
 *   category: selectedCategory,
 * });
 *
 * // Autocomplete suggestions
 * const { data: suggestions } = useSearchSuggestions(searchQuery, 'vendors');
 *
 * // Recent searches
 * const { data: recentSearches } = useRecentSearches('vendors');
 *
 * // Trending
 * const { data: trending } = useTrendingSearches('vendors');
 *
 * BENEFITS:
 * ✅ Automatic caching of search results
 * ✅ Smart debouncing (queryKey changes trigger new search)
 * ✅ Previous data shown while loading (smooth UX)
 * ✅ Suggestions cached for instant display
 * ✅ Recent searches persisted locally
 *
 * TIP: Combine with debounce for search input:
 * const debouncedQuery = useDebounce(searchQuery, 500);
 * const { data } = useSearchVendors({ keyword: debouncedQuery });
 */
