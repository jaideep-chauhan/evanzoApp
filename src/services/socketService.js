import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
    this.currentChatId = null;
    this.typingTimeout = null;
  }

  async connect() {
    try {
      // Get auth token
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No auth token found');
      }

      // Initialize socket connection
      this.socket = io(API_BASE_URL.replace('/api', ''), {
        auth: {
          token: token
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.setupEventHandlers();
      
      return new Promise((resolve, reject) => {
        this.socket.on('connect', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('Socket connected successfully');
          resolve(true);
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error.message);
          this.isConnected = false;
          reject(error);
        });
      });
    } catch (error) {
      console.error('Failed to connect socket:', error);
      throw error;
    }
  }

  setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connected', (data) => {
      console.log('Socket connected:', data);
      this.emit('connected', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnected', reason);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.emit('reconnected', attemptNumber);
    });

    // Chat events
    this.socket.on('chat-joined', (data) => {
      console.log('Joined chat:', data.chatId);
      this.emit('chat-joined', data);
    });

    this.socket.on('chat-left', (data) => {
      console.log('Left chat:', data.chatId);
      this.emit('chat-left', data);
    });

    // Message events
    this.socket.on('new-message', (data) => {
      console.log('New message received:', data.message.message_id);
      this.emit('new-message', data);
    });

    this.socket.on('message-delivered', (data) => {
      console.log('Message delivered:', data.messageId);
      this.emit('message-delivered', data);
    });

    this.socket.on('message-read', (data) => {
      console.log('Message read:', data.messageId);
      this.emit('message-read', data);
    });

    this.socket.on('messages-read', (data) => {
      console.log('Messages read in chat:', data.chatId);
      this.emit('messages-read', data);
    });

    // Typing indicators
    this.socket.on('user-typing', (data) => {
      console.log('User typing:', data.userId);
      this.emit('user-typing', data);
    });

    this.socket.on('user-stopped-typing', (data) => {
      console.log('User stopped typing:', data.userId);
      this.emit('user-stopped-typing', data);
    });

    // User status
    this.socket.on('user-status-changed', (data) => {
      console.log('User status changed:', data.userId, data.status);
      this.emit('user-status-changed', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });
  }

  // Join a chat room
  joinChat(chatId) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    this.currentChatId = chatId;
    this.socket.emit('join-chat', { chatId });
    return true;
  }

  // Leave a chat room
  leaveChat(chatId) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    this.currentChatId = null;
    this.socket.emit('leave-chat', { chatId });
    return true;
  }

  // Send a message
  sendMessage(chatId, content, messageType = 'text', attachments = null) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    const messageData = {
      chat_id: chatId,
      content,
      message_type: messageType,
      attachments,
    };

    this.socket.emit('send-message', messageData);
    return true;
  }

  // Mark message as read
  markAsRead(chatId, messageId = null) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    this.socket.emit('mark-read', { chatId, messageId });
    return true;
  }

  // Typing indicators
  startTyping(chatId) {
    if (!this.socket || !this.isConnected) return;

    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.socket.emit('typing', { chatId });

    // Auto stop typing after 3 seconds
    this.typingTimeout = setTimeout(() => {
      this.stopTyping(chatId);
    }, 3000);
  }

  stopTyping(chatId) {
    if (!this.socket || !this.isConnected) return;

    // Clear timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }

    this.socket.emit('stop-typing', { chatId });
  }

  // Update user online status
  setOnlineStatus(online = true) {
    if (!this.socket || !this.isConnected) return;

    if (online) {
      this.socket.emit('user-online');
    } else {
      this.socket.emit('user-offline');
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    if (callback) {
      this.listeners.get(event).delete(callback);
    } else {
      this.listeners.delete(event);
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      // Clear all listeners
      this.listeners.clear();
      
      // Clear typing timeout
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
      }

      // Disconnect socket
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentChatId = null;
    }
  }

  // Check connection status
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  // Get socket instance (for advanced usage)
  getSocket() {
    return this.socket;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;