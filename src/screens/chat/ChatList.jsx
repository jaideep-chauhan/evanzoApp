import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Image,
    TextInput,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../ThemeContext';
import chatService from '../../services/chatService';
import socketService from '../../services/socketService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChatList({ navigation }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [chats, setChats] = useState([]);
    const [filteredChats, setFilteredChats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const theme = useTheme();

    useEffect(() => {
        initializeChat();
        loadChats();
        setupSocketListeners();

        return () => {
            socketService.off('new-message');
            socketService.off('chat-updated');
            socketService.off('user-status-changed');
        };
    }, []);

    const initializeChat = async () => {
        try {
            const userId = await AsyncStorage.getItem('userId');
            setCurrentUserId(userId);

            if (!socketService.isSocketConnected()) {
                await socketService.connect();
            }
        } catch (error) {
            console.error('Failed to initialize chat:', error);
        }
    };

    const setupSocketListeners = () => {
        socketService.on('new-message', (data) => {
            loadChats();
        });

        socketService.on('chat-updated', (data) => {
            loadChats();
        });

        socketService.on('user-status-changed', (data) => {
            setChats(prevChats => prevChats.map(chat => {
                if (chat.recipientId === data.userId) {
                    return { ...chat, isOnline: data.status === 'online' };
                }
                return chat;
            }));
        });
    };

    const loadChats = async () => {
        try {
            setIsLoading(true);
            const result = await chatService.getChats();
            
            if (result.success && result.data) {
                const formattedChats = result.data.results ? result.data.results : result.data;
                const chatList = Array.isArray(formattedChats) ? formattedChats : [];
                
                const processedChats = chatList.map(chat => ({
                    id: chat.chat_id || chat.id,
                    name: chat.name || chat.participants?.find(p => p.user_id !== currentUserId)?.name || 'Unknown User',
                    lastMessage: chat.last_message || 'No messages yet',
                    timestamp: formatTimestamp(chat.last_message_time || chat.updated_at),
                    unreadCount: chat.unread_count || 0,
                    avatar: chat.avatar || chat.participants?.find(p => p.user_id !== currentUserId)?.profile_picture || 'https://via.placeholder.com/50',
                    isOnline: chat.participants?.find(p => p.user_id !== currentUserId)?.is_online || false,
                    recipientId: chat.participants?.find(p => p.user_id !== currentUserId)?.user_id,
                    type: chat.type || 'direct',
                }));
                
                setChats(processedChats);
                setFilteredChats(processedChats);
            }
        } catch (error) {
            console.error('Failed to load chats:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        
        const date = new Date(typeof timestamp === 'number' ? timestamp : timestamp);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return date.toLocaleDateString([], { weekday: 'long' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const onRefresh = () => {
        setIsRefreshing(true);
        loadChats();
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query.trim() === '') {
            setFilteredChats(chats);
        } else {
            const filtered = chats.filter(chat =>
                chat.name.toLowerCase().includes(query.toLowerCase()) ||
                chat.lastMessage.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredChats(filtered);
        }
    };

    const renderChatItem = ({ item }) => (
        <TouchableOpacity
            style={styles.chatItem}
            onPress={() => navigation.navigate('ChatScreen', {
                chatId: item.id,
                chatName: item.name,
                avatar: item.avatar,
                isOnline: item.isOnline,
                recipientId: item.recipientId
            })}
        >
            <View style={styles.avatarContainer}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                {item.isOnline && <View style={styles.onlineIndicator} />}
            </View>

            <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                    <Text style={[styles.chatName, { color: theme.colors.primary }]}>{item.name}</Text>
                    <Text style={styles.timestamp}>{item.timestamp}</Text>
                </View>
                <View style={styles.messageRow}>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                        {item.lastMessage}
                    </Text>
                    {item.unreadCount > 0 && (
                        <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]}>
                            <Text style={styles.unreadText}>
                                {item.unreadCount > 99 ? '99+' : item.unreadCount}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#f6f8fa' }]}>
            <View style={styles.androidPad} />
            {/* Header */}
            <View style={[styles.header]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color="#2C3D5B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chats</Text>
                {/* <TouchableOpacity style={styles.headerAction}>
                    <Icon name="add" size={24} color="#2C3D5B" />
                </TouchableOpacity> */}
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Icon name="search-outline" size={20} color="#8B95A5" style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.colors.primary }]}
                        placeholder="Search chats..."
                        placeholderTextColor="#8B95A5"
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => handleSearch('')}>
                            <Icon name="close-circle" size={20} color="#8B95A5" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Chat List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Loading chats...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredChats}
                    renderItem={renderChatItem}
                    keyExtractor={(item) => item.id?.toString()}
                    style={styles.chatList}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={onRefresh}
                            colors={[theme.colors.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="chatbubbles-outline" size={64} color="#8B95A5" />
                            <Text style={styles.emptyText}>No chats yet</Text>
                            <Text style={styles.emptySubText}>Start a conversation with vendors or event organizers</Text>
                        </View>
                    }
                />
            )}

            {/* Floating Action Button */}
            {/* <TouchableOpacity style={[styles.fab, { backgroundColor: theme.colors.primary }]}>
                <Icon name="chatbubble" size={24} color="#fff" />
            </TouchableOpacity> */}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f6f8fa',
    },
    androidPad: {
        height: 18,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#f6f8fa',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        position: 'relative',
    },
    backButton: {
        padding: 5,
        position: 'absolute',
        left: 20,
        zIndex: 1,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: '600',
        color: '#2C3D5B',
        textAlign: 'center',
    },
    headerAction: {
        padding: 5,
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#f6f8fa',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#2C3D5B',
    },
    chatList: {
        flex: 1,
    },
    listContainer: {
        paddingBottom: 100,
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e3e8f0',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 15,
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
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#fff',
    },
    chatContent: {
        flex: 1,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    chatName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3D5B',
        flex: 1,
    },
    timestamp: {
        fontSize: 12,
        color: '#8B95A5',
        marginLeft: 10,
    },
    messageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: 14,
        color: '#8B95A5',
        flex: 1,
        marginRight: 10,
    },
    unreadBadge: {
        backgroundColor: '#2C3D5B',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    unreadText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#2C3D5B',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#8B95A5',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2C3D5B',
        marginTop: 20,
    },
    emptySubText: {
        fontSize: 14,
        color: '#8B95A5',
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
