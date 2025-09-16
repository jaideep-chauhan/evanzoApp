import api from './api';
import { Share } from 'react-native';

class VendorDetailsService {
    // Get vendor details by ID
    async getVendorDetails(vendorId) {
        try {
            const response = await api.get(`/vendor-enhanced/${vendorId}`);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Get vendor details error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch vendor details',
                data: null
            };
        }
    }

    // Get vendor reviews
    async getVendorReviews(vendorId, page = 1, limit = 10) {
        try {
            const response = await api.get(`/vendor-enhanced/${vendorId}/reviews`, {
                params: { page, limit }
            });
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Get vendor reviews error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch reviews',
                data: null
            };
        }
    }

    // Submit a review for vendor
    async submitVendorReview(vendorId, reviewData) {
        try {
            const response = await api.post(`/vendor-enhanced/${vendorId}/reviews`, {
                vendor_ad_id: vendorId,
                rating: reviewData.rating,
                review_text: reviewData.comment,
                media_attachments: reviewData.media || []
            });
            return {
                success: true,
                data: response.data.data,
                message: 'Review submitted successfully'
            };
        } catch (error) {
            console.error('Submit vendor review error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to submit review'
            };
        }
    }

    // Toggle save vendor (save/unsave)
    async toggleSaveVendor(vendorId) {
        try {
            // Ensure vendorId is a number
            const itemId = parseInt(vendorId, 10);
            
            if (isNaN(itemId)) {
                console.error('Invalid vendorId:', vendorId);
                return {
                    success: false,
                    message: 'Invalid vendor ID'
                };
            }
            
            console.log('Toggling save for vendor with itemId:', itemId);
            
            const response = await api.post('/profile/saved-items/toggle', {
                itemId: itemId,
                itemType: 'vendor'
            });
            
            console.log('Toggle save response:', response.data);
            
            // The backend returns: { status: true, message: '...', data: { saved: true/false, message: '...' } }
            const isSaved = response.data.data?.saved !== undefined ? response.data.data.saved : 
                           response.data.saved !== undefined ? response.data.saved :
                           true; // Default to saved if we got a successful response
            
            const message = response.data.data?.message || response.data.message || (isSaved ? 'Vendor saved' : 'Vendor unsaved');
            
            return {
                success: true,
                saved: isSaved,
                message: message
            };
        } catch (error) {
            console.error('Toggle save vendor error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to save vendor'
            };
        }
    }

    // Get saved vendors
    async getSavedVendors(page = 1, limit = 20) {
        try {
            const response = await api.get('/profile/saved-items', {
                params: {
                    itemType: 'vendor',
                    page,
                    limit
                }
            });
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Get saved vendors error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch saved vendors',
                data: []
            };
        }
    }

    // Share vendor
    async shareVendor(vendor) {
        try {
            const shareOptions = {
                title: `Check out ${vendor.name}`,
                message: `
🌟 ${vendor.name} - ${vendor.type}
📍 ${vendor.location}
⭐ Rating: ${vendor.rating || 'N/A'}

${vendor.description}

View more details on Evanzo app!
                `.trim(),
                url: vendor.images?.[0] || '', // Share first image if available
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
            console.error('Share vendor error:', error);
            return {
                success: false,
                message: 'Failed to share vendor'
            };
        }
    }

    // Send inquiry to vendor
    async sendVendorInquiry(vendorId, inquiryData) {
        try {
            const response = await api.post(`/vendor-enhanced/${vendorId}/inquiry`, {
                message: inquiryData.message,
                event_date: inquiryData.eventDate,
                event_type: inquiryData.eventType,
                budget: inquiryData.budget,
                guest_count: inquiryData.guestCount,
                additional_details: inquiryData.additionalDetails
            });
            return {
                success: true,
                data: response.data.data,
                message: 'Inquiry sent successfully'
            };
        } catch (error) {
            console.error('Send vendor inquiry error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to send inquiry'
            };
        }
    }

    // Get vendor portfolio
    async getVendorPortfolio(vendorId) {
        try {
            const response = await api.get(`/vendor-enhanced/${vendorId}/portfolio`);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Get vendor portfolio error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch portfolio',
                data: []
            };
        }
    }

    // Get vendor availability
    async getVendorAvailability(vendorId, startDate, endDate) {
        try {
            const params = {};
            if (startDate) params.start = startDate;
            if (endDate) params.end = endDate;
            
            const response = await api.get(`/vendor-enhanced/${vendorId}/availability`, { params });
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Get vendor availability error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch availability',
                data: []
            };
        }
    }

    // Get similar vendors
    async getSimilarVendors(vendorId) {
        try {
            const response = await api.get(`/vendor-enhanced/${vendorId}/similar`);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Get similar vendors error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch similar vendors',
                data: []
            };
        }
    }

    // Check if vendor is saved by current user
    async isVendorSaved(vendorId) {
        try {
            // Convert vendorId to number
            const vendorIdNum = parseInt(vendorId, 10);
            
            if (isNaN(vendorIdNum)) {
                console.error('Invalid vendorId for isVendorSaved:', vendorId);
                return false;
            }
            
            console.log('Checking if vendor is saved, vendorId:', vendorIdNum);
            
            // Make a direct API call to check if this specific vendor is saved
            const response = await api.get('/profile/saved-items', {
                params: {
                    itemType: 'vendor',
                    limit: 100 // Get more items to ensure we find it
                }
            });
            
            console.log('Saved items response:', response.data);
            
            if (response.data.status && response.data.data) {
                const savedItems = response.data.data.items || response.data.data;
                // Check if this vendor is in the saved items
                const isSaved = savedItems.some(item => {
                    const itemId = item.item_id || item.itemId;
                    return parseInt(itemId, 10) === vendorIdNum;
                });
                console.log('Vendor', vendorIdNum, 'is saved:', isSaved);
                return isSaved;
            }
            return false;
        } catch (error) {
            console.error('Check vendor saved status error:', error);
            return false;
        }
    }
}

const vendorDetailsService = new VendorDetailsService();
export default vendorDetailsService;