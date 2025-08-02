import React, { useState, useMemo } from 'react';
import {
    StyleSheet,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
} from 'react-native';
import Tabs from '../vendors/Tabs';
import EventCard from './EventCard';
import LocationSearchModal from '../vendors/LocationSearchModal';
import DateRangePickerModal from '../vendors/DateRangePickerModal';
import CategorySelectionModal from '../vendors/CategorySelectionModal';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../ThemeContext';
import SearchHeader from '../vendors/SearchHeader';

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

    const events = [
        {
            id: 1,
            title: 'Corporate Event',
            location: 'Ontario, Canada',
            duration: '2 hours',
            date: 'October 30, 2023',
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

        return filtered;
    }, [selectedLocation, selectedCategory]);

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

    return (
        <View style={[styles.safe, { backgroundColor: '#fff' }]}>
            <ScrollView
                style={{ flex: 1, backgroundColor: '#fff' }}
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
            >
                <SearchHeader />
                <View style={{ marginBottom: 10 }}>
                    <Tabs
                        tabs={['Location', 'Date', 'Category']}
                        onTabPress={handleTabPress}
                        defaultActive={activeTab}
                    />
                </View>

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
            </ScrollView>

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
});
