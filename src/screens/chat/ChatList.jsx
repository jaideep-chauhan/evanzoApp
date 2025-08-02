import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Image,
    TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../ThemeContext';

// Mock chat data - replace with real data from your backend
const mockChats = [
    {
        id: '1',
        name: 'Sarah Johnson',
        lastMessage: 'Hey! Are you available for the wedding event?',
        timestamp: '10:30 AM',
        unreadCount: 2,
        avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
        isOnline: true,
    },
    {
        id: '2',
        name: 'Mike Photography',
        lastMessage: 'I can provide photography services for your event',
        timestamp: 'Yesterday',
        unreadCount: 0,
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        isOnline: false,
    },
    {
        id: '3',
        name: 'Elite Catering',
        lastMessage: 'What type of cuisine are you looking for?',
        timestamp: 'Monday',
        unreadCount: 1,
        avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
        isOnline: true,
    },
    {
        id: '4',
        name: 'DJ Alex',
        lastMessage: 'I have availability for your date',
        timestamp: 'Sunday',
        unreadCount: 0,
        avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
        isOnline: false,
    },
    {
        id: '5',
        name: 'Floral Designs',
        lastMessage: 'I sent you some samples, please check',
        timestamp: 'Saturday',
        unreadCount: 3,
        avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
        isOnline: true,
    },
];

export default function ChatList({ navigation }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredChats, setFilteredChats] = useState(mockChats);
    const theme = useTheme();

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query.trim() === '') {
            setFilteredChats(mockChats);
        } else {
            const filtered = mockChats.filter(chat =>
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
                isOnline: item.isOnline
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
            <FlatList
                data={filteredChats}
                renderItem={renderChatItem}
                keyExtractor={(item) => item.id}
                style={styles.chatList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
            />

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
        // justifyContent: 'space-between',
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
    },
    backButton: {
        padding: 5,

    },
    headerTitle: {
        fontSize: 30,
        fontWeight: '600',
        color: '#2C3D5B',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 20,
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
});
