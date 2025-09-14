import api from './api';

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

      const response = await api.post(`/chat/${chatId}/message`, messageData);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send message'
      };
    }
  }

  // Send media message
  async sendMediaMessage(chatId, formData) {
    try {
      const response = await api.post(`/chat/${chatId}/media`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send media'
      };
    }
  }

  // Mark message as read
  async markMessageAsRead(messageId) {
    try {
      const response = await api.put(`/chat/message/${messageId}/read`);
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
      const response = await api.put(`/chat/${chatId}/read`);
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
      const response = await api.put(`/chat/message/${messageId}`, { content });
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
      const response = await api.delete(`/chat/message/${messageId}`);
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
      const response = await api.put(`/chat/${chatId}/settings`, settings);
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

      const response = await api.get(`/chat/${chatId}/search?${params.toString()}`);
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
      const response = await api.post(`/chat/${chatId}/participant`, {
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
      const response = await api.delete(`/chat/${chatId}/participant/${userId}`);
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
      sender: message.sender
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