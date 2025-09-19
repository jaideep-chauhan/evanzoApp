import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Animated, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import {
    StyleSheet,
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SearchHeader from './SearchHeader';
import Tabs from './Tabs';
import VendorCard from './VendorCard';
import LocationSearchModal from './LocationSearchModal';
import CategorySelectionModal from './CategorySelectionModal';
import PreSavedMessage from '../profile/PreSavedMessage';
import img from '../../assets/images/dummy.png'; // Fallback image
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../ThemeContext';
import CatererCard from './CatererCard';
import Icon from 'react-native-vector-icons/Ionicons';
import vendorService from '../../services/vendorService';
import filterService from '../../services/filterService';

export default function Vendor() {
    const navigation = useNavigation();
    const theme = useTheme();
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedCategoryNames, setSelectedCategoryNames] = useState([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showPreSaveModal, setShowPreSaveModal] = useState(false);
    const [focusedCardIndex, setFocusedCardIndex] = useState(0);
    const scrollViewRef = useRef(null);
    const scrollY = useRef(new Animated.Value(0)).current;
    const [activeTab, setActiveTab] = useState(null); // No tab active by default
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [vendors, setVendors] = useState([]);
    const [isFetchingVendors, setIsFetchingVendors] = useState(false);
    const [networkError, setNetworkError] = useState(false);
    const fetchTimeoutRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentFilters, setCurrentFilters] = useState({});
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalResults: 0 });

    // Fetch vendors using new filtering service
    const fetchVendors = async (filters = {}, resetResults = false) => {
        if (isFetchingVendors) {
            console.log('Already fetching vendors, skipping...');
            return;
        }

        if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
        }

        try {
            setIsFetchingVendors(true);
            setNetworkError(false);
            
            if (resetResults) {
                setIsLoading(true);
            }

            // Combine current filters with new ones
            const searchFilters = {
                ...currentFilters,
                ...filters,
                page: resetResults ? 1 : (filters.page || currentFilters.page || 1),
                limit: 10
            };
            
            console.log('🔎 fetchVendors called with:', {
                filters,
                currentFilters,
                searchFilters,
                resetResults,
                filterCount: Object.keys(searchFilters).length
            });

            // If no filters applied, get all vendors
            let response;
            // Check if only pagination params are present (no actual filters)
            const hasFilters = Object.keys(searchFilters).some(key => 
                key !== 'page' && key !== 'limit' && searchFilters[key]
            );
            
            if (!hasFilters) {
                console.log('📋 No filters applied, fetching all vendors');
                response = await vendorService.getPublicVendorAds();
                if (response.success && response.data) {
                    const formattedVendors = response.data.map(vendor => 
                        vendorService.formatVendorForDisplay(vendor)
                    );
                    response = {
                        success: true,
                        data: formattedVendors,
                        pagination: { page: 1, limit: 10, totalPages: 1, totalResults: formattedVendors.length }
                    };
                }
            } else {
                console.log('🔍 Filters applied, searching vendors');
                response = await filterService.searchVendors(searchFilters);
                if (response.success && response.data) {
                    response.data = response.data.map(vendor => 
                        vendorService.formatVendorForDisplay(vendor)
                    );
                }
            }
            
            if (response.success) {
                if (resetResults) {
                    setVendors(response.data || []);
                } else {
                    // For pagination, append results
                    setVendors(prev => [...prev, ...(response.data || [])]);
                }
                setPagination(response.pagination || { page: 1, limit: 10, totalPages: 1, totalResults: 0 });
                setCurrentFilters(searchFilters);
            } else {
                if (resetResults) {
                    setVendors([]);
                }
                setNetworkError(true);
            }
        } catch (error) {
            console.error('Error fetching vendors:', error);
            setNetworkError(true);
            if (resetResults) {
                setVendors([]);
            }
        } finally {
            setIsLoading(false);
            setIsFetchingVendors(false);
        }
    };

    // Fetch vendors on component mount
    useEffect(() => {
        // Initial fetch with a small delay to prevent race conditions
        const initialFetchTimeout = setTimeout(() => {
            fetchVendors();
        }, 100);
        
        // Failsafe: Stop loading after 15 seconds if still loading
        const failsafeTimeout = setTimeout(() => {
            if (isLoading) {
                setIsLoading(false);
                setIsFetchingVendors(false);
                setNetworkError(true);
            }
        }, 15000);
        
        return () => {
            clearTimeout(initialFetchTimeout);
            clearTimeout(failsafeTimeout);
            if (fetchTimeoutRef.current) {
                clearTimeout(fetchTimeoutRef.current);
            }
        };
    }, []);
    
    // Note: Removed useFocusEffect that was causing continuous API calls 
    // when no vendors found. Initial fetch on mount is sufficient.


    // Note: Filtering is disabled for now to ensure vendors always show
    // Can be re-enabled later if needed
    // const filteredVendors = useMemo(() => {
    //     let filtered = vendors;
    //     if (selectedLocation && selectedLocation !== 'Current Location') {
    //         filtered = filtered.filter(vendor => vendor.location === selectedLocation);
    //     }
    //     if (selectedCategory) {
    //         filtered = filtered.filter(vendor =>
    //             vendor.type.toLowerCase().includes(selectedCategory.toLowerCase()) ||
    //             selectedCategory.toLowerCase().includes(vendor.type.toLowerCase())
    //         );
    //     }
    //     return filtered;
    // }, [selectedLocation, selectedCategory]);

    const handleTabPress = (tabLabel, tabIndex) => {
        setActiveTab(tabIndex);
        if (tabLabel === 'Location') {
            setShowLocationModal(true);
        } else if (tabLabel === 'Pre Save') {
            setShowPreSaveModal(true);
        } else if (tabLabel === 'Category') {
            setShowCategoryModal(true);
        }
    };

    const handleLocationSelect = (location) => {
        setSelectedLocation(location);
        setShowLocationModal(false);
        
        // Apply location filter
        const newFilters = { ...currentFilters, location };
        if (!location) {
            delete newFilters.location;
        }
        fetchVendors(newFilters, true);
    };

    const handleCategorySelect = (categoryIds, categoryData) => {
        console.log('🔍 handleCategorySelect called with:', {
            categoryIds,
            categoryData,
            isArray: Array.isArray(categoryIds)
        });
        
        setSelectedCategory(categoryIds);
        setShowCategoryModal(false);
        
        // Store category names for display
        if (categoryData) {
            setSelectedCategoryNames(categoryData.map(cat => cat.name));
        } else {
            setSelectedCategoryNames([]);
        }
        
        // Apply category filter
        const newFilters = { ...currentFilters };
        if (categoryIds && categoryIds.length > 0) {
            newFilters.categories = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
        } else {
            delete newFilters.categories;
        }
        
        console.log('📊 Filters being applied:', {
            newFilters,
            categoriesInFilter: newFilters.categories
        });
        
        fetchVendors(newFilters, true);
    };

    // Create smooth interpolations for sticky header with better ranges
    const stickyHeaderOpacity = scrollY.interpolate({
        inputRange: [100, 150, 160],
        outputRange: [0, 0.5, 1],
        extrapolate: 'clamp',
    });

    const stickyHeaderTranslateY = scrollY.interpolate({
        inputRange: [100, 160],
        outputRange: [-50, 0],
        extrapolate: 'clamp',
    });

    const onRefresh = React.useCallback(async () => {
        // Don't refresh if already fetching
        if (isFetchingVendors) {
            return;
        }
        
        setRefreshing(true);
        
        try {
            // Reset filters and search
            setSelectedLocation(null);
            setSelectedCategory(null);
            setSelectedCategoryNames([]);
            setActiveTab(null);
            setSearchQuery('');
            setCurrentFilters({});
            
            // Fetch fresh data with no filters
            await fetchVendors({}, true);
        } catch (error) {
            console.error('Error refreshing vendors:', error);
        } finally {
            setRefreshing(false);
        }
    }, [isFetchingVendors]);

    return (
        <View style={[styles.safe]}>
            <Animated.ScrollView
                ref={scrollViewRef}
                style={{ flex: 1, backgroundColor: '#fff' }}
                contentContainerStyle={[styles.contentContainer, { backgroundColor: undefined }]}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                        colors={[theme.colors.primary]}
                        progressBackgroundColor="#fff"
                    />
                }
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    {
                        useNativeDriver: true,
                        listener: (event) => {
                            const offsetY = event.nativeEvent.contentOffset.y;
                            const cardHeight = 420;
                            const currentIndex = Math.floor(offsetY / cardHeight);
                            setFocusedCardIndex(Math.max(0, currentIndex));
                        }
                    }
                )}
            >
                <View style={styles.headerWrapper} >
                    <SearchHeader 
                        searchValue={searchQuery}
                        onSearchChange={(text) => {
                            setSearchQuery(text);
                            // Debounced search
                            filterService.debouncedSearch(
                                (filters) => fetchVendors(filters, true),
                                { ...currentFilters, keyword: text },
                                500,
                                'vendor-header-search'
                            );
                        }}
                    />
                    <Tabs
                        tabs={['Location', 'Quick Message', 'Category']}
                        onTabPress={handleTabPress}
                        defaultActive={activeTab}
                    />
                </View>

                {/* Loading Spinner below tabs */}
                {isLoading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadingText, { color: theme.colors.primary }]}>
                            {networkError ? 'Network issue detected. Retrying...' : 'Loading vendors...'}
                        </Text>
                        {networkError && (
                            <TouchableOpacity 
                                style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
                                onPress={() => {
                                    console.log('Manual retry triggered');
                                    fetchVendors(true);
                                }}
                                disabled={isFetchingVendors}
                            >
                                <Text style={styles.retryButtonText}>
                                    {isFetchingVendors ? 'Retrying...' : 'Retry Now'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <>
                {/* Filter status and vendor count */}
                {(vendors.length > 0 || searchQuery || selectedLocation || selectedCategoryNames.length > 0) && (
                    <View style={[styles.filterIndicator, { backgroundColor: '#f0f4ff', borderColor: theme.colors.primary + '33' }]}>
                        <Text style={[styles.filterIndicatorText, { color: theme.colors.primary }]}>
                            {vendors.length} vendor{vendors.length !== 1 ? 's' : ''} {(searchQuery || selectedLocation || selectedCategoryNames.length > 0) ? 'found' : 'available'}
                        </Text>
                        {(selectedLocation || selectedCategoryNames.length > 0 || searchQuery) && (
                            <View style={styles.activeFilters}>
                                {searchQuery && (
                                    <View style={[styles.filterChip, { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary + '30' }]}>
                                        <Text style={[styles.filterChipText, { color: theme.colors.primary }]}>Search: {searchQuery}</Text>
                                    </View>
                                )}
                                {selectedLocation && (
                                    <View style={[styles.filterChip, { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary + '30' }]}>
                                        <Text style={[styles.filterChipText, { color: theme.colors.primary }]}>{selectedLocation}</Text>
                                    </View>
                                )}
                                {selectedCategoryNames && selectedCategoryNames.length > 0 && (
                                    <View style={[styles.filterChip, { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary + '30' }]}>
                                        <Text style={[styles.filterChipText, { color: theme.colors.primary }]}>
                                            {selectedCategoryNames.length > 2 
                                                ? `${selectedCategoryNames.length} categories`
                                                : selectedCategoryNames.join(', ')
                                            }
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                )}

                {/* No vendors message */}
                {vendors.length === 0 ? (
                    <View style={styles.noVendorsContainer}>
                        <Text style={styles.noVendorsText}>
                            {networkError ? 'Unable to load vendors' : 
                             ((searchQuery || selectedLocation || selectedCategoryNames.length > 0) ? 'No vendors match your filters' : 'No vendors found')}
                        </Text>
                        <Text style={styles.noVendorsSubtext}>
                            {networkError ? 'Check your internet connection' : 
                             ((searchQuery || selectedLocation || selectedCategoryNames.length > 0) ? 'Try adjusting your filters or clear them to see all vendors' : 'Pull down to refresh')}
                        </Text>
                        {networkError && (
                            <TouchableOpacity 
                                style={[styles.retryButton, { backgroundColor: theme.colors.primary, marginTop: 16 }]}
                                onPress={() => fetchVendors({}, true)}
                                disabled={isFetchingVendors}
                            >
                                <Text style={styles.retryButtonText}>
                                    {isFetchingVendors ? 'Retrying...' : 'Retry'}
                                </Text>
                            </TouchableOpacity>
                        )}
                        {!networkError && (searchQuery || selectedLocation || selectedCategoryNames.length > 0) && (
                            <TouchableOpacity 
                                style={[styles.clearFiltersButton, { backgroundColor: theme.colors.primary, marginTop: 16 }]}
                                onPress={() => {
                                    setSelectedLocation(null);
                                    setSelectedCategory(null);
                                    setSelectedCategoryNames([]);
                                    setSearchQuery('');
                                    setCurrentFilters({});
                                    fetchVendors({}, true);
                                }}
                            >
                                <Text style={styles.clearFiltersButtonText}>Clear All Filters</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    // Use vendors directly instead of filteredVendors
                    vendors.map((vendor, idx) => (
                        <VendorCard
                            key={vendor.id || idx}
                            vendorId={vendor._original?.vendor_ad_id || vendor.id}
                            fullVendorData={vendor} // Pass the complete vendor object
                            initials={vendor.initials}
                            name={vendor.name}
                            type={vendor.type}
                            rating={vendor.rating}
                            description={vendor.description}
                            images={vendor.images}
                            extraCount={vendor.extraCount}
                            location={vendor.location}
                            offers={vendor.offers || []} // Add offers prop
                            isFocused={idx === focusedCardIndex}
                            onChatPress={async () => {
                                // Get current user ID
                                const currentUserData = await AsyncStorage.getItem('userData');
                                const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
                                const currentUserId = currentUser?.user_id || currentUser?.id;
                                const vendorUserId = vendor._original?.user_id;
                                
                                console.log('Chat button pressed:', {
                                    currentUserId,
                                    vendorUserId,
                                    vendorName: vendor.name
                                });
                                
                                // Check if trying to chat with self
                                if (String(vendorUserId) === String(currentUserId)) {
                                    Alert.alert(
                                        'Cannot Start Chat',
                                        'You cannot start a chat with your own vendor listing.',
                                        [{ text: 'OK' }]
                                    );
                                    return;
                                }
                                
                                navigation.navigate('ChatScreen', {
                                    recipientId: vendorUserId,
                                    chatName: vendor.name,
                                    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
                                    isOnline: false,
                                });
                            }}
                        />
                    ))
                )}
                    </>
                )}
            </Animated.ScrollView>

            {/* Sticky Search Bar */}
            <Animated.View
                style={[
                    styles.stickyHeader,
                    {
                        opacity: stickyHeaderOpacity,
                        transform: [
                            { translateY: stickyHeaderTranslateY }
                        ],
                    }
                ]}
                pointerEvents="box-none"
            >
                    <View style={styles.stickyContent}>
                        <View style={[styles.stickySearchBar, { backgroundColor: theme.colors.primary + '10' }]}>
                            <Icon name="search-outline" size={20} color={theme.colors.primary} style={styles.stickySearchIcon} />
                            <TextInput
                                style={styles.stickyInput}
                                placeholder="Search by name, location, category..."
                                placeholderTextColor={theme.colors.primary + '80'}
                                value={searchQuery}
                                onChangeText={(text) => {
                                    setSearchQuery(text);
                                    // Debounced search
                                    filterService.debouncedSearch(
                                        (filters) => fetchVendors(filters, true),
                                        { ...currentFilters, keyword: text },
                                        500,
                                        'vendor-search'
                                    );
                                }}
                                returnKeyType="search"
                                onSubmitEditing={() => {
                                    const filters = { ...currentFilters, keyword: searchQuery };
                                    if (!searchQuery.trim()) {
                                        delete filters.keyword;
                                    }
                                    fetchVendors(filters, true);
                                }}
                            />
                        </View>
                        <TouchableOpacity
                            style={[styles.stickyChatIcon, { backgroundColor: theme.colors.primary }]}
                            onPress={() => navigation.navigate('ChatList')}
                        >
                            <Icon name="chatbubble-ellipses-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>

            {/* Location Search Modal */}
            <LocationSearchModal
                visible={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                onLocationSelect={handleLocationSelect}
                currentLocation={selectedLocation}
            />

            {/* Pre Save Modal */}
            <Modal
                visible={showPreSaveModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowPreSaveModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <PreSavedMessage />
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => setShowPreSaveModal(false)}
                        >
                            <Icon name="close" size={24} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Category Selection Modal */}
            <CategorySelectionModal
                visible={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                onCategorySelect={handleCategorySelect}
                currentCategory={selectedCategory}
                screenType="vendors"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#fff',
    },
    contentContainer: {
        paddingBottom: 100, // Increased padding to ensure last card is fully visible
    },
    headerWrapper: {
        marginBottom: 8,
    },
    filterIndicator: {
        marginTop: 12,
        marginBottom: 4,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginHorizontal: 0,
        shadowColor: '#2C3D5B',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
    },
    filterIndicatorText: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    activeFilters: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        gap: 6,
    },
    filterChip: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '500',
    },
    vendorCount: {
        fontSize: 12,
        color: '#666',
    },
    noVendorsContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
        marginTop: 24,
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        shadowColor: '#2C3D5B',
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 1,
    },
    noVendorsText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    noVendorsSubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    loaderContainer: {
        flex: 1,
        minHeight: 400,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '500',
    },
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    clearFiltersButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    clearFiltersButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '100%',
        maxWidth: 600,
        position: 'relative',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 5,
    },
    closeBtn: {
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 1,
        padding: 5,
    },
    stickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingTop: 50,
        paddingBottom: 12,
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 100,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    stickyContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    stickySearchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 25,
        paddingHorizontal: 15,
        height: 46,
        borderWidth: 1,
        borderColor: 'rgba(44, 61, 91, 0.08)',
    },
    stickySearchIcon: {
        marginRight: 8,
    },
    stickyInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    stickyChatIcon: {
        width: 46,
        height: 46,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 5,
    },
});