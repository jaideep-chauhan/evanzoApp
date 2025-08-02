import React, { useState, useMemo } from 'react';
import {
    StyleSheet,
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
} from 'react-native';
import SearchHeader from './SearchHeader';
import Tabs from './Tabs';
import VendorCard from './VendorCard';
import LocationSearchModal from './LocationSearchModal';
import DateRangePickerModal from './DateRangePickerModal';
import CategorySelectionModal from './CategorySelectionModal';
import img from '../../assets/images/dummy.png';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../ThemeContext';
import CatererCard from './CatererCard';

export default function Vendor() {
    const navigation = useNavigation();
    const theme = useTheme();
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [selectedDateRange, setSelectedDateRange] = useState(null);
    const [showDateRangeModal, setShowDateRangeModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [activeTab, setActiveTab] = useState(null); // No tab active by default

    const vendors = [
        {
            initials: '4S',
            name: '4x90 Studio',
            type: 'Photography',
            rating: 5,
            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do',
            images: [img, img, img],
            extraCount: 10,
            location: 'Toronto, ON',
        },
        {
            initials: 'AB',
            name: 'Alpha Bakers',
            type: 'Bakery',
            rating: 4.5,
            description: 'Freshly baked goods for every occasion.',
            images: [img, img, img],
            extraCount: 5,
            location: 'Vancouver, BC',
        },
        {
            initials: 'DJ',
            name: 'DJ Max',
            type: 'Music',
            rating: 4.8,
            description: 'Professional DJ services for weddings and parties.',
            images: [img, img, img],
            extraCount: 7,
            location: 'Toronto, ON',
        },
        {
            initials: 'FL',
            name: 'Floral Lane',
            type: 'Florist',
            rating: 4.7,
            description: 'Beautiful flower arrangements and bouquets.',
            images: [img, img, img],
            extraCount: 3,
            location: 'Montreal, QC',
        },
        {
            initials: 'CT',
            name: 'Catering Time',
            type: 'Catering',
            rating: 4.9,
            description: 'Delicious food and excellent service for your events.',
            images: [img, img, img],
            extraCount: 8,
            location: 'Calgary, AB',
        },
        {
            initials: 'EV',
            name: 'Eventify',
            type: 'Event Planner',
            rating: 5,
            description: 'Making your events memorable and stress-free.',
            images: [img, img, img],
            extraCount: 12,
            location: 'Toronto, ON',
        },
        {
            initials: 'PH',
            name: 'PhotoHub',
            type: 'Photography',
            rating: 4.6,
            description: 'Capturing moments that last a lifetime.',
            images: [img, img, img],
            extraCount: 6,
            location: 'Vancouver, BC',
        },
        {
            initials: 'DS',
            name: 'Decor Studio',
            type: 'Decor',
            rating: 4.4,
            description: 'Creative decor solutions for all occasions.',
            images: [img, img, img],
            extraCount: 4,
            location: 'Ottawa, ON',
        },
    ];

    // Filter vendors based on selected location and category
    const filteredVendors = useMemo(() => {
        let filtered = vendors;

        // Filter by location
        if (selectedLocation && selectedLocation !== 'Current Location') {
            filtered = filtered.filter(vendor => vendor.location === selectedLocation);
        }

        // Filter by category
        if (selectedCategory) {
            filtered = filtered.filter(vendor =>
                vendor.type.toLowerCase().includes(selectedCategory.toLowerCase()) ||
                selectedCategory.toLowerCase().includes(vendor.type.toLowerCase())
            );
        }

        return filtered;
    }, [selectedLocation, selectedCategory]);

    const handleTabPress = (tabLabel, tabIndex) => {
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

    return (
        <View style={[styles.safe]}>
            <ScrollView
                style={{ flex: 1, backgroundColor: '#fff' }}
                contentContainerStyle={[styles.contentContainer, { backgroundColor: undefined }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.headerWrapper} >
                    <SearchHeader />
                    <Tabs
                        tabs={['Location', 'Date', 'Category']}
                        onTabPress={handleTabPress}
                        defaultActive={activeTab}
                    />
                </View>

                <CatererCard />

                {/* Location Filter Indicator */}
                {selectedLocation && (
                    <View style={[styles.filterIndicator, { backgroundColor: '#f0f4ff', borderColor: theme.colors.primary + '33' }]}>
                        <Text style={[styles.filterIndicatorText, { color: theme.colors.primary }]}>
                            Showing vendors in: {selectedLocation}
                        </Text>
                        <Text style={styles.vendorCount}>
                            ({filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''} found)
                        </Text>
                    </View>
                )}

                {/* Date Range Filter Indicator */}
                {selectedDateRange && (
                    <View style={[styles.filterIndicator, { backgroundColor: '#f0fff4', borderColor: theme.colors.success + '33' }]}>
                        <Text style={[styles.filterIndicatorText, { color: theme.colors.success }]}>
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
                        <Text style={styles.vendorCount}>
                            Filter applied for availability
                        </Text>
                    </View>
                )}

                {/* Category Filter Indicator */}
                {selectedCategory && (
                    <View style={[styles.filterIndicator, { backgroundColor: '#fff0f5', borderColor: theme.colors.error + '33' }]}>
                        <Text style={[styles.filterIndicatorText, { color: theme.colors.error }]}>
                            Category: {selectedCategory}
                        </Text>
                        <Text style={styles.vendorCount}>
                            ({filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''} found)
                        </Text>
                    </View>
                )}

                {/* No vendors message */}
                {filteredVendors.length === 0 ? (
                    <View style={styles.noVendorsContainer}>
                        <Text style={styles.noVendorsText}>
                            No vendors found{selectedLocation ? ` in ${selectedLocation}` : ''}
                        </Text>
                        <Text style={styles.noVendorsSubtext}>
                            Try selecting a different location or clear the filter
                        </Text>
                    </View>
                ) : (
                    filteredVendors.map((vendor, idx) => (
                        <VendorCard
                            key={idx}
                            initials={vendor.initials}
                            name={vendor.name}
                            type={vendor.type}
                            rating={vendor.rating}
                            description={vendor.description}
                            images={vendor.images}
                            extraCount={vendor.extraCount}
                            location={vendor.location}
                            onChatPress={() => navigation.navigate('ChatScreen', {
                                chatId: `vendor_${idx}`,
                                chatName: vendor.name,
                                avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
                                isOnline: Math.random() > 0.5,
                            })}
                        />
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
        paddingBottom: 24,
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
});