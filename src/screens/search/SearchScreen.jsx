import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import searchService from '../../services/searchService';
import { searchLocations as photonSearch } from '../../services/photonService';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Advanced SearchScreen Component
 *
 * Features:
 * - Real-time autocomplete suggestions
 * - Search history (recent searches)
 * - Trending/popular searches
 * - Category suggestions
 * - Voice search ready
 * - Smooth animations
 *
 * Similar to Amazon/Flipkart search experience
 */
const SearchScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Get search type from route params (vendors or events)
  const searchType = route.params?.searchType || 'vendors';
  const initialQuery = route.params?.initialQuery || '';

  // State management
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Refs
  const searchInputRef = useRef(null);
  const debounceTimer = useRef(null);

  // Auto-focus search input on mount
  useEffect(() => {
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 300);
  }, []);

  // Load search history and trending on mount
  useEffect(() => {
    loadSearchHistory();
    loadTrendingSearches();
  }, [searchType]);

  // Fetch autocomplete suggestions as user types
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      fetchSuggestions(searchQuery);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  /**
   * Load search history from AsyncStorage
   */
  const loadSearchHistory = async () => {
    try {
      const historyKey = `search_history_${searchType}`;
      const history = await AsyncStorage.getItem(historyKey);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('[SearchScreen] Error loading history:', error);
    }
  };

  /**
   * Load trending searches from API
   */
  const loadTrendingSearches = async () => {
    try {
      const response = await searchService.getTrendingSearches(searchType);
      if (response.success) {
        setTrendingSearches(response.data || []);
      }
    } catch (error) {
      console.error('[SearchScreen] Error loading trending:', error);
    }
  };

  /**
   * Fetch autocomplete suggestions with debounce
   */
  const fetchSuggestions = useCallback((query) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true);

      // Run the backend autocomplete first (it's the primary signal —
      // DB-known categories, vendors, locations). Then Photon in a
      // separate try so a network/parse error there can't crash the
      // backend's already-good hits or leave the loading state stuck.
      let appHits = [];
      let photonHits = [];

      try {
        const appRes = await searchService.getAutocompleteSuggestions(query, searchType);
        if (appRes?.success && Array.isArray(appRes.data)) {
          appHits = appRes.data;
        }
      } catch (e) {
        console.warn('[SearchScreen] backend autocomplete failed:', e?.message || e);
      }

      try {
        const features = await photonSearch(query, { limit: 5 });
        if (Array.isArray(features)) {
          photonHits = features
            .map((p) => {
              const display = String(p?.display_name || p?.name || '').trim();
              if (!display) return null;
              return {
                value: display,
                display,
                type: 'location',
                subtype: typeof p?.type === 'string' ? p.type : undefined,
                icon: 'location-outline',
                id: `photon-${p?.id || `${p?.lat || 0},${p?.lon || 0}`}`,
                lat: p?.lat ?? null,
                lon: p?.lon ?? null,
                country: typeof p?.country === 'string' ? p.country : undefined,
                state: typeof p?.state === 'string' ? p.state : undefined,
                city: typeof p?.city === 'string' ? p.city : undefined,
              };
            })
            .filter(Boolean);
        }
      } catch (e) {
        console.warn('[SearchScreen] photon autocomplete failed:', e?.message || e);
      }

      // Dedupe by `value` (case-insensitive). App hits win — they carry
      // richer linkage (vendor IDs, category IDs).
      const seen = new Set();
      const merged = [];
      for (const item of [...appHits, ...photonHits]) {
        const key = String(item?.value || '').toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        merged.push(item);
      }

      setSuggestions(merged);
      setIsLoading(false);
    }, 300);
  }, [searchType]);

  /**
   * Save search to history
   */
  const saveToHistory = async (query) => {
    try {
      const historyKey = `search_history_${searchType}`;

      // Remove duplicates and add to front
      const newHistory = [
        query,
        ...searchHistory.filter(item => item !== query)
      ].slice(0, 10); // Keep only last 10 searches

      setSearchHistory(newHistory);
      await AsyncStorage.setItem(historyKey, JSON.stringify(newHistory));

      // Also save to backend for analytics
      await searchService.saveSearchHistory(query, searchType);
    } catch (error) {
      console.error('[SearchScreen] Error saving history:', error);
    }
  };

  /**
   * Clear all search history
   */
  const clearHistory = async () => {
    try {
      const historyKey = `search_history_${searchType}`;
      setSearchHistory([]);
      await AsyncStorage.removeItem(historyKey);
    } catch (error) {
      console.error('[SearchScreen] Error clearing history:', error);
    }
  };

  /**
   * Handle search submission
   */
  const handleSearch = (query, filterType = 'keyword', filterId = null) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery && !filterId) return;

    // Save to history
    if (trimmedQuery) {
      saveToHistory(trimmedQuery);
    }

    // Hide keyboard
    Keyboard.dismiss();

    // Navigate to results screen with appropriate filter
    const navigationParams = {};

    if (filterType === 'category' && filterId) {
      // If clicking a category, filter by category ID
      navigationParams.categoryId = filterId;
      navigationParams.categoryName = trimmedQuery;
    } else if (filterType === 'location') {
      // If clicking a location, filter by location
      navigationParams.location = trimmedQuery;
    } else {
      // Default: keyword search
      navigationParams.searchQuery = trimmedQuery;
    }

    // Close SearchScreen and navigate to results
    const targetScreen = searchType === 'vendors' ? 'Vendors' : 'Events';

    // Navigate to the tab screen with params, which will automatically close SearchScreen
    // and switch to the appropriate tab
    navigation.navigate('Main', {
      screen: targetScreen,
      params: navigationParams
    });
  };

  /**
   * Handle suggestion/history item tap
   */
  const handleSuggestionTap = (item) => {
    // Handle string items (from history)
    if (typeof item === 'string') {
      handleSearch(item, 'keyword');
      return;
    }

    // Extract suggestion details - support both old and new API formats
    const text = item.display || item.value || item.text || item.name || '';
    const type = item.type || 'keyword';
    const id = item.id;

    // Handle different suggestion types
    // Don't update searchQuery state - just navigate directly
    if (type === 'category') {
      // Category: Show all vendors/events in this category
      handleSearch(text, 'category', id);
    } else if (type === 'location') {
      // Location: Show all vendors/events in this location
      handleSearch(item.value || text, 'location');
    } else if (type === 'vendor' || type === 'event') {
      // Vendor/Event: Show all items in the same category
      const categoryId = item.categoryId;
      if (item.category && categoryId) {
        // If we have category info, filter by category
        handleSearch(item.category, 'category', categoryId);
      } else {
        // Otherwise, do keyword search
        handleSearch(text, 'keyword');
      }
    } else {
      // Default: keyword search
      handleSearch(text, 'keyword');
    }
  };

  /**
   * Clear search input
   */
  const handleClear = () => {
    setSearchQuery('');
    setSuggestions([]);
    searchInputRef.current?.focus();
  };

  /**
   * Render suggestion item
   */
  const renderSuggestion = ({ item }) => {
    // Defensive normalize — every field gets forced to a string|undefined so
    // a malformed suggestion (Photon empty hit, unknown backend shape, etc.)
    // can't crash the row via <Text>{undefined}</Text>.
    const safe = item && typeof item === 'object' ? item : {};
    const text = String(
      typeof item === 'string' ? item
        : safe.display || safe.value || safe.text || safe.name || ''
    );
    if (!text) return null;
    const type = typeof safe.type === 'string' ? safe.type : 'keyword';
    const category = typeof safe.category === 'string' ? safe.category : undefined;
    const subtype = typeof safe.subtype === 'string' ? safe.subtype : undefined;

    // Icon based on suggestion type - prefer API-provided icon
    const getIcon = () => {
      // Use icon from API if provided (remove "outline" suffix for consistency)
      if (typeof safe.icon === 'string' && safe.icon) {
        return safe.icon.replace('-outline', '');
      }

      // Fallback to type-based icons
      switch (type) {
        case 'vendor':
        case 'event':
          return 'search';
        case 'category':
          return 'pricetag';
        case 'location':
          return 'location';
        default:
          return 'search';
      }
    };

    return (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleSuggestionTap(item)}
      >
        <Icon name={getIcon()} size={20} color="#666" style={styles.suggestionIcon} />
        <View style={styles.suggestionTextContainer}>
          <Text style={styles.suggestionText} numberOfLines={1}>
            {text}
          </Text>
          {(category || subtype) && (
            <Text style={styles.suggestionCategory} numberOfLines={1}>
              {category ? `in ${category}` : (subtype ? subtype : '')}
            </Text>
          )}
        </View>
        <Icon name="arrow-forward" size={16} color="#ccc" />
      </TouchableOpacity>
    );
  };

  /**
   * Render search history item
   */
  const renderHistoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleSuggestionTap(item)}
    >
      <Icon name="time-outline" size={20} color="#666" style={styles.historyIcon} />
      <Text style={styles.historyText} numberOfLines={1}>
        {item}
      </Text>
      <TouchableOpacity
        onPress={() => {
          // Remove this item from history
          const newHistory = searchHistory.filter(h => h !== item);
          setSearchHistory(newHistory);
          const historyKey = `search_history_${searchType}`;
          AsyncStorage.setItem(historyKey, JSON.stringify(newHistory));
        }}
        style={styles.removeButton}
      >
        <Icon name="close" size={16} color="#999" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  /**
   * Render trending search item
   */
  const renderTrendingItem = ({ item }) => (
    <TouchableOpacity
      style={styles.trendingChip}
      onPress={() => handleSuggestionTap(item)}
    >
      <Icon name="trending-up" size={14} color="#2C3D5B" style={styles.trendingIcon} />
      <Text style={styles.trendingText}>{item.text || item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder={`Search ${searchType === 'vendors' ? 'vendors' : 'events'}...`}
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearch(searchQuery)}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <Icon name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content Area */}
      <ScrollView
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Loading Indicator */}
        {isLoading && searchQuery.length > 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2C3D5B" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {/* Autocomplete Suggestions */}
        {searchQuery.length > 0 && suggestions.length > 0 && !isLoading && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggestions</Text>
            <FlatList
              data={suggestions}
              keyExtractor={(item, index) => `suggestion-${index}`}
              renderItem={renderSuggestion}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* No results */}
        {searchQuery.length > 0 && suggestions.length === 0 && !isLoading && (
          <View style={styles.noResultsContainer}>
            <Icon name="search-outline" size={48} color="#ccc" />
            <Text style={styles.noResultsText}>No suggestions found</Text>
            <Text style={styles.noResultsSubtext}>
              Try searching for something else
            </Text>
          </View>
        )}

        {/* Search History */}
        {searchQuery.length === 0 && searchHistory.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={searchHistory}
              keyExtractor={(item, index) => `history-${index}`}
              renderItem={renderHistoryItem}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Trending Searches */}
        {searchQuery.length === 0 && trendingSearches.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending Searches</Text>
            <View style={styles.trendingContainer}>
              {trendingSearches.map((item, index) => (
                <TouchableOpacity
                  key={`trending-${index}`}
                  style={styles.trendingChip}
                  onPress={() => handleSuggestionTap(item)}
                >
                  <Icon name="trending-up" size={14} color="#2C3D5B" style={styles.trendingIcon} />
                  <Text style={styles.trendingText}>{item.text || item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Popular Categories (if no search query) */}
        {searchQuery.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Categories</Text>
            <View style={styles.categoriesContainer}>
              {searchType === 'vendors' ? (
                <>
                  <TouchableOpacity
                    style={styles.categoryChip}
                    onPress={() => handleSuggestionTap('Photography')}
                  >
                    <Text style={styles.categoryText}>📸 Photography</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.categoryChip}
                    onPress={() => handleSuggestionTap('Catering')}
                  >
                    <Text style={styles.categoryText}>🍽️ Catering</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.categoryChip}
                    onPress={() => handleSuggestionTap('Decoration')}
                  >
                    <Text style={styles.categoryText}>🎨 Decoration</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.categoryChip}
                    onPress={() => handleSuggestionTap('DJ')}
                  >
                    <Text style={styles.categoryText}>🎵 DJ & Music</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.categoryChip}
                    onPress={() => handleSuggestionTap('Wedding')}
                  >
                    <Text style={styles.categoryText}>💒 Wedding</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.categoryChip}
                    onPress={() => handleSuggestionTap('Birthday')}
                  >
                    <Text style={styles.categoryText}>🎂 Birthday</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.categoryChip}
                    onPress={() => handleSuggestionTap('Corporate')}
                  >
                    <Text style={styles.categoryText}>💼 Corporate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.categoryChip}
                    onPress={() => handleSuggestionTap('Party')}
                  >
                    <Text style={styles.categoryText}>🎉 Party</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  clearText: {
    fontSize: 14,
    color: '#2C3D5B',
    fontWeight: '500',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 15,
    color: '#000',
  },
  suggestionCategory: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  historyIcon: {
    marginRight: 12,
  },
  historyText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  removeButton: {
    padding: 4,
  },
  trendingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: -8,
  },
  trendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  trendingIcon: {
    marginRight: 4,
  },
  trendingText: {
    fontSize: 14,
    color: '#2C3D5B',
    fontWeight: '500',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: -8,
  },
  categoryChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});

export default SearchScreen;
