import api from './api';

class EventService {
    // Create event ad
    async createEventAd(eventData) {
        try {
            const headers = {};
            
            // Check if eventData is FormData (for file uploads)
            if (eventData instanceof FormData) {
                headers['Content-Type'] = 'multipart/form-data';
            }
            
            const response = await api.post('/event_ad', eventData, { headers });
            return {
                success: true,
                data: response.data.data,
                message: 'Event ad created successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to create event ad'
            };
        }
    }

    // Get my event ads
    async getMyEventAds() {
        try {
            const response = await api.get('/events/my-ads');
            return {
                success: true,
                data: response.data.data || []
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch your event ads',
                data: []
            };
        }
    }

    // Update event ad
    async updateEventAd(eventId, eventData) {
        try {
            const response = await api.put(`/event_ad/${eventId}`, eventData);
            return {
                success: true,
                data: response.data.data,
                message: 'Event ad updated successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to update event ad'
            };
        }
    }

    // Delete event ad
    async deleteEventAd(eventId) {
        try {
            await api.delete(`/event_ad/${eventId}`);
            return {
                success: true,
                message: 'Event ad deleted successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to delete event ad'
            };
        }
    }

    // Search event ads
    async searchEventAds({
        keyword = '',
        location = '',
        eventType = '',
        dateFrom = null,
        dateTo = null,
        budgetMin = null,
        budgetMax = null,
        page = 1,
        limit = 20
    } = {}) {
        try {
            const params = new URLSearchParams();
            if (keyword) params.append('keyword', keyword);
            if (location) params.append('location', location);
            if (eventType) params.append('eventType', eventType);
            if (dateFrom) params.append('dateFrom', dateFrom);
            if (dateTo) params.append('dateTo', dateTo);
            if (budgetMin) params.append('budgetMin', budgetMin);
            if (budgetMax) params.append('budgetMax', budgetMax);
            params.append('page', page);
            params.append('limit', limit);

            const response = await api.get(`/event_ad/search?${params.toString()}`);
            return {
                success: true,
                data: response.data.data || [],
                pagination: response.data.pagination
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to search event ads',
                data: []
            };
        }
    }

    // Get event ad details
    async getEventAdDetails(eventId) {
        try {
            const response = await api.get(`/event_ad/${eventId}`);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch event ad details',
                data: null
            };
        }
    }

    // Mark event ad as completed
    async markEventAdComplete(eventId) {
        try {
            const response = await api.put(`/event_ad/${eventId}/complete`);
            return {
                success: true,
                data: response.data.data,
                message: 'Event marked as completed'
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to mark event as completed'
            };
        }
    }

    // Helper method to format event data for display
    formatEventForDisplay(event) {
        return {
            id: event.id || event.event_ad_id,
            service: event.service_needed || event.service,
            eventType: event.event_type,
            location: event.location,
            date: event.date,
            duration: event.duration,
            budget: event.budget,
            description: event.description,
            attachments: this.extractImages(event.attachments),
            status: event.status || 'active',
            createdAt: event.created_at,
            userId: event.user_id
        };
    }

    extractImages(data) {
        if (!data) return [];
        
        // If it's already an array of images
        if (Array.isArray(data)) {
            return data.filter(item => 
                typeof item === 'string' && 
                (item.startsWith('http') || item.startsWith('data:'))
            );
        }
        
        // If it's a JSON string
        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed)) {
                    return this.extractImages(parsed);
                }
            } catch (e) {
                // If it's a single URL
                if (data.startsWith('http') || data.startsWith('data:')) {
                    return [data];
                }
            }
        }
        
        return [];
    }
}

const eventService = new EventService();
export { eventService };
export default eventService;