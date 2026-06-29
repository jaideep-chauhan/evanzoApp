import api, { API_BASE_URL } from './api';
import { Share, Platform } from 'react-native';
import authFetch from './authFetch';
import savedVendorsStorage from './savedVendorsStorage';
import { createAdLink } from './deepLinkService';

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

    // Get reviews for a user directly (event organizers have no vendor ad).
    async getUserReviews(userId, page = 1, limit = 10) {
        try {
            const response = await api.get(`/vendor-enhanced/user/${userId}/reviews`, {
                params: { page, limit }
            });
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Get user reviews error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch reviews',
                data: null
            };
        }
    }

    // Shared review-submit core. When media files are attached, the request
    // goes out as multipart so the backend's multer middleware can persist them
    // under /uploads/vendor-reviews. Axios's XHR multipart is broken on
    // Android, so the multipart path uses native fetch with the auth token
    // (same pattern as createVendorAd in vendorService). `path` is the API
    // path (vendor-ad or user review endpoint) — both share this logic.
    async _postReview(path, reviewData) {
        try {
            const media = Array.isArray(reviewData.media) ? reviewData.media : [];

            if (media.length === 0) {
                // Plain JSON path — no files, the original behavior is fine.
                const response = await api.post(path, {
                    rating: reviewData.rating,
                    review_text: reviewData.comment,
                });
                return {
                    success: true,
                    data: response.data.data,
                    message: 'Review submitted successfully',
                };
            }

            // Multipart path
            const formData = new FormData();
            formData.append('rating', String(reviewData.rating));
            if (reviewData.comment) {
                formData.append('review_text', reviewData.comment);
            }
            media.forEach((m) => {
                let uri = typeof m === 'string' ? m : m.uri;
                if (Platform.OS === 'android' && uri && !uri.startsWith('file://') && !uri.startsWith('content://') && !uri.startsWith('http')) {
                    uri = `file://${uri}`;
                }
                formData.append('media_attachments', {
                    uri,
                    type: m.type || 'image/jpeg',
                    name: m.name || `review_${Date.now()}.jpg`,
                });
            });

            // Go through authFetch so a 401 mid-upload transparently
            // refreshes + retries instead of failing the whole submission.
            const res = await authFetch(`${API_BASE_URL}${path}`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                return {
                    success: false,
                    message: data?.message || `Server error: ${res.status}`,
                };
            }

            return {
                success: true,
                data: data.data,
                message: data.message || 'Review submitted successfully',
            };
        } catch (error) {
            console.error('Submit review error:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to submit review',
            };
        }
    }

    // Submit a review for a vendor ad's owner.
    async submitVendorReview(vendorId, reviewData) {
        return this._postReview(`/vendor-enhanced/${vendorId}/reviews`, reviewData);
    }

    // Submit a review for a user directly (event organizer).
    async submitUserReview(userId, reviewData) {
        return this._postReview(`/vendor-enhanced/user/${userId}/reviews`, reviewData);
    }

    // Toggle save vendor (save/unsave)
    async toggleSaveVendor(vendorId, vendorData = {}) {
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
            
            // Update local storage first for immediate UI update
            const localResult = await savedVendorsStorage.toggleSaveVendor(itemId, vendorData);
            
            try {
                // Then sync with backend
                const response = await api.post('/profile/saved-items/toggle', {
                    itemId: itemId,
                    itemType: 'vendor'
                });
                
                console.log('Toggle save response:', response.data);
                
                // The backend returns: { status: true, message: '...', data: { saved: true/false, message: '...' } }
                const isSaved = response.data.data?.saved !== undefined ? response.data.data.saved : 
                               response.data.saved !== undefined ? response.data.saved :
                               localResult.saved; // Use local result as fallback
                
                const message = response.data.data?.message || response.data.message || (isSaved ? 'Vendor saved' : 'Vendor unsaved');
                
                // Update local storage to match backend state
                if (isSaved !== localResult.saved) {
                    // Backend state differs from local, sync it
                    if (isSaved) {
                        await savedVendorsStorage.saveVendor(itemId, vendorData);
                    } else {
                        await savedVendorsStorage.unsaveVendor(itemId);
                    }
                }
                
                return {
                    success: true,
                    saved: isSaved,
                    message: message
                };
            } catch (error) {
                // If backend fails, keep local state and return it
                console.error('Backend toggle save vendor error:', error);
                console.log('Using local storage result as fallback');
                
                return {
                    success: true,
                    saved: localResult.saved,
                    message: localResult.saved ? 'Vendor saved locally' : 'Vendor unsaved locally'
                };
            }
        } catch (error) {
            console.error('Toggle save vendor error:', error);
            return {
                success: false,
                message: error.message || 'Failed to save vendor'
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
            // Shareable deep link to THIS vendor ad.
            const link = await createAdLink({
                type: 'vendor',
                id: vendor.vendor_ad_id || vendor.id,
                title: vendor.name,
                description: vendor.description,
                imageUrl: vendor.images?.[0]?.uri || vendor.images?.[0] || '',
            });

            const shareOptions = {
                title: `Check out ${vendor.name}`,
                message: `
🌟 ${vendor.name} - ${vendor.type}
📍 ${vendor.location}
⭐ Rating: ${vendor.rating || 'N/A'}

${vendor.description}

👉 Open it on Evanzo: ${link}
                `.trim(),
                url: link,
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
            
            // Check backend first (primary source of truth)
            try {
                const response = await api.get('/profile/saved-items', {
                    params: {
                        itemType: 'vendor',
                        limit: 100
                    }
                });
                
                if (response.data.status && response.data.data) {
                    const savedItems = response.data.data.items || response.data.data;
                    const isBackendSaved = savedItems.some(item => {
                        const itemId = item.item_id || item.itemId || item.item?.vendor_ad_id;
                        return parseInt(itemId, 10) === vendorIdNum;
                    });
                    
                    // Update local storage to match backend
                    if (isBackendSaved) {
                        await savedVendorsStorage.saveVendor(vendorIdNum);
                    } else {
                        await savedVendorsStorage.unsaveVendor(vendorIdNum);
                    }
                    
                    return isBackendSaved;
                }
            } catch (backendError) {
                // Fall back to local storage if backend fails
                const isLocallySaved = await savedVendorsStorage.isVendorSaved(vendorIdNum);
                return isLocallySaved;
            }
            
            return false;
        } catch (error) {
            console.error('Check vendor saved status error:', error);
            return false;
        }
    }
    
    // Helper method to sync saved status with backend
    async syncSavedStatusWithBackend(vendorIdNum) {
        try {
            const response = await api.get('/profile/saved-items', {
                params: {
                    itemType: 'vendor',
                    limit: 100
                }
            });
            
            if (response.data.status && response.data.data) {
                const savedItems = response.data.data.items || response.data.data;
                const isBackendSaved = savedItems.some(item => {
                    const itemId = item.item_id || item.itemId;
                    return parseInt(itemId, 10) === vendorIdNum;
                });
                
                const isLocallySaved = await savedVendorsStorage.isVendorSaved(vendorIdNum);
                
                // Sync local storage with backend if different
                if (isBackendSaved !== isLocallySaved) {
                    if (isBackendSaved) {
                        await savedVendorsStorage.saveVendor(vendorIdNum);
                    } else {
                        await savedVendorsStorage.unsaveVendor(vendorIdNum);
                    }
                }
            }
        } catch (error) {
            console.error('Sync saved status error:', error);
        }
    }
}

const vendorDetailsService = new VendorDetailsService();
export default vendorDetailsService;