import { useInfiniteQuery } from '@tanstack/react-query';
import vendorService from '../services/vendorService';

/**
 * React Query hook for vendors with infinite scroll
 *
 * This replaces:
 * - Manual pagination state (currentPage, hasMoreData, loadingMore)
 * - Manual caching logic (adsCacheService)
 * - Manual loading states (isLoading, isFetchingVendors)
 * - loadMoreVendors function
 *
 * React Query handles ALL of this automatically!
 */
export const useVendors = (filters = {}) => {
  const PAGE_SIZE = 5;

  return useInfiniteQuery({
    // Unique key for this query (includes filters for cache separation)
    queryKey: ['vendors', filters],

    // Fetch function - gets called automatically
    queryFn: async ({ pageParam = 1 }) => {
      const response = await vendorService.getPublicVendorAds({
        ...filters,
        page: pageParam,
        limit: PAGE_SIZE,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch vendors');
      }

      // Filter and format vendors
      const approvedVendors = response.data.filter(v => v.approval_status === 'approved');
      const formattedVendors = approvedVendors.map(v => vendorService.formatVendorForDisplay(v));

      return {
        vendors: formattedVendors,
        nextPage: formattedVendors.length === PAGE_SIZE ? pageParam + 1 : undefined,
      };
    },

    // Get next page parameter
    getNextPageParam: (lastPage) => lastPage.nextPage,

    // Get previous page parameter (for reverse scrolling)
    getPreviousPageParam: (firstPage, pages) => {
      return pages.length > 1 ? pages.length - 1 : undefined;
    },

    // Optimization options
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};

/**
 * USAGE EXAMPLE in Vendors screen:
 *
 * const {
 *   data,              // All pages of data
 *   fetchNextPage,     // Function to load more
 *   hasNextPage,       // Boolean: more data available?
 *   isFetchingNextPage,// Loading next page?
 *   isLoading,         // Initial loading?
 *   isError,           // Error state?
 *   error,             // Error object
 *   refetch,           // Manual refetch function
 * } = useVendors(currentFilters);
 *
 * // Flatten all pages into single array
 * const vendors = data?.pages.flatMap(page => page.vendors) ?? [];
 *
 * // In FlatList
 * <FlatList
 *   data={vendors}
 *   onEndReached={() => {
 *     if (hasNextPage && !isFetchingNextPage) {
 *       fetchNextPage();
 *     }
 *   }}
 *   ListFooterComponent={() => isFetchingNextPage ? <LoadingFooter /> : null}
 * />
 *
 * BENEFITS:
 * ✅ Automatic caching (no need for adsCacheService)
 * ✅ Automatic loading states (no useState for isLoading, loadingMore)
 * ✅ Automatic pagination (no useState for currentPage, hasMoreData)
 * ✅ Automatic refetching (on reconnect, focus, etc)
 * ✅ Optimistic updates
 * ✅ Cache invalidation
 * ✅ Parallel requests
 * ✅ Request deduplication
 * ✅ Background refetching
 *
 * CODE REDUCTION:
 * - Remove ~100 lines of pagination logic
 * - Remove ~50 lines of caching logic
 * - Remove ~30 lines of loading state management
 * = ~180 lines of code removed per screen! 🎉
 */
