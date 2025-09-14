import api from './api';
import dummyImage from '../assets/images/dummy.png';

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

    // Get my event ads (for profile screen - current user's ads only)
    async getMyEventAds() {
        try {
            const response = await api.get('/event_ad/my-ads');
            console.log('📱 My event ads response received');
            
            // Backend returns data directly or with results structure
            const eventAds = response.data.data?.results || response.data.data || [];
            console.log(`✅ Found ${eventAds.length} event ads for current user`);
            
            return {
                success: true,
                data: eventAds
            };
        } catch (error) {
            console.error('❌ Get my event ads error:', error);
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

    // Get public event ads (for events tab - excludes current user)
    async getPublicEventAds() {
        try {
            const response = await api.get('/event_ad');
            console.log('🌐 Public event ads response received');
            
            // Check if response.data exists and has the expected structure
            if (!response.data || !response.data.data) {
                console.error('❌ Unexpected Event API response structure');
                return {
                    success: false,
                    message: 'Invalid API response structure',
                    data: []
                };
            }
            
            // Extract the results array from the paginated response
            const eventAds = response.data.data?.results || [];
            console.log(`✅ Found ${eventAds.length} public event ads`);
            
            return {
                success: true,
                data: eventAds  // Return the array directly
            };
        } catch (error) {
            console.error('❌ Get public event ads error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch event ads',
                data: []
            };
        }
    }
    
    // Deprecated: Keep for backward compatibility, redirects to getPublicEventAds
    async getAllEventAds() {
        console.warn('⚠️ getAllEventAds is deprecated. Use getPublicEventAds instead.');
        return this.getPublicEventAds();
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

    // Enhanced method to extract images from attachments (similar to vendor service)
    extractImages(attachments) {
        if (!attachments) return [];
        
        try {
            // If attachments is a JSON string, parse it
            const parsed = typeof attachments === 'string' 
                ? JSON.parse(attachments) 
                : attachments;
            
            if (Array.isArray(parsed)) {
                return parsed
                    .filter(item => {
                        // Check if it's an image file object or URL
                        if (typeof item === 'string') {
                            return item.includes('.jpg') || item.includes('.jpeg') || 
                                   item.includes('.png') || item.includes('.gif') ||
                                   item.includes('.webp') || item.startsWith('http');
                        } else if (typeof item === 'object' && item.url) {
                            // Handle file objects with url property
                            return item.mimetype && item.mimetype.startsWith('image/');
                        }
                        return false;
                    })
                    .map(item => {
                        // Return just the URL string for image rendering
                        if (typeof item === 'string') {
                            return item;
                        } else if (typeof item === 'object' && item.url) {
                            return item.url;
                        }
                        return null;
                    })
                    .filter(Boolean); // Remove null values
            }
        } catch (e) {
            console.error('Error parsing event attachments:', e);
        }
        
        return [];
    }

    // Helper method to format event data for display
    formatEventForDisplay(event) {
        console.log('Formatting event:', event);
        const extractedImages = this.extractImages(event.attachments);
        
        // Format date if it exists
        let formattedDate = 'Date TBD';
        if (event.date) {
            try {
                const dateObj = new Date(event.date);
                formattedDate = dateObj.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                });
            } catch (e) {
                formattedDate = event.date;
            }
        }
        
        // Create dummy organizer data (since backend doesn't provide it yet)
        const organizer = {
            name: `User ${event.user_id || 'Unknown'}`,
            avatar: 'https://randomuser.me/api/portraits/lego/1.jpg' // Default avatar
        };
        
        // Determine event category
        const category = event.event_type || event.service_needed || 'General Event';
        
        return {
            id: event.id || event.event_ad_id,
            title: event.title || `${event.event_type || 'Event'} - ${event.service_needed || ''}`,
            service_needed: event.service_needed,
            event_type: event.event_type,
            event_tags: event.event_tags || [],
            location: event.location || 'Unknown',
            date: formattedDate,
            duration: event.duration || 'TBD',
            budget: event.budget || null,
            guests: event.guests_count || null,
            description: event.description || '',
            attachments: extractedImages.length > 0 ? extractedImages : [], // Return empty array if no images
            images: extractedImages.length > 0 ? extractedImages : [], // For new usage
            organizer: organizer, // Add organizer data for EventCard
            category: category, // Add category for filtering
            status: event.status || 'active',
            visibility: event.visibility || 'public',
            is_urgent: event.is_urgent || false,
            views_count: event.views_count || 0,
            responses_count: event.responses_count || 0,
            boosted: event.boosted || false,
            created_at: event.created_at,
            updated_at: event.updated_at
        };
    }

    extractAttachments(data) {
        if (!data) return [];
        
        // If it's already an array
        if (Array.isArray(data)) {
            return data;
        }
        
        // If it's a JSON string
        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            } catch (e) {
                return [];
            }
        }
        
        return [];
    }
}

const eventService = new EventService();
export { eventService };
export default eventService;