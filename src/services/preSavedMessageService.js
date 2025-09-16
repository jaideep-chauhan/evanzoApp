import api from './api';

class PreSavedMessageService {
    // Get user's pre-saved message
    async getPreSavedMessage() {
        try {
            const response = await api.get('/vendor-enhanced/messages/pre-saved');
            return {
                success: true,
                data: response.data.data,
                message: 'Pre-saved message retrieved successfully'
            };
        } catch (error) {
            // If no message exists (404), return success with null data
            if (error.response?.status === 404 || error.response?.data?.message?.includes('not found')) {
                return {
                    success: true,
                    data: null,
                    message: 'No pre-saved message found'
                };
            }
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to retrieve pre-saved message',
                data: null
            };
        }
    }

    // Create or update pre-saved message
    async savePreSavedMessage(messageData) {
        try {
            const response = await api.post('/vendor-enhanced/messages/pre-saved', messageData);
            return {
                success: true,
                data: response.data.data,
                message: response.data.message || 'Pre-saved message saved successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to save pre-saved message'
            };
        }
    }

    // Update pre-saved message by ID
    async updatePreSavedMessage(messageId, messageData) {
        try {
            const response = await api.put(`/vendor-enhanced/messages/pre-saved/${messageId}`, messageData);
            return {
                success: true,
                data: response.data.data,
                message: response.data.message || 'Pre-saved message updated successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to update pre-saved message'
            };
        }
    }

    // Use pre-saved message (increment usage count)
    async usePreSavedMessage(messageId) {
        try {
            const response = await api.post(`/vendor-enhanced/messages/pre-saved/${messageId}/use`);
            return {
                success: true,
                data: response.data.data,
                message: 'Pre-saved message used successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to use pre-saved message'
            };
        }
    }

    // Generate message template from form data
    generateMessageTemplate(formData) {
        const {
            eventName,
            location,
            category,
            date,
            time,
            duration,
            description
        } = formData;

        return `Hello! I'm organizing "${eventName}" in ${location}. 

Event Details:
- Category: ${category}
- Date: ${date}
- Time: ${time}
- Duration: ${duration}

Description: ${description}

I'm looking for vendors who can provide services for this event. Please let me know if you're available and interested in working with us.

Thank you for your time!`;
    }
}

const preSavedMessageService = new PreSavedMessageService();
export { preSavedMessageService };
export default preSavedMessageService;