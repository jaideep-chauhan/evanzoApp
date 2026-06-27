import api, { API_BASE_URL } from './api';
import dummyImage from '../assets/images/dummy.png';
import authFetch from './authFetch';

// Backend stores `duration` as a free-text varchar (legacy ads sometimes
// have just "4" without units). Format it for display:
//   - empty / null  → "TBD"
//   - already contains letters (e.g. "2 hours", "90 min") → pass through
//   - purely numeric → "<N> hour" / "<N> hours"
// Exported so the similar-events carousel (which renders raw DB rows that
// don't pass through formatEventForDisplay) shares the exact same formatting.
export const formatDuration = (raw) => {
    if (raw == null) return 'TBD';
    const s = String(raw).trim();
    if (!s) return 'TBD';
    if (/[a-zA-Z]/.test(s)) return s; // user already typed a unit
    const n = Number(s);
    if (!Number.isFinite(n)) return s;
    return `${n} ${n === 1 ? 'hour' : 'hours'}`;
};

class EventService {
    // Create event ad. Multipart upload routes through authFetch (native
    // fetch + refresh-on-401), same reason as createVendorAd.
    // Mirror createVendorAd's onUploadProgress contract: 10 right before
    // POST, 100 on response. Real upload-byte progress isn't exposed by
    // fetch; per-image progress lives in the compression step.
    async createEventAd(eventData, onUploadProgress = null) {
        try {
            if (eventData instanceof FormData) {
                if (onUploadProgress) onUploadProgress(10);
                const res = await authFetch(`${API_BASE_URL}/event_ad`, {
                    method: 'POST',
                    body: eventData,
                });
                const data = await res.json().catch(() => ({}));
                if (onUploadProgress) onUploadProgress(100);
                if (!res.ok) {
                    return {
                        success: false,
                        message: data?.message || `Server error: ${res.status}`,
                    };
                }
                return {
                    success: true,
                    data: data.data,
                    message: data.message || 'Event ad created successfully',
                };
            }

            const response = await api.post('/event_ad', eventData);
            return {
                success: true,
                data: response.data.data,
                message: 'Event ad created successfully',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to create event ad',
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
        const numericId = Number(eventId);
        if (!Number.isFinite(numericId) || numericId <= 0) {
            console.warn('[eventService.deleteEventAd] missing/invalid eventId:', eventId);
            return { success: false, message: 'Event ad id is missing' };
        }
        try {
            await api.delete(`/event_ad/${numericId}`);
            return {
                success: true,
                message: 'Event ad deleted successfully',
            };
        } catch (error) {
            console.error('[eventService.deleteEventAd] failed for', numericId, '→', error.response?.status, error.response?.data?.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to delete event ad',
            };
        }
    }

    // Get public event ads (for events tab - excludes current user)
    async getPublicEventAds() {
        try {
            const response = await api.get('/event_ad');
            console.log('🌐 Public event ads response received');
            console.log('📦 Response success:', response.data?.success);
            console.log('📦 Results count:', response.data?.data?.results?.length || 0);
            
            // Check if response.data exists and has the expected structure
            if (!response.data || !response.data.data) {
                console.error('❌ Unexpected Event API response structure');
                console.error('Response data:', response.data);
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

    // Mark event ad as completed.
    // Backend has no `/event_ad/:id/complete` route — status changes go
    // through PATCH /event_ad/:id/status with { status: 'completed' }.
    async markEventAdComplete(eventId) {
        const numericId = Number(eventId);
        if (!Number.isFinite(numericId) || numericId <= 0) {
            console.warn('[eventService.markEventAdComplete] missing/invalid eventId:', eventId);
            return { success: false, message: 'Event ad id is missing' };
        }
        try {
            const response = await api.patch(`/event_ad/${numericId}/status`, { status: 'completed' });
            return {
                success: true,
                data: response.data.data,
                message: 'Event marked as completed',
            };
        } catch (error) {
            console.error('[eventService.markEventAdComplete] failed for', eventId, '→', error.response?.status, error.response?.data?.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to mark event as completed',
            };
        }
    }

    // Enhanced method to extract images from attachments (similar to vendor service)
    extractImages(attachments) {
        if (!attachments) return [];
        
        const imageBaseUrl = 'https://api.evnzo.com'; // Use the actual API server URL for images
        
        try {
            // If attachments is a JSON string, parse it
            const parsed = typeof attachments === 'string' 
                ? JSON.parse(attachments) 
                : attachments;
            
            if (Array.isArray(parsed)) {
                const imageUrls = parsed
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
                        // Return properly formatted URL string for image rendering
                        if (typeof item === 'string') {
                            // If it's already a full URL, use it; otherwise append base URL
                            return item.startsWith('http') ? item : `${imageBaseUrl}${item}`;
                        } else if (typeof item === 'object' && item.url) {
                            // Handle file objects with url property
                            return item.url.startsWith('http') ? item.url : `${imageBaseUrl}${item.url}`;
                        }
                        return null;
                    })
                    .filter(Boolean); // Remove null values
                    
                return imageUrls;
            }
        } catch (e) {
            console.error('Error parsing event attachments:', e);
        }
        
        return [];
    }

    // Helper method to format event data for display
    formatEventForDisplay(event) {
        console.log('🎯 Formatting event:', event.title || event.event_ad_id);
        
        const extractedImages = this.extractImages(event.attachments);
        console.log('🎯 Extracted images count:', extractedImages.length);
        
        // Format date if it exists. The backend ships `event.date` as a Postgres
        // timestamptz (string like "2026-05-30 00:00:00+00") or sometimes a ms
        // timestamp. Normalise the space → "T" so JSC/Hermes parsers don't choke,
        // and guard against NaN so we never propagate the string "Invalid Date".
        let formattedDate = 'Date TBD';
        if (event.date) {
            const raw = typeof event.date === 'string'
                ? event.date.replace(' ', 'T')
                : event.date;
            const dateObj = new Date(raw);
            if (!isNaN(dateObj.getTime())) {
                formattedDate = dateObj.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                });
            } else if (typeof event.date === 'string') {
                // Backend already sent something human-readable; pass it through.
                formattedDate = event.date;
            }
        }
        
        // Create organizer data with user_id included. Backend ships event
        // ads with the joined user row, so prefer its full_name + profile_pic
        // over the legacy "User <id>" placeholder + lego avatar.
        const userRow = event?.user || event?.User || null;
        const organizer = {
            id: event.user_id, // Include user_id for chat navigation
            user_id: event.user_id, // Also include as user_id for compatibility
            name:
                userRow?.full_name ||
                [userRow?.first_name, userRow?.last_name].filter(Boolean).join(' ').trim() ||
                event.organizer_name ||
                `User ${event.user_id || 'Unknown'}`,
            avatar:
                userRow?.profile_pic ||
                event.organizer_avatar ||
                'https://randomuser.me/api/portraits/lego/1.jpg',
        };

        // Determine event category
        const category = event.event_type || event.service_needed || 'General Event';

        return {
            id: event.id || event.event_ad_id,
            user_id: event.user_id, // Include user_id at top level for easy access
            title: event.title || `${event.event_type || 'Event'} - ${event.service_needed || ''}`,
            service_needed: event.service_needed,
            event_type: event.event_type,
            event_tags: event.event_tags || [],
            location: event.location || 'Unknown',
            date: formattedDate,
            duration: formatDuration(event.duration),
            budget: event.budget || null,
            currency: event.currency || 'USD',
            guests: event.guests_count || null,
            guests_count: event.guests_count || null, // Add guests_count for consistency
            description: event.description || '',
            attachments: extractedImages.length > 0 ? extractedImages : [], // Return empty array if no images
            images: extractedImages.length > 0 ? extractedImages : [], // For new usage
            organizer: organizer, // Add organizer data for EventCard with user_id
            category: category, // Add category for filtering
            status: event.status || 'active',
            // Backend now auto-approves new event ads (approval_status:
            // 'approved' on insert at services/eventAd.service.js:22), so
            // default to 'approved' instead of 'pending' when the backend
            // omits the field. Avoids lighting up the "Waiting for approval"
            // banner on freshly-posted ads.
            approval_status: event.approval_status || 'approved',
            visibility: event.visibility || 'public',
            is_urgent: event.is_urgent || false,
            views_count: event.views_count || 0,
            responses_count: event.responses_count || 0,
            boosted: event.boosted || false,
            created_at: event.created_at,
            updated_at: event.updated_at,
            _original: event // Store original event data for reference
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