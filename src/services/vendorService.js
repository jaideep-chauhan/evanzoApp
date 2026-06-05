import api, { API_BASE_URL } from './api';
import dummyImage from '../assets/images/dummy.png';

class VendorService {
    constructor() {
        this.retryCount = 0;
        this.maxRetries = 3;
        this.baseDelay = 1000; // 1 second
        this.lastRequestTime = 0;
        this.minRequestInterval = 2000; // 2 seconds minimum between requests
        this.isRequestInProgress = false;
    }

    // Helper method for exponential backoff
    async retryWithBackoff(apiCall, retryCount = 0) {
        try {
            const result = await apiCall();
            this.retryCount = 0; // Reset on success
            return result;
        } catch (error) {
            if (retryCount >= this.maxRetries) {
                throw error;
            }
            
            // Calculate exponential backoff delay
            const delay = this.baseDelay * Math.pow(2, retryCount);
            console.log(`Retry attempt ${retryCount + 1}/${this.maxRetries} after ${delay}ms`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.retryWithBackoff(apiCall, retryCount + 1);
        }
    }

    // Debounce mechanism to prevent rapid API calls
    async debounceRequest(apiCall) {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        // If a request is already in progress, don't make another one
        if (this.isRequestInProgress) {
            console.log('Request already in progress, skipping...');
            return { success: false, message: 'Request already in progress', data: [] };
        }
        
        // Ensure minimum interval between requests
        if (timeSinceLastRequest < this.minRequestInterval) {
            const waitTime = this.minRequestInterval - timeSinceLastRequest;
            console.log(`Waiting ${waitTime}ms before next request...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime = Date.now();
        this.isRequestInProgress = true;
        
        try {
            const result = await apiCall();
            return result;
        } finally {
            this.isRequestInProgress = false;
        }
    }
    // Get categories
    async getCategories() {
        try {
            const response = await api.get('/vendor_ad/categories');
            return response.data || [];
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            return [];
        }
    }

    // Get tags
    async getTags(type = 'vendor') {
        try {
            const response = await api.get(`/vendor_ad/tags?type=${type}`);
            return response.data || [];
        } catch (error) {
            console.error('Failed to fetch tags:', error);
            return [];
        }
    }

    // Get my vendor ads (for profile screen - current user's ads only)
    async getMyVendorAds() {
        return this.debounceRequest(async () => {
            return this.retryWithBackoff(async () => {
                try {
                    const response = await api.get('/vendor_ad/my-ads');
                    
                    // Backend returns simple array for my-ads
                    const vendorAds = response.data.data || [];
                    
                    return {
                        success: true,
                        data: vendorAds
                    };
                } catch (error) {
                    // Check if it's a network error
                    if (error.code === 'ECONNABORTED' || error.message === 'Network Error' || !error.response) {
                        console.error('Network error detected:', error.message);
                        throw error; // Will trigger retry
                    }
                    
                    console.error('Get my vendor ads error:', error);
                    
                    // Don't retry for client errors (4xx)
                    if (error.response?.status >= 400 && error.response?.status < 500) {
                        return {
                            success: false,
                            message: error.response?.data?.message || 'Failed to fetch your vendor ads',
                            data: []
                        };
                    }
                    
                    throw error; // Will trigger retry for 5xx errors
                }
            });
        });
    }

    // Get public vendor ads (for vendors tab - excludes current user)
    async getPublicVendorAds() {
        return this.debounceRequest(async () => {
            return this.retryWithBackoff(async () => {
                try {
                    const response = await api.get('/vendor_ad/all');
                    
                    // Handle different response structures
                    let vendorAds = [];
                    
                    // Check if response has the paginated structure
                    if (response.data?.data?.results) {
                        vendorAds = response.data.data.results;
                    }
                    // Check if data is directly an array (non-paginated)
                    else if (Array.isArray(response.data?.data)) {
                        vendorAds = response.data.data;
                    }
                    // Check if results are at the top level
                    else if (Array.isArray(response.data)) {
                        vendorAds = response.data;
                    }
                    
                    return {
                        success: true,
                        data: vendorAds
                    };
                } catch (error) {
                    // Check if it's a network error
                    if (error.code === 'ECONNABORTED' || error.message === 'Network Error' || !error.response) {
                        console.error('Network error detected:', error.message);
                        throw error; // Will trigger retry
                    }
                    
                    console.error('Get public vendor ads error:', error);
                    
                    // Don't retry for client errors (4xx)
                    if (error.response?.status >= 400 && error.response?.status < 500) {
                        return {
                            success: false,
                            message: error.response?.data?.message || 'Failed to fetch vendor ads',
                            data: []
                        };
                    }
                    
                    throw error; // Will trigger retry for 5xx errors
                }
            });
        });
    }
    
    // Deprecated: Keep for backward compatibility, redirects to getPublicVendorAds
    async getAllVendorAds() {
        return this.getPublicVendorAds();
    }

    // Create vendor ad
    async createVendorAd(vendorData) {
        try {
            const headers = {};
            
            // Check if vendorData is FormData (for file uploads)
            if (vendorData instanceof FormData) {
                headers['Content-Type'] = 'multipart/form-data';
            }

            const response = await api.post('/vendor_ad', vendorData, { headers });
            
            return {
                success: true,
                data: response.data.data || response.data,
                message: response.data.message || 'Vendor ad created successfully'
            };
        } catch (error) {
            console.error('Create vendor ad error:', error);
            console.error('Error response:', error.response?.data);
            
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to create vendor ad',
                data: null
            };
        }
    }

    // Update vendor ad
    async updateVendorAd(vendorAdId, updateData) {
        try {
            const response = await api.patch(`/vendor_ad/${vendorAdId}`, updateData);
            
            return {
                success: true,
                data: response.data.data || response.data,
                message: 'Vendor ad updated successfully'
            };
        } catch (error) {
            console.error('Update vendor ad error:', error);
            
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to update vendor ad',
                data: null
            };
        }
    }

    // Delete vendor ad
    async deleteVendorAd(vendorAdId) {
        try {
            const response = await api.delete(`/vendor_ad/${vendorAdId}`);
            
            return {
                success: true,
                message: 'Vendor ad deleted successfully'
            };
        } catch (error) {
            console.error('Delete vendor ad error:', error);
            
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to delete vendor ad'
            };
        }
    }

    // Helper method to format vendor data for display
    formatVendorForDisplay(vendor) {
        // Parse photos if it's a JSON string or use attachments
        let photos = [];
        // Since API_BASE_URL is 'https://api.evnzo.com/api', we need to extract the proper base URL
        const baseUrl = API_BASE_URL.replace('/api', '').replace('api.', ''); // This will give us https://evnzo.com
        // But we need the API subdomain, so let's use the correct URL
        const imageBaseUrl = 'https://api.evnzo.com'; // Use the actual API server URL for images
        
        console.log('📸 Formatting vendor for display:', {
            vendorId: vendor.vendor_ad_id || vendor.id,
            hasPhotos: !!vendor.photos,
            photosType: typeof vendor.photos,
            photosLength: vendor.photos ? vendor.photos.length : 0,
            hasAttachments: !!vendor.attachments,
            baseUrl,
            imageBaseUrl,
            API_BASE_URL
        });
        
        if (vendor.photos) {
            if (typeof vendor.photos === 'string' && vendor.photos !== '[]' && vendor.photos !== '') {
                try {
                    const parsed = JSON.parse(vendor.photos);
                    photos = parsed.map(photo => {
                        // If photo has url property, use it directly
                        if (photo.url) {
                            // If it's already a full URL, use it; otherwise append base URL
                            return photo.url.startsWith('http') ? photo.url : `${imageBaseUrl}${photo.url}`;
                        }
                        // If photo has path property, use it with base URL
                        if (photo.path) {
                            return `${imageBaseUrl}${photo.path}`;
                        }
                        // If it's already a URL string
                        if (typeof photo === 'string' && photo.startsWith('http')) {
                            return photo;
                        }
                        // If it's a path string
                        if (typeof photo === 'string') {
                            return `${imageBaseUrl}${photo}`;
                        }
                        return photo;
                    });
                } catch (e) {
                    console.error('Error parsing photos:', e);
                    photos = [];
                }
            } else if (Array.isArray(vendor.photos) && vendor.photos.length > 0) {
                photos = vendor.photos.map(photo => {
                    if (typeof photo === 'object' && photo.url) {
                        return photo.url.startsWith('http') ? photo.url : `${imageBaseUrl}${photo.url}`;
                    }
                    if (typeof photo === 'string' && photo.startsWith('http')) {
                        return photo;
                    }
                    if (typeof photo === 'string') {
                        return `${imageBaseUrl}${photo}`;
                    }
                    return photo;
                });
            }
        }
        
        // If no photos found yet, try attachments
        if (photos.length === 0 && vendor.attachments) {
            // Handle attachments field
            if (typeof vendor.attachments === 'string' && vendor.attachments !== '[]') {
                try {
                    const parsed = JSON.parse(vendor.attachments);
                    photos = parsed.map(att => {
                        if (att.url) return att.url.startsWith('http') ? att.url : `${imageBaseUrl}${att.url}`;
                        if (att.path) return `${imageBaseUrl}${att.path}`;
                        if (typeof att === 'string' && att.startsWith('http')) return att;
                        if (typeof att === 'string') return `${imageBaseUrl}${att}`;
                        return att;
                    });
                } catch (e) {
                    console.error('Error parsing attachments:', e);
                    photos = [];
                }
            } else if (Array.isArray(vendor.attachments)) {
                photos = vendor.attachments.map(att => {
                    if (typeof att === 'object' && att.url) return att.url.startsWith('http') ? att.url : `${imageBaseUrl}${att.url}`;
                    if (typeof att === 'string' && att.startsWith('http')) return att;
                    if (typeof att === 'string') return `${imageBaseUrl}${att}`;
                    return att;
                });
            }
        }
        
        console.log('📸 Final formatted photos:', {
            count: photos.length,
            photos: photos.map((photo, index) => ({
                index,
                url: photo,
                isValidUrl: typeof photo === 'string' && photo.startsWith('http')
            }))
        });

        // Calculate initials from company name or title
        const displayName = vendor.company_name || vendor.title || 'Vendor';
        const initials = displayName
            .split(' ')
            .map(word => word[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

        // Parse offers if they exist
        let offers = [];
        if (vendor.offers) {
            if (typeof vendor.offers === 'string') {
                try {
                    offers = JSON.parse(vendor.offers);
                } catch (e) {
                    console.error('Error parsing offers:', e);
                }
            } else if (Array.isArray(vendor.offers)) {
                offers = vendor.offers;
            }
        }

        // Get category name
        let categoryName = vendor.category?.name || vendor.category_name || vendor.type || 'Service';
        
        // Map category_id to category name if needed
        if (!categoryName && vendor.category_id) {
            const categoryMap = {
                1: 'Photographer',
                2: 'Videographer',
                3: 'Caterer',
                4: 'Decorator',
                5: 'DJ',
                6: 'Event Planner',
                7: 'Florist',
                8: 'Makeup Artist',
                9: 'Venue',
                10: 'Transport'
            };
            categoryName = categoryMap[vendor.category_id] || 'Service';
        }

        return {
            id: vendor.vendor_ad_id || vendor.id || vendor._id,
            vendor_ad_id: vendor.vendor_ad_id || vendor.id || vendor._id, // Add vendor_ad_id explicitly
            initials: initials,
            name: displayName,
            company_name: vendor.company_name || vendor.title, // Add company_name
            type: categoryName,
            rating: vendor.rating || 4.5,
            description: vendor.description || '',
            images: photos.length > 0 ? photos : [dummyImage, dummyImage, dummyImage], // Use dummy images as fallback
            extraCount: photos.length > 3 ? photos.length - 3 : 0,
            // Prefer the structured city column (populated by newer ads).
            // Legacy ads only have the full `location` string — fall back to
            // its first comma-separated segment, which is the city.
            location: vendor.city
                || (vendor.location ? String(vendor.location).split(',')[0].trim() : '')
                || '',
            offers: offers,
            approval_status: vendor.approval_status || 'pending', // Add approval_status
            status: vendor.status || 'active', // Add status
            // Keep original data for reference
            _original: vendor
        };
    }
}

const vendorService = new VendorService();
export default vendorService;