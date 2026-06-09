import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Animated, ActivityIndicator, Alert } from 'react-native';
import { VendorCardSkeleton, renderSkeletons } from '../../components/SkeletonLoader';
import { getCached, setCached } from '../../services/listCacheService';
import BannerAdView from '../../components/ads/BannerAdView';
import { BANNER_LIST_INTERVAL } from '../../services/adsConfig';

const VENDORS_CACHE_KEY = 'vendors:public';
import {
    StyleSheet,
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SearchHeader from './SearchHeader';
import Tabs from './Tabs';
import VendorCard from './VendorCard';
import LocationSearchModal from './LocationSearchModal';
import CategorySelectionModalEnhanced from './CategorySelectionModalEnhanced';
import PreSavedMessage from '../profile/PreSavedMessage';
import img from '../../assets/images/dummy.png'; // Fallback image
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../ThemeContext';
import CatererCard from './CatererCard';
import Icon from 'react-native-vector-icons/Ionicons';
import vendorService from '../../services/vendorService';
import filterService from '../../services/filterService';
import chatService from '../../services/chatService';

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
    const [checkingChat, setCheckingChat] = useState(null); // Track which vendor's chat is being checked
    const chatCacheRef = useRef(new Map()); // Cache existing chat lookups

    // Fetch vendors using new filtering service
    // IMPORTANT: Only approved vendor ads should be visible in the public vendors tab
    // - Backend filters for approval_status='approved'
    // - Frontend adds an additional safety layer to ensure only approved ads are shown
    // - User's own ads (in Profile -> My Ads) can show all statuses (pending, approved, rejected)
    const fetchVendors = async (filters = {}, resetResults = false, clearAllFilters = false) => {
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

            // resetResults = true means the caller (a filter handler, a search
            // change, etc.) is supplying the FULL intended filter set, so we
            // must not merge with the stale `currentFilters` — otherwise a
            // cleared filter (e.g. handleLocationSelect(null) deleting the
            // `location` key) gets re-applied from current state and the list
            // keeps showing "No vendors found" with the old filter still active.
            //
            // resetResults = false is pagination: keep the current filters and
            // just advance the page.
            const searchFilters = clearAllFilters ? {
                page: 1,
                limit: 10
            } : resetResults ? {
                ...filters,
                page: 1,
                limit: 10
            } : {
                ...currentFilters,
                ...filters,
                page: filters.page || currentFilters.page || 1,
                limit: 10
            };

            console.log('🔎 fetchVendors called with:', {
                filters,
                currentFilters,
                searchFilters,
                resetResults,
                clearAllFilters,
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
                console.log('📋 getPublicVendorAds response:', {
                    success: response?.success,
                    dataLength: response?.data?.length,
                    firstItem: response?.data?.[0]
                });

                if (response.success && response.data) {
                    // Filter to only show approved vendor ads
                    const approvedVendors = response.data.filter(vendor =>
                        vendor.approval_status === 'approved'
                    );
                    console.log(`✅ Filtered ${response.data.length} ads to ${approvedVendors.length} approved ads`);

                    const formattedVendors = approvedVendors.map(vendor =>
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
                console.log('🔍 searchVendors response:', {
                    success: response?.success,
                    dataLength: response?.data?.length,
                    firstItem: response?.data?.[0]
                });

                if (response.success && response.data) {
                    // Filter to only show approved vendor ads
                    const approvedVendors = response.data.filter(vendor =>
                        vendor.approval_status === 'approved'
                    );
                    console.log(`✅ Filtered ${response.data.length} ads to ${approvedVendors.length} approved ads`);

                    response.data = approvedVendors.map(vendor =>
                        vendorService.formatVendorForDisplay(vendor)
                    );
                }
            }

            console.log('📊 Response processing:', {
                success: response?.success,
                dataLength: response?.data?.length,
                resetResults
            });

            if (response.success) {
                if (resetResults) {
                    console.log('✨ Setting vendors state to:', response.data?.length, 'items');
                    const fresh = response.data || [];
                    setVendors(fresh);
                    // Cache only the unfiltered public list so the next launch
                    // can render instantly. Filtered results vary too widely
                    // to be worth persisting.
                    const hasUserFilters = Object.keys(filters || {}).some(
                        (k) => k !== 'page' && k !== 'limit' && filters[k],
                    );
                    if (!hasUserFilters && !clearAllFilters) {
                        setCached(VENDORS_CACHE_KEY, fresh);
                    }
                } else {
                    // For pagination, append results and remove duplicates based on vendor_ad_id
                    setVendors(prev => {
                        const newData = response.data || [];
                        const existingIds = new Set(prev.map(v => v._original?.vendor_ad_id || v.id));
                        const uniqueNewData = newData.filter(v => !existingIds.has(v._original?.vendor_ad_id || v.id));
                        console.log('📝 Appending vendors:', {
                            previousCount: prev.length,
                            newCount: uniqueNewData.length,
                            totalCount: prev.length + uniqueNewData.length
                        });
                        return [...prev, ...uniqueNewData];
                    });
                }
                setPagination(response.pagination || { page: 1, limit: 10, totalPages: 1, totalResults: 0 });
                setCurrentFilters(searchFilters);
                console.log('✅ fetchVendors completed successfully');
            } else {
                console.log('❌ Response not successful, setting network error');
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
        let isMounted = true;

        // Hydrate from AsyncStorage cache so the list paints immediately,
        // then the real fetch runs in the background. If there's already
        // cached data we skip the spinner — first-paint is the cached list.
        (async () => {
            const cached = await getCached(VENDORS_CACHE_KEY);
            if (!isMounted || !Array.isArray(cached) || cached.length === 0) return;
            setVendors(cached);
            setIsLoading(false);
        })();

        // Initial fetch with a small delay to prevent race conditions
        const initialFetchTimeout = setTimeout(() => {
            if (isMounted && !isFetchingVendors) {
                console.log('🚀 Initial vendor fetch on mount');
                fetchVendors({}, true); // Always reset results on mount
            }
        }, 100);

        // Failsafe: Stop loading after 15 seconds if still loading
        const failsafeTimeout = setTimeout(() => {
            if (isMounted && isLoading) {
                console.log('⏰ Failsafe timeout reached');
                setIsLoading(false);
                setIsFetchingVendors(false);
                setNetworkError(true);
            }
        }, 15000);

        return () => {
            isMounted = false;
            clearTimeout(initialFetchTimeout);
            clearTimeout(failsafeTimeout);
            if (fetchTimeoutRef.current) {
                clearTimeout(fetchTimeoutRef.current);
            }
        };
    }, []); // Empty dependency array ensures this runs only once on mount

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
        // Don't set active tab here - it will be set when filter is actually applied
        if (tabLabel === 'Location') {
            setShowLocationModal(true);
        } else if (tabLabel === 'Quick Message') {
            setShowPreSaveModal(true);
        } else if (tabLabel === 'Category') {
            setShowCategoryModal(true);
        }
    };

    const handleLocationSelect = (location) => {
        setSelectedLocation(location);
        setShowLocationModal(false);

        // Set active tab only if a location is selected
        if (location) {
            setActiveTab(0); // Location is index 0
        } else {
            setActiveTab(null);
        }

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

        // Set active tab only if a category is selected
        if (categoryIds && categoryIds.length > 0) {
            setActiveTab(2); // Category is index 2
        } else {
            setActiveTab(null);
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
            console.log('🔄 Already fetching, skipping refresh');
            return;
        }

        console.log('🔄 Refresh triggered with currentFilters:', currentFilters);
        setRefreshing(true);
        setNetworkError(false); // Clear network error on refresh

        try {
            // Check if we have any actual filters (excluding page/limit)
            const hasActualFilters = Object.keys(currentFilters).some(key =>
                key !== 'page' && key !== 'limit' && currentFilters[key]
            );

            if (!hasActualFilters) {
                // No filters, fetch all vendors fresh
                console.log('🔄 No filters, fetching all vendors');
                await fetchVendors({}, true, true);
            } else {
                // Has filters, fetch with existing filters
                console.log('🔄 Has filters, fetching with existing filters');
                await fetchVendors(currentFilters, true);
            }
        } catch (error) {
            console.error('Error refreshing vendors:', error);
        } finally {
            setRefreshing(false);
        }
    }, [isFetchingVendors, currentFilters]);

    // While the user is pulling down to refresh (negative scrollY), counter-
    // translate the header so it appears pinned even though it lives inside
    // the ScrollView. Normal upward scroll (positive scrollY) gets T=0, so the
    // header still scrolls away with the cards as expected.
    const refreshPinTranslate = scrollY.interpolate({
        inputRange: [-500, 0, 500],
        outputRange: [-500, 0, 0],
        extrapolateRight: 'clamp',
        extrapolateLeft: 'identity',
    });

    return (
        <View style={[styles.safe]}>
            <Animated.ScrollView
                ref={scrollViewRef}
                style={{ flex: 1, backgroundColor: '#fff' }}
                contentContainerStyle={[styles.contentContainer, { backgroundColor: undefined }]}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
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
                <Animated.View
                    style={[styles.headerWrapper, { transform: [{ translateY: refreshPinTranslate }] }]}
                >
                    <SearchHeader
                        searchValue={searchQuery}
                        searchType="vendors"
                        onSearchChange={(text) => {
                            setSearchQuery(text);
                            filterService.debouncedSearch(
                                (filters) => fetchVendors(filters, true),
                                { ...currentFilters, keyword: text },
                                500,
                                'vendor-header-search'
                            );
                        }}
                        onCategorySelect={(cat) => {
                            handleCategorySelect([cat.category_id || cat.id], [cat]);
                        }}
                    />
                    <Tabs
                        tabs={['Location', 'Quick Message', 'Category']}
                        onTabPress={handleTabPress}
                        defaultActive={activeTab}
                    />
                </Animated.View>

                {/* First-paint loading state — skeletons matching the real
                    VendorCard layout. Subsequent renders never hit this branch
                    because cache hydration flips isLoading false before the
                    network call returns. Network-error state is a richer
                    fallback with a retry button. */}
                {isLoading ? (
                    networkError ? (
                        <View style={styles.loaderContainer}>
                            <Text style={[styles.loadingText, { color: theme.colors.primary }]}>
                                Network issue detected. Retrying...
                            </Text>
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
                        </View>
                    ) : (
                        renderSkeletons(VendorCardSkeleton, 3)
                    )
                ) : (
                    <>
                        {/* Filter status */}
                        {(selectedLocation || selectedCategoryNames.length > 0 || searchQuery) && (
                            <View style={[styles.filterIndicator, { backgroundColor: '#f0f4ff', borderColor: theme.colors.primary + '33' }]}>
                                {(selectedLocation || selectedCategoryNames.length > 0 || searchQuery) && (
                                    <View style={styles.activeFilters}>
                                        {searchQuery && (
                                            <View style={[styles.filterChip, { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary + '30' }]}>
                                                <Text style={[styles.filterChipText, { color: theme.colors.primary }]}>Search: {searchQuery}</Text>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setSearchQuery('');
                                                        const newFilters = { ...currentFilters };
                                                        delete newFilters.keyword;
                                                        fetchVendors(newFilters, true);
                                                    }}
                                                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                                    style={styles.filterChipClear}
                                                >
                                                    <Icon name="close" size={14} color={theme.colors.primary} />
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                        {selectedLocation && (
                                            <View style={[styles.filterChip, { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary + '30' }]}>
                                                <Text style={[styles.filterChipText, { color: theme.colors.primary }]}>{selectedLocation}</Text>
                                                <TouchableOpacity
                                                    onPress={() => handleLocationSelect(null)}
                                                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                                    style={styles.filterChipClear}
                                                >
                                                    <Icon name="close" size={14} color={theme.colors.primary} />
                                                </TouchableOpacity>
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
                                                <TouchableOpacity
                                                    onPress={() => handleCategorySelect([], [])}
                                                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                                    style={styles.filterChipClear}
                                                >
                                                    <Icon name="close" size={14} color={theme.colors.primary} />
                                                </TouchableOpacity>
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
                                            console.log('🧹 Clear All Filters button clicked');
                                            setSelectedLocation(null);
                                            setSelectedCategory(null);
                                            setSelectedCategoryNames([]);
                                            setSearchQuery('');
                                            setActiveTab(null); // Clear active tab when clearing all filters
                                            setCurrentFilters({});
                                            setNetworkError(false); // Explicitly clear network error
                                            fetchVendors({}, true, true); // Pass true for clearAllFilters
                                        }}
                                    >
                                        <Text style={styles.clearFiltersButtonText}>Clear All Filters</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            // Use vendors directly instead of filteredVendors.
                            // After every Nth card we drop an inline banner.
                            vendors.map((vendor, idx) => (
                              <React.Fragment key={`vendor-frag-${vendor._original?.vendor_ad_id || vendor.id}-${idx}`}>
                                <VendorCard
                                    key={`vendor-${vendor._original?.vendor_ad_id || vendor.id}-${idx}`}
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
                                    isCheckingChat={checkingChat === `vendor_${vendor._original?.user_id}`}
                                    onChatPress={async () => {
                                        // Get current user ID
                                        const currentUserData = await AsyncStorage.getItem('userData');
                                        const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
                                        const currentUserId = currentUser?.user_id || currentUser?.id;
                                        const vendorUserId = vendor._original?.user_id;
                                        const vendorKey = `vendor_${vendorUserId}`;

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

                                        // Show loading state
                                        setCheckingChat(vendorKey);

                                        try {
                                            let existingChatResult;
                                            
                                            // Check cache first
                                            if (chatCacheRef.current.has(vendorUserId)) {
                                                console.log('📦 Using cached chat info for vendor:', vendorUserId);
                                                existingChatResult = chatCacheRef.current.get(vendorUserId);
                                            } else {
                                                // Not in cache, fetch from server
                                                console.log('🔍 Checking for existing chat with vendor:', vendorUserId);
                                                existingChatResult = await chatService.findDirectChat(vendorUserId);
                                                
                                                // Cache the result for future use
                                                chatCacheRef.current.set(vendorUserId, existingChatResult);
                                            }
                                            
                                            // Hide loading state
                                            setCheckingChat(null);
                                            
                                            if (existingChatResult.exists) {
                                                // Navigate to existing chat
                                                console.log('📱 Navigating to existing chat:', existingChatResult.chatId);
                                                navigation.navigate('ChatScreen', {
                                                    chatId: existingChatResult.chatId,
                                                    chatName: vendor.name,
                                                    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
                                                    isOnline: false,
                                                });
                                            } else {
                                                // No existing chat, navigate with recipientId to create new
                                                console.log('📱 No existing chat, will create new one');
                                                navigation.navigate('ChatScreen', {
                                                    recipientId: vendorUserId,
                                                    chatName: vendor.name,
                                                    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
                                                    isOnline: false,
                                                });
                                                
                                                // Clear cache for this vendor as a new chat will be created
                                                chatCacheRef.current.delete(vendorUserId);
                                            }
                                        } catch (error) {
                                            console.error('Error checking for existing chat:', error);
                                            setCheckingChat(null);
                                            
                                            // Fallback: navigate directly with recipientId
                                            navigation.navigate('ChatScreen', {
                                                recipientId: vendorUserId,
                                                chatName: vendor.name,
                                                avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
                                                isOnline: false,
                                            });
                                        }
                                    }}
                                />
                                {(idx + 1) % BANNER_LIST_INTERVAL === 0 && (
                                    <BannerAdView style={{ marginVertical: 12 }} />
                                )}
                              </React.Fragment>
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
                        onPress={() => navigation.navigate('NotificationInbox')}
                    >
                        <Icon name="notifications-outline" size={24} color="#fff" />
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
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>Quick Message Template</Text>
                            <TouchableOpacity
                                style={styles.closeBtn}
                                onPress={() => setShowPreSaveModal(false)}
                            >
                                <Icon name="close" size={24} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1 }}>
                            <PreSavedMessage
                                visible={showPreSaveModal}
                                onClose={() => setShowPreSaveModal(false)}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Category Selection Modal */}
            <CategorySelectionModalEnhanced
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 8,
        paddingRight: 4,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '500',
    },
    filterChipClear: {
        marginLeft: 6,
        padding: 2,
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        width: '90%',
        maxWidth: 600,
        height: '80%',
        position: 'relative',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 5,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: '#fff',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    closeBtn: {
        padding: 8,
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