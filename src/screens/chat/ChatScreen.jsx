import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Image,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MessageStatus from './MessageStatus';
import { useTheme } from '../../ThemeContext';

// Mock messages data - replace with real data from your backend
const mockMessages = [
    {
        id: '1',
        text: 'Hi! I saw your event listing and I\'m interested in providing catering services.',
        timestamp: '10:00 AM',
        isMe: false,
        messageType: 'text',
        status: 'read',
    },
    {
        id: '2',
        text: 'That sounds great! Can you tell me more about your menu options?',
        timestamp: '10:02 AM',
        isMe: true,
        messageType: 'text',
        status: 'read',
    },
    {
        id: '3',
        text: 'Of course! We specialize in both traditional and modern cuisine. We can accommodate 50-500 guests.',
        timestamp: '10:05 AM',
        isMe: false,
        messageType: 'text',
        status: 'read',
    },
    {
        id: '4',
        text: 'Perfect! We\'re expecting around 150 guests. What would be the pricing for that?',
        timestamp: '10:07 AM',
        isMe: true,
        messageType: 'text',
        status: 'read',
    },
    {
        id: '5',
        text: 'For 150 guests, our packages start from $25 per person. This includes appetizers, main course, dessert, and service staff.',
        timestamp: '10:10 AM',
        isMe: false,
        messageType: 'text',
        status: 'read',
    },
    {
        id: '6',
        text: 'That sounds reasonable. Can you send me some photos of your previous work?',
        timestamp: '10:12 AM',
        isMe: true,
        messageType: 'text',
        status: 'delivered',
    },
    {
        id: '7',
        text: 'Absolutely! I\'ll send you our portfolio shortly.',
        timestamp: '10:15 AM',
        isMe: false,
        messageType: 'text',
        status: 'read',
    },
];

