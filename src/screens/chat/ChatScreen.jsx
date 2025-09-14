import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    ImageBackground,
    ActivityIndicator,
    Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MessageStatus from './MessageStatus';
import { useTheme } from '../../ThemeContext';
import socketService from '../../services/socketService';
import chatService from '../../services/chatService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DocumentPicker from 'react-native-document-picker';
import { launchImageLibrary } from 'react-native-image-picker';

export default function ChatScreen({ route, navigation }) {
    const { chatId, chatName, avatar, isOnline: initialOnline, recipientId } = route.params;
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isOnline, setIsOnline] = useState(initialOnline || false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [chat, setChat] = useState(null);
    const [showAttachmentModal, setShowAttachmentModal] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const flatListRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const theme = useTheme();

    // Initialize chat and socket connection
    useEffect(() => {
        initializeChat();
        return () => {
            // Cleanup on unmount
            if (chatId) {
                socketService.leaveChat(chatId);
            }
            socketService.off('new-message');
            socketService.off('message-delivered');
            socketService.off('message-read');
            socketService.off('user-typing');
            socketService.off('user-stopped-typing');
            socketService.off('user-status-changed');
        };
    }, [chatId]);

    const initializeChat = async () => {
        try {
            setIsLoading(true);
            
            // Get current user ID
            const userId = await AsyncStorage.getItem('userId');
            setCurrentUserId(userId);

            // Connect to socket if not connected
            if (!socketService.isSocketConnected()) {
                await socketService.connect();
            }

            let actualChatId = chatId;

            // If no chatId but have recipientId, create direct chat
            if (!chatId && recipientId) {
                const result = await chatService.createDirectChat(recipientId);
                if (result.success) {
                    actualChatId = result.data.chat_id;
                    // Update route params with new chatId
                    navigation.setParams({ chatId: actualChatId });
                } else {
                    Alert.alert('Error', 'Failed to create chat');
                    navigation.goBack();
                    return;
                }
            }

            // Get chat details
            const chatResult = await chatService.getChatById(actualChatId);
            if (chatResult.success) {
                setChat(chatResult.data);
            }

            // Join chat room
            socketService.joinChat(actualChatId);

            // Load initial messages
            await loadMessages(actualChatId);

            // Setup socket event listeners
            setupSocketListeners();

            // Mark chat as read
            await chatService.markChatAsRead(actualChatId);

        } catch (error) {
            console.error('Failed to initialize chat:', error);
            Alert.alert('Error', 'Failed to load chat');
        } finally {
            setIsLoading(false);
        }
    };

    const loadMessages = async (chatIdToLoad) => {
        try {
            const result = await chatService.getChatMessages(chatIdToLoad || chatId, {
                limit: 50,
                page: 1
            });

            if (result.success && result.data.results) {
                const formattedMessages = result.data.results.map(msg => ({
                    id: msg.message_id,
                    text: msg.content,
                    timestamp: chatService.formatTime(msg.created_at),
                    isMe: msg.sender_id === currentUserId,
                    messageType: msg.message_type || 'text',
                    status: msg.status || 'sent',
                    attachments: msg.attachments,
                    sender: msg.sender
                }));
                setMessages(formattedMessages.reverse());
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    const setupSocketListeners = () => {
        // New message received
        socketService.on('new-message', (data) => {
            const newMsg = chatService.formatMessage(data.message);
            newMsg.isMe = data.message.sender_id === currentUserId;
            
            setMessages(prev => [...prev, newMsg]);
            
            // Mark as read if chat is open
            if (data.message.sender_id !== currentUserId) {
                chatService.markMessageAsRead(data.message.message_id);
            }

            // Clear typing indicator for this user
            setTypingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(data.message.sender_id);
                return newSet;
            });
        });

        // Message delivered
        socketService.on('message-delivered', (data) => {
            setMessages(prev => prev.map(msg => 
                msg.id === data.messageId 
                    ? { ...msg, status: 'delivered' }
                    : msg
            ));
        });

        // Message read
        socketService.on('message-read', (data) => {
            setMessages(prev => prev.map(msg => 
                msg.id === data.messageId 
                    ? { ...msg, status: 'read' }
                    : msg
            ));
        });

        // User typing
        socketService.on('user-typing', (data) => {
            if (data.userId !== currentUserId) {
                setTypingUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.add(data.userId);
                    return newSet;
                });
                setIsTyping(true);
            }
        });

        // User stopped typing
        socketService.on('user-stopped-typing', (data) => {
            setTypingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(data.userId);
                return newSet;
            });
            if (typingUsers.size === 0) {
                setIsTyping(false);
            }
        });

        // User status changed
        socketService.on('user-status-changed', (data) => {
            if (data.userId === recipientId) {
                setIsOnline(data.status === 'online');
            }
        });
    };

    const sendMessage = async () => {
        if (newMessage.trim().length === 0 || isSending) return;

        const messageText = newMessage.trim();
        const tempId = `temp-${Date.now()}`;
        
        // Add optimistic message
        const optimisticMessage = {
            id: tempId,
            text: messageText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true,
            messageType: 'text',
            status: 'sending',
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');
        setIsSending(true);

        // Stop typing indicator
        socketService.stopTyping(chatId);

        try {
            // Send via API
            const result = await chatService.sendMessage(chatId, messageText);
            
            if (result.success) {
                // Update optimistic message with real data
                setMessages(prev => prev.map(msg => 
                    msg.id === tempId 
                        ? {
                            ...msg,
                            id: result.data.message_id,
                            status: 'sent'
                        }
                        : msg
                ));
            } else {
                // Remove optimistic message on failure
                setMessages(prev => prev.filter(msg => msg.id !== tempId));
                Alert.alert('Error', 'Failed to send message');
            }
        } catch (error) {
            console.error('Send message error:', error);
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            Alert.alert('Error', 'Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    const handleTyping = () => {
        if (!chatId) return;

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Send typing indicator
        socketService.startTyping(chatId);

        // Auto stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            socketService.stopTyping(chatId);
        }, 2000);
    };

    const formatTime = (timestamp) => {
        return timestamp;
    };

    const handleImagePicker = () => {
        setShowAttachmentModal(false);
        const options = {
            mediaType: 'photo',
            includeBase64: false,
            maxHeight: 2000,
            maxWidth: 2000,
        };

        launchImageLibrary(options, async (response) => {
            if (response.didCancel || response.errorMessage) {
                return;
            }

            const asset = response.assets[0];
            if (asset) {
                await sendMediaMessage(asset, 'image');
            }
        });
    };

    const handleDocumentPicker = async () => {
        setShowAttachmentModal(false);
        try {
            const result = await DocumentPicker.pick({
                type: [DocumentPicker.types.pdf, DocumentPicker.types.doc, DocumentPicker.types.docx, DocumentPicker.types.plainText],
                copyTo: 'cachesDirectory',
            });

            if (result && result[0]) {
                await sendMediaMessage(result[0], 'document');
            }
        } catch (err) {
            if (!DocumentPicker.isCancel(err)) {
                Alert.alert('Error', 'Failed to pick document');
            }
        }
    };

    const sendMediaMessage = async (file, type) => {
        setUploadingFile(true);
        const tempId = `temp-${Date.now()}`;
        
        // Add optimistic message
        const optimisticMessage = {
            id: tempId,
            text: type === 'image' ? '📷 Photo' : '📄 Document',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true,
            messageType: type,
            status: 'sending',
            attachments: [{
                type: type,
                uri: file.uri,
                name: file.name || 'file',
                size: file.fileSize || file.size,
            }],
        };

        setMessages(prev => [...prev, optimisticMessage]);

        try {
            // Send via API
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri || file.fileCopyUri,
                type: file.type || (type === 'image' ? 'image/jpeg' : 'application/octet-stream'),
                name: file.name || file.fileName || `file_${Date.now()}`,
            });
            formData.append('messageType', type);
            formData.append('content', '');

            const result = await chatService.sendMediaMessage(chatId, formData);
            
            if (result.success) {
                // Update optimistic message with real data
                setMessages(prev => prev.map(msg => 
                    msg.id === tempId 
                        ? {
                            ...msg,
                            id: result.data.message_id,
                            status: 'sent',
                            attachments: result.data.attachments,
                        }
                        : msg
                ));
            } else {
                // Remove optimistic message on failure
                setMessages(prev => prev.filter(msg => msg.id !== tempId));
                Alert.alert('Error', 'Failed to send file');
            }
        } catch (error) {
            console.error('Send media error:', error);
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            Alert.alert('Error', 'Failed to send file');
        } finally {
            setUploadingFile(false);
        }
    };

    const renderMessage = ({ item, index }) => {
        const isMe = item.isMe;
        const showTimestamp = index === 0 ||
            messages[index - 1]?.timestamp !== item.timestamp ||
            messages[index - 1]?.isMe !== item.isMe;

        return (
            <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
                <View style={[styles.messageBubble, isMe ? [styles.myBubble] : styles.theirBubble]}>
                    {item.messageType === 'image' && item.attachments?.[0] ? (
                        <TouchableOpacity onPress={() => {/* Handle image view */}}>
                            <Image 
                                source={{ uri: item.attachments[0].uri || item.attachments[0].url }} 
                                style={styles.messageImage}
                                resizeMode="cover"
                            />
                        </TouchableOpacity>
                    ) : item.messageType === 'document' && item.attachments?.[0] ? (
                        <TouchableOpacity 
                            style={styles.documentContainer}
                            onPress={() => {/* Handle document open */}}
                        >
                            <Icon name="document-attach" size={24} color={isMe ? '#2C3D5B' : theme.colors.primary} />
                            <View style={styles.documentInfo}>
                                <Text style={[styles.documentName, isMe ? styles.myText : styles.theirText]} numberOfLines={1}>
                                    {item.attachments[0].name || 'Document'}
                                </Text>
                                {item.attachments[0].size && (
                                    <Text style={[styles.documentSize, isMe ? styles.myTime : styles.theirTime]}>
                                        {formatFileSize(item.attachments[0].size)}
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <Text style={[styles.messageText, isMe ? styles.myText : [styles.theirText, { color: theme.colors.primary }]]}>
                            {item.text}
                        </Text>
                    )}
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

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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

    useEffect(() => {
        // Scroll to bottom when messages change
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    if (isLoading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading chat...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
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
                            {isTyping ? 'Typing...' : isOnline ? 'Online' : 'Last seen recently'}
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
            <ImageBackground
                source={require('../../assets/images/chatBG.jpg')}
                style={styles.messagesList}
                resizeMode="cover"
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    style={styles.messagesList}
                    contentContainerStyle={styles.messagesContainer}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={renderTypingIndicator}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No messages yet. Start a conversation!</Text>
                        </View>
                    }
                />
            </ImageBackground>

            {/* Sticky Input Bar */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={styles.inputSectionContainer}>
                    <View style={styles.inputSection}>
                        <View style={styles.inputBar}>
                            <TouchableOpacity 
                                style={styles.attachButton}
                                onPress={() => setShowAttachmentModal(true)}
                                disabled={uploadingFile}
                            >
                                <Icon name="add" size={24} color={uploadingFile ? "#ccc" : "#8B95A5"} />
                            </TouchableOpacity>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Type a message..."
                                placeholderTextColor="#8B95A5"
                                value={newMessage}
                                onChangeText={(text) => {
                                    setNewMessage(text);
                                    handleTyping();
                                }}
                                multiline
                                maxLength={1000}
                                editable={!isSending}
                            />
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                newMessage.trim().length > 0 && [styles.sendButtonActive, { backgroundColor: theme.colors.primary }],
                            ]}
                            onPress={sendMessage}
                            disabled={newMessage.trim().length === 0 || isSending}
                        >
                            {isSending ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Icon
                                    name={newMessage.trim().length > 0 ? "send" : "mic"}
                                    size={22}
                                    color={newMessage.trim().length > 0 ? "#fff" : "#8B95A5"}
                                />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Attachment Modal */}
            <Modal
                visible={showAttachmentModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowAttachmentModal(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowAttachmentModal(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Send Attachment</Text>
                        </View>
                        <View style={styles.attachmentOptions}>
                            <TouchableOpacity 
                                style={styles.attachmentOption}
                                onPress={handleImagePicker}
                            >
                                <View style={[styles.attachmentIcon, { backgroundColor: '#E3F2FD' }]}>
                                    <Icon name="image" size={24} color="#2196F3" />
                                </View>
                                <Text style={styles.attachmentLabel}>Photo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.attachmentOption}
                                onPress={handleDocumentPicker}
                            >
                                <View style={[styles.attachmentIcon, { backgroundColor: '#FFF3E0' }]}>
                                    <Icon name="document" size={24} color="#FF9800" />
                                </View>
                                <Text style={styles.attachmentLabel}>Document</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f6f8fa',
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
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
        paddingBottom: 100,
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
        backgroundColor: '#E9F1FF',
        borderBottomRightRadius: 5,
    },
    theirBubble: {
        backgroundColor: '#E9F1FF',
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
        color: '#2C3D5B',
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
    inputSectionContainer: {
        position: 'absolute',
        bottom: 15,
        left: 0,
        right: 0,
        paddingHorizontal: 15,
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    inputSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    inputBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2F5',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 10,
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
        paddingVertical: 0,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EEF2F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonActive: {
        backgroundColor: '#2C3D5B',
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 10,
    },
    documentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        minWidth: 200,
    },
    documentInfo: {
        marginLeft: 10,
        flex: 1,
    },
    documentName: {
        fontSize: 14,
        fontWeight: '600',
    },
    documentSize: {
        fontSize: 12,
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 30,
    },
    modalHeader: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e3e8f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2C3D5B',
        textAlign: 'center',
    },
    attachmentOptions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 30,
    },
    attachmentOption: {
        alignItems: 'center',
    },
    attachmentIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    attachmentLabel: {
        fontSize: 14,
        color: '#2C3D5B',
        fontWeight: '500',
    },
});