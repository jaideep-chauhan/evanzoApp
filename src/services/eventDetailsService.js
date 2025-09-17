import api from './api';
import { Share } from 'react-native';

class EventDetailsService {
    // Check if event is saved by current user
    async isEventSaved(eventId) {
        try {
            // Convert eventId to number
            const eventIdNum = parseInt(eventId, 10);
            
            if (isNaN(eventIdNum)) {
                console.error('Invalid eventId for isEventSaved:', eventId);
                return false;
            }
            
            console.log('Checking if event is saved, eventId:', eventIdNum);
            
            // Make a direct API call to check if this specific event is saved
            const response = await api.get('/profile/saved-items', {
                params: {
                    itemType: 'event',
                    limit: 100 // Get more items to ensure we find it
                }
            });
            
            console.log('Saved events response:', response.data);
            
            if (response.data.status && response.data.data) {
                const savedItems = response.data.data.items || response.data.data;
                // Check if this event is in the saved items
                const isSaved = savedItems.some(item => {
                    const itemId = item.item_id || item.itemId;
                    return parseInt(itemId, 10) === eventIdNum;
                });
                
                console.log('Event saved status:', isSaved);
                return isSaved;
            }
            
            return false;
        } catch (error) {
            console.error('Check event saved error:', error);
            return false;
        }
    }

    // Toggle save event (save/unsave)
    async toggleSaveEvent(eventId) {
        try {
            // Ensure eventId is a number
            const itemId = parseInt(eventId, 10);
            
            if (isNaN(itemId)) {
                console.error('Invalid eventId:', eventId);
                return {
                    success: false,
                    message: 'Invalid event ID'
                };
            }
            
            console.log('Toggling save for event with itemId:', itemId);
            
            const response = await api.post('/profile/saved-items/toggle', {
                itemId: itemId,
                itemType: 'event'
            });
            
            console.log('Toggle save event response:', response.data);
            
            // The backend returns: { status: true, message: '...', data: { saved: true/false, message: '...' } }
            const isSaved = response.data.data?.saved !== undefined ? response.data.data.saved : 
                           response.data.saved !== undefined ? response.data.saved :
                           true; // Default to saved if we got a successful response
            
            const message = response.data.data?.message || response.data.message || (isSaved ? 'Event saved' : 'Event unsaved');
            
            return {
                success: true,
                saved: isSaved,
                message: message
            };
        } catch (error) {
            console.error('Toggle save event error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to save/unsave event'
            };
        }
    }

    // Share event
    async shareEvent(event) {
        try {
            const shareOptions = {
                title: `Check out this event: ${event.title}`,
                message: `
🎉 ${event.title}
📍 ${event.location}
📅 ${event.date}
⏱️ Duration: ${event.duration} hours
👥 Guests: ${event.guests || 'TBD'}
💰 Budget: ${event.budget}

${event.description}

Event organized by ${event.organizer?.name || 'Event Organizer'}

View more details on Evanzo app!
                `.trim(),
                url: event.images?.[0]?.uri || '', // Share first image if available
            };

            const result = await Share.share(shareOptions);
            return {
                success: true,
                shared: true,
                result
            };
        } catch (error) {
            if (error.message === 'User did not share') {
                return {
                    success: true,
                    shared: false,
                    message: 'Share cancelled'
                };
            }
            console.error('Share event error:', error);
            return {
                success: false,
                message: 'Failed to share event'
            };
        }
    }

    // Get event reviews/responses
    async getEventResponses(eventId, page = 1, limit = 10) {
        try {
            const response = await api.get(`/event_ad/${eventId}/responses`, {
                params: { page, limit }
            });
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Get event responses error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch responses',
                data: null
            };
        }
    }

    // Send response/quote to event
    async respondToEvent(eventId, responseData) {
        try {
            const response = await api.post(`/event_ad/${eventId}/respond`, {
                event_ad_id: eventId,
                message: responseData.message || responseData.quote,
                quote_amount: responseData.quote_amount,
                availability: responseData.availability || true,
                additional_info: responseData.additional_info || ''
            });
            
            return {
                success: true,
                data: response.data.data,
                message: 'Response sent successfully'
            };
        } catch (error) {
            console.error('Respond to event error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to send response'
            };
        }
    }
}

const eventDetailsService = new EventDetailsService();
export { eventDetailsService };
export default eventDetailsService;