import { useState, useRef, useCallback } from 'react';
import filterService from '../services/filterService';

/**
 * Shared filter state and handlers for Vendors and Events screens.
 *
 * @param {Object} options
 * @param {Function} options.fetchFn - Function to call when filters change: fetchFn(filters, resetResults, clearAllFilters)
 * @param {Array} options.tabs - Tab labels, e.g. ['Location', 'Quick Message', 'Category']
 * @param {string} options.searchDebounceKey - Unique debounce key, e.g. 'vendor-header-search'
 */
export default function useListFilters({ fetchFn, tabs = [], searchDebounceKey = 'search' }) {
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedCategoryNames, setSelectedCategoryNames] = useState([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [activeTab, setActiveTab] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const searchQueryRef = useRef('');
    const [currentFilters, setCurrentFilters] = useState({});
    const clearSearchRef = useRef(null);

    // Extra modal states — screens can use whichever they need
    const [showPreSaveModal, setShowPreSaveModal] = useState(false);
    const [showDateRangeModal, setShowDateRangeModal] = useState(false);

    const handleTabPress = useCallback((tabLabel) => {
        const idx = tabs.indexOf(tabLabel);
        if (tabLabel === 'Location') {
            setShowLocationModal(true);
        } else if (tabLabel === 'Quick Message') {
            setShowPreSaveModal(true);
        } else if (tabLabel === 'Category') {
            setShowCategoryModal(true);
        } else if (tabLabel === 'Date') {
            setShowDateRangeModal(true);
        }
    }, [tabs]);

    const handleLocationSelect = useCallback((location, locationData = null) => {
        const displayLocation = locationData?.displayName || location;
        setSelectedLocation(displayLocation);
        setShowLocationModal(false);

        setActiveTab(location ? tabs.indexOf('Location') : null);

        const newFilters = { ...currentFilters };
        if (location) {
            const searchLocation = locationData?.city || location.split(',')[0].trim();
            newFilters.location = searchLocation;
            if (locationData) {
                if (locationData.country) newFilters.country = locationData.country;
                if (locationData.state) newFilters.state = locationData.state;
                if (locationData.city) newFilters.city = locationData.city;
                if (locationData.latitude != null && locationData.longitude != null) {
                    newFilters.latitude = locationData.latitude;
                    newFilters.longitude = locationData.longitude;
                }
            }
        } else {
            delete newFilters.location;
            delete newFilters.country;
            delete newFilters.state;
            delete newFilters.city;
            delete newFilters.latitude;
            delete newFilters.longitude;
        }

        setCurrentFilters(newFilters);
        fetchFn(newFilters, true);
    }, [currentFilters, fetchFn, tabs]);

    const handleCategorySelect = useCallback((categoryIds, categoryData) => {
        setSelectedCategory(categoryIds);
        setShowCategoryModal(false);

        if (categoryData) {
            setSelectedCategoryNames(categoryData.map(cat => cat.name));
        } else {
            setSelectedCategoryNames([]);
        }

        setActiveTab(categoryIds && categoryIds.length > 0 ? tabs.indexOf('Category') : null);

        const newFilters = { ...currentFilters };
        if (categoryIds && categoryIds.length > 0) {
            newFilters.categories = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
        } else {
            delete newFilters.categories;
        }

        setCurrentFilters(newFilters);
        fetchFn(newFilters, true);
    }, [currentFilters, fetchFn, tabs]);

    const handleSearchChange = useCallback((text) => {
        console.log('[SEARCH][useListFilters] handleSearchChange called with:', JSON.stringify(text), 'len:', text?.length);
        searchQueryRef.current = text;

        if (text === '') {
            setSearchQuery('');
            const newFilters = { ...currentFilters };
            delete newFilters.keyword;
            console.log('[SEARCH][useListFilters] cleared keyword, newFilters:', newFilters);
            setCurrentFilters(newFilters);
            fetchFn(newFilters, true, Object.keys(newFilters).filter(k => k !== 'page' && k !== 'limit').length === 0);
            return;
        }

        const pendingFilters = { ...currentFilters, keyword: text };
        console.log('[SEARCH][useListFilters] scheduling debounced fetch with filters:', pendingFilters);

        filterService.debouncedSearch(
            (filters) => {
                console.log('[SEARCH][useListFilters] debounce fired → fetchFn with filters:', filters);
                setSearchQuery(text);
                fetchFn(filters, true);
            },
            pendingFilters,
            500,
            searchDebounceKey
        );
    }, [currentFilters, fetchFn, searchDebounceKey]);

    const clearAllFilters = useCallback(() => {
        setSelectedLocation(null);
        setSelectedCategory(null);
        setSelectedCategoryNames([]);
        setSearchQuery('');
        searchQueryRef.current = '';
        setActiveTab(null);
        setCurrentFilters({});
        if (clearSearchRef.current) clearSearchRef.current();
        fetchFn({}, true, true);
    }, [fetchFn]);

    const clearLocation = useCallback(() => {
        handleLocationSelect(null);
    }, [handleLocationSelect]);

    const clearCategory = useCallback(() => {
        handleCategorySelect(null, null);
    }, [handleCategorySelect]);

    const clearSearch = useCallback(() => {
        handleSearchChange('');
        if (clearSearchRef.current) clearSearchRef.current();
    }, [handleSearchChange]);

    return {
        // State
        selectedLocation,
        selectedCategory, setSelectedCategory,
        selectedCategoryNames, setSelectedCategoryNames,
        activeTab,
        searchQuery,
        searchQueryRef,
        currentFilters,
        setCurrentFilters,
        clearSearchRef,

        // Modal visibility
        showLocationModal, setShowLocationModal,
        showCategoryModal, setShowCategoryModal,
        showPreSaveModal, setShowPreSaveModal,
        showDateRangeModal, setShowDateRangeModal,

        // Handlers
        handleTabPress,
        handleLocationSelect,
        handleCategorySelect,
        handleSearchChange,
        clearAllFilters,
        clearLocation,
        clearCategory,
        clearSearch,

        // Setters for external use
        setActiveTab,
        setSelectedLocation,
        setSearchQuery,
    };
}
