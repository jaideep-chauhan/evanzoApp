import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    StyleSheet,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Animated,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Tabs from '../vendors/Tabs';
import EventCard from './EventCard';
import LocationSearchModal from '../vendors/LocationSearchModal';
import DateRangePickerModal from '../vendors/DateRangePickerModal';
import CategorySelectionModal from '../vendors/CategorySelectionModal';
import { useNavigation } from '@react-navigation/native';
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
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [activeTab, setActiveTab] = useState(2); // Category tab is default
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
    const fetchEvents = async (filters = {}, resetResults = false) => {
        if (isFetchingEvents) {
            console.log('Already fetching events, skipping...');
            return;
        }

        try {
            setIsFetchingEvents(true);
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
                    const formattedEvents = response.data.map(event => 
                        eventService.formatEventForDisplay(event)
                    );
                    response = {
                        success: true,
                        data: formattedEvents,
                        pagination: { page: 1, limit: 10, totalPages: 1, totalResults: formattedEvents.length }
                    };
                }
            } else {
                // For now, get all events and filter client-side since search endpoint doesn't exist
                const allEventsResponse = await eventService.getPublicEventAds();
                if (allEventsResponse.success && allEventsResponse.data) {
                    let filteredEvents = allEventsResponse.data;
                    
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
                        console.log('🔍 Events before filter:', filteredEvents.map(e => ({
                            title: e.title,
                            category: e.category
                        })));
                        
                        filteredEvents = filteredEvents.filter(event => {
                            const eventCategory = event.category?.toLowerCase() || event.event_type?.toLowerCase();
                            const matches = categories.some(cat => eventCategory === cat.toLowerCase());
                            if (!matches) {
                                console.log(`❌ Event "${event.title}" with category "${event.category}" doesn't match`);
                            }
                            return matches;
                        });
                        
                        console.log('🔍 Events after filter:', filteredEvents.length);
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
            
            if (response.success) {
                if (resetResults) {
                    setEvents(response.data || []);
                } else {
                    // For pagination, append results
                    setEvents(prev => [...prev, ...(response.data || [])]);
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
        // Initial fetch with a small delay to prevent race conditions
        const initialFetchTimeout = setTimeout(() => {
            fetchEvents();
        }, 100);
        
        return () => {
            clearTimeout(initialFetchTimeout);
        };
    }, []);

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
        setActiveTab(tabIndex);

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
        
        // Apply location filter
        const newFilters = { ...currentFilters, location };
        if (!location) {
            delete newFilters.location;
        }
        fetchEvents(newFilters, true);
    };

    const handleDateRangeSelect = (dateRange) => {
        setSelectedDateRange(dateRange);
        setShowDateRangeModal(false);
        
        // Apply date range filter
        const newFilters = { ...currentFilters };
        if (dateRange && dateRange.startDate && dateRange.endDate) {
            newFilters.dateFrom = dateRange.startDate.toISOString().split('T')[0];
            newFilters.dateTo = dateRange.endDate.toISOString().split('T')[0];
        } else {
            delete newFilters.dateFrom;
            delete newFilters.dateTo;
        }
        fetchEvents(newFilters, true);
    };

    const handleCategorySelect = (category) => {
        console.log('📱 Event category selected:', category);
        setSelectedCategory(category);
        setShowCategoryModal(false);
        
        // Apply category filter
        const newFilters = { ...currentFilters };
        if (category && category.length > 0) {
            newFilters.category = Array.isArray(category) ? category.join(',') : category;
        } else {
            delete newFilters.category;
        }
        
        console.log('🎯 Event filters to apply:', newFilters);
        fetchEvents(newFilters, true);
    };

    const handleGiveQuote = (event) => {
        // Navigate to quote submission screen or show modal
        console.log('Give quote for event:', event.title);
        // navigation.navigate('GiveQuote', { eventId: event.id });
    };

    // Removed duplicate loading effect - fetchEvents already handles loading state

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        
        try {
            // Reset filters and search
            setSelectedLocation(null);
            setSelectedCategory(null);
            setSelectedDateRange(null);
            setSearchQuery('');
            setCurrentFilters({});
            
            // Fetch fresh data with no filters
            await fetchEvents({}, true);
            
            console.log('Events refreshed successfully');
        } catch (error) {
            console.error('Error refreshing events:', error);
        } finally {
            setRefreshing(false);
        }
    }, []);

    return (
        <View style={[styles.safe, { backgroundColor: '#fff' }]}>
            <Animated.ScrollView
                style={{ flex: 1, backgroundColor: '#fff' }}
                contentContainerStyle={{ paddingBottom: 24 }}
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
                        useNativeDriver: false,
                        listener: (event) => {
                            const offsetY = event.nativeEvent.contentOffset.y;
                            // Show sticky header when scrolled past header
                            if (offsetY > 180 && !isScrolled) {
                                setIsScrolled(true);
                            } else if (offsetY <= 180 && isScrolled) {
                                setIsScrolled(false);
                            }
                        }
                    }
                )}
            >
                <SearchHeader 
                    searchValue={searchQuery}
                    onSearchChange={(text) => {
                        setSearchQuery(text);
                        // Debounced search
                        filterService.debouncedSearch(
                            (filters) => fetchEvents(filters, true),
                            { ...currentFilters, keyword: text },
                            500,
                            'event-header-search'
                        );
                    }}
                />
                <View style={{ marginBottom: 10 }}>
                    <Tabs
                        tabs={['Location', 'Date', 'Category']}
                        onTabPress={handleTabPress}
                        defaultActive={activeTab}
                    />
                </View>

                {/* Loading Spinner below tabs */}
                {isLoading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadingText, { color: theme.colors.primary }]}>Loading events...</Text>
                    </View>
                ) : (
                    <>
                {/* Filter status and event count */}
                {(events.length > 0 || searchQuery || selectedLocation || selectedCategory || selectedDateRange) && (
                    <View style={[styles.filterIndicator, { backgroundColor: '#f0f4ff', borderColor: theme.colors.primary + '33' }]}>
                        <Text style={[styles.filterIndicatorText, { color: theme.colors.primary }]}>
                            {events.length} event{events.length !== 1 ? 's' : ''} {(searchQuery || selectedLocation || selectedCategory || selectedDateRange) ? 'found' : 'available'}
                        </Text>
                        {(selectedLocation || selectedCategory || selectedDateRange || searchQuery) && (
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
                                {selectedDateRange && (
                                    <View style={[styles.filterChip, { backgroundColor: '#22c55e15', borderColor: '#22c55e30' }]}>
                                        <Text style={[styles.filterChipText, { color: '#059669' }]}>
                                            {selectedDateRange.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {selectedDateRange.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </Text>
                                    </View>
                                )}
                                {selectedCategory && (
                                    <View style={[styles.filterChip, { backgroundColor: '#e91e6315', borderColor: '#e91e6330' }]}>
                                        <Text style={[styles.filterChipText, { color: '#e91e63' }]}>
                                            {Array.isArray(selectedCategory) ? `${selectedCategory.length} categories` : selectedCategory}
                                        </Text>
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
                             ((searchQuery || selectedLocation || selectedCategory || selectedDateRange) ? 'No events match your filters' : 'No events found')}
                        </Text>
                        <Text style={styles.noEventsSubtext}>
                            {networkError ? 'Check your internet connection' : 
                             ((searchQuery || selectedLocation || selectedCategory || selectedDateRange) ? 'Try adjusting your filters or clear them to see all events' : 'Pull down to refresh')}
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
                        {!networkError && (searchQuery || selectedLocation || selectedCategory || selectedDateRange) && (
                            <TouchableOpacity 
                                style={[styles.clearFiltersButton, { backgroundColor: theme.colors.primary, marginTop: 16 }]}
                                onPress={() => {
                                    setSelectedLocation(null);
                                    setSelectedCategory(null);
                                    setSelectedDateRange(null);
                                    setSearchQuery('');
                                    setCurrentFilters({});
                                    fetchEvents({}, true);
                                }}
                            >
                                <Text style={styles.clearFiltersButtonText}>Clear All Filters</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    events.map((event, idx) => (
                        <View key={idx}>
                            <EventCard
                                key={event.id}
                                event={event}
                                onGiveQuote={() => handleGiveQuote(event)}
                            />
                        </View>
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
                            onPress={() => navigation.navigate('ChatList')}
                        >
                            <Icon name="chatbubble-ellipses-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}

            {/* Location Search Modal */}
            <LocationSearchModal
                visible={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                onLocationSelect={handleLocationSelect}
                currentLocation={selectedLocation}
                screenType="events"
            />

            {/* Date Range Picker Modal */}
            <DateRangePickerModal
                visible={showDateRangeModal}
                onClose={() => setShowDateRangeModal(false)}
                onDateRangeSelect={handleDateRangeSelect}
                currentDateRange={selectedDateRange}
            />

            {/* Category Selection Modal */}
            <CategorySelectionModal
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
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '500',
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
