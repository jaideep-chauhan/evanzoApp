import api from './api';

class FilterService {
    constructor() {
        this.lastVendorSearchParams = null;
        this.lastEventSearchParams = null;
        this.searchDebounceTimeouts = new Map();
    }

    // Search vendors with filters
    async searchVendors(filters = {}) {
        try {
            const params = this.buildVendorSearchParams(filters);
            
            console.log('🚀 Searching vendors with params:', params);
            console.log('📍 Full URL:', `/vendor-enhanced/search?${new URLSearchParams(params).toString()}`);
            
            const response = await api.get('/vendor-enhanced/search', { params });
            
            console.log('✅ Vendor search response:', {
                status: response.data?.status,
                hasData: !!response.data?.data,
                resultsCount: response.data?.data?.results?.length || response.data?.data?.length || 0,
                pagination: response.data?.data?.pagination,
                fullResponse: response.data
            });
            
            // Handle both response formats - with and without status field
            if (response.data) {
                this.lastVendorSearchParams = params;
                
                // Handle different response structures
                let vendorData = [];
                let pagination = { page: 1, limit: 10, totalPages: 1, totalResults: 0 };
                
                // If response.data is directly an array
                if (Array.isArray(response.data)) {
                    vendorData = response.data;
                    pagination.totalResults = response.data.length;
                }
                // If response has data property
                else if (response.data.data) {
                    // If data.results exists (paginated response)
                    if (response.data.data.results) {
                        vendorData = response.data.data.results;
                        pagination = {
                            page: response.data.data.page || 1,
                            limit: response.data.data.limit || 10,
                            totalPages: response.data.data.totalPages || 1,
                            totalResults: response.data.data.totalResults || vendorData.length
                        };
                    }
                    // If data is directly an array
                    else if (Array.isArray(response.data.data)) {
                        vendorData = response.data.data;
                        pagination.totalResults = response.data.data.length;
                    }
                    // If data has other structure
                    else {
                        vendorData = response.data.data;
                    }
                }
                
                console.log('📊 Processed vendor data:', {
                    vendorCount: vendorData.length,
                    pagination,
                    sampleVendor: vendorData[0]
                });
                
                return {
                    success: true,
                    data: vendorData,
                    pagination
                };
            } else {
                return {
                    success: false,
                    message: 'No vendors found',
                    data: [],
                    pagination: { page: 1, limit: 10, totalPages: 0, totalResults: 0 }
                };
            }
        } catch (error) {
            console.error('Error searching vendors:', error);
            console.error('Error details:', {
                status: error.response?.status,
                message: error.response?.data?.message,
                data: error.response?.data,
                params: params
            });
            return {
                success: false,
                message: error.response?.data?.message || 'Search failed',
                data: [],
                pagination: { page: 1, limit: 10, totalPages: 0, totalResults: 0 }
            };
        }
    }

    // Search events with filters
    async searchEvents(filters = {}) {
        try {
            const params = this.buildEventSearchParams(filters);
            
            console.log('Searching events with params:', params);
            
            const response = await api.get('/events/search', { params });
            
            if (response.data.status && response.data.data) {
                this.lastEventSearchParams = params;
                
                return {
                    success: true,
                    data: response.data.data.results || response.data.data,
                    pagination: {
                        page: response.data.data.page || 1,
                        limit: response.data.data.limit || 10,
                        totalPages: response.data.data.totalPages || 1,
                        totalResults: response.data.data.totalResults || 0
                    }
                };
            } else {
                return {
                    success: false,
                    message: response.data.message || 'No events found',
                    data: [],
                    pagination: { page: 1, limit: 10, totalPages: 0, totalResults: 0 }
                };
            }
        } catch (error) {
            console.error('Error searching events:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Search failed',
                data: [],
                pagination: { page: 1, limit: 10, totalPages: 0, totalResults: 0 }
            };
        }
    }

