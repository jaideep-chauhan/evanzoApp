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
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../ThemeContext';
import chatService from '../../services/chatService';
import socketService from '../../services/socketService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChatList({ navigation }) {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userId, setUserId] = useState(null);
    const [error, setError] = useState(null);
    const theme = useTheme();

    useEffect(() => {
        loadUserAndChats();
        
        return () => {
            socketService.off('chat-updated');
            socketService.off('new-message');
        };
    }, []);
    
    // Set up socket listeners when userId is available
    useEffect(() => {
        if (userId) {
            setupSocketListeners();
        }
    }, [userId]);

    const setupSocketListeners = () => {
        // Listen for new messages to update last message
        socketService.on('new-message', (data) => {
            updateChatLastMessage(data.message.chat_id, data.message);
        });

        // Listen for chat updates
        socketService.on('chat-updated', (data) => {
            loadChats(userId);
        });
    };

    const updateChatLastMessage = (chatId, message) => {
        setChats(prevChats => prevChats.map(chat => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    lastMessage: message.content,
                    time: formatTime(message.created_at),
                    unreadCount: chat.unreadCount + (message.sender_id !== userId ? 1 : 0)
                };
            }
            return chat;
        }));
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
            setLoading(true);
            setError(null);
            const result = await chatService.getChats();
            console.log('📥 Chat service result:', { success: result.success, hasData: !!result.data, hasResults: !!result.data?.results });

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
                    // Get participant info if it's a direct chat
                    let participantInfo = {};
                    if (chat.type === 'direct' && chat.participants && chat.participants.length > 0) {
                        // Find the OTHER participant (not the current user)
                        // Handle both string and number comparisons
                        const otherParticipant = chat.participants.find(p => {
                            const participantId = String(p.user_id || p.id);
                            const currentId = String(userIdToUse);
                            return participantId !== currentId;
                        });
                        
                        if (otherParticipant?.user) {
                            // User data is populated from the backend
                            participantInfo = {
                                name: otherParticipant.user.full_name || otherParticipant.user.name || 'Unknown User',
                                avatar: otherParticipant.user.profile_pic || otherParticipant.user.avatar
                            };
                        } else if (otherParticipant) {
                            // Fallback if user data is not populated
                            participantInfo = {
                                name: otherParticipant.full_name || otherParticipant.name || 'Unknown User',
                                avatar: otherParticipant.profile_pic || otherParticipant.avatar
                            };
                        }
                        
                        // If still no name found and we have participants, ensure we're not showing current user
                        if (!participantInfo.name || participantInfo.name === 'Unknown User') {
                            // Try to get name from chat metadata
                            if (chat.metadata?.recipient_name) {
                                participantInfo.name = chat.metadata.recipient_name;
                            }
                        }
                    }

                    return {
                        id: chat.chat_id,
                        name: participantInfo.name || chat.name || 'Unknown User',
                        lastMessage: chat.last_message || 'No messages yet',
                        time: formatTime(chat.last_message_time),
                        avatar: participantInfo.avatar || chat.avatar || generateAvatar(participantInfo.name || chat.name),
                        unreadCount: chat.unread_count || 0,
                        isOnline: false, // This will be updated via socket
                        type: chat.type,
                        participants: chat.participants || [],
                        recipientId: chat.participants?.find(p => String(p.user_id) !== String(userIdToUse))?.user_id
                    };
                }));
                
                // Sort by last message time
                formattedChats.sort((a, b) => {
                    const timeA = a.time ? new Date(a.time).getTime() : 0;
                    const timeB = b.time ? new Date(b.time).getTime() : 0;
                    return timeB - timeA;
                });

                console.log('✅ Formatted', formattedChats.length, 'chats');
                setChats(formattedChats);
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

    const generateAvatar = (name) => {
        const encodedName = encodeURIComponent(name || 'User');
        const colors = ['5E72E4', '11CDEF', '2DCE89', 'FB6340', 'F5365C'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        return `https://ui-avatars.com/api/?name=${encodedName}&background=${randomColor}&color=fff&bold=true`;
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

    const createNewChat = () => {
        // Navigate to a screen to select a user to chat with
        navigation.navigate('SelectUser');
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
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
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
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.secondary }]}>
                    Loading conversations...
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
            
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icon name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Messages</Text>
                </View>
                <TouchableOpacity style={styles.headerAction} onPress={createNewChat}>
                    <Icon name="create-outline" size={24} color="#fff" />
                </TouchableOpacity>
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
                                <TouchableOpacity
                                    style={[styles.startChatButton, { backgroundColor: theme.colors.primary }]}
                                    onPress={createNewChat}
                                >
                                    <Text style={styles.startChatText}>Start a Chat</Text>
                                </TouchableOpacity>
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
        paddingTop: StatusBar.currentHeight || 44,
        paddingBottom: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backButton: {
        marginRight: 15,
        padding: 5,
    },
    headerTitle: {
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