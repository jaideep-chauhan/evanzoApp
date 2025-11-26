import api from './api';

class CategoryService {
    constructor() {
        this.vendorCategoriesCache = null;
        this.eventCategoriesCache = null;
        this.locationsCache = null;
        this.cacheTimestamp = null;
        this.CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
    }

    // Check if cache is still valid
    isCacheValid() {
        return this.cacheTimestamp && 
               (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION;
    }

    // Get vendor categories from backend
    async getVendorCategories(includeSubcategories = true) {
        try {
            // Don't use cache if we need subcategories, as cached data might not have them
            // Also bypass cache to ensure we get fresh data with subcategories
            if (!includeSubcategories && this.vendorCategoriesCache && this.isCacheValid()) {
                // Check if cached data has subcategories
                const hasSubcategoriesInCache = this.vendorCategoriesCache.some(cat =>
                    cat.subcategories && cat.subcategories.length > 0
                );

                if (hasSubcategoriesInCache) {
                    console.log('📦 Using cached vendor categories with subcategories');
                    return {
                        success: true,
                        data: this.vendorCategoriesCache
                    };
                }
                // If cache doesn't have subcategories, fetch fresh data
                console.log('📦 Cache exists but lacks subcategories, fetching fresh data');
            }

            // Request categories with subcategories
            const response = await api.get('/vendor-enhanced/categories', {
                params: {
                    includeSubcategories: includeSubcategories
                }
            });

            console.log('📦 Vendor categories API response:', {
                status: response.data?.status,
                count: response.data?.data?.length,
                firstCategory: response.data?.data?.[0],
                hasSubcategories: response.data?.data?.[0]?.subcategories?.length > 0
            });

            if (response.data.status && response.data.data) {
                this.vendorCategoriesCache = response.data.data;
                this.cacheTimestamp = Date.now();

                return {
                    success: true,
                    data: response.data.data
                };
            } else {
                return this.getFallbackVendorCategories();
            }
        } catch (error) {
            console.error('Error fetching vendor categories:', error);
            return this.getFallbackVendorCategories();
        }
    }

    // Get event categories from backend
    async getEventCategories(includeSubcategories = true) {
        try {
            // Don't use cache if we need subcategories, as cached data might not have them
            // Also bypass cache to ensure we get fresh data with subcategories
            if (!includeSubcategories && this.eventCategoriesCache && this.isCacheValid()) {
                // Check if cached data has subcategories
                const hasSubcategoriesInCache = this.eventCategoriesCache.some(cat =>
                    cat.subcategories && cat.subcategories.length > 0
                );

                if (hasSubcategoriesInCache) {
                    console.log('📦 Using cached event categories with subcategories');
                    return {
                        success: true,
                        data: this.eventCategoriesCache
                    };
                }
                // If cache doesn't have subcategories, fetch fresh data
                console.log('📦 Cache exists but lacks subcategories, fetching fresh data');
            }

            // Request categories with subcategories
            const response = await api.get('/events/categories', {
                params: {
                    includeSubcategories: includeSubcategories
                }
            });

            console.log('📦 Event categories API response:', {
                status: response.data?.status,
                count: response.data?.data?.length,
                firstCategory: response.data?.data?.[0],
                hasSubcategories: response.data?.data?.[0]?.subcategories?.length > 0
            });

            if (response.data.status && response.data.data) {
                this.eventCategoriesCache = response.data.data;
                this.cacheTimestamp = Date.now();

                return {
                    success: true,
                    data: response.data.data
                };
            } else {
                return this.getFallbackEventCategories();
            }
        } catch (error) {
            console.error('Error fetching event categories:', error);
            return this.getFallbackEventCategories();
        }
    }

    // Get locations for vendors
    async getVendorLocations() {
        try {
            if (this.locationsCache && this.isCacheValid()) {
                return {
                    success: true,
                    data: this.locationsCache
                };
            }

            const response = await api.get('/vendor-enhanced/locations');
            
            if (response.data.status && response.data.data) {
                this.locationsCache = response.data.data;
                this.cacheTimestamp = Date.now();
                
                return {
                    success: true,
                    data: response.data.data
                };
            } else {
                return this.getFallbackLocations();
            }
        } catch (error) {
            console.error('Error fetching vendor locations:', error);
            return this.getFallbackLocations();
        }
    }

    // Get locations for events
    async getEventLocations() {
        try {
            const response = await api.get('/events/locations');
            
            if (response.data.status && response.data.data) {
                return {
                    success: true,
                    data: response.data.data
                };
            } else {
                return this.getFallbackLocations();
            }
        } catch (error) {
            console.error('Error fetching event locations:', error);
            return this.getFallbackLocations();
        }
    }

    // Fallback vendor categories (if API fails)
    getFallbackVendorCategories() {
        const fallbackCategories = [
            { category_id: 1, id: 1, name: 'Photography', slug: 'photography' },
            { category_id: 2, id: 2, name: 'Videography', slug: 'videography' },
            { category_id: 3, id: 3, name: 'Event Decoration', slug: 'event-decoration' },
            { category_id: 4, id: 4, name: 'DJ / Music', slug: 'dj-music' },
            { category_id: 5, id: 5, name: 'Catering', slug: 'catering' },
            { category_id: 6, id: 6, name: 'Makeup Artist', slug: 'makeup-artist' },
            { category_id: 7, id: 7, name: 'Event Planning', slug: 'event-planning' },
            { category_id: 8, id: 8, name: 'Florist', slug: 'florist' },
            { category_id: 9, id: 9, name: 'Wedding Dress', slug: 'wedding-dress' },
            { category_id: 10, id: 10, name: 'Venue Rental', slug: 'venue-rental' },
            { category_id: 11, id: 11, name: 'Transportation', slug: 'transportation' },
            { category_id: 12, id: 12, name: 'Security Services', slug: 'security-services' },
            { category_id: 13, id: 13, name: 'Audio Visual', slug: 'audio-visual' },
            { category_id: 14, id: 14, name: 'Lighting', slug: 'lighting' },
            { category_id: 15, id: 15, name: 'Entertainment', slug: 'entertainment' },
            { category_id: 16, id: 16, name: 'Photo Booth', slug: 'photo-booth' },
            { category_id: 17, id: 17, name: 'Live Band', slug: 'live-band' },
            { category_id: 18, id: 18, name: 'MC / Host', slug: 'mc-host' },
            { category_id: 19, id: 19, name: 'Wedding Cakes', slug: 'wedding-cakes' },
            { category_id: 20, id: 20, name: 'Bartending', slug: 'bartending' },
            { category_id: 21, id: 21, name: 'Hair Styling', slug: 'hair-styling' },
            { category_id: 22, id: 22, name: 'Jewelry Rental', slug: 'jewelry-rental' },
            { category_id: 23, id: 23, name: 'Invitation Design', slug: 'invitation-design' },
            { category_id: 24, id: 24, name: 'Gift & Favors', slug: 'gift-favors' }
        ];

        this.vendorCategoriesCache = fallbackCategories;
        this.cacheTimestamp = Date.now();

        return {
            success: true,
            data: fallbackCategories
        };
    }

    // Fallback event categories (if API fails)
    getFallbackEventCategories() {
        const fallbackCategories = [
            'Corporate',
            'Wedding',
            'Birthday',
            'Conference',
            'Graduation',
            'Product Launch',
            'Anniversary',
            'Baby Shower',
            'Engagement',
            'Retirement',
            'Holiday Party',
            'Fundraiser',
            'Workshop',
            'Seminar',
            'Trade Show',
            'Concert',
            'Festival',
            'Reunion',
            'Memorial',
            'Sports Event'
        ];

        this.eventCategoriesCache = fallbackCategories;
        this.cacheTimestamp = Date.now();

        return {
            success: true,
            data: fallbackCategories
        };
    }

    // Fallback locations (Canadian cities)
    getFallbackLocations() {
        const fallbackLocations = [
            'Current Location',
            'Toronto, ON',
            'Vancouver, BC',
            'Montreal, QC',
            'Calgary, AB',
            'Ottawa, ON',
            'Edmonton, AB',
            'Mississauga, ON',
            'Winnipeg, MB',
            'Quebec City, QC',
            'Hamilton, ON',
            'Brampton, ON',
            'Surrey, BC',
            'Laval, QC',
            'Halifax, NS',
            'London, ON',
            'Markham, ON',
            'Vaughan, ON',
            'Gatineau, QC',
            'Saskatoon, SK',
            'Longueuil, QC',
            'Burnaby, BC',
            'Regina, SK',
            'Richmond, BC',
            'Richmond Hill, ON',
            'Oakville, ON',
            'Burlington, ON',
            'Sherbrooke, QC',
            'Oshawa, ON',
            'Saguenay, QC'
        ];

        this.locationsCache = fallbackLocations;
        this.cacheTimestamp = Date.now();

        return {
            success: true,
            data: fallbackLocations
        };
    }

    // Format categories for display in UI
    formatCategoriesForUI(categories, type = 'vendor') {
        if (!categories || !Array.isArray(categories)) {
            return [];
        }
        
        if (type === 'vendors' || type === 'vendor') {
            return categories
                .filter(cat => cat && cat.name) // Filter out invalid entries
                .map(cat => {
                    const formatted = {
                        id: cat.category_id || cat.id || cat.name,
                        name: cat.name,
                        value: cat.category_id || cat.id, // Add value for filter
                        category_id: cat.category_id || cat.id, // Ensure category_id is present
                        slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')
                    };
                    // Debug log removed for production
                    return formatted;
                });
        } else {
            // For events, categories might be strings or objects
            return categories
                .filter(cat => cat) // Filter out null/undefined entries
                .map(cat => {
                    // Handle both string and object formats
                    if (typeof cat === 'string') {
                        return {
                            id: cat,
                            name: cat,
                            slug: cat.toLowerCase().replace(/\s+/g, '-')
                        };
                    } else if (cat && cat.name) {
                        return {
                            id: cat.category_id || cat.id || cat.name,
                            name: cat.name,
                            slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')
                        };
                    } else {
                        // Skip invalid entries
                        return null;
                    }
                })
                .filter(item => item !== null); // Remove any null entries
        }
    }

    // Clear cache (useful for refresh)
    clearCache() {
        this.vendorCategoriesCache = null;
        this.eventCategoriesCache = null;
        this.locationsCache = null;
        this.cacheTimestamp = null;
    }
}

const categoryService = new CategoryService();
export default categoryService;