    // Build vendor search parameters
    buildVendorSearchParams(filters) {
        const params = {};

        // Search keyword - this will search across name, description, location, and category
        if (filters.keyword && filters.keyword.trim()) {
            params.keyword = filters.keyword.trim();
            console.log('🔍 Vendor search keyword:', params.keyword);
        }

        // Location filter (separate from keyword search)
        if (filters.location && filters.location !== 'Current Location') {
            params.location = filters.location;
        }

        // Category filter - backend expects category IDs as numbers
        if (filters.categories) {
            if (Array.isArray(filters.categories)) {
                // Filter out non-numeric values and convert to numbers
                const numericCategories = filters.categories
                    .map(cat => {
                        const num = parseInt(cat, 10);
                        return isNaN(num) ? null : num;
                    })
                    .filter(cat => cat !== null);
                
                if (numericCategories.length > 0) {
                    params.categories = numericCategories.join(',');
                }
            } else {
                const num = parseInt(filters.categories, 10);
                if (!isNaN(num)) {
                    params.categories = num;
                }
            }
        }

        // Price range filters
        if (filters.priceMin && !isNaN(parseFloat(filters.priceMin))) {
            params.priceMin = parseFloat(filters.priceMin);
        }
        if (filters.priceMax && !isNaN(parseFloat(filters.priceMax))) {
            params.priceMax = parseFloat(filters.priceMax);
        }

        // Rating filter
        if (filters.rating && !isNaN(parseInt(filters.rating))) {
            params.rating = parseInt(filters.rating);
        }

        // Availability date
        if (filters.availability) {
            params.availability = filters.availability;
        }

        // Sorting
        if (filters.sortBy) {
            params.sortBy = filters.sortBy;
        } else {
            params.sortBy = 'rating:desc'; // Default sort
        }

        // Pagination
        params.page = filters.page || 1;
        params.limit = filters.limit || 10;

        return params;
    }

    // Build event search parameters
    buildEventSearchParams(filters) {
        const params = {};

        // Search keyword
        if (filters.keyword && filters.keyword.trim()) {
            params.keyword = filters.keyword.trim();
        }

        // Location filter
        if (filters.location && filters.location !== 'Current Location') {
            params.location = filters.location;
        }

        // Category filter
        if (filters.category) {
            params.category = filters.category;
        }

        // Event type filter
        if (filters.eventType) {
            params.eventType = filters.eventType;
        }

        // Date range filters
        if (filters.dateFrom) {
            params.dateFrom = filters.dateFrom;
        }
        if (filters.dateTo) {
            params.dateTo = filters.dateTo;
        }

        // Budget range filters
        if (filters.budgetMin && !isNaN(parseFloat(filters.budgetMin))) {
            params.budgetMin = parseFloat(filters.budgetMin);
        }
        if (filters.budgetMax && !isNaN(parseFloat(filters.budgetMax))) {
            params.budgetMax = parseFloat(filters.budgetMax);
        }

        // Guest count filters
        if (filters.guestsMin && !isNaN(parseInt(filters.guestsMin))) {
            params.guestsMin = parseInt(filters.guestsMin);
        }
        if (filters.guestsMax && !isNaN(parseInt(filters.guestsMax))) {
            params.guestsMax = parseInt(filters.guestsMax);
        }

        // Duration filter
        if (filters.duration) {
            params.duration = filters.duration;
        }

        // Status filter
        if (filters.status) {
            params.status = filters.status;
        } else {
            params.status = 'active'; // Default to active events
        }

        // Sorting
        if (filters.sortBy) {
            params.sortBy = filters.sortBy;
        } else {
            params.sortBy = 'date:asc'; // Default sort for events
        }

        // Pagination
        params.page = filters.page || 1;
        params.limit = filters.limit || 10;

        return params;
    }

    // Debounced search for real-time typing
    debouncedSearch(searchFunction, filters, delay = 500, searchKey = 'default') {
        // Clear existing timeout for this search key
        if (this.searchDebounceTimeouts.has(searchKey)) {
            clearTimeout(this.searchDebounceTimeouts.get(searchKey));
        }

        // Set new timeout
        const timeoutId = setTimeout(() => {
            searchFunction(filters);
            this.searchDebounceTimeouts.delete(searchKey);
        }, delay);

        this.searchDebounceTimeouts.set(searchKey, timeoutId);
    }

    // Get featured vendors (fallback when no search applied)
    async getFeaturedVendors(limit = 10) {
        try {
            const response = await api.get('/vendor-enhanced/featured', {
                params: { limit }
            });

            if (response.data.status && response.data.data) {
                return {
                    success: true,
                    data: response.data.data
                };
            }
        } catch (error) {
            console.error('Error fetching featured vendors:', error);
        }

        // Fallback to regular vendor search
        return this.searchVendors({ limit });
    }

    // Get upcoming events (fallback when no search applied)
    async getUpcomingEvents(limit = 10) {
        try {
            const response = await api.get('/events/upcoming', {
                params: { limit }
            });

            if (response.data.status && response.data.data) {
                return {
                    success: true,
                    data: response.data.data
                };
            }
        } catch (error) {
            console.error('Error fetching upcoming events:', error);
        }

        // Fallback to regular event search
        return this.searchEvents({ limit, status: 'active' });
    }

    // Clear all search debounce timeouts
    clearDebounceTimeouts() {
        this.searchDebounceTimeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        this.searchDebounceTimeouts.clear();
    }

    // Get last search parameters for pagination
    getLastVendorSearchParams() {
        return this.lastVendorSearchParams;
    }

    getLastEventSearchParams() {
        return this.lastEventSearchParams;
    }
}

const filterService = new FilterService();
export default filterService;