import React, { useState, useMemo, useRef } from 'react';
import { Animated } from 'react-native';
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
import SearchHeader from './SearchHeader';
import Tabs from './Tabs';
import VendorCard from './VendorCard';
import LocationSearchModal from './LocationSearchModal';
import CategorySelectionModal from './CategorySelectionModal';
import PreSavedMessage from '../profile/PreSavedMessage';
import img from '../../assets/images/dummy.png';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../ThemeContext';
import CatererCard from './CatererCard';
import Icon from 'react-native-vector-icons/Ionicons';

export default function Vendor() {
    const navigation = useNavigation();
    const theme = useTheme();
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showPreSaveModal, setShowPreSaveModal] = useState(false);
    const [focusedCardIndex, setFocusedCardIndex] = useState(0);
    const scrollViewRef = useRef(null);
    const scrollY = useRef(new Animated.Value(0)).current;
    const [isScrolled, setIsScrolled] = useState(false);
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
        } else if (tabLabel === 'Pre Save') {
            setShowPreSaveModal(true);
        } else if (tabLabel === 'Category') {
            setShowCategoryModal(true);
        }
    };

    const handleLocationSelect = (location) => {
        setSelectedLocation(location);
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
    };

    return (
        <View style={[styles.safe]}>
            <Animated.ScrollView
                ref={scrollViewRef}
                style={{ flex: 1, backgroundColor: '#fff' }}
                contentContainerStyle={[styles.contentContainer, { backgroundColor: undefined }]}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    {
                        useNativeDriver: false,
                        listener: (event) => {
                            const offsetY = event.nativeEvent.contentOffset.y;
                            const cardHeight = 420;
                            const currentIndex = Math.floor(offsetY / cardHeight);
                            setFocusedCardIndex(Math.max(0, currentIndex));
                            
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
                <View style={styles.headerWrapper} >
                    <SearchHeader />
                    <Tabs
                        tabs={['Location', 'Pre Save', 'Category']}
                        onTabPress={handleTabPress}
                        defaultActive={activeTab}
                    />
                </View>

                {/* <CatererCard /> */}

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
                {/* Removed date range filter indicator since we're not using date filter anymore */}

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
                            isFocused={idx === focusedCardIndex}
                            onChatPress={() => navigation.navigate('ChatScreen', {
                                chatId: `vendor_${idx}`,
                                chatName: vendor.name,
                                avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
                                isOnline: Math.random() > 0.5,
                            })}
                        />
                    ))
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
                                placeholder="Search..."
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
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