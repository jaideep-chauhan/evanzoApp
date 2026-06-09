import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import chatService from '../services/chatService';

/**
 * Hook for chat list with real-time updates
 */
export const useChatList = (userId) => {
  return useQuery({
    queryKey: ['chats', userId],
    queryFn: async () => {
      const response = await chatService.getUserChats(userId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch chats');
      }
      return response.data;
    },
    enabled: !!userId, // Only run if userId exists
    staleTime: 30 * 1000, // Refetch every 30 seconds for real-time feel
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
  });
};

/**
 * Hook for individual chat messages with infinite scroll
 */
export const useChatMessages = (chatId) => {
  const PAGE_SIZE = 20;

  return useInfiniteQuery({
    queryKey: ['chat-messages', chatId],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await chatService.getChatMessages(chatId, {
        page: pageParam,
        limit: PAGE_SIZE,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch messages');
      }

      return {
        messages: response.data,
        nextPage: response.data.length === PAGE_SIZE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!chatId,
    staleTime: 10 * 1000, // 10 seconds
  });
};

/**
 * Hook for sending messages (mutation)
 * Returns optimistic updates for instant UI feedback
 */
export const useSendMessage = (chatId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageData) => {
      const response = await chatService.sendMessage(chatId, messageData);
      if (!response.success) {
        throw new Error(response.message || 'Failed to send message');
      }
      return response.data;
    },

    // Optimistic update - message appears instantly
    onMutate: async (newMessage) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['chat-messages', chatId] });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(['chat-messages', chatId]);

      // Optimistically update
      queryClient.setQueryData(['chat-messages', chatId], (old) => {
        if (!old) return old;

        const optimisticMessage = {
          ...newMessage,
          id: `temp-${Date.now()}`,
          status: 'sending',
          created_at: new Date().toISOString(),
        };

        return {
          ...old,
          pages: old.pages.map((page, index) =>
            index === 0
              ? { ...page, messages: [optimisticMessage, ...page.messages] }
              : page
          ),
        };
      });

      return { previousMessages };
    },

    // Rollback on error
    onError: (err, newMessage, context) => {
      queryClient.setQueryData(['chat-messages', chatId], context.previousMessages);
    },

    // Refetch on success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] }); // Update chat list
    },
  });
};

/**
 * Hook for creating new chat
 */
export const useCreateChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipientId) => {
      const response = await chatService.createDirectChat(recipientId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create chat');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate chat list to show new chat
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
};

/**
 * USAGE EXAMPLE:
 *
 * // In ChatList screen
 * const { data: chats, isLoading } = useChatList(userId);
 *
 * // In ChatScreen
 * const { data, fetchNextPage, hasNextPage } = useChatMessages(chatId);
 * const messages = data?.pages.flatMap(page => page.messages) ?? [];
 *
 * const sendMessage = useSendMessage(chatId);
 * sendMessage.mutate({ text: 'Hello!' });
 *
 * BENEFITS:
 * ✅ Optimistic updates (messages appear instantly)
 * ✅ Auto-refresh (real-time feel)
 * ✅ Error rollback (failed messages removed)
 * ✅ Infinite scroll (load older messages)
 * ✅ Automatic retry on network issues
 */
