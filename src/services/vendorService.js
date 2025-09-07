import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class VendorService {
    // Public endpoints (no auth required)
    async searchVendors({
        keyword = '',
        location = '',
        categories = [],
        priceMin = null,
        priceMax = null,
        rating = null,
        availability = null,
        sortBy = 'featured',
        page = 1,
        limit = 20
    } = {}) {
        try {
            const params = new URLSearchParams();
            if (keyword) params.append('keyword', keyword);
            if (location) params.append('location', location);
            if (categories.length) params.append('categories', categories.join(','));
            if (priceMin) params.append('priceMin', priceMin);
            if (priceMax) params.append('priceMax', priceMax);
            if (rating) params.append('rating', rating);
            if (availability) params.append('availability', availability);
            params.append('sortBy', sortBy);
            params.append('page', page);
            params.append('limit', limit);

            const response = await api.get(`/vendors/search?${params.toString()}`);
            return {
                success: true,
                data: response.data.data,
                pagination: response.data.pagination
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to search vendors',
                data: []
            };
        }
    }

    async getCategories() {
        try {
            const response = await api.get('/vendor_ad/categories');
            return response.data || [];
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            return [];
        }
    }

    async getTags(type = 'vendor') {
        try {
            const response = await api.get(`/vendor_ad/tags?type=${type}`);
            return response.data || [];
        } catch (error) {
            console.error('Failed to fetch tags:', error);
            return [];
        }
    }

    async getLocations() {
        try {
            const response = await api.get('/vendors/locations');
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch locations',
                data: []
            };
        }
    }

    async getFeaturedVendors(limit = 10) {
        try {
            const response = await api.get(`/vendors/featured?limit=${limit}`);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch featured vendors',
                data: []
            };
        }
    }

    async getTopRatedVendors(limit = 10) {
        try {
            const response = await api.get(`/vendors/top-rated?limit=${limit}`);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch top-rated vendors',
                data: []
            };
        }
    }

    async getNearbyVendors(latitude, longitude, radius = 10) {
        try {
            const params = new URLSearchParams({
                latitude,
                longitude,
                radius
            });
            
            const response = await api.get(`/vendors/nearby?${params.toString()}`);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch nearby vendors',
                data: []
            };
        }
    }

    async getVendorDetails(vendorId) {
        try {
            const response = await api.get(`/vendors/${vendorId}`);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch vendor details',
                data: null
            };
        }
    }

    async getVendorPortfolio(vendorId) {
        try {
            const response = await api.get(`/vendors/${vendorId}/portfolio`);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch vendor portfolio',
                data: []
            };
        }
    }

    async getVendorAvailability(vendorId) {
        try {
            const response = await api.get(`/vendors/${vendorId}/availability`);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch vendor availability',
                data: []
            };
        }
    }

    async getVendorReviews(vendorId, page = 1, limit = 10) {
        try {
            const params = new URLSearchParams({ page, limit });
            const response = await api.get(`/vendors/${vendorId}/reviews?${params.toString()}`);
            return {
                success: true,
                data: response.data.data,
                pagination: response.data.pagination
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch vendor reviews',
                data: []
            };
        }
    }

    async getSimilarVendors(vendorId, limit = 5) {
        try {
            const response = await api.get(`/vendors/${vendorId}/similar?limit=${limit}`);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch similar vendors',
                data: []
            };
        }
    }

    // Protected endpoints (auth required)
    async getMyVendorAds() {
        try {
            const response = await api.get('/vendors/my-ads');
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch your vendor ads',
                data: []
            };
        }
    }

    async createVendorAd(vendorData) {
        try {
            const headers = {};
            
            // Check if vendorData is FormData (for file uploads)
            if (vendorData instanceof FormData) {
                headers['Content-Type'] = 'multipart/form-data';
            }
            
            const response = await api.post('/vendors/create-ad', vendorData, { headers });
            return {
                success: true,
                data: response.data.data,
                message: 'Vendor ad created successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to create vendor ad'
            };
        }
    }

    async updateVendorAd(vendorId, vendorData) {
        try {
            const response = await api.put(`/vendor_ad/${vendorId}`, vendorData);
            return {
                success: true,
                data: response.data.data,
                message: 'Vendor ad updated successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to update vendor ad'
            };
        }
    }

    async deleteVendorAd(vendorId) {
        try {
            await api.delete(`/vendor_ad/${vendorId}`);
            return {
                success: true,
                message: 'Vendor ad deleted successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to delete vendor ad'
            };
        }
    }

    async createVendorReview(vendorId, reviewData) {
        try {
            const response = await api.post(`/vendors/${vendorId}/reviews`, reviewData);
            return {
                success: true,
                data: response.data.data,
                message: 'Review submitted successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to submit review'
            };
        }
    }

    async addPortfolioItem(vendorId, portfolioData) {
        try {
            const formData = new FormData();
            
            // Add portfolio data
            Object.keys(portfolioData).forEach(key => {
                if (key === 'media' && portfolioData[key]) {
                    // Handle file uploads
                    portfolioData[key].forEach((file, index) => {
                        formData.append(`media`, file);
                    });
                } else {
                    formData.append(key, portfolioData[key]);
                }
            });

            const response = await api.post(`/vendors/${vendorId}/portfolio`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            return {
                success: true,
                data: response.data.data,
                message: 'Portfolio item added successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to add portfolio item'
            };
        }
    }

    async updateVendorAvailability(vendorId, availabilityData) {
        try {
            const response = await api.put(`/vendors/${vendorId}/availability`, availabilityData);
            return {
                success: true,
                data: response.data.data,
                message: 'Availability updated successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to update availability'
            };
        }
    }

    async sendVendorInquiry(vendorId, inquiryData) {
        try {
            const response = await api.post(`/vendors/${vendorId}/inquiry`, inquiryData);
            return {
                success: true,
                data: response.data.data,
                message: 'Inquiry sent successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to send inquiry'
            };
        }
    }

    // Pre-saved messages
    async getPreSavedMessages() {
        try {
            const response = await api.get('/vendors/messages/pre-saved');
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch pre-saved messages',
                data: []
            };
        }
    }

    async createPreSavedMessage(messageData) {
        try {
            const response = await api.post('/vendors/messages/pre-saved', messageData);
            return {
                success: true,
                data: response.data.data,
                message: 'Message saved successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to save message'
            };
        }
    }

    async updatePreSavedMessage(messageId, messageData) {
        try {
            const response = await api.put(`/vendors/messages/pre-saved/${messageId}`, messageData);
            return {
                success: true,
                data: response.data.data,
                message: 'Message updated successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to update message'
            };
        }
    }

    async usePreSavedMessage(messageId) {
        try {
            const response = await api.post(`/vendors/messages/pre-saved/${messageId}/use`);
            return {
                success: true,
                data: response.data.data,
                message: 'Message used successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to use message'
            };
        }
    }

    // Helper method to format vendor data for display
    formatVendorForDisplay(vendor) {
        return {
            id: vendor.id || vendor.vendor_ad_id,
            initials: this.getInitials(vendor.company_name || vendor.title),
            name: vendor.company_name || vendor.title,
            type: (typeof vendor.category === 'object' ? vendor.category?.name : vendor.category) || 
                  vendor.services_offered?.[0] || 
                  'Service Provider',
            rating: vendor.rating || 0,
            reviewCount: vendor.review_count || 0,
            description: vendor.description || '',
            images: this.extractImages(vendor.attachments || vendor.portfolio_url),
            extraCount: vendor.attachments?.length || 0,
            location: vendor.location || vendor.service_areas?.[0] || 'Unknown',
            price: vendor.price_amount || vendor.price_range,
            currency: vendor.currency || 'USD',
            verified: vendor.verified || false,
            featured: vendor.featured || false,
            boosted: vendor.is_boosted || false,
            availability: vendor.availability || [],
            contact: {
                phone: vendor.contact_number,
                email: vendor.contact_email,
                whatsapp: vendor.whatsapp_number
            }
        };
    }

    getInitials(name) {
        if (!name) return 'V';
        const words = name.split(' ');
        if (words.length === 1) {
            return name.substring(0, 2).toUpperCase();
        }
        return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
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

const vendorService = new VendorService();
export { vendorService };
export default vendorService;