import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    ScrollView,
    View,
    Animated,
    Text,
    TextInput,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { EventCardSkeleton, renderSkeletons } from '../../components/SkeletonLoader';
import { getCached, setCached } from '../../services/listCacheService';
import BannerAdView from '../../components/ads/BannerAdView';
import { BANNER_LIST_INTERVAL } from '../../services/adsConfig';

const EVENTS_CACHE_KEY = 'events:public';
import Tabs from '../vendors/Tabs';
import EventCard from './EventCard';
import LocationSelector from '../../components/LocationSelector';
import DateRangePickerModal from '../vendors/DateRangePickerModal';
import CategorySelectionModalEnhanced from '../vendors/CategorySelectionModalEnhanced';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../ThemeContext';
import SearchHeader from '../vendors/SearchHeader';
import eventService from '../../services/eventService';
import filterService from '../../services/filterService';

export default function Events() {
    const navigation = useNavigation();
    const theme = useTheme();
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [selectedDateRange, setSelectedDateRange] = useState(null);
    const [showDateRangeModal, setShowDateRangeModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedCategoryNames, setSelectedCategoryNames] = useState([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [activeTab, setActiveTab] = useState(null); // No tab active by default
    const scrollY = useRef(new Animated.Value(0)).current;
    const [isScrolled, setIsScrolled] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentFilters, setCurrentFilters] = useState({});
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalResults: 0 });
    const [isFetchingEvents, setIsFetchingEvents] = useState(false);
    const [networkError, setNetworkError] = useState(false);

    // Fetch events using new filtering service
    // IMPORTANT: Only approved event ads should be visible in the public events tab
    // - Backend filters for approval_status='approved'
    // - Frontend adds an additional safety layer to ensure only approved ads are shown
    // - User's own ads (in Profile -> My Ads) can show all statuses (pending, approved, rejected)
    const fetchEvents = async (filters = {}, resetResults = false, clearAllFilters = false, silent = false) => {
        if (isFetchingEvents) {
            console.log('Already fetching events, skipping...');
            return;
        }

        try {
            setIsFetchingEvents(true);
            setNetworkError(false);

            // `silent` lets a focus-refresh / pull-to-refresh keep the
            // existing list visible and swap in the fresh data in place
            // when the request returns. Without this, every tab swap or
            // back-nav flashes a skeleton over real data.
            if (resetResults && !silent) {
                setIsLoading(true);
            }

            // resetResults = true means the caller supplied the FULL intended
            // filter set; don't merge with stale currentFilters or a cleared
            // key (deleted from filters) will get re-applied from current state
            // and the list keeps showing the old result. Pagination
            // (resetResults=false) keeps current filters and advances the page.
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

            // If no filters applied, get all events
            let response;
            // Check if only pagination params are present (no actual filters)
            const hasFilters = Object.keys(searchFilters).some(key => 
                key !== 'page' && key !== 'limit' && searchFilters[key]
            );
            
            if (!hasFilters) {
                console.log('📋 No filters applied, fetching all events');
                response = await eventService.getPublicEventAds();
                if (response.success && response.data) {
                    // Filter to only show approved event ads
                    const approvedEvents = response.data.filter(event =>
                        event.approval_status === 'approved'
                    );
                    console.log(`✅ Filtered ${response.data.length} ads to ${approvedEvents.length} approved ads`);

                    const formattedEvents = approvedEvents.map(event =>
                        eventService.formatEventForDisplay(event)
                    );
                    response = {
                        success: true,
                        data: formattedEvents,
                        pagination: { page: 1, limit: 10, totalPages: 1, totalResults: formattedEvents.length }
                    };
                }
            } else {
                // Try to use search endpoint if available, otherwise filter client-side
                try {
                    // Try using the search endpoint first
                    response = await eventService.searchEventAds({
                        keyword: searchFilters.keyword,
                        location: searchFilters.location,
                        eventType: searchFilters.category,
                        dateFrom: searchFilters.dateFrom,
                        dateTo: searchFilters.dateTo,
                        page: searchFilters.page,
                        limit: searchFilters.limit
                    });

                    if (response.success && response.data) {
                        // Filter to only show approved event ads
                        const approvedEvents = response.data.filter(event =>
                            event.approval_status === 'approved'
                        );
                        console.log(`✅ Filtered ${response.data.length} search results to ${approvedEvents.length} approved ads`);

                        response = {
                            success: true,
                            data: approvedEvents.map(event => eventService.formatEventForDisplay(event)),
                            pagination: response.pagination || { page: 1, limit: 10, totalPages: 1, totalResults: approvedEvents.length }
                        };
                    }
                } catch (searchError) {
                    // If search endpoint fails, fall back to client-side filtering
                    console.log('📱 Search endpoint not available, using client-side filtering');
                    
                    const allEventsResponse = await eventService.getPublicEventAds();
                    if (allEventsResponse.success && allEventsResponse.data) {
                        // Filter to only show approved event ads first
                        let filteredEvents = allEventsResponse.data.filter(event =>
                            event.approval_status === 'approved'
                        );
                        console.log(`✅ Client-side: Filtered ${allEventsResponse.data.length} ads to ${filteredEvents.length} approved ads`);
                        
                        // Apply client-side filtering - search across multiple fields
                        if (searchFilters.keyword) {
                            const keyword = searchFilters.keyword.toLowerCase();
                            filteredEvents = filteredEvents.filter(event =>
                                event.title?.toLowerCase().includes(keyword) ||
                                event.description?.toLowerCase().includes(keyword) ||
                                event.location?.toLowerCase().includes(keyword) ||
                                event.category?.toLowerCase().includes(keyword) ||
                                event.event_type?.toLowerCase().includes(keyword)
                            );
                            console.log(`🔍 Event keyword search for "${searchFilters.keyword}" found ${filteredEvents.length} results`);
                        }
                        
                        if (searchFilters.location) {
                            filteredEvents = filteredEvents.filter(event =>
                                event.location?.includes(searchFilters.location)
                            );
                        }
                        
                        if (searchFilters.category) {
                            const categories = searchFilters.category.split(',');
                            console.log('🔍 Filtering events by categories:', categories);
                            
                            filteredEvents = filteredEvents.filter(event => {
                                const eventCategory = event.category?.toLowerCase() || event.event_type?.toLowerCase();
                                const matches = categories.some(cat => eventCategory === cat.toLowerCase());
                                return matches;
                            });
                            
                            console.log('🔍 Events after category filter:', filteredEvents.length);
                        }
                        
                        // Apply date range filtering
                        if (searchFilters.dateFrom && searchFilters.dateTo) {
                            const startDate = new Date(searchFilters.dateFrom);
                            const endDate = new Date(searchFilters.dateTo);
                            endDate.setHours(23, 59, 59, 999); // Include the entire end date
                            
                            console.log('📅 Filtering events by date range:', {
                                from: startDate.toLocaleDateString(),
                                to: endDate.toLocaleDateString()
                            });
                            
                            filteredEvents = filteredEvents.filter(event => {
                                if (!event.date) return false;
                                
                                try {
                                    const eventDate = new Date(event.date);
                                    const isInRange = eventDate >= startDate && eventDate <= endDate;
                                    
                                    if (!isInRange) {
                                        console.log(`❌ Event "${event.title}" date ${eventDate.toLocaleDateString()} is outside range`);
                                    }
                                    
                                    return isInRange;
                                } catch (e) {
                                    console.error(`Error parsing date for event "${event.title}":`, e);
                                    return false;
                                }
                            });
                            
                            console.log('📅 Events after date filter:', filteredEvents.length);
                        }
                        
                        response = {
                            success: true,
                            data: filteredEvents.map(event => eventService.formatEventForDisplay(event)),
                            pagination: { page: 1, limit: 10, totalPages: 1, totalResults: filteredEvents.length }
                        };
                    } else {
                        response = allEventsResponse;
                    }
                }
            }
            
            if (response.success) {
                if (resetResults) {
                    const fresh = response.data || [];
                    setEvents(fresh);
                    // Persist only the unfiltered public list — filtered or
                    // paginated results aren't worth caching across launches.
                    const hasUserFilters = Object.keys(filters || {}).some(
                        (k) => k !== 'page' && k !== 'limit' && filters[k],
                    );
                    if (!hasUserFilters && !clearAllFilters) {
                        setCached(EVENTS_CACHE_KEY, fresh);
                    }
                } else {
                    // For pagination, append results and remove duplicates based on event_ad_id
                    setEvents(prev => {
                        const newData = response.data || [];
                        const existingIds = new Set(prev.map(e => e._original?.event_ad_id || e.id));
                        const uniqueNewData = newData.filter(e => !existingIds.has(e._original?.event_ad_id || e.id));
                        return [...prev, ...uniqueNewData];
                    });
                }
                setPagination(response.pagination || { page: 1, limit: 10, totalPages: 1, totalResults: 0 });
                setCurrentFilters(searchFilters);
            } else {
                if (resetResults) {
                    setEvents([]);
                }
                setNetworkError(true);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            setNetworkError(true);
            if (resetResults) {
                setEvents([]);
            }
        } finally {
            setIsLoading(false);
            setIsFetchingEvents(false);
        }
    };

    // Fetch events on component mount
    useEffect(() => {
        let isMounted = true;

        // Hydrate from AsyncStorage so the first paint is the last known list
        // (no spinner), then run the real fetch silently in the background.
        (async () => {
            const cached = await getCached(EVENTS_CACHE_KEY);
            if (!isMounted || !Array.isArray(cached) || cached.length === 0) return;
            setEvents(cached);
            setIsLoading(false);
        })();

        // Initial fetch with a small delay to prevent race conditions.
        // silent=true so a cache-hydrated list isn't replaced by a skeleton
        // while the network request runs.
        const initialFetchTimeout = setTimeout(() => {
            if (isMounted && !isFetchingEvents) {
                console.log('🚀 Initial event fetch on mount');
                fetchEvents({}, true, false, true);
            }
        }, 100);

        return () => {
            isMounted = false;
            clearTimeout(initialFetchTimeout);
        };
    }, []); // Empty dependency array ensures this runs only once on mount

    // Refetch on focus so a rating/review submitted on a detail page is
    // reflected when the user returns. First focus is skipped because the
    // mount effect above already does the initial fetch. currentFilters is
    // read via a ref so the callback can stay with empty deps — otherwise
    // fetchEvents → setCurrentFilters → new useCallback → useFocusEffect
    // re-fires → infinite loop.
    const isFirstFocusRef = useRef(true);
    const currentFiltersRef = useRef(currentFilters);
    useEffect(() => {
        currentFiltersRef.current = currentFilters;
    }, [currentFilters]);
    useFocusEffect(
        useCallback(() => {
            if (isFirstFocusRef.current) {
                isFirstFocusRef.current = false;
                return undefined;
            }
            // silent=true → keep current list visible, swap in fresh data
            // when the network call completes.
            fetchEvents(currentFiltersRef.current, true, false, true);
            return undefined;
        }, []),
    );

    const dummyEvents = [
        {
            id: 1,
            title: 'Corporate Event',
            location: 'Ontario, Canada',
            duration: '2 hours',
            date: 'October 30, 2023',
            budget: '1500',
            guests: '150',
            organizer: {
                name: 'Rachel Swan',
                avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
            },
            description: 'Join us for an exclusive corporate networking event featuring industry leaders, innovative presentations, and valuable business connections. This event will showcase the latest trends in business development.',
            attachments: [
                'https://picsum.photos/100/100?random=1',
                'https://picsum.photos/100/100?random=2',
            ],
            category: 'Corporate',
        },
        {
            id: 2,
            title: 'Wedding Ceremony',
            location: 'Toronto, ON',
            duration: '6 hours',
            date: 'November 15, 2023',
            budget: '5000',
            guests: '200',
            organizer: {
                name: 'Emily Johnson',
                avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
            },
            description: 'A beautiful outdoor wedding ceremony in a stunning garden venue. Looking for comprehensive wedding planning services including decoration, catering, photography, and music.',
            attachments: [
                'https://picsum.photos/100/100?random=3',
                'https://picsum.photos/100/100?random=4',
            ],
            category: 'Wedding',
        },
        {
            id: 3,
            title: 'Birthday Party',
            location: 'Vancouver, BC',
            duration: '4 hours',
            date: 'December 5, 2023',
            budget: '800',
            guests: '50',
            organizer: {
                name: 'Mike Chen',
                avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
            },
            description: 'Planning a spectacular 25th birthday celebration with live music, catering, and entertainment. Need vendors for sound system, decorations, and birthday cake.',
            attachments: [
                'https://picsum.photos/100/100?random=5',
                'https://picsum.photos/100/100?random=6',
            ],
            category: 'Birthday',
        },
        {
            id: 4,
            title: 'Conference Summit',
            location: 'Montreal, QC',
            duration: '8 hours',
            date: 'January 20, 2024',
            budget: '10000',
            guests: '500',
            organizer: {
                name: 'Sarah Mitchell',
                avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
            },
            description: 'Annual technology conference bringing together 500+ attendees. Requiring comprehensive event management including AV equipment, catering, and booth setup.',
            attachments: [
                'https://picsum.photos/100/100?random=7',
                'https://picsum.photos/100/100?random=8',
            ],
            category: 'Conference',
        },
        {
            id: 5,
            title: 'Graduation Party',
            location: 'Calgary, AB',
            duration: '5 hours',
            date: 'June 10, 2024',
            organizer: {
                name: 'David Wilson',
                avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
            },
            description: 'Celebrating graduation with family and friends. Looking for party planning services including venue decoration, photography, and catering for 50 guests.',
            attachments: [
                'https://picsum.photos/100/100?random=9',
                'https://picsum.photos/100/100?random=10',
            ],
            category: 'Graduation',
        },
        {
            id: 6,
            title: 'Product Launch',
            location: 'Ottawa, ON',
            duration: '3 hours',
            date: 'February 14, 2024',
            organizer: {
                name: 'Lisa Park',
                avatar: 'https://randomuser.me/api/portraits/women/6.jpg',
            },
            description: 'Exclusive product launch event for our new tech product. Need professional event coordination, marketing materials, and media coverage.',
            attachments: [
                'https://picsum.photos/100/100?random=11',
                'https://picsum.photos/100/100?random=12',
            ],
            category: 'Product Launch',
        },
    ];

    // Use events directly as filtering is now handled by the API

    const handleTabPress = (tabLabel, tabIndex) => {
        console.log('Selected tab:', tabLabel);
        // Don't activate the tab here — that's what was causing closed-
        // without-selecting modals to leave the tab stuck active.
        // The per-filter select handlers (handleLocationSelect,
        // handleDateRangeSelect, handleCategorySelect) flip activeTab
        // only when a real value is committed.

        if (tabLabel === 'Location') {
            setShowLocationModal(true);
        } else if (tabLabel === 'Date') {
            setShowDateRangeModal(true);
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
        const newFilters = { ...currentFilters };
        if (location) {
            newFilters.location = location;
        } else {
            delete newFilters.location;
        }

        // Check if we're clearing all filters
        const hasAnyFilter = Object.keys(newFilters).some(key =>
            key !== 'page' && key !== 'limit' && newFilters[key]
        );

        fetchEvents(newFilters, true, !hasAnyFilter);
    };

    const handleDateRangeSelect = (dateRange) => {
        setSelectedDateRange(dateRange);
        setShowDateRangeModal(false);

        // Set active tab only if a date range is selected
        if (dateRange && dateRange.startDate && dateRange.endDate) {
            setActiveTab(1); // Date is index 1
        } else {
            setActiveTab(null);
        }

        // Apply date range filter
        const newFilters = { ...currentFilters };
        if (dateRange && dateRange.startDate && dateRange.endDate) {
            newFilters.dateFrom = dateRange.startDate.toISOString().split('T')[0];
            newFilters.dateTo = dateRange.endDate.toISOString().split('T')[0];
        } else {
            delete newFilters.dateFrom;
            delete newFilters.dateTo;
        }

        // Check if we're clearing all filters
        const hasAnyFilter = Object.keys(newFilters).some(key =>
            key !== 'page' && key !== 'limit' && newFilters[key]
        );

        fetchEvents(newFilters, true, !hasAnyFilter);
    };

    const handleCategorySelect = (categoryIds, categoryData) => {
        console.log('📱 Event category selected:', {
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

        console.log('🎯 Event filters to apply:', newFilters);

        // Check if we're clearing all filters
        const hasAnyFilter = Object.keys(newFilters).some(key =>
            key !== 'page' && key !== 'limit' && newFilters[key]
        );

        fetchEvents(newFilters, true, !hasAnyFilter);
    };

    const handleGiveQuote = async (event) => {
        // Navigate to chat screen with event organizer
        console.log('Give quote for event:', event.title);
        console.log('Event object structure:', JSON.stringify(event, null, 2));

        try {
            // Get event organizer information
            // Try multiple paths to get user_id
            const organizerId = event._original?.user_id ||
                               event.user_id ||
                               event.organizer?.id ||
                               event.organizer?.user_id;

            const organizerName = event.organizer?.name || 'Event Organizer';
            const organizerAvatar = event.organizer?.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg';

            console.log('Extracted organizer info:', {
                organizerId,
                organizerName,
                organizerAvatar,
                hasOriginal: !!event._original,
                originalUserId: event._original?.user_id,
                eventUserId: event.user_id
            });

            if (!organizerId) {
                console.error('❌ No organizer ID found for event:', event);
                Alert.alert('Error', 'Unable to contact event organizer. Please try again later.');
                return;
            }

            console.log('📱 Navigating to chat with organizer:', {
                recipientId: organizerId,
                chatName: organizerName,
                avatar: organizerAvatar
            });

            // Navigate to ChatScreen - it will create a new chat if one doesn't exist
            navigation.navigate('ChatScreen', {
                recipientId: organizerId,
                chatName: organizerName,
                avatar: organizerAvatar,
                isOnline: false, // Will be updated by socket
                eventContext: {
                    eventId: event._original?.event_ad_id || event.id,
                    eventTitle: event.title,
                    eventBudget: event.budget
                }
            });
        } catch (error) {
            console.error('Error navigating to chat:', error);
            Alert.alert('Error', 'Unable to open chat. Please try again.');
        }
    };

    // Removed duplicate loading effect - fetchEvents already handles loading state

    const onRefresh = React.useCallback(async () => {
        // Don't refresh if already fetching
        if (isFetchingEvents) {
            console.log('🔄 Already fetching, skipping refresh');
            return;
        }

        console.log('🔄 Event refresh triggered');
        setRefreshing(true);

        try {
            // Check if we have any active filters
            const hasFilters = Object.keys(currentFilters).some(key =>
                key !== 'page' && key !== 'limit' && currentFilters[key]
            );

            // Fetch fresh data with existing filters
            await fetchEvents(currentFilters, true, !hasFilters);

            console.log('Events refreshed successfully');
        } catch (error) {
            console.error('Error refreshing events:', error);
        } finally {
            setRefreshing(false);
        }
    }, [isFetchingEvents, currentFilters]);

    // Pin the header in place ONLY when scrollY is negative (pull-to-refresh).
    // Positive scrollY (normal scroll up) gets translateY = 0 so the header
    // scrolls away with the cards as before.
    const refreshPinTranslate = scrollY.interpolate({
        inputRange: [-500, 0, 500],
        outputRange: [-500, 0, 0],
        extrapolateRight: 'clamp',
        extrapolateLeft: 'identity',
    });

    return (
        <View style={[styles.safe, { backgroundColor: '#fff' }]}>
            <Animated.ScrollView
                style={{ flex: 1, backgroundColor: '#fff' }}
                contentContainerStyle={{ paddingBottom: 24 }}
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
                        useNativeDriver: false,
                        listener: (event) => {
                            const offsetY = event.nativeEvent.contentOffset.y;
                            if (offsetY > 180 && !isScrolled) {
                                setIsScrolled(true);
                            } else if (offsetY <= 180 && isScrolled) {
                                setIsScrolled(false);
                            }
                        }
                    }
                )}
            >
                <Animated.View style={{ transform: [{ translateY: refreshPinTranslate }] }}>
                    <SearchHeader
                        searchValue={searchQuery}
                        searchType="events"
                        onSearchChange={(text) => {
                            setSearchQuery(text);
                            filterService.debouncedSearch(
                                (filters) => fetchEvents(filters, true),
                                { ...currentFilters, keyword: text },
                                500,
                                'event-header-search'
                            );
                        }}
                        onCategorySelect={(cat) => {
                            handleCategorySelect([cat.category_id || cat.id], [cat]);
                        }}
                    />
                    <View style={{ marginBottom: 10 }}>
                        <Tabs
                            tabs={['Location', 'Date', 'Category']}
                            onTabPress={handleTabPress}
                            defaultActive={activeTab}
                        />
                    </View>
                </Animated.View>

                {/* First-paint loading state — skeletons matching the real
                    EventCard layout. Cache-hydrated mounts skip this branch. */}
                {isLoading ? (
                    renderSkeletons(EventCardSkeleton, 3)
                ) : (
                    <>
                {/* Filter status */}
                {(selectedLocation || selectedCategoryNames.length > 0 || selectedDateRange || searchQuery) && (
                    <View style={[styles.filterIndicator, { backgroundColor: '#f0f4ff', borderColor: theme.colors.primary + '33' }]}>
                        {(selectedLocation || selectedCategoryNames.length > 0 || selectedDateRange || searchQuery) && (
                            <View style={styles.activeFilters}>
                                {searchQuery && (
                                    <View style={[styles.filterChip, { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary + '30' }]}>
                                        <Text style={[styles.filterChipText, { color: theme.colors.primary }]}>Search: {searchQuery}</Text>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setSearchQuery('');
                                                const newFilters = { ...currentFilters };
                                                delete newFilters.keyword;
                                                fetchEvents(newFilters, true);
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
                                {selectedDateRange && (
                                    <View style={[styles.filterChip, { backgroundColor: '#22c55e15', borderColor: '#22c55e30' }]}>
                                        <Text style={[styles.filterChipText, { color: '#059669' }]}>
                                            {selectedDateRange.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {selectedDateRange.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setSelectedDateRange(null);
                                                // De-highlight the Date tab when its chip is cleared,
                                                // mirroring how clearing the Location/Category chips
                                                // resets their respective tabs.
                                                setActiveTab(null);
                                                const newFilters = { ...currentFilters };
                                                delete newFilters.dateFrom;
                                                delete newFilters.dateTo;
                                                fetchEvents(newFilters, true);
                                            }}
                                            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                            style={styles.filterChipClear}
                                        >
                                            <Icon name="close" size={14} color="#059669" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                                {selectedCategoryNames.length > 0 && (
                                    <View style={[styles.filterChip, { backgroundColor: '#e91e6315', borderColor: '#e91e6330' }]}>
                                        <Text style={[styles.filterChipText, { color: '#e91e63' }]}>
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
                                            <Icon name="close" size={14} color="#e91e63" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                )}

                {/* No events message */}
                {events.length === 0 ? (
                    <View style={styles.noEventsContainer}>
                        <Text style={styles.noEventsText}>
                            {networkError ? 'Unable to load events' :
                             ((searchQuery || selectedLocation || selectedCategoryNames.length > 0 || selectedDateRange) ? 'No events match your filters' : 'No events found')}
                        </Text>
                        <Text style={styles.noEventsSubtext}>
                            {networkError ? 'Check your internet connection' :
                             ((searchQuery || selectedLocation || selectedCategoryNames.length > 0 || selectedDateRange) ? 'Try adjusting your filters or clear them to see all events' : 'Pull down to refresh')}
                        </Text>
                        {networkError && (
                            <TouchableOpacity
                                style={[styles.retryButton, { backgroundColor: theme.colors.primary, marginTop: 16 }]}
                                onPress={() => fetchEvents({}, true)}
                                disabled={isFetchingEvents}
                            >
                                <Text style={styles.retryButtonText}>
                                    {isFetchingEvents ? 'Retrying...' : 'Retry'}
                                </Text>
                            </TouchableOpacity>
                        )}
                        {!networkError && (searchQuery || selectedLocation || selectedCategoryNames.length > 0 || selectedDateRange) && (
                            <TouchableOpacity
                                style={[styles.clearFiltersButton, { backgroundColor: theme.colors.primary, marginTop: 16 }]}
                                onPress={() => {
                                    setSelectedLocation(null);
                                    setSelectedCategory(null);
                                    setSelectedCategoryNames([]);
                                    setSelectedDateRange(null);
                                    setActiveTab(null); // Clear active tab
                                    setSearchQuery('');
                                    setCurrentFilters({});
                                    fetchEvents({}, true, true); // Pass true for clearAllFilters
                                }}
                            >
                                <Text style={styles.clearFiltersButtonText}>Clear All Filters</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    events.map((event, idx) => (
                      <React.Fragment key={`event-frag-${event._original?.event_ad_id || event.id}-${idx}`}>
                        <EventCard
                            key={`event-${event._original?.event_ad_id || event.id}-${idx}`}
                            event={event}
                            onGiveQuote={() => handleGiveQuote(event)}
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
            {isScrolled && (
                <Animated.View 
                    style={[
                        styles.stickyHeader,
                        {
                            opacity: scrollY.interpolate({
                                inputRange: [150, 200],
                                outputRange: [0, 1],
                                extrapolate: 'clamp',
                            }),
                            transform: [{
                                translateY: scrollY.interpolate({
                                    inputRange: [150, 200],
                                    outputRange: [-50, 0],
                                    extrapolate: 'clamp',
                                })
                            }]
                        }
                    ]}
                >
                    <View style={styles.stickyContent}>
                        <View style={[styles.stickySearchBar, { backgroundColor: theme.colors.primary + '10' }]}>
                            <Icon name="search-outline" size={20} color={theme.colors.primary} style={styles.stickySearchIcon} />
                            <TextInput
                                style={styles.stickyInput}
                                placeholder="Search by title, location, category..."
                                placeholderTextColor={theme.colors.primary + '80'}
                                value={searchQuery}
                                onChangeText={(text) => {
                                    setSearchQuery(text);
                                    // Debounced search
                                    filterService.debouncedSearch(
                                        (filters) => fetchEvents(filters, true),
                                        { ...currentFilters, keyword: text },
                                        500,
                                        'event-search'
                                    );
                                }}
                                returnKeyType="search"
                                onSubmitEditing={() => {
                                    const filters = { ...currentFilters, keyword: searchQuery };
                                    if (!searchQuery.trim()) {
                                        delete filters.keyword;
                                    }
                                    fetchEvents(filters, true);
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
            )}

            {/* Location picker — same component used by the Create Ad form,
                driven externally by the Location filter chip. */}
            <LocationSelector
                externallyControlled
                visible={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                onLocationChange={(payload) =>
                    handleLocationSelect(payload?.formattedLocation || null)
                }
            />

            {/* Date Range Picker Modal */}
            <DateRangePickerModal
                visible={showDateRangeModal}
                onClose={() => setShowDateRangeModal(false)}
                onDateRangeSelect={handleDateRangeSelect}
                currentDateRange={selectedDateRange}
            />

            {/* Category Selection Modal */}
            <CategorySelectionModalEnhanced
                visible={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                onCategorySelect={handleCategorySelect}
                currentCategory={selectedCategory}
                screenType="events"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    locationIndicator: {
        backgroundColor: '#fff',
        // backgroundColor: '#f0f4ff',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    locationIndicatorText: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    dateIndicator: {
        backgroundColor: '#f0fff4',
        marginHorizontal: 16,
        marginTop: 8,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#22c55e33',
    },
    dateIndicatorText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#059669',
        marginBottom: 2,
    },
    categoryIndicator: {
        backgroundColor: '#fff0f5',
        marginHorizontal: 16,
        marginTop: 8,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e91e6333',
    },
    categoryIndicatorText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#e91e63',
        marginBottom: 2,
    },
    eventCount: {
        fontSize: 12,
        color: '#666',
    },
    filterIndicator: {
        marginTop: 12,
        marginBottom: 4,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginHorizontal: 16,
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
    retryButton: {
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
    noEventsContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    noEventsText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    noEventsSubtext: {
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
    stickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingTop: 50,
        paddingBottom: 10,
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 100,
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
        height: 45,
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
        width: 45,
        height: 45,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
});
