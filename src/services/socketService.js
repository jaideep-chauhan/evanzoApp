import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../utils/secureStorage';
import { API_BASE_URL } from './api';
import notificationService from './notificationService';
import { AppState } from 'react-native';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
    this.currentChatId = null;
    this.typingTimeout = null;
    this.isReconnecting = false;
    this.connectionTimeout = null;
    this.reconnectTimeout = null;
    this.lastConnectionAttempt = 0;
    this.minReconnectDelay = 2000; // Minimum 2 seconds between attempts
    this.maxReconnectDelay = 30000; // Maximum 30 seconds between attempts
    this.connectionState = 'disconnected'; // disconnected, connecting, connected, error
  }

  async refreshTokenIfNeeded() {
    try {
      const refreshToken = await secureStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.error('❌ No refresh token found');
        return null;
      }

      console.log('🔄 Refreshing auth token...');
      
      // Use fetch directly to avoid circular dependency with api service
      const response = await fetch(`${API_BASE_URL}/auth/refresh-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Type': 'mobile',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();
      
      if (response.ok && data.success && data.tokens) {
        const { accessToken, refreshToken: newRefreshToken } = data.tokens;
        
        // Store new tokens
        await secureStorage.setItem('authToken', accessToken);
        await secureStorage.setItem('refreshToken', newRefreshToken);
        
        console.log('✅ Token refreshed successfully');
        return accessToken;
      } else {
        console.error('❌ Failed to refresh token:', data.message);
        return null;
      }
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      return null;
    }
  }

  async connect() {
    // Prevent multiple simultaneous connection attempts
    if (this.connectionState === 'connecting') {
      console.log('⚠️ Already attempting to connect, skipping...');
      return Promise.resolve(false);
    }

    // Check if we're already connected
    if (this.connectionState === 'connected' && this.socket?.connected) {
      console.log('✅ Already connected');
      return Promise.resolve(true);
    }

    // Implement connection throttling
    const now = Date.now();
    const timeSinceLastAttempt = now - this.lastConnectionAttempt;
    if (timeSinceLastAttempt < this.minReconnectDelay) {
      const waitTime = this.minReconnectDelay - timeSinceLastAttempt;
      console.log(`⏳ Waiting ${waitTime}ms before attempting connection...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastConnectionAttempt = Date.now();
    this.connectionState = 'connecting';

    try {
      // Get auth token
      let token = await secureStorage.getItem('authToken');
      if (!token) {
        console.error('❌ No auth token found in AsyncStorage');
        this.connectionState = 'error';
        throw new Error('No auth token found');
      }
      
      console.log('🔑 Auth token found, length:', token.length);
      console.log('🔑 Token preview:', token.substring(0, 50) + '...');

      // Get the base URL for socket connection
      // For production: https://api.evnzo.com/api -> https://api.evnzo.com
      // For local: http://localhost:3000/api -> http://localhost:3000
      let socketUrl = API_BASE_URL;
      if (socketUrl.endsWith('/api')) {
        socketUrl = socketUrl.slice(0, -4); // Remove trailing /api
      }
      
      // Check if this is production environment
      const isProduction = socketUrl.includes('evnzo.com');
      
      console.log('🌐 Connecting to socket server:', socketUrl);
      console.log('🔧 Environment:', isProduction ? 'Production' : 'Development');

      // Calculate reconnection delay with exponential backoff
      const reconnectDelay = Math.min(
        this.minReconnectDelay * Math.pow(2, this.reconnectAttempts),
        this.maxReconnectDelay
      );

      // Initialize socket connection with better reconnection settings
      // For production, use both polling and websocket transports for better compatibility
      this.socket = io(socketUrl, {
        auth: {
          token: token
        },
        transports: isProduction ? ['polling', 'websocket'] : ['websocket'], // Use polling first in production
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: reconnectDelay,
        reconnectionDelayMax: this.maxReconnectDelay,
        randomizationFactor: 0.5, // Add jitter to prevent thundering herd
        timeout: 20000, // 20 second connection timeout
        secure: isProduction, // Use secure connection in production
        rejectUnauthorized: false, // Allow self-signed certificates (if needed)
        forceNew: true, // Force a new connection
        upgrade: isProduction, // Allow transport upgrade in production
        path: '/socket.io/', // Explicit socket.io path
      });

      // Add additional debugging events for production
      if (isProduction) {
        this.socket.on('connect_attempt', (attempt) => {
          console.log('🔄 Socket connection attempt:', attempt);
        });
        
        this.socket.on('reconnect_attempt', (attempt) => {
          console.log('🔄 Socket reconnection attempt:', attempt);
        });
        
        this.socket.on('ping', () => {
          console.log('🏓 Socket ping sent');
        });
        
        this.socket.on('pong', (latency) => {
          console.log('🏓 Socket pong received, latency:', latency, 'ms');
        });
      }
      
      this.setupEventHandlers();
      
      return new Promise((resolve, reject) => {
        // Clear any existing connection timeout
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
        }

        this.connectionTimeout = setTimeout(() => {
          console.error('⏱️ Socket connection timeout after 20 seconds');
          console.error('⏱️ Final connection state:', {
            url: socketUrl,
            isProduction,
            socketId: this.socket?.id,
            connected: this.socket?.connected,
            disconnected: this.socket?.disconnected
          });
          this.connectionState = 'error';
          this.socket?.disconnect();
          reject(new Error('Connection timeout'));
        }, 20000);

        this.socket.once('connect', () => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          this.isConnected = true;
          this.connectionState = 'connected';
          this.reconnectAttempts = 0;
          console.log('✅ Socket connected successfully');
          console.log('🆔 Socket ID:', this.socket.id);
          resolve(true);
        });

        this.socket.once('connect_error', async (error) => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          
          // Enhanced error logging for production debugging
          if (this.reconnectAttempts === 0 || this.reconnectAttempts % 3 === 0) {
            console.error('❌ Socket connection error:', error?.message || 'Unknown error');
            console.error('❌ Error type:', error?.type || 'Unknown');
            console.error('❌ Error details:', {
              code: error?.code || 'UNKNOWN',
              data: error?.data || null,
              context: error?.context || null
            });
            console.error('❌ Connection URL:', socketUrl);
            console.error('❌ Is Production:', isProduction);
            console.error('❌ Reconnect attempt:', this.reconnectAttempts + 1, '/', this.maxReconnectAttempts);
          }
          
          // Increment reconnect attempts
          this.reconnectAttempts++;

          // If we've exceeded max attempts, stop trying
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached. Stopping.');
            this.connectionState = 'error';
            this.isConnected = false;
            this.socket?.disconnect();
            reject(new Error('Max reconnection attempts reached'));
            return;
          }

          // If authentication failed due to expired token, try refreshing once
          if ((error.message === 'Authentication failed' || error.message.includes('jwt expired')) && this.reconnectAttempts === 1) {
            console.log('🔄 Token expired, attempting to refresh...');
            const newToken = await this.refreshTokenIfNeeded();
            
            if (newToken) {
              console.log('🔁 Retrying connection with new token...');
              // Disconnect current socket
              if (this.socket) {
                this.socket.disconnect();
              }
              
              // Calculate delay with exponential backoff
              const retryDelay = Math.min(
                this.minReconnectDelay * Math.pow(2, this.reconnectAttempts),
                this.maxReconnectDelay
              );
              
              // Try connecting again with new token after delay
              setTimeout(() => {
                // Recalculate socket URL for retry
                let retrySocketUrl = API_BASE_URL;
                if (retrySocketUrl.endsWith('/api')) {
                  retrySocketUrl = retrySocketUrl.slice(0, -4);
                }
                
                // Check if this is production environment
                const isProduction = retrySocketUrl.includes('evnzo.com');

                this.socket = io(retrySocketUrl, {
                  auth: {
                    token: newToken
                  },
                  transports: isProduction ? ['polling', 'websocket'] : ['websocket'],
                  reconnection: true,
                  reconnectionAttempts: this.maxReconnectAttempts - this.reconnectAttempts,
                  reconnectionDelay: retryDelay,
                  reconnectionDelayMax: this.maxReconnectDelay,
                  timeout: 20000,
                  secure: isProduction,
                  rejectUnauthorized: false,
                  forceNew: true,
                  upgrade: isProduction,
                  path: '/socket.io/',
                });

                // Set up handlers for retry
                this.socket.once('connect', () => {
                  this.isConnected = true;
                  this.connectionState = 'connected';
                  this.reconnectAttempts = 0;
                  console.log('✅ Socket connected successfully after token refresh');
                  console.log('🆔 Socket ID:', this.socket.id);
                  resolve(true);
                });

                this.socket.once('connect_error', (retryError) => {
                  console.error('❌ Failed to connect even after token refresh:', retryError.message);
                  this.connectionState = 'error';
                  this.isConnected = false;
                  reject(retryError);
                });

                // Re-setup event handlers for the new socket
                this.setupEventHandlers();
              }, retryDelay);
            } else {
              console.error('❌ Failed to refresh token, user needs to login again');
              this.connectionState = 'error';
              this.isConnected = false;
              reject(new Error('Authentication failed - please login again'));
            }
          } else {
            // For other errors, implement exponential backoff
            const retryDelay = Math.min(
              this.minReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
              this.maxReconnectDelay
            );
            
            console.log(`⏳ Will retry connection in ${retryDelay}ms...`);
            this.connectionState = 'error';
            this.isConnected = false;
            
            // Schedule a reconnection attempt
            if (this.reconnectTimeout) {
              clearTimeout(this.reconnectTimeout);
            }
            
            this.reconnectTimeout = setTimeout(() => {
              if (this.connectionState !== 'connected') {
                console.log('🔄 Attempting to reconnect...');
                this.connect().catch(err => {
                  console.error('Failed to reconnect:', err);
                });
              }
            }, retryDelay);
            
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('❌ Failed to connect socket:', error);
      this.connectionState = 'error';
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
      this.connectionState = 'disconnected';
      this.emit('disconnected', reason);
      
      // Don't auto-reconnect for certain disconnect reasons
      const noReconnectReasons = ['io server disconnect', 'io client disconnect'];
      if (noReconnectReasons.includes(reason)) {
        console.log('ℹ️ Disconnect was intentional, not attempting reconnection');
        return;
      }
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
    this.socket.on('new-message', async (data) => {
      console.log('New message received:', data.message.message_id);

      // Check if app is in background/inactive or user is not on the chat screen
      const currentAppState = AppState.currentState;
      const currentUser = await AsyncStorage.getItem('userData');
      const userData = currentUser ? JSON.parse(currentUser) : null;
      const currentUserId = userData?.user_id || userData?.id;

      // Don't show notification if message is from current user
      if (data.message.sender_id !== currentUserId) {
        // Show notification if:
        // 1. App is in background or inactive
        // 2. OR user is not on this specific chat screen
        const shouldShowNotification =
          currentAppState === 'background' ||
          currentAppState === 'inactive' ||
          this.currentChatId !== data.chatId;

        if (shouldShowNotification) {
          await notificationService.displayNotification({
            data: {
              type: 'chat_message',
              chat_id: data.chatId,
              sender_name: data.message.sender?.full_name || 'User',
              sender_id: data.message.sender_id,
              message: data.message.content,
            },
            notification: {
              title: data.message.sender?.full_name || 'New Message',
              body: data.message.content,
            }
          });
        }

        // Auto-send delivered status for messages from others
        if (this.socket && this.isConnected) {
          this.socket.emit('message-delivered', {
            messageId: data.message.message_id,
            chatId: data.chatId
          });
        }
      }

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

    // Error handling with rate limiting
    this.socket.on('error', (error) => {
      // Only log errors occasionally to prevent spam
      if (this.reconnectAttempts === 0 || this.reconnectAttempts % 5 === 0) {
        console.error('Socket error:', error);
      }
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
      
      // Clear timeouts
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
        this.typingTimeout = null;
      }
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      // Update state
      this.connectionState = 'disconnected';
      this.isConnected = false;
      this.currentChatId = null;
      this.reconnectAttempts = 0;

      // Disconnect socket
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Check connection status
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  // Get connection state
  getConnectionState() {
    return this.connectionState;
  }

  // Reset connection attempts
  resetReconnectAttempts() {
    this.reconnectAttempts = 0;
    this.lastConnectionAttempt = 0;
  }

  // Get socket instance (for advanced usage)
  getSocket() {
    return this.socket;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;