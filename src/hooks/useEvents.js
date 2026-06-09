import { useInfiniteQuery } from '@tanstack/react-query';
import eventService from '../services/eventService';

/**
 * React Query hook for events with infinite scroll
 * Same pattern as useVendors - consistent and reusable
 */
export const useEvents = (filters = {}) => {
  const PAGE_SIZE = 5;

  return useInfiniteQuery({
    queryKey: ['events', filters],

    queryFn: async ({ pageParam = 1 }) => {
      const response = await eventService.getPublicEventAds({
        ...filters,
        page: pageParam,
        limit: PAGE_SIZE,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch events');
      }

      // Filter and format events
      const approvedEvents = response.data.filter(e => e.approval_status === 'approved');
      const formattedEvents = approvedEvents.map(e => eventService.formatEventForDisplay(e));

      return {
        events: formattedEvents,
        nextPage: formattedEvents.length === PAGE_SIZE ? pageParam + 1 : undefined,
      };
    },

    getNextPageParam: (lastPage) => lastPage.nextPage,
    getPreviousPageParam: (firstPage, pages) => {
      return pages.length > 1 ? pages.length - 1 : undefined;
    },

    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * USAGE EXAMPLE:
 *
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useEvents(filters);
 * const events = data?.pages.flatMap(page => page.events) ?? [];
 */
