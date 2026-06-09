import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import notificationService from '../services/notificationService';

/**
 * Hook for notification inbox with infinite scroll
 */
export const useNotifications = (userId) => {
  const PAGE_SIZE = 10;

  return useInfiniteQuery({
    queryKey: ['notifications', userId],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await notificationService.getNotifications({
        page: pageParam,
        limit: PAGE_SIZE,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch notifications');
      }

      return {
        notifications: response.data,
        nextPage: response.data.length === PAGE_SIZE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Auto-refetch every minute
  });
};

/**
 * Hook for unread notification count with frequent updates
 */
export const useUnreadNotificationCount = (userId) => {
  return useQuery({
    queryKey: ['notifications-unread-count', userId],
    queryFn: async () => {
      const response = await notificationService.getUnreadCount();
      if (!response.success) {
        return 0;
      }
      return response.data.count || 0;
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Update every 30 seconds
  });
};

/**
 * Hook for marking notification as read
 */
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId) => {
      const response = await notificationService.markAsRead(notificationId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to mark as read');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate to update UI
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
};

/**
 * Hook for marking all notifications as read
 */
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await notificationService.markAllAsRead();
      if (!response.success) {
        throw new Error(response.message || 'Failed to mark all as read');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
};

/**
 * Hook for notification preferences
 */
export const useNotificationPreferences = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await notificationService.getNotificationPreferences();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch preferences');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updatePreferences = useMutation({
    mutationFn: async (preferences) => {
      const response = await notificationService.updateNotificationPreferences(preferences);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update preferences');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    updatePreferences: updatePreferences.mutate,
    isUpdating: updatePreferences.isPending,
  };
};

/**
 * USAGE EXAMPLE:
 *
 * // Notification Inbox
 * const { data, fetchNextPage, hasNextPage } = useNotifications(userId);
 * const notifications = data?.pages.flatMap(page => page.notifications) ?? [];
 *
 * // Unread count badge
 * const { data: unreadCount } = useUnreadNotificationCount(userId);
 *
 * // Mark as read
 * const markRead = useMarkNotificationRead();
 * markRead.mutate(notificationId);
 *
 * // Notification settings
 * const { preferences, updatePreferences } = useNotificationPreferences();
 * updatePreferences({ push: true, email: false });
 *
 * BENEFITS:
 * ✅ Real-time unread count
 * ✅ Auto-refresh notifications
 * ✅ Optimistic updates
 * ✅ Infinite scroll
 */
