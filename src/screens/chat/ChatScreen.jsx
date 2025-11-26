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
    Linking,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MessageStatus from './MessageStatus';
import { useTheme } from '../../ThemeContext';
import socketService from '../../services/socketService';
import chatService from '../../services/chatService';
import api from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DocumentPicker from 'react-native-document-picker';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';
import Contacts from 'react-native-contacts';
import Video from 'react-native-video';
import VoiceRecorder from '../../components/VoiceRecorder';
import AudioPlayer from '../../components/AudioPlayer';
import ReactionPicker from '../../components/ReactionPicker';
import MessageOptionsModal from '../../components/MessageOptionsModal';
import MessageReactions from '../../components/MessageReactions';
import ImagePreview from '../../components/ImagePreview';
import preSavedMessageService from '../../services/preSavedMessageService';

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
    const [isRecordingVoice, setIsRecordingVoice] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [showMessageOptions, setShowMessageOptions] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [reactionPickerPosition, setReactionPickerPosition] = useState(null);
    const [showImagePreview, setShowImagePreview] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState(null);
    const [previewImageName, setPreviewImageName] = useState(null);
    const [showContactPicker, setShowContactPicker] = useState(false);
    const [contactsList, setContactsList] = useState([]);
    const [contactSearchQuery, setContactSearchQuery] = useState('');
    const [showQuickMessageModal, setShowQuickMessageModal] = useState(false);
    const [quickMessageTemplate, setQuickMessageTemplate] = useState('');
    const [editableQuickMessage, setEditableQuickMessage] = useState('');
    const [loadingQuickMessage, setLoadingQuickMessage] = useState(false);
    const flatListRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const currentUserIdRef = useRef(null); // Add ref to maintain userId consistency
    const selectedMessageRef = useRef(null); // Add ref to preserve selected message during async operations
    const textInputRef = useRef(null); // Add ref for text input to maintain focus
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
            socketService.off('message-reaction');
            socketService.off('message-deleted');
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
                console.log('📞 Creating direct chat with recipientId:', recipientId);
                const result = await chatService.createDirectChat(recipientId);
                console.log('📞 Direct chat creation result:', result);

                if (result.success) {
                    actualChatId = result.data.chat_id;
                    setChatId(actualChatId);
                    console.log('✅ Direct chat created successfully with chatId:', actualChatId);
                    // Update route params with new chatId
                    navigation.setParams({ chatId: actualChatId });
                } else {
                    console.error('❌ Failed to create direct chat:', result.message);
                    Alert.alert('Error', result.message || 'Failed to create chat');
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
                console.log(`📥 loadMessages - Received ${result.data.results.length} messages from backend`);

                // Filter out messages deleted for current user
                const visibleMessages = result.data.results.filter(msg => {
                    const deletedFor = msg.metadata?.deleted_for || [];
                    // Check both string and number formats since backend stores as string
                    const isDeletedForMe = deletedFor.includes(String(effectiveUserId)) ||
                                          deletedFor.includes(Number(effectiveUserId)) ||
                                          deletedFor.includes(effectiveUserId);
                    if (isDeletedForMe) {
                        console.log(`🗑️ loadMessages - Message ${msg.message_id} is deleted for user ${effectiveUserId}, hiding it`, {
                            deletedFor,
                            effectiveUserId,
                            type: typeof effectiveUserId
                        });
                    }
                    return !isDeletedForMe;
                });

                console.log(`📥 loadMessages - After filtering: ${visibleMessages.length} visible messages`);

                const formattedMessages = visibleMessages.map(msg => {
                    const isMyMessage = String(msg.sender_id) === String(effectiveUserId);
                    console.log(`Message ${msg.message_id}: sender_id=${msg.sender_id}, effectiveUserId=${effectiveUserId}, isMe=${isMyMessage}`);

                    // Extract duration from metadata for audio messages
                    let duration = 0;
                    if (msg.message_type === 'audio' && msg.metadata?.duration) {
                        duration = msg.metadata.duration;
                    } else if (msg.message_type === 'audio' && msg.attachments?.[0]?.metadata?.duration) {
                        duration = msg.attachments[0].metadata.duration;
                    }

                    // Process attachments to fix URLs (localhost → API URL)
                    const processedAttachments = chatService.processAttachments(msg.attachments);

                    // Parse contact data if message type is contact
                    let contactData = null;
                    if (msg.message_type === 'contact' && msg.content) {
                        try {
                            contactData = JSON.parse(msg.content);
                            console.log('📇 Parsed contact data from message:', contactData);
                        } catch (e) {
                            console.warn('Failed to parse contact data:', e);
                            console.warn('Contact content was:', msg.content);
                        }
                    }

                    return {
                        id: msg.message_id,
                        text: msg.content,
                        timestamp: chatService.formatTime(msg.created_at),
                        isMe: isMyMessage,
                        messageType: msg.message_type || 'text',
                        status: msg.status || 'sent',
                        attachments: processedAttachments,
                        sender: msg.sender,
                        senderId: msg.sender_id,
                        reactions: msg.reactions || [],
                        createdAt: msg.created_at, // Keep original timestamp for sorting
                        duration: duration, // Add duration for audio messages
                        contactData: contactData // Add parsed contact data for contact messages
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

                // Auto-scroll to latest message after messages are rendered
                // Use longer delay to ensure FlatList has rendered all items
                setTimeout(() => {
                    if (flatListRef.current && sortedMessages.length > 0) {
                        console.log('📜 Scrolling to end after loading messages');
                        flatListRef.current.scrollToEnd({ animated: false }); // Use false for instant scroll on load
                    }
                }, 300);
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

            // Extract duration for audio messages
            let duration = 0;
            if (data.message.message_type === 'audio') {
                duration = data.message.metadata?.duration || data.message.attachments?.[0]?.metadata?.duration || 0;
            }

            // Process attachments to fix URLs (localhost → API URL)
            const processedAttachments = chatService.processAttachments(data.message.attachments);

            // Parse contact data if message type is contact
            let contactData = null;
            if (data.message.message_type === 'contact' && data.message.content) {
                try {
                    contactData = JSON.parse(data.message.content);
                } catch (e) {
                    console.warn('Failed to parse contact data from socket:', e);
                }
            }

            // This is a message from another user
            const newMsg = {
                id: data.message.message_id,
                text: data.message.content,
                timestamp: chatService.formatTime(data.message.created_at),
                isMe: false, // Always false since this is from another user
                messageType: data.message.message_type || 'text',
                status: data.message.status || 'sent',
                attachments: processedAttachments,
                sender: data.message.sender,
                senderId: data.message.sender_id,
                createdAt: data.message.created_at,
                duration: duration, // Add duration for audio messages
                reactions: data.message.reactions || [],
                contactData: contactData // Add parsed contact data for contact messages
            };
            
            // Prevent duplicate messages by checking if message already exists
            setMessages(prev => {
                const messageExists = prev.some(msg => msg.id === newMsg.id);
                if (messageExists) {
                    console.log('⚠️ Message already exists, not adding duplicate');
                    return prev; // Don't add duplicate
                }

                // Auto-scroll to new message
                setTimeout(() => {
                    if (flatListRef.current) {
                        flatListRef.current.scrollToEnd({ animated: true });
                    }
                }, 100);

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

        // Message reaction event
        socketService.on('message-reaction', (data) => {
            console.log('👍 Reaction received:', data);
            setMessages(prev => prev.map(msg =>
                msg.id === data.messageId
                    ? { ...msg, reactions: data.reactions }
                    : msg
            ));
        });

        // Message deleted event
        socketService.on('message-deleted', (data) => {
            console.log('🗑️ Message deleted:', data);
            const effectiveUserId = currentUserIdRef.current;

            if (data.deleteForEveryone) {
                // Replace message content for everyone
                setMessages(prev => prev.map(msg =>
                    msg.id === data.messageId
                        ? {
                            ...msg,
                            text: 'This message was deleted',
                            deleted: true,
                            messageType: 'text',
                            attachments: []
                        }
                        : msg
                ));
            } else {
                // Remove for the user who deleted it (data.deletedBy)
                // If I am the one who deleted it, remove it from my view
                if (String(data.deletedBy) === String(effectiveUserId)) {
                    setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
                }
                // If someone else deleted their message, it won't affect my view
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
            createdAt: new Date().toISOString(), // Add for consistent sorting
            reactions: [] // Initialize with empty reactions array
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

            // Auto-scroll to the new message
            setTimeout(() => {
                if (flatListRef.current) {
                    flatListRef.current.scrollToEnd({ animated: true });
                }
            }, 100);

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
            console.error('❌ Error message:', error?.message || 'Unknown error');
            console.error('❌ Error name:', error?.name || 'Error');
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
        // If timestamp is already formatted string (like "10:30 AM"), return it
        if (!timestamp) return '';
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
            Alert.alert('Permission Required', 'Gallery permission is required to select photos and videos');
            return;
        }

        const options = {
            mediaType: 'mixed', // Allow both photos and videos
            includeBase64: false,
            maxHeight: 2000,
            maxWidth: 2000,
            quality: 0.8,
            videoQuality: 'medium',
        };

        launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled media picker');
            } else if (response.errorMessage) {
                console.log('MediaPicker Error: ', response.errorMessage);
                Alert.alert('Error', 'Failed to select media');
            } else if (response.assets && response.assets[0]) {
                const asset = response.assets[0];
                // Determine if it's a video or image based on the type
                const isVideo = asset.type?.startsWith('video/');
                const messageType = isVideo ? 'video' : 'image';
                console.log('Selected media:', { type: asset.type, messageType });
                // Pass the complete asset object with all properties
                sendMediaMessage(asset, messageType);
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

        // Small delay to ensure modal is closed before opening picker
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            console.log('Opening document picker...');
            const results = await DocumentPicker.pick({
                type: [DocumentPicker.types.allFiles], // Allow ALL file types
                copyTo: 'cachesDirectory',
                allowMultiSelection: false,
            });

            console.log('Document picker results:', results);

            if (results && results.length > 0) {
                const document = results[0];
                console.log('Sending document:', {
                    uri: document.uri,
                    fileCopyUri: document.fileCopyUri,
                    name: document.name,
                    size: document.size,
                    type: document.type
                });

                // Use fileCopyUri if available (from copyTo), otherwise use uri
                const finalDocument = {
                    ...document,
                    uri: document.fileCopyUri || document.uri
                };

                await sendMediaMessage(finalDocument, 'file');
            }
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                console.log('Document picker cancelled by user');
            } else {
                console.error('Document picker error:', err);
                // Safely extract error details without accessing .stack directly
                const errorDetails = {
                    message: err?.message || 'Unknown error',
                    code: err?.code || 'UNKNOWN',
                    name: err?.name || 'Error'
                };
                console.error('Error details:', errorDetails);
                Alert.alert(
                    'Error',
                    'Failed to pick document. Please try again.'
                );
            }
        }
    };

    const handleContactPicker = async () => {
        console.log('📇 handleContactPicker called');
        setShowAttachmentModal(false);

        // Small delay to ensure modal is closed before opening picker
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            console.log('📇 Requesting contacts permission...');
            // Request permission directly (combines check + request)
            const permission = await Contacts.requestPermission();
            console.log('📇 Permission status:', permission);

            // On iOS simulator, permission might be 'undefined' but still work
            // Only block if explicitly denied
            if (permission === 'denied') {
                console.log('📇 Permission explicitly denied');
                Alert.alert('Permission Denied', 'Cannot access contacts without permission. Please enable contacts access in Settings.');
                return;
            }

            console.log('📇 Attempting to fetch contacts...');
            // Try to get contacts regardless of permission status (works on simulator)
            const contacts = await Contacts.getAll();
            console.log('📇 Fetched contacts count:', contacts?.length || 0);

            if (!contacts || contacts.length === 0) {
                console.log('📇 No contacts found');
                Alert.alert('No Contacts', 'No contacts found on your device');
                return;
            }

            // Sort contacts by display name
            const sortedContacts = contacts.sort((a, b) => {
                const nameA = a.displayName || a.givenName || '';
                const nameB = b.displayName || b.givenName || '';
                return nameA.localeCompare(nameB);
            });

            console.log('📇 Setting contacts list and showing modal...');
            // Set contacts list and show picker modal
            setContactsList(sortedContacts);
            setShowContactPicker(true);
            console.log('📇 Modal should be visible now');
        } catch (error) {
            console.error('📇 Error opening contact picker:', error);
            console.error('📇 Error details:', error.message, error.stack);
            Alert.alert('Error', `Failed to access contacts: ${error.message}`);
        }
    };

    const handleContactSelect = (contact) => {
        setShowContactPicker(false);
        setContactSearchQuery('');
        sendContactMessage(contact);
    };

    const handleQuickMessage = async () => {
        setShowAttachmentModal(false);
        setLoadingQuickMessage(true);

        // Small delay to ensure modal is closed
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            console.log('📨 Loading quick message template...');
            const response = await preSavedMessageService.getPreSavedMessage();

            if (response.success && response.data && response.data.message_template) {
                const template = response.data.message_template;
                setQuickMessageTemplate(template);
                setEditableQuickMessage(template);
                setShowQuickMessageModal(true);
                console.log('✅ Quick message loaded successfully');
            } else {
                Alert.alert(
                    'No Quick Message',
                    'You haven\'t created a quick message template yet. Please create one in your profile settings first.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('❌ Error loading quick message:', error);
            Alert.alert('Error', 'Failed to load quick message template');
        } finally {
            setLoadingQuickMessage(false);
        }
    };

    const handleSendQuickMessage = async () => {
        if (!editableQuickMessage.trim()) {
            Alert.alert('Error', 'Message cannot be empty');
            return;
        }

        setShowQuickMessageModal(false);

        // Send the message using the existing sendMessage function
        const messageText = editableQuickMessage.trim();
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

        // Add optimistic message
        const optimisticMessage = {
            id: tempId,
            text: messageText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true,
            messageType: 'text',
            status: 'sending',
            senderId: currentUserId,
            createdAt: new Date().toISOString(),
            reactions: []
        };

        setMessages(prev => {
            const messageExists = prev.some(msg => msg.id === tempId);
            if (messageExists) {
                return prev;
            }

            // Auto-scroll to the new message
            setTimeout(() => {
                if (flatListRef.current) {
                    flatListRef.current.scrollToEnd({ animated: true });
                }
            }, 100);

            return [...prev, optimisticMessage];
        });

        setIsSending(true);

        try {
            const result = await chatService.sendMessage(chatId, messageText);

            if (result.success && result.data) {
                console.log('✅ Quick message sent successfully!');

                // Update optimistic message with real data
                setMessages(prev => prev.map(msg => {
                    if (msg.id === tempId) {
                        return {
                            ...msg,
                            id: result.data.message_id,
                            status: 'sent',
                            createdAt: result.data.created_at,
                            senderId: result.data.sender_id
                        };
                    }
                    return msg;
                }));

                // Track usage of the pre-saved message
                if (quickMessageTemplate) {
                    try {
                        await preSavedMessageService.usePreSavedMessage(quickMessageTemplate.id);
                    } catch (error) {
                        console.warn('Failed to track message usage:', error);
                    }
                }
            } else {
                console.error('❌ Failed to send quick message:', result.message);
                setMessages(prev => prev.filter(msg => msg.id !== tempId));
                Alert.alert('Error', result.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('❌ Error sending quick message:', error);
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            Alert.alert('Error', 'Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    const filteredContacts = contactSearchQuery
        ? contactsList.filter(contact => {
            const name = contact.displayName || contact.givenName || '';
            return name.toLowerCase().includes(contactSearchQuery.toLowerCase());
        })
        : contactsList;

    const sendContactMessage = async (contact) => {
        if (!chatId || !contact) return;

        setIsSending(true);
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

        // Format contact data
        const contactData = {
            name: contact.displayName || contact.givenName + ' ' + contact.familyName,
            phone: contact.phoneNumbers && contact.phoneNumbers.length > 0
                ? contact.phoneNumbers[0].number
                : '',
            email: contact.emailAddresses && contact.emailAddresses.length > 0
                ? contact.emailAddresses[0].email
                : '',
        };

        // Add optimistic message
        const optimisticMessage = {
            id: tempId,
            text: `📇 ${contactData.name}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true,
            messageType: 'contact',
            status: 'sending',
            contactData: contactData,
            createdAt: new Date().toISOString(),
            reactions: []
        };

        setMessages(prev => [...prev, optimisticMessage]);

        try {
            console.log('📇 Sending contact message via API:', contactData);

            // Send contact message via API (like text messages)
            const result = await chatService.sendMessage(
                chatId,
                JSON.stringify(contactData),
                'contact'
            );

            if (result.success && result.data) {
                console.log('✅ Contact message sent successfully:', result.data);

                // Parse the contact data from response if it's a string
                let responseContactData = contactData;
                if (result.data.content) {
                    try {
                        responseContactData = JSON.parse(result.data.content);
                    } catch (e) {
                        console.warn('Failed to parse contact data from response:', e);
                    }
                }

                // Update optimistic message with real data
                setMessages(prev => prev.map(msg =>
                    msg.id === tempId
                        ? {
                            ...msg,
                            id: result.data.message_id,
                            status: 'sent',
                            createdAt: result.data.created_at,
                            senderId: result.data.sender_id,
                            contactData: responseContactData
                        }
                        : msg
                ));
            } else {
                console.error('❌ Failed to send contact message:', result.message);
                setMessages(prev => prev.filter(msg => msg.id !== tempId));
                Alert.alert('Error', result.message || 'Failed to send contact');
            }
        } catch (error) {
            console.error('❌ Error sending contact:', error);
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            Alert.alert('Error', 'Failed to send contact');
        } finally {
            setIsSending(false);
        }
    };


    const sendMediaMessage = async (file, type) => {
        if (!chatId) return;
        
        setUploadingFile(true);
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        
        // Add optimistic message
        const optimisticMessage = {
            id: tempId,
            text: type === 'image' ? '📷 Photo' : type === 'video' ? '🎥 Video' : '📄 Document',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true,
            messageType: type, // 'image', 'video', or 'file'
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
            // Backend accepts: text, image, video, audio, file, location, contact
            formData.append('content', '');
            formData.append('message_type', type); // Pass the actual type: 'image', 'video', or 'file'

            // Prepare file object - ensuring we have all required fields
            const fileObject = {
                uri: file.uri || file.fileCopyUri,
                type: file.type || (type === 'image' ? 'image/jpeg' : type === 'video' ? 'video/mp4' : 'application/octet-stream'),
                name: file.fileName || file.name || (type === 'image' ? `photo_${Date.now()}.jpg` : type === 'video' ? `video_${Date.now()}.mp4` : `document_${Date.now()}`),
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
                console.log('📎 Attachment data from backend:', result.data.attachments);
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

            // Provide more specific error messages
            let errorMessage = 'Failed to send file';
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                errorMessage = 'Upload timed out. Please check your internet connection and try again.';
            } else if (error.message === 'Network Error') {
                errorMessage = 'Network error. Please check your connection and try again.';
            } else if (error.response?.status === 413) {
                errorMessage = 'File is too large. Please try a smaller file.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            Alert.alert('Upload Failed', errorMessage);
        } finally {
            setUploadingFile(false);
        }
    };

    const sendVoiceNote = async (audioFile, duration) => {
        if (!chatId) return;

        setUploadingFile(true);
        setIsRecordingVoice(false);
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

        // Add optimistic message
        const optimisticMessage = {
            id: tempId,
            text: '🎤 Voice message',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true,
            messageType: 'audio',
            status: 'sending',
            attachments: [{
                type: 'audio',
                uri: audioFile.uri,
                name: audioFile.name || 'voice_message.m4a',
                size: audioFile.size,
            }],
            duration: duration,
            createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, optimisticMessage]);

        try {
            // Send via API
            const formData = new FormData();
            formData.append('content', '');
            formData.append('message_type', 'audio');

            const fileObject = {
                uri: audioFile.uri,
                type: audioFile.type || 'audio/m4a',
                name: audioFile.name || `voice_${Date.now()}.m4a`,
            };

            formData.append('file', fileObject);

            console.log('Sending voice message:', {
                fileObject,
                duration,
            });

            const result = await chatService.sendMediaMessage(chatId, formData);

            if (result.success) {
                console.log('✅ Voice message sent successfully');
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
                console.error('❌ Voice message send failed:', result.message);
                setMessages(prev => prev.filter(msg => msg.id !== tempId));
                Alert.alert('Error', result.message || 'Failed to send voice message');
            }
        } catch (error) {
            console.error('❌ Exception sending voice message:', error);
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            Alert.alert('Error', 'Failed to send voice message');
        } finally {
            setUploadingFile(false);
        }
    };

    // Handle long press on message (show options)
    const handleMessageLongPress = (message, event) => {
        setSelectedMessage(message);
        selectedMessageRef.current = message; // Store in ref for persistence

        // Get touch position for reaction picker
        if (event?.nativeEvent?.pageY) {
            setReactionPickerPosition({
                x: event.nativeEvent.pageX,
                y: event.nativeEvent.pageY
            });
        }

        setShowMessageOptions(true);
    };

    // Handle reaction selection
    const handleReactionSelect = async (emoji) => {
        // Get message from ref (persists even if state is cleared)
        const messageToReact = selectedMessageRef.current;

        console.log('👍 REACTION - handleReactionSelect called:', {
            emoji,
            hasSelectedMessage: !!selectedMessage,
            hasMessageInRef: !!selectedMessageRef.current,
            messageId: messageToReact?.id
        });

        if (!messageToReact) {
            console.error('❌ REACTION - No message selected!');
            return;
        }

        try {
            console.log('👍 REACTION - Starting toggle:', {
                emoji,
                messageId: messageToReact.id,
                currentReactions: messageToReact.reactions,
                currentUserId: currentUserIdRef.current
            });

            const result = await chatService.toggleReaction(messageToReact.id, emoji);
            console.log('👍 REACTION - API Response:', JSON.stringify(result, null, 2));

            if (result.success && result.data) {
                const newReactions = result.data.reactions || [];
                console.log('✅ REACTION - Updating UI with reactions:', newReactions);

                setMessages(prev => {
                    const updated = prev.map(msg => {
                        if (msg.id === messageToReact.id) {
                            console.log('🔄 REACTION - Before:', msg.reactions, 'After:', newReactions);
                            return { ...msg, reactions: newReactions };
                        }
                        return msg;
                    });
                    console.log('✅ REACTION - Messages state updated');
                    return updated;
                });
            } else {
                console.error('❌ REACTION - Backend returned error:', result.message);
                Alert.alert('Error', result.message || 'Failed to add reaction');
            }
        } catch (error) {
            console.error('❌ REACTION - Exception occurred:', error);
            Alert.alert('Error', 'Failed to add reaction');
        } finally {
            // Clear selected message after reaction is processed
            setSelectedMessage(null);
            selectedMessageRef.current = null;
        }
    };

    // Handle message deletion
    const handleDeleteMessage = async (messageId, deleteForEveryone) => {
        try {
            console.log('🗑️ DELETE - Starting deletion:', {
                messageId,
                deleteForEveryone,
                currentUserId: currentUserIdRef.current
            });

            const result = await chatService.deleteMessage(messageId, deleteForEveryone);

            console.log('🗑️ DELETE - API Response:', result);

            if (result.success) {
                console.log('✅ DELETE - Message deleted successfully on backend');

                if (deleteForEveryone) {
                    // Replace with "deleted" message
                    setMessages(prev => prev.map(msg =>
                        msg.id === messageId
                            ? {
                                ...msg,
                                text: 'This message was deleted',
                                deleted: true,
                                messageType: 'text',
                                attachments: []
                            }
                            : msg
                    ));
                } else {
                    // Remove from list (delete for me only)
                    console.log('🗑️ DELETE - Removing message from UI:', messageId);
                    setMessages(prev => prev.filter(msg => msg.id !== messageId));
                }
            } else {
                console.error('❌ DELETE - Backend returned error:', result.message);
                Alert.alert('Error', result.message || 'Failed to delete message');
            }
        } catch (error) {
            console.error('❌ DELETE - Exception occurred:', error);
            Alert.alert('Error', 'Failed to delete message');
        }
    };

    // Show reaction picker
    const handleShowReactionPicker = () => {
        console.log('👍 ChatScreen - handleShowReactionPicker called');
        console.log('👍 ChatScreen - Selected message:', selectedMessage?.id);
        setShowMessageOptions(false);
        setTimeout(() => {
            console.log('👍 ChatScreen - Opening reaction picker');
            setShowReactionPicker(true);
        }, 300);
    };

    // Handle reaction press on existing reaction
    const handleReactionPress = async (messageId, emoji) => {
        try {
            const result = await chatService.toggleReaction(messageId, emoji);

            if (result.success) {
                setMessages(prev => prev.map(msg =>
                    msg.id === messageId
                        ? { ...msg, reactions: result.data.reactions }
                        : msg
                ));
            }
        } catch (error) {
            console.error('Failed to toggle reaction:', error);
        }
    };

    // Handle opening image preview
    const handleImagePreview = (attachment) => {
        const imageUrl = attachment.url || attachment.uri;
        const imageName = attachment.name || attachment.originalName || 'Image';

        console.log('🖼️ Opening image preview:', {
            name: imageName,
            url: imageUrl
        });

        setPreviewImageUrl(imageUrl);
        setPreviewImageName(imageName);
        setShowImagePreview(true);
    };

    // Handle downloading image
    const handleImageDownload = async (imageUrl, imageName) => {
        try {
            console.log('💾 Downloading image:', { imageUrl, imageName });

            // Check if URL can be opened
            const supported = await Linking.canOpenURL(imageUrl);

            if (supported) {
                await Linking.openURL(imageUrl);
                Alert.alert('Success', 'Image download started');
            } else {
                Alert.alert('Error', 'Cannot download this image');
            }
        } catch (error) {
            console.error('Error downloading image:', error);
            Alert.alert('Error', 'Failed to download image');
        }
    };

    // Handle opening document or file (not images)
    const handleFileOpen = async (attachment) => {
        try {
            const fileUrl = attachment.url || attachment.uri;

            if (!fileUrl) {
                Alert.alert('Error', 'File URL not available');
                return;
            }

            console.log('📂 Opening file:', {
                name: attachment.name,
                type: attachment.type,
                url: fileUrl
            });

            // Download file to local cache if it's a remote URL
            let localFilePath = fileUrl;

            if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
                // Remote file - download it first
                const fileName = attachment.name || `file_${Date.now()}`;
                const localPath = `${RNFS.CachesDirectoryPath}/${fileName}`;

                console.log('📥 Downloading file from:', fileUrl);
                console.log('📥 Saving to:', localPath);

                try {
                    const downloadResult = await RNFS.downloadFile({
                        fromUrl: fileUrl,
                        toFile: localPath,
                    }).promise;

                    if (downloadResult.statusCode === 200) {
                        console.log('✅ File downloaded successfully');
                        localFilePath = localPath;
                    } else {
                        throw new Error(`Download failed with status: ${downloadResult.statusCode}`);
                    }
                } catch (downloadError) {
                    console.error('❌ Download error:', downloadError);
                    Alert.alert('Error', 'Failed to download file. Please check your internet connection.');
                    return;
                }
            }

            // Open file with FileViewer in-app (works for documents, PDFs, etc.)
            console.log('📱 Opening file with FileViewer:', localFilePath);

            await FileViewer.open(localFilePath, {
                showOpenWithDialog: false, // Don't show "Open with" dialog - keep it in-app
                showAppsSuggestions: false, // Don't show external app suggestions
                displayName: attachment.name || 'File', // Display name for the file
            });

            console.log('✅ File opened successfully');
        } catch (error) {
            console.error('❌ Error opening file:', error);

            // Provide more specific error messages
            let errorMessage = 'Failed to open file';

            if (error.message?.includes('No app associated')) {
                errorMessage = 'No app found to open this file type.';
            } else if (error.message?.includes('Download')) {
                errorMessage = 'Failed to download file. Please check your internet connection.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            Alert.alert('Error', errorMessage);
        }
    };

    // Handle opening/viewing contact
    const handleContactOpen = async (contactData) => {
        if (!contactData) {
            Alert.alert('Error', 'Contact data not available');
            return;
        }

        console.log('📇 Opening contact:', contactData);

        // Create options for the alert
        const options = [];

        // Try different possible phone field names
        const phoneNumber = contactData.phone || contactData.phoneNumber || contactData.number;

        if (phoneNumber) {
            options.push({
                text: `Call ${phoneNumber}`,
                onPress: () => {
                    const phoneUrl = `tel:${phoneNumber}`;
                    Linking.canOpenURL(phoneUrl)
                        .then(supported => {
                            if (supported) {
                                Linking.openURL(phoneUrl);
                            } else {
                                Alert.alert('Error', 'Cannot make phone calls on this device');
                            }
                        })
                        .catch(err => {
                            console.error('Error opening phone dialer:', err);
                            Alert.alert('Error', 'Failed to open phone dialer');
                        });
                }
            });

            options.push({
                text: `Send SMS to ${phoneNumber}`,
                onPress: () => {
                    const smsUrl = `sms:${phoneNumber}`;
                    Linking.canOpenURL(smsUrl)
                        .then(supported => {
                            if (supported) {
                                Linking.openURL(smsUrl);
                            } else {
                                Alert.alert('Error', 'Cannot send SMS on this device');
                            }
                        })
                        .catch(err => {
                            console.error('Error opening SMS:', err);
                            Alert.alert('Error', 'Failed to open SMS');
                        });
                }
            });
        }

        if (contactData.email) {
            options.push({
                text: `Email ${contactData.email}`,
                onPress: () => {
                    const emailUrl = `mailto:${contactData.email}`;
                    Linking.canOpenURL(emailUrl)
                        .then(supported => {
                            if (supported) {
                                Linking.openURL(emailUrl);
                            } else {
                                Alert.alert('Error', 'Cannot send emails on this device');
                            }
                        })
                        .catch(err => {
                            console.error('Error opening email:', err);
                            Alert.alert('Error', 'Failed to open email client');
                        });
                }
            });
        }

        // Add cancel option
        options.push({
            text: 'Cancel',
            style: 'cancel'
        });

        // Show action sheet
        Alert.alert(
            contactData.name || 'Contact',
            contactData.phone || contactData.email || '',
            options,
            { cancelable: true }
        );
    };

    const renderMessage = ({ item }) => {
        const isMe = item.isMe;
        // Always show timestamp if it exists
        const showTimestamp = item.timestamp && item.timestamp.length > 0;

        // Check if message is deleted
        if (item.deleted && item.text === 'This message was deleted') {
            return (
                <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
                    <View style={[styles.messageBubble, styles.deletedBubble]}>
                        <Text style={styles.deletedText}>
                            <Icon name="ban" size={12} color="#999" /> This message was deleted
                        </Text>
                    </View>
                </View>
            );
        }

        return (
            <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onLongPress={(event) => handleMessageLongPress(item, event)}
                    delayLongPress={500}
                >
                    <View style={[styles.messageBubble, isMe ? [styles.myBubble] : styles.theirBubble]}>
                    {item.messageType === 'image' && item.attachments?.[0] ? (
                        <TouchableOpacity onPress={() => handleImagePreview(item.attachments[0])}>
                            <Image
                                source={{ uri: item.attachments[0].uri || item.attachments[0].url }}
                                style={styles.messageImage}
                                resizeMode="cover"
                                onError={(error) => {
                                    console.error('Image load error:', error.nativeEvent.error);
                                    console.log('Failed to load image from:', item.attachments[0]);
                                }}
                                onLoad={() => {
                                    console.log('Image loaded successfully from:', item.attachments[0].uri || item.attachments[0].url);
                                }}
                            />
                        </TouchableOpacity>
                    ) : item.messageType === 'audio' && (item.attachments?.[0] || item.duration) ? (
                        <AudioPlayer
                            audioUrl={item.attachments?.[0]?.uri || item.attachments?.[0]?.url}
                            duration={item.duration || item.attachments?.[0]?.metadata?.duration || 0}
                            isMe={isMe}
                        />
                    ) : item.messageType === 'video' && item.attachments?.[0] ? (
                        <View style={styles.videoContainer}>
                            <Video
                                source={{ uri: item.attachments[0].uri || item.attachments[0].url }}
                                style={styles.messageVideo}
                                controls={true}
                                resizeMode="contain"
                                paused={true}
                                onError={(error) => {
                                    console.error('Video load error:', error);
                                    console.log('Failed to load video from:', item.attachments[0]);
                                }}
                                onLoad={() => {
                                    console.log('Video loaded successfully from:', item.attachments[0].uri || item.attachments[0].url);
                                }}
                            />
                        </View>
                    ) : (item.messageType === 'document' || item.messageType === 'file') && item.attachments?.[0] ? (
                        <TouchableOpacity
                            style={styles.documentContainer}
                            onPress={() => handleFileOpen(item.attachments[0])}
                        >
                            {(() => {
                                const fileIcon = getFileIcon(item.attachments[0].name, item.attachments[0].type);
                                return (
                                    <View style={[styles.fileIconWrapper, { backgroundColor: fileIcon.bgColor }]}>
                                        <Icon name={fileIcon.name} size={24} color={fileIcon.color} />
                                    </View>
                                );
                            })()}
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
                    ) : item.messageType === 'contact' && item.contactData ? (
                        <TouchableOpacity
                            style={styles.contactContainer}
                            onPress={() => {
                                console.log('📇 Contact tapped, data:', item.contactData);
                                handleContactOpen(item.contactData);
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.contactIconWrapper, { backgroundColor: '#E8F5E9' }]}>
                                <Icon name="person" size={30} color="#4CAF50" />
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={[styles.contactName, isMe ? styles.myText : styles.theirText]}>
                                    {item.contactData.name || item.contactData.displayName || 'Contact'}
                                </Text>
                                {(item.contactData.phone || item.contactData.phoneNumber || item.contactData.number) && (
                                    <Text style={[styles.contactDetail, isMe ? styles.myTime : styles.theirTime]}>
                                        📞 {item.contactData.phone || item.contactData.phoneNumber || item.contactData.number}
                                    </Text>
                                )}
                                {item.contactData.email && (
                                    <Text style={[styles.contactDetail, isMe ? styles.myTime : styles.theirTime]}>
                                        ✉️ {item.contactData.email}
                                    </Text>
                                )}
                            </View>
                            <Icon name="chevron-forward" size={20} color={isMe ? '#fff' : '#94A3B8'} style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    ) : (
                        <Text style={[styles.messageText, isMe ? styles.myText : [styles.theirText, { color: theme.colors.primary }]]}>
                            {item.text}
                        </Text>
                    )}
                    </View>
                </TouchableOpacity>

                {/* Reactions Display */}
                <MessageReactions
                    reactions={item.reactions}
                    onReactionPress={(emoji) => handleReactionPress(item.id, emoji)}
                    currentUserId={currentUserId}
                    isMe={isMe}
                />

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

    // Get appropriate icon for different file types
    const getFileIcon = (fileName, mimeType) => {
        const extension = fileName?.split('.').pop()?.toLowerCase();
        const type = mimeType?.toLowerCase();

        // PDF files
        if (extension === 'pdf' || type?.includes('pdf')) {
            return { name: 'document-text', color: '#D32F2F', bgColor: '#FFEBEE' };
        }
        // Word documents
        if (['doc', 'docx'].includes(extension) || type?.includes('word') || type?.includes('msword')) {
            return { name: 'document-text', color: '#1976D2', bgColor: '#E3F2FD' };
        }
        // Excel files
        if (['xls', 'xlsx', 'csv'].includes(extension) || type?.includes('excel') || type?.includes('spreadsheet')) {
            return { name: 'stats-chart', color: '#388E3C', bgColor: '#E8F5E9' };
        }
        // PowerPoint files
        if (['ppt', 'pptx'].includes(extension) || type?.includes('presentation') || type?.includes('powerpoint')) {
            return { name: 'easel', color: '#F57C00', bgColor: '#FFF3E0' };
        }
        // Archive files
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension) || type?.includes('zip') || type?.includes('compressed')) {
            return { name: 'archive', color: '#7B1FA2', bgColor: '#F3E5F5' };
        }
        // Text files
        if (['txt', 'log'].includes(extension) || type?.includes('text/plain')) {
            return { name: 'document', color: '#455A64', bgColor: '#ECEFF1' };
        }
        // Audio files
        if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(extension) || type?.includes('audio')) {
            return { name: 'musical-notes', color: '#C2185B', bgColor: '#FCE4EC' };
        }
        // Video files
        if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(extension) || type?.includes('video')) {
            return { name: 'videocam', color: '#00796B', bgColor: '#E0F2F1' };
        }
        // Code files
        if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'xml'].includes(extension)) {
            return { name: 'code-slash', color: '#5E35B1', bgColor: '#EDE7F6' };
        }
        // Default for unknown types
        return { name: 'document-attach', color: '#FF9800', bgColor: '#FFF3E0' };
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

    // Separate effect for scrolling on new messages (not on initial load)
    const previousMessagesLength = useRef(messages.length);

    useEffect(() => {
        // Only auto-scroll if new messages were added (not on initial load)
        if (messages.length > 0 && messages.length > previousMessagesLength.current) {
            console.log('📜 New message added, scrolling to end');
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
        previousMessagesLength.current = messages.length;
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
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
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
                    onContentSizeChange={() => {
                        // Scroll to end when content size changes (messages loaded/added)
                        if (messages.length > 0 && !isLoading) {
                            flatListRef.current?.scrollToEnd({ animated: false });
                        }
                    }}
                    onLayout={() => {
                        // Scroll to end when layout is ready
                        if (messages.length > 0 && !isLoading) {
                            flatListRef.current?.scrollToEnd({ animated: false });
                        }
                    }}
                />
            </ImageBackground>

            {/* Sticky Input Bar */}
            <View style={styles.inputSectionContainer}>
                <View style={styles.inputSection}>
                    {isRecordingVoice ? (
                        <VoiceRecorder
                            onSendVoiceNote={sendVoiceNote}
                            onCancel={() => setIsRecordingVoice(false)}
                        />
                    ) : (
                        <>
                            <View style={styles.inputBar}>
                                <TouchableOpacity
                                    style={styles.attachButton}
                                    onPress={() => setShowAttachmentModal(true)}
                                    disabled={uploadingFile}
                                >
                                    <Icon name="add" size={24} color={uploadingFile ? "#ccc" : "#8B95A5"} />
                                </TouchableOpacity>
                                <TextInput
                                    ref={textInputRef}
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
                                    blurOnSubmit={false}
                                    keyboardType="default"
                                />
                            </View>
                            {newMessage.trim().length > 0 ? (
                                <TouchableOpacity
                                    style={[
                                        styles.sendButton,
                                        styles.sendButtonActive,
                                        { backgroundColor: theme.colors.primary }
                                    ]}
                                    onPress={sendMessage}
                                    disabled={isSending}
                                >
                                    {isSending ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Icon name="send" size={22} color="#fff" />
                                    )}
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
                                    onPress={() => setIsRecordingVoice(true)}
                                    disabled={uploadingFile}
                                >
                                    <Icon name="mic" size={22} color="#fff" />
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            </View>

            {/* Attachment Modal */}
            <Modal
                visible={showAttachmentModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowAttachmentModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowAttachmentModal(false)}
                    />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Send Attachment</Text>
                            <TouchableOpacity onPress={() => setShowAttachmentModal(false)}>
                                <Icon name="close" size={24} color="#2C3D5B" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView
                            contentContainerStyle={styles.attachmentScrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.attachmentGrid}>
                                <TouchableOpacity
                                    style={styles.attachmentOption}
                                    onPress={handleQuickMessage}
                                >
                                    <View style={[styles.attachmentIcon, { backgroundColor: '#FFF3E0' }]}>
                                        <Icon name="flash" size={28} color="#FF9800" />
                                    </View>
                                    <Text style={styles.attachmentLabel}>Quick{'\n'}Message</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.attachmentOption}
                                    onPress={handleCameraLaunch}
                                >
                                    <View style={[styles.attachmentIcon, { backgroundColor: '#F3E5F5' }]}>
                                        <Icon name="camera" size={28} color="#9C27B0" />
                                    </View>
                                    <Text style={styles.attachmentLabel}>Camera</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.attachmentOption}
                                    onPress={handleImagePicker}
                                >
                                    <View style={[styles.attachmentIcon, { backgroundColor: '#E3F2FD' }]}>
                                        <Icon name="images" size={28} color="#2196F3" />
                                    </View>
                                    <Text style={styles.attachmentLabel}>Photos &{'\n'}Videos</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.attachmentOption}
                                    onPress={handleDocumentPicker}
                                >
                                    <View style={[styles.attachmentIcon, { backgroundColor: '#E0F2F1' }]}>
                                        <Icon name="document" size={28} color="#00796B" />
                                    </View>
                                    <Text style={styles.attachmentLabel}>Document</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.attachmentOption}
                                    onPress={handleContactPicker}
                                >
                                    <View style={[styles.attachmentIcon, { backgroundColor: '#E8F5E9' }]}>
                                        <Icon name="person" size={28} color="#4CAF50" />
                                    </View>
                                    <Text style={styles.attachmentLabel}>Contact</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Reaction Picker Modal */}
            <ReactionPicker
                visible={showReactionPicker}
                onReactionSelect={handleReactionSelect}
                onClose={() => {
                    setShowReactionPicker(false);
                    // Don't clear selectedMessage here - it's cleared in handleReactionSelect's finally block
                }}
                position={reactionPickerPosition}
            />

            {/* Message Options Modal */}
            <MessageOptionsModal
                visible={showMessageOptions}
                onClose={() => {
                    setShowMessageOptions(false);
                    // Don't clear selectedMessage here - it might be needed for reactions
                    // It will be cleared after the reaction is processed or if user cancels
                    if (!showReactionPicker) {
                        // Only clear if reaction picker isn't about to open
                        setTimeout(() => {
                            if (!showReactionPicker) {
                                setSelectedMessage(null);
                            }
                        }, 400);
                    }
                }}
                message={selectedMessage}
                currentUserId={currentUserId}
                onDelete={handleDeleteMessage}
                onReact={handleShowReactionPicker}
                onCopy={() => {
                    // Copy is handled in the modal
                }}
            />

            {/* Image Preview Modal */}
            <ImagePreview
                visible={showImagePreview}
                imageUrl={previewImageUrl}
                imageName={previewImageName}
                onClose={() => {
                    setShowImagePreview(false);
                    setPreviewImageUrl(null);
                    setPreviewImageName(null);
                }}
                onDownload={handleImageDownload}
            />

            {/* Contact Picker Modal */}
            <Modal
                visible={showContactPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => {
                    setShowContactPicker(false);
                    setContactSearchQuery('');
                }}
            >
                <View style={styles.contactPickerContainer}>
                    <TouchableOpacity
                        style={styles.contactPickerOverlay}
                        activeOpacity={1}
                        onPress={() => {
                            setShowContactPicker(false);
                            setContactSearchQuery('');
                        }}
                    />
                    <View style={styles.contactPickerContent}>
                        <View style={styles.contactPickerHeader}>
                            <Text style={styles.contactPickerTitle}>Select Contact</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowContactPicker(false);
                                    setContactSearchQuery('');
                                }}
                            >
                                <Icon name="close" size={24} color="#2C3D5B" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.contactSearchContainer}>
                            <Icon name="search" size={20} color="#8B95A5" style={styles.contactSearchIcon} />
                            <TextInput
                                style={styles.contactSearchInput}
                                placeholder="Search contacts..."
                                placeholderTextColor="#8B95A5"
                                value={contactSearchQuery}
                                onChangeText={setContactSearchQuery}
                            />
                        </View>

                        <FlatList
                            data={filteredContacts}
                            keyExtractor={(item) => item.recordID}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.contactItem}
                                    onPress={() => handleContactSelect(item)}
                                >
                                    <View style={styles.contactAvatar}>
                                        <Icon name="person" size={24} color="#fff" />
                                    </View>
                                    <View style={styles.contactDetails}>
                                        <Text style={styles.contactName}>
                                            {item.displayName || `${item.givenName || ''} ${item.familyName || ''}`.trim() || 'Unknown'}
                                        </Text>
                                        {item.phoneNumbers && item.phoneNumbers.length > 0 && (
                                            <Text style={styles.contactPhone}>
                                                {item.phoneNumbers[0].number}
                                            </Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            )}
                            style={styles.contactList}
                            contentContainerStyle={styles.contactListContent}
                            ListEmptyComponent={
                                <View style={styles.emptyContactsContainer}>
                                    <Text style={styles.emptyContactsText}>
                                        {contactSearchQuery ? 'No contacts found' : 'No contacts available'}
                                    </Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>

            {/* Quick Message Modal */}
            <Modal
                visible={showQuickMessageModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => {
                    setShowQuickMessageModal(false);
                    setEditableQuickMessage('');
                }}
            >
                <View style={styles.quickMessageContainer}>
                    <TouchableOpacity
                        style={styles.quickMessageOverlay}
                        activeOpacity={1}
                        onPress={() => {
                            setShowQuickMessageModal(false);
                            setEditableQuickMessage('');
                        }}
                    />
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.quickMessageContent}
                    >
                        <View style={styles.quickMessageHeader}>
                            <Text style={styles.quickMessageTitle}>Quick Message</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowQuickMessageModal(false);
                                    setEditableQuickMessage('');
                                }}
                            >
                                <Icon name="close" size={24} color="#2C3D5B" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.quickMessageLabel}>Edit message before sending:</Text>

                        <ScrollView style={styles.quickMessageScroll}>
                            <TextInput
                                style={styles.quickMessageInput}
                                value={editableQuickMessage}
                                onChangeText={setEditableQuickMessage}
                                multiline
                                placeholder="Your quick message will appear here..."
                                placeholderTextColor="#999"
                            />
                        </ScrollView>

                        <View style={styles.quickMessageButtons}>
                            <TouchableOpacity
                                style={[styles.quickMessageButton, styles.quickMessageCancelButton]}
                                onPress={() => {
                                    setShowQuickMessageModal(false);
                                    setEditableQuickMessage('');
                                }}
                            >
                                <Text style={[styles.quickMessageButtonText, styles.quickMessageCancelText]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.quickMessageButton, styles.quickMessageSendButton, { backgroundColor: theme.colors.primary }]}
                                onPress={handleSendQuickMessage}
                                disabled={!editableQuickMessage.trim()}
                            >
                                <Icon name="send" size={18} color="#fff" style={styles.quickMessageSendIcon} />
                                <Text style={styles.quickMessageSendText}>Send</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </KeyboardAvoidingView>
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
        paddingBottom: 20,
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
        paddingHorizontal: 15,
        paddingVertical: 10,
        paddingBottom: Platform.OS === 'ios' ? 10 : 15,
        backgroundColor: '#fff',
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
    videoContainer: {
        width: 250,
        height: 200,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    messageVideo: {
        width: '100%',
        height: '100%',
    },
    documentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 10,
        minWidth: 200,
    },
    fileIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    documentInfo: {
        marginLeft: 12,
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
    contactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        minWidth: 200,
    },
    contactIconWrapper: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactInfo: {
        marginLeft: 12,
        flex: 1,
    },
    contactName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    contactDetail: {
        fontSize: 12,
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e3e8f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2C3D5B',
    },
    attachmentScrollContent: {
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    attachmentGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    deletedBubble: {
        backgroundColor: '#f5f5f5',
        borderColor: '#ddd',
        borderWidth: 1,
    },
    deletedText: {
        color: '#999',
        fontStyle: 'italic',
        fontSize: 14,
    },
    attachmentOption: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '30%',
        minWidth: 90,
        marginBottom: 16,
    },
    attachmentIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    attachmentLabel: {
        fontSize: 12,
        color: '#2C3D5B',
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 16,
    },
    contactPickerContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    contactPickerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    contactPickerContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '80%',
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    contactPickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    contactPickerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2C3D5B',
    },
    contactSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        margin: 16,
        paddingHorizontal: 12,
    },
    contactSearchIcon: {
        marginRight: 8,
    },
    contactSearchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: '#2C3D5B',
    },
    contactList: {
        flex: 1,
    },
    contactListContent: {
        flexGrow: 1,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    contactAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contactDetails: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3D5B',
        marginBottom: 4,
    },
    contactPhone: {
        fontSize: 14,
        color: '#8B95A5',
    },
    emptyContactsContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyContactsText: {
        fontSize: 16,
        color: '#8B95A5',
        textAlign: 'center',
    },
    quickMessageContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    quickMessageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    quickMessageContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '85%',
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    quickMessageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    quickMessageTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2C3D5B',
    },
    quickMessageLabel: {
        fontSize: 14,
        color: '#666',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    quickMessageScroll: {
        flex: 1,
        paddingHorizontal: 20,
    },
    quickMessageInput: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: '#2C3D5B',
        minHeight: 200,
        textAlignVertical: 'top',
    },
    quickMessageButtons: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
    },
    quickMessageButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    quickMessageCancelButton: {
        backgroundColor: '#F5F5F5',
    },
    quickMessageSendButton: {
        // backgroundColor set dynamically from theme
    },
    quickMessageButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    quickMessageCancelText: {
        color: '#666',
    },
    quickMessageSendText: {
        color: '#fff',
        marginLeft: 8,
    },
    quickMessageSendIcon: {
        marginRight: 4,
    },
});