export default function ChatScreen({ route, navigation }) {
    const { chatId, chatName, avatar, isOnline } = route.params;
    const [messages, setMessages] = useState(mockMessages);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef(null);
    const theme = useTheme();

    useEffect(() => {
        // Scroll to bottom when messages change
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const sendMessage = () => {
        if (newMessage.trim().length === 0) return;

        const message = {
            id: (messages.length + 1).toString(),
            text: newMessage.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true,
            messageType: 'text',
            status: 'sending',
        };

        setMessages(prevMessages => [...prevMessages, message]);
        setNewMessage('');

        // Simulate message status updates
        setTimeout(() => {
            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    msg.id === message.id ? { ...msg, status: 'sent' } : msg
                )
            );
        }, 1000);

        setTimeout(() => {
            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    msg.id === message.id ? { ...msg, status: 'delivered' } : msg
                )
            );
        }, 2000);

        // Simulate typing indicator and response (remove in production)
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            const autoResponse = {
                id: (messages.length + 2).toString(),
                text: 'Thanks for your message! I\'ll get back to you shortly.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isMe: false,
                messageType: 'text',
                status: 'read',
            };
            setMessages(prevMessages => [...prevMessages, autoResponse]);

            // Mark user message as read after response
            setTimeout(() => {
                setMessages(prevMessages =>
                    prevMessages.map(msg =>
                        msg.id === message.id ? { ...msg, status: 'read' } : msg
                    )
                );
            }, 500);
        }, 3000);
    };

    const formatTime = (timestamp) => {
        return timestamp;
    };

    const renderMessage = ({ item, index }) => {
        const isMe = item.isMe;
        const showTimestamp = index === 0 ||
            messages[index - 1]?.timestamp !== item.timestamp ||
            messages[index - 1]?.isMe !== item.isMe;

        return (
            <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
                <View style={[styles.messageBubble, isMe ? [styles.myBubble, { backgroundColor: theme.colors.primary }] : styles.theirBubble]}>
                    <Text style={[styles.messageText, isMe ? styles.myText : [styles.theirText, { color: theme.colors.primary }]]}>
                        {item.text}
                    </Text>
                </View>
                <View style={[styles.messageFooter, isMe ? styles.myMessageFooter : styles.theirMessageFooter]}>
                    {showTimestamp && (
                        <Text style={[styles.messageTime, isMe ? styles.myTime : styles.theirTime]}>
                            {formatTime(item.timestamp)}
                        </Text>
                    )}
                    <MessageStatus status={item.status} isMe={isMe} />
                </View>
            </View>
        );
    };

    const renderTypingIndicator = () => {
        if (!isTyping) return null;

        return (
            <View style={[styles.messageContainer, styles.theirMessage]}>
                <View style={[styles.messageBubble, styles.theirBubble, styles.typingBubble]}>
                    <View style={styles.typingIndicator}>
                        <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
                        <View style={[styles.typingDot, { animationDelay: '200ms' }]} />
                        <View style={[styles.typingDot, { animationDelay: '400ms' }]} />
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: '#f6f8fa', flex: 1 }]}>
            <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>

                <View style={styles.headerContent}>
                    <View style={styles.avatarContainer}>
                        <Image source={{ uri: avatar }} style={styles.headerAvatar} />
                        {isOnline && <View style={styles.onlineIndicator} />}
                    </View>

                    <View style={styles.headerText}>
                        <Text style={styles.headerName}>{chatName}</Text>
                        <Text style={styles.headerStatus}>
                            {isOnline ? 'Online' : 'Last seen recently'}
                        </Text>
                    </View>
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.headerAction}>
                        <Icon name="ellipsis-vertical" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Messages List */}
            <View style={{ flex: 1, marginBottom: 70 }}>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    style={styles.messagesList}
                    contentContainerStyle={styles.messagesContainer}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={renderTypingIndicator}
                />
            </View>

            {/* Input Bar */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={[styles.inputContainer, { position: 'absolute', left: 0, right: 0, bottom: 10, zIndex: 10 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={styles.inputBar}>
                            <TouchableOpacity style={styles.attachButton}>
                                <Icon name="add" size={24} color="#8B95A5" />
                            </TouchableOpacity>
                            <TextInput
                                style={[styles.textInput, { color: theme.colors.primary }]}
                                placeholder="Type a message..."
                                placeholderTextColor="#8B95A5"
                                value={newMessage}
                                onChangeText={setNewMessage}
                                multiline
                                maxLength={1000}
                            />
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                newMessage.trim().length > 0 && [styles.sendButtonActive, { backgroundColor: theme.colors.primary }],
                            ]}
                            onPress={sendMessage}
                            disabled={newMessage.trim().length === 0}
                        >
                            <Icon
                                name={newMessage.trim().length > 0 ? "send" : "mic"}
                                size={22}
                                color={newMessage.trim().length > 0 ? "#fff" : "#8B95A5"}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
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
        backgroundColor: '#2C3D5B',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight,

        shadowRadius: 8,

    },
    backButton: {
        padding: 5,
        marginRight: 10,
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e3e8f0',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#2C3D5B',
    },
    headerText: {
        flex: 1,
    },
    headerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    headerStatus: {
        fontSize: 12,
        color: '#B8C5E0',
        marginTop: 2,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAction: {
        padding: 8,
        marginLeft: 5,
    },
    messagesList: {
        flex: 1,
    },
    messagesContainer: {
        paddingVertical: 20,
        paddingHorizontal: 15,
    },
    messageContainer: {
        marginVertical: 2,
    },
    myMessage: {
        alignItems: 'flex-end',
    },
    theirMessage: {
        alignItems: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        marginVertical: 2,
    },
    myBubble: {
        backgroundColor: '#2C3D5B',
        borderBottomRightRadius: 5,
    },
    theirBubble: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 5,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 20,
    },
    myText: {
        color: '#fff',
    },
    theirText: {
        color: '#2C3D5B',
    },
    messageTime: {
        fontSize: 11,
        marginTop: 2,
    },
    myTime: {
        color: '#8B95A5',
    },
    theirTime: {
        color: '#8B95A5',
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
        marginHorizontal: 5,
    },
    myMessageFooter: {
        justifyContent: 'flex-end',
    },
    theirMessageFooter: {
        justifyContent: 'flex-start',
    },
    typingBubble: {
        paddingVertical: 12,
        paddingHorizontal: 18,
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#8B95A5',
        marginHorizontal: 2,
    },
    inputContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#e3e8f0',
    },
    inputBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#f6f8fa',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 8,
        maxHeight: 100,
    },
    attachButton: {
        padding: 5,
        marginRight: 10,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#2C3D5B',
        maxHeight: 80,
        paddingVertical: 8,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        backgroundColor: '#e3e8f0',
        borderWidth: 1.5,
        borderColor: '#d1d5db',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    sendButtonActive: {
        backgroundColor: '#2C3D5B',
        borderColor: '#2C3D5B',
        shadowColor: '#2C3D5B',
        shadowOpacity: 0.25,
        elevation: 6,
    },
});
