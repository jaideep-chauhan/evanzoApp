import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ChatService {
  // Create a new chat
  async createChat(chatData) {
    try {
      const response = await api.post('/chat', chatData);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create chat'
      };
    }
  }

  // Create direct chat with a user
  async createDirectChat(recipientId) {
    try {
      // Get current user ID to prevent self-chat on frontend
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        const currentUserId = String(user?.user_id || user?.id);
        
        if (String(recipientId) === currentUserId) {
          return {
            success: false,
            message: 'Cannot create a direct chat with yourself'
          };
        }
      }
      
      const response = await api.post('/chat/direct', {
        recipient_id: recipientId
      });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create direct chat'
      };
    }
  }

  // Get user's chats
  async getChats(filters = {}, options = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add filters
      if (filters.type) params.append('type', filters.type);
      if (filters.is_archived) params.append('is_archived', filters.is_archived);
      if (filters.is_muted) params.append('is_muted', filters.is_muted);
      
      // Add pagination options
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);
      if (options.sortBy) params.append('sortBy', options.sortBy);

      const response = await api.get(`/chat?${params.toString()}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch chats',
        data: []
      };
    }
  }

  // Get chat by ID
  async getChatById(chatId) {
    try {
      const response = await api.get(`/chat/${chatId}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch chat'
      };
    }
  }

  // Get chat messages
  async getChatMessages(chatId, options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);
      if (options.before) params.append('before', options.before);
      if (options.after) params.append('after', options.after);

      const response = await api.get(`/chat/${chatId}/messages?${params.toString()}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch messages',
        data: { results: [] }
      };
    }
  }

  // Send a message
  async sendMessage(chatId, content, messageType = 'text', attachments = null) {
    try {
      const messageData = {
        content,
        message_type: messageType
      };

      if (attachments) {
        messageData.attachments = attachments;
      }

      const response = await api.post(`/chat/${chatId}/messages`, messageData);
      console.log('📤 ChatService - API Response:', {
        status: response.status,
        data: response.data,
        hasData: !!response.data.data
      });
      
      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Server returned unsuccessful response'
        };
      }
    } catch (error) {
      console.error('📤 ChatService - API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        errorData: error.response?.data,
        errorMessage: error.message
      });
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to send message'
      };
    }
  }

  // Send media message
  async sendMediaMessage(chatId, formData) {
    try {
      console.log('📤 ChatService.sendMediaMessage - Sending to:', `/chat/${chatId}/messages/media`);
      
      // Don't set Content-Type header - api.js interceptor handles it
      const response = await api.post(`/chat/${chatId}/messages/media`, formData);
      
      console.log('✅ ChatService.sendMediaMessage - Success:', response.data);
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('❌ ChatService.sendMediaMessage - Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to send media'
      };
    }
  }

  // Mark message as read
  async markMessageAsRead(messageId) {
    try {
      const response = await api.post(`/chat/messages/${messageId}/read`);
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to mark as read'
      };
    }
  }

  // Mark entire chat as read
  async markChatAsRead(chatId) {
    try {
      const response = await api.post(`/chat/${chatId}/read`);
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to mark chat as read'
      };
    }
  }

  // Update message
  async updateMessage(messageId, content) {
    try {
      const response = await api.patch(`/chat/messages/${messageId}`, { content });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update message'
      };
    }
  }

  // Delete message
  async deleteMessage(messageId) {
    try {
      const response = await api.delete(`/chat/messages/${messageId}`);
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete message'
      };
    }
  }

  // Update chat settings
  async updateChatSettings(chatId, settings) {
    try {
      const response = await api.patch(`/chat/${chatId}/settings`, settings);
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update settings'
      };
    }
  }

  // Set typing status
  async setTypingStatus(chatId, typing) {
    try {
      const response = await api.post(`/chat/${chatId}/typing`, { typing });
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update typing status'
      };
    }
  }

  // Search messages in chat
  async searchMessages(chatId, query, options = {}) {
    try {
      const params = new URLSearchParams();
      params.append('query', query);
      
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);

      const response = await api.get(`/chat/${chatId}/messages/search?${params.toString()}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to search messages',
        data: []
      };
    }
  }

  // Get chat participants
  async getChatParticipants(chatId) {
    try {
      const response = await api.get(`/chat/${chatId}/participants`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch participants',
        data: []
      };
    }
  }

  // Add participant to chat
  async addParticipant(chatId, userId, role = 'member') {
    try {
      const response = await api.post(`/chat/${chatId}/participants`, {
        user_id: userId,
        role
      });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add participant'
      };
    }
  }

  // Remove participant from chat
  async removeParticipant(chatId, userId) {
    try {
      const response = await api.delete(`/chat/${chatId}/participants/${userId}`);
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to remove participant'
      };
    }
  }

  // Leave chat
  async leaveChat(chatId) {
    try {
      const response = await api.post(`/chat/${chatId}/leave`);
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to leave chat'
      };
    }
  }

  // Delete chat
  async deleteChat(chatId) {
    try {
      const response = await api.delete(`/chat/${chatId}`);
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete chat'
      };
    }
  }

  // Get unread messages count
  async getUnreadCount() {
    try {
      const response = await api.get('/chat/unread-count');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch unread count',
        data: { unread_count: 0 }
      };
    }
  }

  // Block user
  async blockUser(userId) {
    try {
      const response = await api.post('/chat/block', { user_id: userId });
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to block user'
      };
    }
  }

  // Unblock user
  async unblockUser(userId) {
    try {
      const response = await api.post('/chat/unblock', { user_id: userId });
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to unblock user'
      };
    }
  }

  // Format message for display
  formatMessage(message) {
    return {
      id: message.message_id,
      text: message.content,
      timestamp: this.formatTime(message.created_at),
      isMe: message.is_sender || false,
      messageType: message.message_type || 'text',
      status: message.status || 'sent',
      attachments: message.attachments,
      sender: message.sender,
      senderId: message.sender_id
    };
  }

  // Format time for display
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Today - show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffDays < 7) {
      // This week - show day name
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // Older - show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }
}

const chatService = new ChatService();
export default chatService;