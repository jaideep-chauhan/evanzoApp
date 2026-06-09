/**
 * React Query Hooks for Evanzo App
 *
 * These hooks replace manual state management with automatic:
 * - Caching
 * - Loading states
 * - Error handling
 * - Pagination
 * - Refetching
 * - Optimistic updates
 * - Real-time sync
 */

// ==========================================
// VENDOR & EVENT HOOKS
// ==========================================
export { useVendors } from './useVendors';
export { useEvents } from './useEvents';

// ==========================================
// CHAT & MESSAGING HOOKS
// ==========================================
export {
  useChatList,
  useChatMessages,
  useSendMessage,
  useCreateChat,
} from './useChat';

// ==========================================
// NOTIFICATION HOOKS
// ==========================================
export {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useNotificationPreferences,
} from './useNotifications';

// ==========================================
// PROFILE & USER HOOKS
// ==========================================
export {
  useUserProfile,
  useUpdateProfile,
  useSavedVendors,
  useToggleSaveVendor,
  useUserReviews,
  useVendorReviews,
  useSubmitReview,
} from './useProfile';

// ==========================================
// SEARCH HOOKS
// ==========================================
export {
  useSearchVendors,
  useSearchEvents,
  useSearchSuggestions,
  useRecentSearches,
  useTrendingSearches,
} from './useSearch';

/**
 * QUICK START GUIDE:
 *
 * 1. INFINITE SCROLL (Vendors/Events):
 *    import { useVendors } from '../hooks';
 *    const { data, fetchNextPage, hasNextPage } = useVendors(filters);
 *    const vendors = data?.pages.flatMap(page => page.vendors) ?? [];
 *
 * 2. CHAT (Real-time):
 *    import { useChatList, useSendMessage } from '../hooks';
 *    const { data: chats } = useChatList(userId);
 *    const sendMessage = useSendMessage(chatId);
 *    sendMessage.mutate({ text: 'Hello!' }); // Instant UI update
 *
 * 3. NOTIFICATIONS (Auto-refresh):
 *    import { useNotifications, useUnreadNotificationCount } from '../hooks';
 *    const { data: notifications } = useNotifications(userId);
 *    const { data: unreadCount } = useUnreadNotificationCount(userId);
 *
 * 4. PROFILE (Optimistic updates):
 *    import { useUserProfile, useToggleSaveVendor } from '../hooks';
 *    const { data: profile } = useUserProfile(userId);
 *    const toggleSave = useToggleSaveVendor();
 *    toggleSave.mutate({ vendorId, isSaved }); // Instant feedback
 *
 * 5. SEARCH (Smart caching):
 *    import { useSearchVendors, useSearchSuggestions } from '../hooks';
 *    const { data: results } = useSearchVendors({ keyword: query });
 *    const { data: suggestions } = useSearchSuggestions(query);
 *
 * MIGRATION TIPS:
 * - Start with one screen (e.g., Vendors)
 * - Remove ~200 lines of manual state
 * - Replace with ~10 lines using hooks
 * - Test and repeat for other screens
 */
