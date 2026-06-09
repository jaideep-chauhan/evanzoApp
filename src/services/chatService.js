import api, { API_BASE_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authFetch from './authFetch';

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

  // Find existing direct chat with a user
  async findDirectChat(recipientId) {
    try {
      console.log('🔍 Finding direct chat with recipient:', recipientId);
      
      // Get all chats and find direct chat with this recipient
      const response = await this.getChats({ type: 'direct' });
      
      if (response.success && response.data?.results) {
        // Find chat where one of the participants is the recipient
        const existingChat = response.data.results.find(chat => {
          if (chat.type !== 'direct') return false;
          
          // Check if any participant matches the recipientId
          return chat.participants?.some(p => 
            String(p.user_id) === String(recipientId)
          );
        });
        
        if (existingChat) {
          console.log('✅ Found existing chat:', existingChat.chat_id);
          return {
            success: true,
            exists: true,
            chatId: existingChat.chat_id,
            chat: existingChat
          };
        }
      }
      
      console.log('ℹ️ No existing chat found with recipient:', recipientId);
      return {
        success: true,
        exists: false,
        chatId: null,
        chat: null
      };
    } catch (error) {
      console.error('Error finding direct chat:', error);
      return {
        success: false,
        exists: false,
        message: error.message
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

      // Convert recipientId to number as backend expects a number
      const numericRecipientId = Number(recipientId);

      console.log('📤 createDirectChat - Sending request:', {
        recipient_id: numericRecipientId,
        originalRecipientId: recipientId,
        type: typeof numericRecipientId
      });

      const response = await api.post('/chat/direct', {
        recipient_id: numericRecipientId
      });

      console.log('✅ createDirectChat - Response:', response.data);

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('❌ createDirectChat - Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
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

  // Send media message — uses authFetch so the multipart body actually
  // works on Android (axios XHR mangles file parts) and so a 401 mid-upload
  // is transparently refreshed + retried once.
  async sendMediaMessage(chatId, formData) {
    try {
      console.log('📤 ChatService.sendMediaMessage - Sending to:', `/chat/${chatId}/messages/media`);

      const res = await authFetch(`${API_BASE_URL}/chat/${chatId}/messages/media`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error('❌ ChatService.sendMediaMessage - HTTP', res.status, data?.message);
        return {
          success: false,
          message: data?.message || `Server error: ${res.status}`,
        };
      }

      const responseData = data.data;
      if (responseData && responseData.attachments) {
        responseData.attachments = this.processAttachments(responseData.attachments);
      }

      return {
        success: true,
        data: responseData,
      };
    } catch (error) {
      console.error('❌ ChatService.sendMediaMessage - Error:', error?.message);
      return {
        success: false,
        message: error.message || 'Failed to send media',
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
  async deleteMessage(messageId, deleteForEveryone = false) {
    try {
      console.log('🗑️ ChatService.deleteMessage - Sending request:', {
        messageId,
        deleteForEveryone,
        url: `/chat/messages/${messageId}`,
        fullURL: `${api.defaults.baseURL}/chat/messages/${messageId}`,
        baseURL: api.defaults.baseURL
      });

      const response = await api.delete(`/chat/messages/${messageId}`, {
        data: { deleteForEveryone }
      });

      console.log('✅ ChatService.deleteMessage - Response:', response.data);
      console.log('✅ ChatService.deleteMessage - Full response:', JSON.stringify(response.data, null, 2));

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('❌ ChatService.deleteMessage - Error:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        error: error.message,
        baseURL: api.defaults.baseURL
      });

      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete message'
      };
    }
  }

  // Toggle reaction on a message
  async toggleReaction(messageId, emoji) {
    try {
      console.log('👍 ChatService.toggleReaction - Sending request:', {
        messageId,
        emoji,
        url: `/chat/messages/${messageId}/react`
      });

      const response = await api.post(`/chat/messages/${messageId}/react`, { emoji });

      console.log('✅ ChatService.toggleReaction - Response:', response.data);

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('❌ ChatService.toggleReaction - Error:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        error: error.message
      });

      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add reaction'
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

  // Helper function to process attachment URLs
  processAttachments(attachments) {
    if (!attachments) {
      return attachments;
    }

    // Handle single attachment object (not array)
    const processAttachment = (attachment) => {
      let processedUrl = attachment.url;

      // If attachment has a URL
      if (processedUrl) {
        // Replace localhost with actual API base URL
        if (processedUrl.includes('localhost') || processedUrl.includes('127.0.0.1')) {
          // Extract the path part from localhost URL (e.g., /uploads/images/file.jpg)
          try {
            // Use string manipulation instead of URL API (React Native compatibility)
            // Find the path after the domain/port
            const pathMatch = processedUrl.match(/https?:\/\/[^\/]+(\/.*)/);
            const path = pathMatch ? pathMatch[1] : processedUrl;

            // Remove '/api' from API_BASE_URL to get the main domain
            const baseUrl = API_BASE_URL.replace('/api', '');
            processedUrl = `${baseUrl}${path}`;
            console.log('🔄 Replaced localhost URL:', { original: attachment.url, fixed: processedUrl });
          } catch (e) {
            console.error('Error parsing URL:', e);
            // Fallback: try to extract path after last /
            const lastSlashIndex = processedUrl.lastIndexOf('/uploads');
            if (lastSlashIndex !== -1) {
              const path = processedUrl.substring(lastSlashIndex);
              const baseUrl = API_BASE_URL.replace('/api', '');
              processedUrl = `${baseUrl}${path}`;
            }
          }
        }
        // If URL doesn't start with http, prepend base URL
        else if (!processedUrl.startsWith('http')) {
          const baseUrl = API_BASE_URL.replace('/api', '');
          processedUrl = `${baseUrl}${processedUrl.startsWith('/') ? '' : '/'}${processedUrl}`;
        }
      }

      // Mirror the normalized URL onto `uri` too. Many call sites in the UI
      // (Image, Video, AudioPlayer) read `attachment.uri || attachment.url`,
      // preferring `uri`. If the backend stored a bad/relative `uri` (e.g.
      // `http://localhost:3000/...` from the dev box, or `/uploads/...`),
      // the renderer would pick that up before falling through to the fixed
      // `url`, causing NSURL "hostname not found" (-1003) on real devices.
      // Setting both fields to the same processed value avoids that.
      return {
        ...attachment,
        url: processedUrl,
        uri: processedUrl,
        name: attachment.name || attachment.originalName || 'Document' // Map originalName to name for display
      };
    };

    // Handle both array and single object
    if (Array.isArray(attachments)) {
      return attachments.map(processAttachment);
    } else {
      // Single attachment object
      return [processAttachment(attachments)];
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
      attachments: this.processAttachments(message.attachments),
      sender: message.sender,
      senderId: message.sender_id
    };
  }

  // Format time for display
  formatTime(timestamp) {
    if (!timestamp) {
      return '';
    }

    const date = new Date(timestamp);

    // Check if date is invalid
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp received:', timestamp);
      return '';
    }

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