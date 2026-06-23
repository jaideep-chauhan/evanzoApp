import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Image,
    TextInput,
    StatusBar,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../ThemeContext';
import chatService from '../../services/chatService';
import { thumbnailUrl } from '../../utils/imageUtils';
import socketService from '../../services/socketService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatRowSkeleton, renderSkeletons } from '../../components/SkeletonLoader';
import { getCached, setCached } from '../../services/listCacheService';

const CHAT_CACHE_KEY = 'chat:list';

export default function ChatList({ navigation }) {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userId, setUserId] = useState(null);
    const [error, setError] = useState(null);
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        // Hydrate from cache first so the tab opens with the last known list
        // instead of a spinner. The real loadUserAndChats() then runs and
        // silently overwrites with fresh state.
        let cancelled = false;
        (async () => {
            const cached = await getCached(CHAT_CACHE_KEY);
            if (cancelled) return;
            if (Array.isArray(cached) && cached.length > 0) {
                setChats(cached);
                setLoading(false); // we have something to render; skip the spinner
            }
            loadUserAndChats();
        })();

        // Refresh chats when screen comes into focus
        const unsubscribe = navigation.addListener('focus', async () => {
            console.log('📱 ChatList screen focused, refreshing...');

            // Get userId from storage if not in state
            let currentUserId = userId;
            if (!currentUserId) {
                currentUserId = await AsyncStorage.getItem('userId');
                console.log('📱 Retrieved userId from storage:', currentUserId);
            }

            if (currentUserId) {
                // Reload chats to get fresh unread counts from server
                console.log('📱 Calling loadChats with userId:', currentUserId);
                await loadChats(currentUserId);
            } else {
                console.error('❌ No userId available for refresh');
            }
        });

        return () => {
            unsubscribe();
            socketService.off('chat-updated');
            socketService.off('new-message');
            socketService.off('chat-read');
        };
    }, [navigation, userId]); // Add userId to dependency array
    
    // Set up socket listeners when userId is available
    useEffect(() => {
        if (userId) {
            setupSocketListeners();
        }
    }, [userId]);

    const setupSocketListeners = () => {
        // Listen for new messages to update last message
        socketService.on('new-message', (data) => {
            console.log('📩 New message received in ChatList:', data.message.chat_id);
            updateChatLastMessage(data.message.chat_id, data.message);
        });

        // Listen for chat updates
        socketService.on('chat-updated', (data) => {
            console.log('🔄 Chat updated, reloading list');
            loadChats(userId);
        });

        // Listen for chat read events to reset unread count
        socketService.on('chat-read', (data) => {
            console.log('✅ ChatList - chat-read event received:', {
                chatId: data.chatId,
                readBy: data.readBy,
                currentUserId: userId,
                match: String(data.readBy) === String(userId)
            });

            if (String(data.readBy) === String(userId)) {
                // Current user marked chat as read, reset unread count
                console.log('✅ Resetting unread count for chat:', data.chatId);
                setChats(prevChats => {
                    const updated = prevChats.map(chat =>
                        String(chat.id) === String(data.chatId)
                            ? { ...chat, unreadCount: 0 }
                            : chat
                    );
                    console.log('Updated chats:', updated.find(c => String(c.id) === String(data.chatId)));
                    return updated;
                });
            }
        });
    };

    const updateChatLastMessage = (chatId, message) => {
        setChats(prevChats => {
            // Check if chat exists in the list
            const chatExists = prevChats.some(chat => chat.id === chatId);

            if (chatExists) {
                // Update existing chat
                const updatedChats = prevChats.map(chat => {
                    if (chat.id === chatId) {
                        // Shape the socket payload into the same form the
                        // helper expects, so media / contact / audio previews
                        // are formatted identically to the initial fetch.
                        const lastMessage = formatLastMessagePreview({
                            last_message_type: message.message_type,
                            last_message: message.content,
                            last_message_time: message.created_at,
                        });

                        // Increment unread count only if message is from another user
                        const isFromOtherUser = String(message.sender_id) !== String(userId);

                        return {
                            ...chat,
                            lastMessage: lastMessage,
                            time: formatTime(message.created_at),
                            timestamp: message.created_at, // Update raw timestamp for sorting
                            unreadCount: isFromOtherUser ? (chat.unreadCount || 0) + 1 : chat.unreadCount
                        };
                    }
                    return chat;
                });

                // Re-sort chats by timestamp (most recent first)
                updatedChats.sort((a, b) => {
                    const timeA = a.timestamp ? parseInt(a.timestamp) : 0;
                    const timeB = b.timestamp ? parseInt(b.timestamp) : 0;
                    return timeB - timeA;
                });

                return updatedChats;
            } else {
                // Chat doesn't exist, reload the chat list to get the new chat
                console.log('🔄 New chat detected, reloading chat list...');
                loadChats(userId);
                return prevChats;
            }
        });
    };

    const loadUserAndChats = async () => {
        try {
            const storedUserId = await AsyncStorage.getItem('userId');
            setUserId(storedUserId);

            // Try to connect to socket but don't block on it
            if (!socketService.isSocketConnected()) {
                socketService.connect().catch(err => {
                    console.error('Socket connection failed, but continuing with chat list:', err);
                });
            }

            // Pass userId to loadChats to ensure it's available
            await loadChats(storedUserId);
        } catch (error) {
            console.error('Error loading chats:', error);
            // Ensure loading state is reset even if there's an error
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadChats = async (currentUserId = null) => {
        try {
            console.log('📥 Loading chats...');
            // Only show the full-screen loading state when we don't already
            // have a list to render. With a cached or in-memory list, this is
            // a silent background refresh — no spinner / blanking.
            setChats((prev) => {
                if (!prev || prev.length === 0) setLoading(true);
                return prev;
            });
            setError(null);
            const result = await chatService.getChats();
            console.log('📥 Chat service result:', {
                success: result.success,
                hasData: !!result.data,
                hasResults: !!result.data?.results,
                resultsCount: result.data?.results?.length || 0,
                fullResult: JSON.stringify(result, null, 2)
            });

            // Use passed userId or state userId
            const userIdToUse = currentUserId || userId;

            if (!userIdToUse) {
                console.error('❌ User ID not available for loading chats');
                setError('User not authenticated. Please log in again.');
                setLoading(false);
                setRefreshing(false);
                return;
            }

            if (result.success && result.data.results) {
                // Format chats for display
                const formattedChats = await Promise.all(result.data.results.map(async (chat) => {
                    console.log('🔍 Processing chat:', {
                        chatId: chat.chat_id,
                        type: chat.type,
                        participantsCount: chat.participants?.length,
                        participants: chat.participants?.map(p => ({
                            user_id: p.user_id,
                            hasUser: !!p.user,
                            userFields: p.user ? Object.keys(p.user) : [],
                            fullData: p
                        }))
                    });

                    // Get participant info if it's a direct chat
                    let participantInfo = {};
                    if (chat.type === 'direct' && chat.participants && chat.participants.length > 0) {
                        // Find the OTHER participant (not the current user)
                        // Handle both string and number comparisons
                        const otherParticipant = chat.participants.find(p => {
                            const participantId = String(p.user_id || p.id);
                            const currentId = String(userIdToUse);
                            console.log('🔍 Comparing participants:', { participantId, currentId, isMatch: participantId !== currentId });
                            return participantId !== currentId;
                        });

                        console.log('🔍 Other participant found:', {
                            found: !!otherParticipant,
                            hasUser: !!otherParticipant?.user,
                            userData: otherParticipant?.user,
                            participantData: otherParticipant
                        });

                        if (otherParticipant?.user) {
                            // User data is populated from the backend
                            participantInfo = {
                                name: otherParticipant.user.full_name || otherParticipant.user.name || 'Unknown User',
                                avatar: normalizeAvatar(otherParticipant.user.profile_pic || otherParticipant.user.avatar)
                            };
                            console.log('✅ Using user data:', participantInfo);
                        } else if (otherParticipant) {
                            // Fallback if user data is not populated
                            participantInfo = {
                                name: otherParticipant.full_name || otherParticipant.name || 'Unknown User',
                                avatar: normalizeAvatar(otherParticipant.profile_pic || otherParticipant.avatar)
                            };
                            console.log('⚠️ Using fallback data:', participantInfo);
                        }
                        
                        // If still no name found and we have participants, ensure we're not showing current user
                        if (!participantInfo.name || participantInfo.name === 'Unknown User') {
                            // Try to get name from chat metadata
                            if (chat.metadata?.recipient_name) {
                                participantInfo.name = chat.metadata.recipient_name;
                            }
                        }
                    }

                    // WhatsApp-style preview for every message type. The
                    // backend stores a `last_message_type` on the chat row;
                    // for media we ignore raw content and show an emoji +
                    // label. Contacts are JSON-stringified on send, so we
                    // attempt to parse and show the contact's name.
                    const lastMessage = formatLastMessagePreview(chat);

                    return {
                        id: chat.chat_id,
                        name: participantInfo.name || chat.name || 'Unknown User',
                        lastMessage: lastMessage,
                        time: formatTime(chat.last_message_time),
                        timestamp: chat.last_message_time, // Keep raw timestamp for sorting
                        // Prefer the participant's real profile pic, then any
                        // avatar already on the chat row, then a generated
                        // initials avatar (ui-avatars.com) as last resort.
                        avatar:
                            participantInfo.avatar ||
                            normalizeAvatar(chat.avatar) ||
                            generateAvatar(participantInfo.name || chat.name),
                        unreadCount: chat.unread_count || 0,
                        isOnline: false, // This will be updated via socket
                        type: chat.type,
                        participants: chat.participants || [],
                        recipientId: chat.participants?.find(p => String(p.user_id) !== String(userIdToUse))?.user_id
                    };
                }));
                
                // Remove any duplicate chats (same chat_id)
                const uniqueChats = formattedChats.reduce((acc, chat) => {
                    const exists = acc.find(c => c.id === chat.id);
                    if (!exists) {
                        acc.push(chat);
                    } else {
                        console.log('⚠️ Duplicate chat found and removed:', chat.id);
                    }
                    return acc;
                }, []);
                
                // Sort by last message timestamp (most recent first)
                uniqueChats.sort((a, b) => {
                    const timeA = a.timestamp ? parseInt(a.timestamp) : 0;
                    const timeB = b.timestamp ? parseInt(b.timestamp) : 0;
                    return timeB - timeA; // Descending order (newest first)
                });

                console.log('✅ Formatted', uniqueChats.length, 'chats (removed', formattedChats.length - uniqueChats.length, 'duplicates)');
                setChats(uniqueChats);
                // Persist a snapshot for the next launch — `id` / `timestamp`
                // / `lastMessage` / `unreadCount` are all already-formatted so
                // the next mount can render immediately without re-fetching.
                setCached(CHAT_CACHE_KEY, uniqueChats);
            } else {
                // API call failed or returned no results
                console.error('❌ Failed to load chats:', result.message || 'No results returned');
                setError(result.message || 'Failed to load conversations');
                setChats([]);
            }
        } catch (error) {
            console.error('❌ Error loading chats:', error);
            setError('Unable to load conversations. Please try again.');
            setChats([]);
        } finally {
            console.log('✅ Loading complete, setting loading to false');
            setLoading(false);
            setRefreshing(false);
        }
    };

    // WhatsApp-style "last message" preview for the chat list. Handles every
    // attachment type the app supports plus contact-share (JSON-stringified
    // content) and empty-attachment edge cases. Always returns a string.
    const formatLastMessagePreview = (chat) => {
        const type = chat.last_message_type;
        const raw = chat.last_message;
        const hasTextContent = typeof raw === 'string' && raw.trim() !== '';

        switch (type) {
            case 'image':
                return '📷 Photo';
            case 'video':
                return '🎥 Video';
            case 'audio':
                return '🎵 Voice message';
            case 'document':
            case 'file':
                // If the backend included the file name in content, show it.
                return hasTextContent ? `📄 ${raw}` : '📄 Document';
            case 'location':
                return '📍 Location';
            case 'contact': {
                // Contact-share sends JSON.stringify({name, phone, ...}) as
                // the message content. Parse it back so we don't render the
                // raw JSON / "[object Object]" string in the list.
                if (hasTextContent) {
                    try {
                        const parsed = JSON.parse(raw);
                        if (parsed?.name) return `👤 ${parsed.name}`;
                    } catch (_) {}
                } else if (raw && typeof raw === 'object' && raw.name) {
                    return `👤 ${raw.name}`;
                }
                return '👤 Contact';
            }
            default:
                break;
        }

        // Text branch — defend against raw objects sneaking through (e.g. an
        // un-parsed contact payload), which would otherwise toString() into
        // "[object Object]" inside the row.
        if (raw && typeof raw === 'object') {
            return raw.name ? `👤 ${raw.name}` : '📎 Attachment';
        }
        if (hasTextContent) {
            // Some contact shares land here with `last_message_type === 'text'`
            // because the backend never typed them as 'contact'. Detect the
            // payload by shape instead — if the string parses to JSON with a
            // `name` (and optionally `phone`) it's a contact card.
            const trimmed = raw.trim();
            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (parsed && typeof parsed === 'object' && parsed.name) {
                        return `👤 ${parsed.name}`;
                    }
                } catch (_) {
                    // not JSON — fall through to raw text
                }
            }
            return raw;
        }
        if (chat.last_message_time) return '📎 Attachment';
        return 'No messages yet';
    };

    const generateAvatar = (name) => {
        const encodedName = encodeURIComponent(name || 'User');
        const colors = ['5E72E4', '11CDEF', '2DCE89', 'FB6340', 'F5365C'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        return `https://ui-avatars.com/api/?name=${encodedName}&background=${randomColor}&color=fff&bold=true`;
    };

    // profile_pic can come back as a relative path (`/uploads/profile/x.jpg`)
    // or an absolute URL — Image needs absolute. Defensive prefix to the API
    // host (NOT baseURL with /api, since uploads serve from root). Returns
    // null if there's nothing to normalize, so the caller can fall through to
    // the generated initials avatar.
    const normalizeAvatar = (raw) => {
        if (!raw || typeof raw !== 'string' || raw.trim() === '') return null;
        if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
        const host = 'https://api.evnzo.com';
        return raw.startsWith('/') ? `${host}${raw}` : `${host}/${raw}`;
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        
        const date = new Date(parseInt(timestamp));
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadChats(userId);
    };

    const navigateToChat = (chat) => {
        navigation.navigate('ChatScreen', {
            chatId: chat.id,
            chatName: chat.name,
            avatar: chat.avatar,
            isOnline: chat.isOnline,
            recipientId: chat.recipientId,
        });
    };

    const filteredChats = chats.filter(chat =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderChat = ({ item }) => (
        <TouchableOpacity
            style={styles.chatItem}
            onPress={() => navigateToChat(item)}
            activeOpacity={0.7}
        >
            <View style={styles.avatarContainer}>
                <Image source={{ uri: thumbnailUrl(item.avatar, 150) }} style={styles.avatar} />
                {item.isOnline && <View style={styles.onlineIndicator} />}
            </View>

            <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                    <Text style={[styles.chatName, { color: theme.colors.text }]} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text style={[styles.chatTime, { color: theme.colors.secondary }]}>
                        {item.time}
                    </Text>
                </View>

                <View style={styles.messageRow}>
                    <Text style={[styles.lastMessage, { color: theme.colors.secondary }]} numberOfLines={1}>
                        {item.lastMessage}
                    </Text>
                    {item.unreadCount > 0 && (
                        <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]}>
                            <Text style={styles.unreadCount}>
                                {item.unreadCount > 99 ? '99+' : item.unreadCount}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    console.log('🎨 Render - loading:', loading, 'chats count:', chats.length);

    if (loading) {
        // First-ever open with no cache → show 6 chat-row skeletons in the
        // real layout. Subsequent mounts hydrate from cache and skip this branch.
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} translucent />
                <View
                    style={[
                        styles.header,
                        { backgroundColor: theme.colors.primary, paddingTop: insets.top + 12 },
                    ]}
                >
                    <Text style={styles.headerTitle}>Messages</Text>
                </View>
                {renderSkeletons(ChatRowSkeleton, 6)}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} translucent />

            {/* Header — no back arrow. This screen is the root of the
                Messages tab; cross-tab navigation belongs to the tab bar,
                not an in-screen back button. The blue fills behind the status
                bar; insets.top pushes the title clear of the notch / camera. */}
            <View
                style={[
                    styles.header,
                    { backgroundColor: theme.colors.primary, paddingTop: insets.top + 12 },
                ]}
            >
                <Text style={styles.headerTitle}>Messages</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Icon name="search" size={20} color="#8B95A5" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search conversations..."
                    placeholderTextColor="#8B95A5"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Icon name="close-circle" size={20} color="#8B95A5" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Chat List */}
            <FlatList
                data={filteredChats}
                renderItem={renderChat}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[theme.colors.primary]}
                        tintColor={theme.colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        {error ? (
                            <>
                                <Icon name="alert-circle-outline" size={64} color="#FF6B6B" />
                                <Text style={styles.emptyText}>Unable to Load Chats</Text>
                                <Text style={styles.emptySubtext}>{error}</Text>
                                <TouchableOpacity
                                    style={[styles.startChatButton, { backgroundColor: theme.colors.primary }]}
                                    onPress={() => loadChats(userId)}
                                >
                                    <Text style={styles.startChatText}>Retry</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Icon name="chatbubbles-outline" size={64} color="#C4C4C4" />
                                <Text style={styles.emptyText}>No conversations yet</Text>
                                <Text style={styles.emptySubtext}>
                                    Start chatting with vendors to see your messages here
                                </Text>
                            </>
                        )}
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f6f8fa',
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
    },
    header: {
        // paddingTop is set inline as insets.top + 12 — the blue background
        // fills the status-bar area while the title is pushed below the notch.
        paddingBottom: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerAction: {
        padding: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginVertical: 15,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#2C3D5B',
    },
    listContent: {
        paddingBottom: 20,
    },
    chatItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginVertical: 5,
        padding: 15,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#e3e8f0',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#fff',
    },
    chatContent: {
        flex: 1,
        justifyContent: 'center',
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    chatName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        marginRight: 10,
    },
    chatTime: {
        fontSize: 12,
    },
    messageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: 14,
        flex: 1,
        marginRight: 10,
    },
    unreadBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadCount: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 20,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        lineHeight: 20,
    },
    startChatButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    startChatText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});