import api from './api';

/**
 * Search Service
 *
 * Handles advanced search functionality including:
 * - Autocomplete suggestions
 * - Search history
 * - Trending searches
 * - Search analytics
 */
class SearchService {
  /**
   * Get autocomplete suggestions as user types
   * @param {string} query - Search query
   * @param {string} type - Search type ('vendors' or 'events')
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  async getAutocompleteSuggestions(query, type = 'vendors') {
    try {
      const response = await api.get('/search/suggestions', {
        params: {
          query,
          type,
          limit: 10
        }
      });

      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('[SearchService] Error fetching suggestions:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch suggestions',
        data: []
      };
    }
  }

  /**
   * Get trending/popular searches
   * @param {string} type - Search type ('vendors' or 'events')
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  async getTrendingSearches(type = 'vendors') {
    try {
      const response = await api.get('/search/trending', {
        params: {
          type,
          limit: 10
        }
      });

      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('[SearchService] Error fetching trending:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch trending searches',
        data: []
      };
    }
  }

  /**
   * Save search to user's history (for analytics)
   * @param {string} query - Search query
   * @param {string} type - Search type ('vendors' or 'events')
   * @returns {Promise<{success: boolean}>}
   */
  async saveSearchHistory(query, type = 'vendors') {
    try {
      await api.post('/search/history', {
        query,
        type
      });

      return {
        success: true
      };
    } catch (error) {
      console.error('[SearchService] Error saving history:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to save search history'
      };
    }
  }

  /**
   * Get user's search history
   * @param {string} type - Search type ('vendors' or 'events')
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  async getSearchHistory(type = 'vendors') {
    try {
      const response = await api.get('/search/history', {
        params: {
          type,
          limit: 20
        }
      });

      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('[SearchService] Error fetching history:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch search history',
        data: []
      };
    }
  }

  /**
   * Clear user's search history
   * @param {string} type - Search type ('vendors' or 'events')
   * @returns {Promise<{success: boolean}>}
   */
  async clearSearchHistory(type = 'vendors') {
    try {
      await api.delete('/search/history', {
        params: {
          type
        }
      });

      return {
        success: true
      };
    } catch (error) {
      console.error('[SearchService] Error clearing history:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to clear search history'
      };
    }
  }

  /**
   * Enhanced vendor search with better keyword matching
   * @param {Object} params - Search parameters
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  async searchVendors(params) {
    try {
      const response = await api.get('/vendor-enhanced/search', {
        params: {
          keyword: params.keyword || '',
          location: params.location || '',
          country: params.country || '',
          state: params.state || '',
          city: params.city || '',
          categories: params.categories || '',
          priceMin: params.priceMin || '',
          priceMax: params.priceMax || '',
          rating: params.rating || '',
          sortBy: params.sortBy || 'relevance',
          page: params.page || 1,
          limit: params.limit || 20
        }
      });

      return {
        success: true,
        data: response.data.data || {}
      };
    } catch (error) {
      console.error('[SearchService] Error searching vendors:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to search vendors',
        data: {}
      };
    }
  }

  /**
   * Enhanced event search with better keyword matching
   * @param {Object} params - Search parameters
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  async searchEvents(params) {
    try {
      const response = await api.get('/events/search', {
        params: {
          keyword: params.keyword || '',
          location: params.location || '',
          country: params.country || '',
          state: params.state || '',
          city: params.city || '',
          category: params.category || '',
          dateFrom: params.dateFrom || '',
          dateTo: params.dateTo || '',
          budgetMin: params.budgetMin || '',
          budgetMax: params.budgetMax || '',
          guestsMin: params.guestsMin || '',
          guestsMax: params.guestsMax || '',
          sortBy: params.sortBy || 'relevance',
          page: params.page || 1,
          limit: params.limit || 20
        }
      });

      return {
        success: true,
        data: response.data.data || {}
      };
    } catch (error) {
      console.error('[SearchService] Error searching events:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to search events',
        data: {}
      };
    }
  }
}

const searchService = new SearchService();
export default searchService;
