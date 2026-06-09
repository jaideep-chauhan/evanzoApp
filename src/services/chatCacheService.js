import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * ChatCacheService - WhatsApp-style local caching for instant chat loading
 *
 * Features:
 * - Cache chat list for instant loading
 * - Cache last 100 messages per chat
 * - Store scroll positions per chat
 * - In-memory cache layer for performance
 */
class ChatCacheService {
    // Storage keys
    CHAT_LIST_KEY = '@evanzo_chat_list';
    MESSAGES_PREFIX = '@evanzo_messages_';
    SCROLL_POSITION_PREFIX = '@evanzo_scroll_';
    LAST_SYNC_PREFIX = '@evanzo_last_sync_';

    // Cache limits
    MAX_CACHED_MESSAGES = 100;
    MAX_CACHED_CHATS = 50;

    // In-memory cache for faster access
    memoryCache = {
        chatList: null,
        messages: new Map(), // chatId -> messages[]
        scrollPositions: new Map(), // chatId -> position
        lastSyncTimes: new Map(), // chatId -> timestamp
    };

    // Cache validity (10 minutes for in-memory - extended for better performance)
    MEMORY_CACHE_TTL = 10 * 60 * 1000;
    memoryCacheTimestamps = new Map();

    // ==========================================
    // CHAT LIST CACHING
    // ==========================================

