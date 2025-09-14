import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dummyImage from '../assets/images/dummy.png';

class VendorService {
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

    // Get my vendor ads (for profile)
    async getMyVendorAds() {
        try {
            const response = await api.get('/vendor_ad/my-ads');
            console.log('My vendor ads response:', response.data);
            
            const vendorAds = response.data.data || response.data || [];
            
            return {
                success: true,
                data: vendorAds
            };
        } catch (error) {
            console.error('Get my vendor ads error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch vendor ads',
                data: []
            };
        }
    }

    // Get all vendor ads (for vendors screen - excludes current user)
    async getAllVendorAds() {
        try {
            const response = await api.get('/vendor_ad/all');
            console.log('All vendor ads response:', response.data);
            
            // Extract the results array from the paginated response
            const vendorAds = response.data.data?.results || [];
            
            return {
                success: true,
                data: vendorAds  // Return the array directly
            };
        } catch (error) {
            console.error('Get all vendor ads error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch vendor ads',
                data: []
            };
        }
    }

    // Create vendor ad
    async createVendorAd(vendorData) {
        try {
            const headers = {};
            
            // Check if vendorData is FormData (for file uploads)
            if (vendorData instanceof FormData) {
                headers['Content-Type'] = 'multipart/form-data';
            }

            console.log('Creating vendor ad with data:', vendorData);
            const response = await api.post('/vendor_ad/create', vendorData, { headers });
            
            console.log('Create vendor ad response:', response.data);
            
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
        console.log('Formatting vendor:', vendor);
        
        // Parse photos if it's a JSON string or use attachments
        let photos = [];
        if (vendor.photos) {
            if (typeof vendor.photos === 'string' && vendor.photos !== '[]') {
                try {
                    const parsed = JSON.parse(vendor.photos);
                    photos = parsed.map(photo => {
                        // If photo has url property, use it directly
                        if (photo.url) {
                            return photo.url;
                        }
                        // If photo has path property, use it with base URL
                        if (photo.path) {
                            return `http://localhost:3000${photo.path}`;
                        }
                        // If it's already a URL string
                        if (typeof photo === 'string' && photo.startsWith('http')) {
                            return photo;
                        }
                        // If it's a path string
                        if (typeof photo === 'string') {
                            return `http://localhost:3000${photo}`;
                        }
                        return photo;
                    });
                } catch (e) {
                    console.error('Error parsing photos:', e);
                    photos = [];
                }
            } else if (Array.isArray(vendor.photos)) {
                photos = vendor.photos.map(photo => {
                    if (typeof photo === 'object' && photo.url) {
                        return photo.url;
                    }
                    if (typeof photo === 'string' && photo.startsWith('http')) {
                        return photo;
                    }
                    if (typeof photo === 'string') {
                        return `http://localhost:3000${photo}`;
                    }
                    return photo;
                });
            }
        } else if (vendor.attachments) {
            // Handle attachments field
            if (typeof vendor.attachments === 'string' && vendor.attachments !== '[]') {
                try {
                    const parsed = JSON.parse(vendor.attachments);
                    photos = parsed.map(att => {
                        if (att.url) return att.url;
                        if (att.path) return `http://localhost:3000${att.path}`;
                        if (typeof att === 'string' && att.startsWith('http')) return att;
                        if (typeof att === 'string') return `http://localhost:3000${att}`;
                        return att;
                    });
                } catch (e) {
                    console.error('Error parsing attachments:', e);
                    photos = [];
                }
            } else if (Array.isArray(vendor.attachments)) {
                photos = vendor.attachments.map(att => {
                    if (typeof att === 'object' && att.url) return att.url;
                    if (typeof att === 'string' && att.startsWith('http')) return att;
                    if (typeof att === 'string') return `http://localhost:3000${att}`;
                    return att;
                });
            }
        }

        console.log('Parsed photos:', photos);

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
            id: vendor.vendor_ad_id || vendor.id,
            initials: initials,
            name: displayName,
            type: categoryName,
            rating: vendor.rating || 4.5,
            description: vendor.description || '',
            images: photos.length > 0 ? photos : [dummyImage, dummyImage, dummyImage], // Use dummy images as fallback
            extraCount: photos.length > 3 ? photos.length - 3 : 0,
            location: vendor.location || '',
            offers: offers,
            // Keep original data for reference
            _original: vendor
        };
    }
}

const vendorService = new VendorService();
export default vendorService;