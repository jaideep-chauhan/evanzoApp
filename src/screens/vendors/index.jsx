import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Animated, RefreshControl, ActivityIndicator } from 'react-native';
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
import img from '../../assets/images/dummy.png'; // Fallback image
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../ThemeContext';
import CatererCard from './CatererCard';
import Icon from 'react-native-vector-icons/Ionicons';
import vendorService from '../../services/vendorService';

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
    const [activeTab, setActiveTab] = useState(null); // No tab active by default
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [vendors, setVendors] = useState([]);

    // Fetch vendors from API
    const fetchVendors = async () => {
        try {
            setIsLoading(true);
            console.log('Fetching all vendor ads...');
            const response = await vendorService.getAllVendorAds();
            console.log('Vendor ads response:', response);
            
            if (response.success && response.data && response.data.length > 0) {
                // Format vendors using the same method as profile
                const formattedVendors = response.data.map(vendor => {
                    const formatted = vendorService.formatVendorForDisplay(vendor);
                    return formatted;
                });
                console.log('Formatted vendors:', formattedVendors);
                setVendors(formattedVendors);
            } else {
                console.log('No vendor ads found or empty response');
                setVendors([]);
            }
        } catch (error) {
            console.error('Error fetching vendors:', error);
            setVendors([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch vendors on component mount
    useEffect(() => {
        fetchVendors();
    }, []);


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

    // Removed duplicate loading effect - fetchVendors already handles loading state

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        
        try {
            // Reset filters
            setSelectedLocation(null);
            setSelectedCategory(null);
            setActiveTab(null);
            
            // Fetch fresh data
            await fetchVendors();
            
            console.log('Vendors refreshed successfully');
        } catch (error) {
            console.error('Error refreshing vendors:', error);
        } finally {
            setRefreshing(false);
        }
    }, []);

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
                    <SearchHeader />
                    <Tabs
                        tabs={['Location', 'Quick Message', 'Category']}
                        onTabPress={handleTabPress}
                        defaultActive={activeTab}
                    />
                </View>

                {/* <CatererCard /> */}

                {/* Loading Spinner below tabs */}
                {isLoading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadingText, { color: theme.colors.primary }]}>Loading vendors...</Text>
                    </View>
                ) : (
                    <>
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