    /**
     * Get cached chat list - instant loading
     * Returns from memory first, then AsyncStorage
     */
    async getCachedChatList() {
        try {
            // Check memory cache first
            if (this.memoryCache.chatList && this.isCacheValid('chatList')) {
                return this.memoryCache.chatList;
            }

            // Fall back to AsyncStorage
            const cached = await AsyncStorage.getItem(this.CHAT_LIST_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                this.memoryCache.chatList = parsed;
                this.memoryCacheTimestamps.set('chatList', Date.now());
                return parsed;
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Save chat list to cache
     */
    async setCachedChatList(chats) {
        try {
            if (!chats || !Array.isArray(chats)) return;

            // Limit to max cached chats
            const trimmedChats = chats.slice(0, this.MAX_CACHED_CHATS);

            // Update memory cache
            this.memoryCache.chatList = trimmedChats;
            this.memoryCacheTimestamps.set('chatList', Date.now());

            // Persist to AsyncStorage
            await AsyncStorage.setItem(this.CHAT_LIST_KEY, JSON.stringify(trimmedChats));
        } catch (error) {
        }
    }

    /**
     * Update a single chat in the cache (for real-time updates)
     */
    async updateChatInCache(chatId, updates) {
        try {
            const chats = await this.getCachedChatList();
            if (!chats) return;

            const index = chats.findIndex(c => String(c.id) === String(chatId));
            if (index !== -1) {
                chats[index] = { ...chats[index], ...updates };

                // Re-sort by timestamp (most recent first)
                chats.sort((a, b) => {
                    const timeA = a.timestamp ? parseInt(a.timestamp) : 0;
                    const timeB = b.timestamp ? parseInt(b.timestamp) : 0;
                    return timeB - timeA;
                });

                await this.setCachedChatList(chats);
            }
        } catch (error) {
        }
    }

    // ==========================================
    // MESSAGE CACHING
    // ==========================================

    /**
     * Get cached messages for a chat - instant chat opening
     */
    async getCachedMessages(chatId) {
        try {
            if (!chatId) return null;

            const cacheKey = `${this.MESSAGES_PREFIX}${chatId}`;

            // Check memory cache first
            if (this.memoryCache.messages.has(chatId) && this.isCacheValid(`messages_${chatId}`)) {
                return this.memoryCache.messages.get(chatId);
            }

            // Fall back to AsyncStorage
            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                this.memoryCache.messages.set(chatId, parsed);
                this.memoryCacheTimestamps.set(`messages_${chatId}`, Date.now());
                return parsed;
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Save messages to cache (replaces existing)
     */
    async setCachedMessages(chatId, messages) {
        try {
            if (!chatId || !messages) return;

            const cacheKey = `${this.MESSAGES_PREFIX}${chatId}`;

            // Remove duplicates and limit to max
            const uniqueMessages = this.deduplicateMessages(messages);
            const trimmedMessages = uniqueMessages.slice(-this.MAX_CACHED_MESSAGES);

            // Update memory cache
            this.memoryCache.messages.set(chatId, trimmedMessages);
            this.memoryCacheTimestamps.set(`messages_${chatId}`, Date.now());

            // Persist to AsyncStorage
            await AsyncStorage.setItem(cacheKey, JSON.stringify(trimmedMessages));
        } catch (error) {
        }
    }

    /**
     * Prepend older messages (for infinite scroll)
     */
    async prependMessages(chatId, olderMessages) {
        try {
            if (!chatId || !olderMessages?.length) return;

            const existing = await this.getCachedMessages(chatId) || [];
            const merged = [...olderMessages, ...existing];
            await this.setCachedMessages(chatId, merged);

            return merged;
        } catch (error) {
            return null;
        }
    }

    /**
     * Append newer messages (for real-time updates)
     */
    async appendMessages(chatId, newerMessages) {
        try {
            if (!chatId || !newerMessages?.length) return;

            const existing = await this.getCachedMessages(chatId) || [];
            const merged = [...existing, ...newerMessages];
            await this.setCachedMessages(chatId, merged);

            return merged;
        } catch (error) {
            return null;
        }
    }

    /**
     * Add a single message to cache (optimistic update)
     */
    async addMessageToCache(chatId, message) {
        try {
            if (!chatId || !message) return;

            const existing = await this.getCachedMessages(chatId) || [];

            // Check if message already exists
            const exists = existing.some(m => m.id === message.id);
            if (exists) {
                // Update existing message
                const updated = existing.map(m => m.id === message.id ? message : m);
                await this.setCachedMessages(chatId, updated);
            } else {
                // Append new message
                await this.appendMessages(chatId, [message]);
            }
        } catch (error) {
        }
    }

    /**
     * Update a message in cache (for status updates, reactions, etc.)
     */
    async updateMessageInCache(chatId, messageId, updates) {
        try {
            if (!chatId || !messageId) return;

            const messages = await this.getCachedMessages(chatId);
            if (!messages) return;

            const index = messages.findIndex(m => m.id === messageId);
            if (index !== -1) {
                messages[index] = { ...messages[index], ...updates };
                await this.setCachedMessages(chatId, messages);
            }
        } catch (error) {
        }
    }

    /**
     * Remove a message from cache
     */
    async removeMessageFromCache(chatId, messageId) {
        try {
            if (!chatId || !messageId) return;

            const messages = await this.getCachedMessages(chatId);
            if (!messages) return;

            const filtered = messages.filter(m => m.id !== messageId);
            await this.setCachedMessages(chatId, filtered);
        } catch (error) {
        }
    }

    // ==========================================
    // SCROLL POSITION
    // ==========================================

    /**
     * Get scroll position for a chat
     */
    async getScrollPosition(chatId) {
        try {
            if (!chatId) return null;

            // Check memory first
            if (this.memoryCache.scrollPositions.has(chatId)) {
                return this.memoryCache.scrollPositions.get(chatId);
            }

            const key = `${this.SCROLL_POSITION_PREFIX}${chatId}`;
            const position = await AsyncStorage.getItem(key);
            if (position) {
                const parsed = JSON.parse(position);
                this.memoryCache.scrollPositions.set(chatId, parsed);
                return parsed;
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Save scroll position for a chat
     */
    async setScrollPosition(chatId, position) {
        try {
            if (!chatId) return;

            // Update memory
            this.memoryCache.scrollPositions.set(chatId, position);

            // Persist
            const key = `${this.SCROLL_POSITION_PREFIX}${chatId}`;
            await AsyncStorage.setItem(key, JSON.stringify(position));
        } catch (error) {
        }
    }

    // ==========================================
    // SYNC TRACKING
    // ==========================================

    /**
     * Get last sync time for a chat
     */
    async getLastSyncTime(chatId) {
        try {
            if (!chatId) return null;

            // Check memory first
            if (this.memoryCache.lastSyncTimes.has(chatId)) {
                return this.memoryCache.lastSyncTimes.get(chatId);
            }

            const key = `${this.LAST_SYNC_PREFIX}${chatId}`;
            const time = await AsyncStorage.getItem(key);
            if (time) {
                const parsed = parseInt(time);
                this.memoryCache.lastSyncTimes.set(chatId, parsed);
                return parsed;
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Set last sync time for a chat
     */
    async setLastSyncTime(chatId, timestamp = Date.now()) {
        try {
            if (!chatId) return;

            this.memoryCache.lastSyncTimes.set(chatId, timestamp);

            const key = `${this.LAST_SYNC_PREFIX}${chatId}`;
            await AsyncStorage.setItem(key, String(timestamp));
        } catch (error) {
        }
    }

    /**
     * Get the last message ID from cached messages (for sync)
     */
    async getLastMessageId(chatId) {
        try {
            const messages = await this.getCachedMessages(chatId);
            if (messages && messages.length > 0) {
                return messages[messages.length - 1].id;
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Get the oldest message ID from cached messages (for pagination)
     */
    async getOldestMessageId(chatId) {
        try {
            const messages = await this.getCachedMessages(chatId);
            if (messages && messages.length > 0) {
                return messages[0].id;
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    // ==========================================
    // CACHE MANAGEMENT
    // ==========================================

    /**
     * Clear cache for a specific chat
     */
    async clearChatCache(chatId) {
        try {
            if (!chatId) return;

            const messagesKey = `${this.MESSAGES_PREFIX}${chatId}`;
            const scrollKey = `${this.SCROLL_POSITION_PREFIX}${chatId}`;
            const syncKey = `${this.LAST_SYNC_PREFIX}${chatId}`;

            // Clear AsyncStorage
            await AsyncStorage.multiRemove([messagesKey, scrollKey, syncKey]);

            // Clear memory cache
            this.memoryCache.messages.delete(chatId);
            this.memoryCache.scrollPositions.delete(chatId);
            this.memoryCache.lastSyncTimes.delete(chatId);
            this.memoryCacheTimestamps.delete(`messages_${chatId}`);

        } catch (error) {
        }
    }

    /**
     * Clear all chat caches
     */
    async clearAllCache() {
        try {
            // Get all keys
            const keys = await AsyncStorage.getAllKeys();

            // Filter chat-related keys
            const chatKeys = keys.filter(key =>
                key.startsWith(this.CHAT_LIST_KEY) ||
                key.startsWith(this.MESSAGES_PREFIX) ||
                key.startsWith(this.SCROLL_POSITION_PREFIX) ||
                key.startsWith(this.LAST_SYNC_PREFIX)
            );

            if (chatKeys.length > 0) {
                await AsyncStorage.multiRemove(chatKeys);
            }

            // Clear memory cache
            this.memoryCache.chatList = null;
            this.memoryCache.messages.clear();
            this.memoryCache.scrollPositions.clear();
            this.memoryCache.lastSyncTimes.clear();
            this.memoryCacheTimestamps.clear();

        } catch (error) {
        }
    }

    // ==========================================
    // HELPERS
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
     * Remove duplicate messages based on ID
     */
    deduplicateMessages(messages) {
        const seen = new Set();
        return messages.filter(msg => {
            if (seen.has(msg.id)) return false;
            seen.add(msg.id);
            return true;
        });
    }

    /**
     * Invalidate memory cache (force reload from storage)
     */
    invalidateMemoryCache(type = 'all') {
        if (type === 'all' || type === 'chatList') {
            this.memoryCache.chatList = null;
            this.memoryCacheTimestamps.delete('chatList');
        }
        if (type === 'all' || type === 'messages') {
            this.memoryCache.messages.clear();
            // Clear all message timestamps
            for (const key of this.memoryCacheTimestamps.keys()) {
                if (key.startsWith('messages_')) {
                    this.memoryCacheTimestamps.delete(key);
                }
            }
        }
    }

    /**
     * Get cache statistics (for debugging)
     */
    getCacheStats() {
        return {
            chatListCached: !!this.memoryCache.chatList,
            chatListCount: this.memoryCache.chatList?.length || 0,
            cachedChats: this.memoryCache.messages.size,
            scrollPositions: this.memoryCache.scrollPositions.size,
            lastSyncTimes: this.memoryCache.lastSyncTimes.size,
        };
    }
}

// Singleton instance
const chatCacheService = new ChatCacheService();
export default chatCacheService;
