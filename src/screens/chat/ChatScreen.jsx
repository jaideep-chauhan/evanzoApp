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
    PermissionsAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MessageStatus from './MessageStatus';
import { useTheme } from '../../ThemeContext';
import socketService from '../../services/socketService';
import chatService from '../../services/chatService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DocumentPicker from 'react-native-document-picker';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

export default function ChatScreen({ route, navigation }) {
    const { chatId: initialChatId, chatName, avatar, isOnline: initialOnline, recipientId } = route.params;
    console.log('🔍 ChatScreen route params:', {
        initialChatId,
        chatName,
        recipientId,
        allParams: route.params
    });
    const [chatId, setChatId] = useState(initialChatId);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isOnline, setIsOnline] = useState(initialOnline || false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [showAttachmentModal, setShowAttachmentModal] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const flatListRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const currentUserIdRef = useRef(null); // Add ref to maintain userId consistency
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
    }, []);

    const initializeChat = async () => {
        try {
            setIsLoading(true);
            
            // Get current user ID - MUST be set before loading messages
            let userIdToUse = null;
            const userId = await AsyncStorage.getItem('userId');
            console.log('🔍 Current user ID from storage:', userId);
            
            if (!userId) {
                console.warn('⚠️ No userId found in storage, trying to get from userData');
                const userData = await AsyncStorage.getItem('userData');
                console.log('🔍 Raw userData from storage:', userData);
                if (userData) {
                    const user = JSON.parse(userData);
                    console.log('🔍 Parsed user object:', user);
                    userIdToUse = String(user?.user_id || user?.id);
                    console.log('🔍 Extracted userIdToUse:', userIdToUse);
                    setCurrentUserId(userIdToUse);
                    // Store it for next time
                    await AsyncStorage.setItem('userId', userIdToUse);
                }
            } else {
                userIdToUse = String(userId); // Ensure it's a string
                setCurrentUserId(userIdToUse);
                console.log('🔍 Using userId from storage:', userIdToUse);
            }
            
            // Log all user-related data from storage
            const token = await AsyncStorage.getItem('token');
            const authToken = await AsyncStorage.getItem('authToken');
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            const userData = await AsyncStorage.getItem('userData');
            const userProfile = await AsyncStorage.getItem('userProfile');
            
            console.log('🔑 CURRENT USER AUTHENTICATION DETAILS:');
            console.log('🔑 Token (token key):', token ? token.substring(0, 20) + '...' : 'No token');
            console.log('🔑 AuthToken (authToken key):', authToken ? authToken.substring(0, 20) + '...' : 'No authToken');
            console.log('🔑 RefreshToken:', refreshToken ? refreshToken.substring(0, 20) + '...' : 'No refreshToken');
            console.log('🔑 UserData:', userData);
            console.log('🔑 UserProfile:', userProfile);
            console.log('🔑 Final userId being used:', userIdToUse);
            
            // Parse and show user data details if available
            if (userData) {
                try {
                    const parsedUserData = JSON.parse(userData);
                    console.log('👤 PARSED USER DATA DETAILS:');
                    console.log('👤 User ID:', parsedUserData?.user_id || parsedUserData?.id);
                    console.log('👤 Username:', parsedUserData?.username);
                    console.log('👤 Email:', parsedUserData?.email);
                    console.log('👤 Full Name:', parsedUserData?.full_name || parsedUserData?.name);
                    console.log('👤 Role:', parsedUserData?.role);
                    console.log('👤 All user fields:', Object.keys(parsedUserData));
                } catch (e) {
                    console.error('❌ Failed to parse userData:', e);
                }
            }
            
            // Store in ref for consistent access in callbacks
            currentUserIdRef.current = userIdToUse;
            console.log('✅ Final currentUserId set to:', userIdToUse);
            console.log('✅ currentUserIdRef.current set to:', currentUserIdRef.current);

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
                    setChatId(actualChatId);
                    // Update route params with new chatId
                    navigation.setParams({ chatId: actualChatId });
                } else {
                    Alert.alert('Error', 'Failed to create chat');
                    navigation.goBack();
                    return;
                }
            }

            // Get chat details if needed in future
            // const chatResult = await chatService.getChatById(actualChatId);
            // if (chatResult.success) {
            //     // Use chat data if needed
            // }

            // Join chat room
            socketService.joinChat(actualChatId);

            // Load initial messages WITH the userId
            await loadMessages(actualChatId, userIdToUse);

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

    const loadMessages = async (chatIdToLoad, userIdToUse = null) => {
        try {
            // Use passed userId or fall back to state (but state might not be set yet)
            const effectiveUserId = userIdToUse || currentUserId;
            
            if (!effectiveUserId) {
                console.error('No user ID available for loading messages');
                return;
            }
            
            console.log('Loading messages with userId:', effectiveUserId);
            
            const result = await chatService.getChatMessages(chatIdToLoad || chatId, {
                limit: 50,
                page: 1
            });

            if (result.success && result.data.results) {
                const formattedMessages = result.data.results.map(msg => {
                    const isMyMessage = String(msg.sender_id) === String(effectiveUserId);
                    console.log(`Message ${msg.message_id}: sender_id=${msg.sender_id}, effectiveUserId=${effectiveUserId}, isMe=${isMyMessage}`);
                    
                    return {
                        id: msg.message_id,
                        text: msg.content,
                        timestamp: chatService.formatTime(msg.created_at),
                        isMe: isMyMessage,
                        messageType: msg.message_type || 'text',
                        status: msg.status || 'sent',
                        attachments: msg.attachments,
                        sender: msg.sender,
                        senderId: msg.sender_id,
                        createdAt: msg.created_at // Keep original timestamp for sorting
                    };
                });
                
                // Remove potential duplicates based on message ID
                const uniqueMessages = formattedMessages.filter((msg, index, self) => 
                    self.findIndex(m => m.id === msg.id) === index
                );
                
                // Sort messages by creation date (oldest first)
                const sortedMessages = uniqueMessages.sort((a, b) => 
                    new Date(a.createdAt) - new Date(b.createdAt)
                );
                
                setMessages(sortedMessages);
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    const setupSocketListeners = () => {
        // New message received
        socketService.on('new-message', (data) => {
            const effectiveUserId = currentUserIdRef.current;
            
            console.log('📨 New message received via socket:', {
                messageId: data.message.message_id,
                senderId: data.message.sender_id,
                effectiveUserId: effectiveUserId,
                isSameUser: String(data.message.sender_id) === String(effectiveUserId),
                content: data.message.content?.substring(0, 20) + '...'
            });
            
            // Skip if this is our own message (we already have the optimistic message)
            if (String(data.message.sender_id) === String(effectiveUserId)) {
                console.log('📤 This is our own message, updating optimistic message status');
                // Just update the status of our optimistic message
                setMessages(prev => prev.map(msg => {
                    // Find the optimistic message and update it with real data
                    if (msg.status === 'sending' && msg.text === data.message.content) {
                        console.log('✅ Found and updated optimistic message');
                        return {
                            ...msg,
                            id: data.message.message_id,
                            status: 'sent',
                            createdAt: data.message.created_at
                        };
                    }
                    return msg;
                }));
                return;
            }
            
            console.log('📥 Message from another user, adding to chat');
            // This is a message from another user
            const newMsg = {
                id: data.message.message_id,
                text: data.message.content,
                timestamp: chatService.formatTime(data.message.created_at),
                isMe: false, // Always false since this is from another user
                messageType: data.message.message_type || 'text',
                status: data.message.status || 'sent',
                attachments: data.message.attachments,
                sender: data.message.sender,
                senderId: data.message.sender_id,
                createdAt: data.message.created_at
            };
            
            // Prevent duplicate messages by checking if message already exists
            setMessages(prev => {
                const messageExists = prev.some(msg => msg.id === newMsg.id);
                if (messageExists) {
                    console.log('⚠️ Message already exists, not adding duplicate');
                    return prev; // Don't add duplicate
                }
                return [...prev, newMsg];
            });
            
            // Mark as read since chat is open
            chatService.markMessageAsRead(data.message.message_id);

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
        if (newMessage.trim().length === 0 || isSending || !chatId) return;

        const messageText = newMessage.trim();
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        
        console.log('🚀 ===== STARTING MESSAGE SEND =====');
        console.log('📝 Message send initiated with:', {
            messageText: messageText,
            tempId: tempId,
            chatId: chatId,
            currentUserId: currentUserId,
            currentUserIdRef: currentUserIdRef.current,
            recipientId: recipientId,
            timestamp: new Date().toISOString()
        });
        
        // Log current authentication state
        const authToken = await AsyncStorage.getItem('authToken');
        console.log('🔐 Current auth state during send:', {
            hasAuthToken: !!authToken,
            authTokenPreview: authToken ? authToken.substring(0, 20) + '...' : 'No token'
        });
        
        // Add optimistic message
        const optimisticMessage = {
            id: tempId,
            text: messageText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true,
            messageType: 'text',
            status: 'sending',
            senderId: currentUserId,
            createdAt: new Date().toISOString() // Add for consistent sorting
        };

        console.log('📤 Creating optimistic message:', optimisticMessage);

        // Check for duplicates before adding
        setMessages(prev => {
            const messageExists = prev.some(msg => msg.id === tempId);
            if (messageExists) {
                console.log('⚠️ Optimistic message already exists, not adding');
                return prev;
            }
            console.log('✅ Adding optimistic message to UI');
            return [...prev, optimisticMessage];
        });
        setNewMessage('');
        setIsSending(true);

        // Stop typing indicator
        socketService.stopTyping(chatId);

        try {
            console.log('🌐 About to call API sendMessage with:', {
                chatId: chatId,
                messageText: messageText,
                messageType: 'text'
            });
            
            // Send via API
            const result = await chatService.sendMessage(chatId, messageText);
            
            console.log('📤 ===== API RESPONSE RECEIVED =====');
            console.log('📤 Full API result:', JSON.stringify(result, null, 2));
            
            if (result.success && result.data) {
                console.log('✅ Message sent successfully!');
                console.log('📤 Response data details:', {
                    messageId: result.data.message_id,
                    senderId: result.data.sender_id,
                    content: result.data.content,
                    status: result.data.status,
                    createdAt: result.data.created_at,
                    allResponseFields: Object.keys(result.data)
                });
                
                // Update optimistic message with real data
                setMessages(prev => prev.map(msg => {
                    if (msg.id === tempId) {
                        const updatedMsg = {
                            ...msg,
                            id: result.data.message_id,
                            status: 'sent',
                            createdAt: result.data.created_at,
                            senderId: result.data.sender_id
                        };
                        console.log('🔄 Updated optimistic message:', updatedMsg);
                        return updatedMsg;
                    }
                    return msg;
                }));
            } else {
                console.error('❌ Failed to send message:', {
                    success: result.success,
                    message: result.message,
                    hasData: !!result.data,
                    fullResult: result
                });
                // Remove optimistic message on failure
                setMessages(prev => prev.filter(msg => msg.id !== tempId));
                Alert.alert('Error', result.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('❌ ===== MESSAGE SEND ERROR =====');
            console.error('❌ Error details:', error);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error stack:', error.stack);
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            Alert.alert('Error', 'Failed to send message');
        } finally {
            setIsSending(false);
            console.log('🏁 ===== MESSAGE SEND COMPLETED =====');
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

    const requestGalleryPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                    {
                        title: 'Gallery Permission',
                        message: 'This app needs access to your gallery to send photos',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    },
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: 'Camera Permission',
                        message: 'This app needs access to your camera to take photos',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    },
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    const handleImagePicker = async () => {
        setShowAttachmentModal(false);
        
        const hasPermission = await requestGalleryPermission();
        if (!hasPermission) {
            Alert.alert('Permission Required', 'Gallery permission is required to select photos');
            return;
        }
        
        const options = {
            mediaType: 'photo',
            includeBase64: false,
            maxHeight: 2000,
            maxWidth: 2000,
            quality: 0.8,
        };

        launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.errorMessage) {
                console.log('ImagePicker Error: ', response.errorMessage);
                Alert.alert('Error', 'Failed to select image');
            } else if (response.assets && response.assets[0]) {
                const asset = response.assets[0];
                // Pass the complete asset object with all properties
                sendMediaMessage(asset, 'image');
            }
        });
    };

    const handleCameraLaunch = async () => {
        setShowAttachmentModal(false);
        
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
            Alert.alert('Permission Required', 'Camera permission is required to take photos');
            return;
        }
        
        const options = {
            mediaType: 'photo',
            includeBase64: false,
            maxHeight: 2000,
            maxWidth: 2000,
            quality: 0.8,
            saveToPhotos: false,
        };

        launchCamera(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled camera');
            } else if (response.errorMessage) {
                console.log('Camera Error: ', response.errorMessage);
                Alert.alert('Error', 'Failed to take photo');
            } else if (response.assets && response.assets[0]) {
                const asset = response.assets[0];
                // Pass the complete asset object with all properties
                sendMediaMessage(asset, 'image');
            }
        });
    };

    const handleDocumentPicker = async () => {
        setShowAttachmentModal(false);
        
        // Document picker doesn't require specific permissions on most platforms
        // but we handle potential permission issues in the error catch
        try {
            console.log('Opening document picker...');
            const result = await DocumentPicker.pick({
                type: [DocumentPicker.types.allFiles],  // Use allFiles to avoid type issues
                copyTo: 'cachesDirectory',
            });

            console.log('Document picked:', result);
            
            if (result && result[0]) {
                const document = result[0];
                console.log('Sending document:', {
                    uri: document.uri,
                    name: document.name,
                    size: document.size,
                    type: document.type
                });
                await sendMediaMessage(document, 'document');
            }
        } catch (err) {
            if (!DocumentPicker.isCancel(err)) {
                console.error('Document picker error:', err);
                console.error('Error details:', {
                    message: err.message,
                    code: err.code,
                    stack: err.stack
                });
                Alert.alert(
                    'Error', 
                    `Failed to pick document: ${err.message || 'Unknown error'}`
                );
            } else {
                console.log('Document picker cancelled');
            }
        }
    };

    const sendMediaMessage = async (file, type) => {
        if (!chatId) return;
        
        setUploadingFile(true);
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        
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
            createdAt: new Date().toISOString() // Add for consistent sorting
        };

        setMessages(prev => [...prev, optimisticMessage]);

        try {
            // Send via API
            const formData = new FormData();
            
            // Add other fields first (order matters sometimes)
            // Backend expects 'message_type' not 'messageType'
            formData.append('content', '');
            formData.append('message_type', type || 'image');
            
            // Prepare file object - ensuring we have all required fields
            const fileObject = {
                uri: file.uri || file.fileCopyUri,
                type: file.type || (type === 'image' ? 'image/jpeg' : 'application/octet-stream'), 
                name: file.fileName || file.name || (type === 'image' ? `photo_${Date.now()}.jpg` : `document_${Date.now()}`),
            };
            
            // Backend now expects 'file' field name (singular) after route update
            // Add the file last
            formData.append('file', fileObject);
            
            console.log('Sending media message with FormData:', {
                fileObject,
                messageType: type,
                fileUri: file.uri,
                fileType: file.type,
                fileName: file.fileName || file.name
            });

            const result = await chatService.sendMediaMessage(chatId, formData);
            
            console.log('📱 ChatScreen - Media send result:', result);
            
            if (result.success) {
                console.log('✅ ChatScreen - Media sent successfully, updating message');
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
                console.error('❌ ChatScreen - Media send failed:', result.message);
                // Remove optimistic message on failure
                setMessages(prev => prev.filter(msg => msg.id !== tempId));
                Alert.alert('Error', result.message || 'Failed to send file');
            }
        } catch (error) {
            console.error('❌ ChatScreen - Exception in sendMediaMessage:', error);
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
                    keyExtractor={(item, index) => `msg-${item.id}-${index}`}
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
                                onPress={handleCameraLaunch}
                            >
                                <View style={[styles.attachmentIcon, { backgroundColor: '#F3E5F5' }]}>
                                    <Icon name="camera" size={24} color="#9C27B0" />
                                </View>
                                <Text style={styles.attachmentLabel}>Camera</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.attachmentOption}
                                onPress={handleImagePicker}
                            >
                                <View style={[styles.attachmentIcon, { backgroundColor: '#E3F2FD' }]}>
                                    <Icon name="image" size={24} color="#2196F3" />
                                </View>
                                <Text style={styles.attachmentLabel}>Gallery</Text>
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