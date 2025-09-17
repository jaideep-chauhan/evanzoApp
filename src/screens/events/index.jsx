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

    // Fetch events from API
    const fetchEvents = async () => {
        try {
            setIsLoading(true);
            console.log('🚀 Fetching public event ads (excluding current user)...');
            const response = await eventService.getPublicEventAds();
            console.log('📦 Public events response:', {
                success: response.success,
                dataType: typeof response.data,
                isArray: Array.isArray(response.data),
                dataLength: response.data?.length,
                data: response.data
            });
            
            if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
                // Format events using the same method as profile
                const formattedEvents = response.data.map(event => {
                    const formatted = eventService.formatEventForDisplay(event);
                    return formatted;
                });
                console.log('Formatted events:', formattedEvents);
                setEvents(formattedEvents);
            } else {
                console.log('No event ads found or empty response');
                setEvents([]);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            setEvents([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch events on component mount
    useEffect(() => {
        fetchEvents();
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

    // Filter events based on selected location and category
    const filteredEvents = useMemo(() => {
        let filtered = events;

        // Filter by location
        if (selectedLocation && selectedLocation !== 'Current Location') {
            filtered = filtered.filter(event => event.location === selectedLocation);
        }

        // Filter by category
        if (selectedCategory) {
            filtered = filtered.filter(event =>
                event.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
                selectedCategory.toLowerCase().includes(event.category.toLowerCase())
            );
        }

        console.log('🔍 Filtering events:', {
            totalEvents: events.length,
            filteredCount: filtered.length,
            selectedLocation,
            selectedCategory
        });
        
        return filtered;
    }, [events, selectedLocation, selectedCategory]);

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
    };

    const handleDateRangeSelect = (dateRange) => {
        setSelectedDateRange(dateRange);
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
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
            // Reset filters
            setSelectedLocation(null);
            setSelectedCategory(null);
            setSelectedDateRange(null);
            
            // Fetch fresh data
            await fetchEvents();
            
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
                <SearchHeader />
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
                {/* Location Filter Indicator */}
                {selectedLocation && (
                    <View style={[styles.locationIndicator, { borderColor: theme.colors.primary + '33' }]}>
                        <Text style={[styles.locationIndicatorText, { color: theme.colors.primary }]}>
                            Showing events in: {selectedLocation}
                        </Text>
                        <Text style={styles.eventCount}>
                            ({filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found)
                        </Text>
                    </View>
                )}

                {/* Date Range Filter Indicator */}
                {selectedDateRange && (
                    <View style={styles.dateIndicator}>
                        <Text style={styles.dateIndicatorText}>
                            Date Range: {selectedDateRange.startDate.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })} - {selectedDateRange.endDate.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </Text>
                        <Text style={styles.eventCount}>
                            Filter applied for availability
                        </Text>
                    </View>
                )}

                {/* Category Filter Indicator */}
                {selectedCategory && (
                    <View style={styles.categoryIndicator}>
                        <Text style={styles.categoryIndicatorText}>
                            Category: {selectedCategory}
                        </Text>
                        <Text style={styles.eventCount}>
                            ({filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found)
                        </Text>
                    </View>
                )}

                {/* No events message */}
                {filteredEvents.length === 0 ? (
                    <View style={styles.noEventsContainer}>
                        <Text style={styles.noEventsText}>
                            No events found in {selectedLocation}
                        </Text>
                        <Text style={styles.noEventsSubtext}>
                            Try selecting a different location or clear the filter
                        </Text>
                    </View>
                ) : (
                    filteredEvents.map((event, idx) => (
                        <View key={idx}   >
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
                                placeholder="Search events..."
                                placeholderTextColor={theme.colors.primary + '80'}
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
