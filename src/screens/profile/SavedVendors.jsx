import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import vendorDetailsService from '../../services/vendorDetailsService';
import savedVendorsStorage from '../../services/savedVendorsStorage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const SavedVendors = () => {
    const navigation = useNavigation();
    const [savedVendors, setSavedVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Load saved vendors
    const loadSavedVendors = async () => {
        try {
            setLoading(true);
            
            // Try to get from backend first
            const response = await vendorDetailsService.getSavedVendors(1, 100);
            
            if (response.success && response.data) {
                const vendors = response.data.items || response.data;
                setSavedVendors(vendors);
                
                // Sync with local storage
                await savedVendorsStorage.syncWithBackend(vendors);
            } else {
                // Fallback to local storage
                const localVendors = await savedVendorsStorage.getSavedVendorsWithData();
                setSavedVendors(localVendors);
            }
        } catch (error) {
            console.error('Error loading saved vendors:', error);
            // Fallback to local storage
            const localVendors = await savedVendorsStorage.getSavedVendorsWithData();
            setSavedVendors(localVendors);
        } finally {
            setLoading(false);
        }
    };

    // Use focus effect to reload when screen is focused
    useFocusEffect(
        useCallback(() => {
            loadSavedVendors();
        }, [])
    );

    // Handle refresh
    const onRefresh = async () => {
        setRefreshing(true);
        await loadSavedVendors();
        setRefreshing(false);
    };

    // Handle unsave
    const handleUnsave = async (vendorId) => {
        Alert.alert(
            'Remove from Saved',
            'Are you sure you want to remove this vendor from your saved list?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await vendorDetailsService.toggleSaveVendor(vendorId);
                            if (response.success) {
                                // Remove from local state
                                setSavedVendors(prev => prev.filter(v => {
                                    const vId = v.vendor_ad_id || v.item_id || v.itemId || v.vendorId || v.id;
                                    return parseInt(vId, 10) !== parseInt(vendorId, 10);
                                }));
                            }
                        } catch (error) {
                            console.error('Error unsaving vendor:', error);
                            Alert.alert('Error', 'Failed to remove vendor from saved list');
                        }
                    }
                }
            ]
        );
    };

    // Navigate to vendor details
    const handleVendorPress = (row) => {
        // Same unwrap as the renderer: backend wraps the vendor under .item.
        const vendor = row?.item || row || {};

        // photos is a JSON-stringified array of {url} objects on the DB.
        // The detail screen reads `vendor.images` (array of URL strings) and
        // shows lorem-ipsum / dummy.png fallbacks if it's missing — so parse
        // photos into the shape the detail screen expects.
        let images = [];
        if (vendor.photos) {
            try {
                const parsed =
                    typeof vendor.photos === 'string'
                        ? JSON.parse(vendor.photos)
                        : vendor.photos;
                if (Array.isArray(parsed)) {
                    images = parsed
                        .map((p) => p?.url || (typeof p === 'string' ? p : null))
                        .filter(Boolean)
                        .map((u) => (u.startsWith('http') ? u : `https://api.evnzo.com${u}`));
                }
            } catch (_) {}
        }
        if (images.length === 0 && Array.isArray(vendor.images)) {
            images = vendor.images;
        }
        if (images.length === 0 && vendor.image) {
            images = [vendor.image];
        }

        let offers = [];
        if (vendor.offers) {
            try {
                offers =
                    typeof vendor.offers === 'string'
                        ? JSON.parse(vendor.offers)
                        : vendor.offers;
            } catch (_) {
                offers = [];
            }
        }

        const vendorData = {
            _original: vendor,
            vendor_ad_id: vendor.vendor_ad_id || vendor.item_id || vendor.itemId || vendor.vendorId,
            id: vendor.vendor_ad_id || vendor.item_id || vendor.itemId || vendor.vendorId,
            user_id: vendor.user_id,
            name: vendor.company_name || vendor.title || vendor.name || vendor.vendor_name,
            type: vendor.category?.name || vendor.type || vendor.vendor_type,
            location: vendor.location || vendor.city || vendor.address,
            rating: Number(vendor.rating) || 0,
            description: vendor.description,
            images,
            photos: vendor.photos,
            offers: Array.isArray(offers) ? offers : [],
        };

        console.log('📍 Navigating to vendor details:', vendorData.name, 'images:', images.length);
        // VendorAddDetail is registered at the root MainNavigator level
        // (not nested in the Vendors tab stack — that was a misread earlier).
        // A flat navigate from any screen in the root stack reaches it.
        navigation.navigate('VendorAddDetail', { vendor: vendorData });
    };

    // Navigate to Vendors tab
    const navigateToVendors = () => {
        console.log('📍 Navigating to Vendors tab');
        // Navigate to the main tab navigator and switch to Vendors tab
        navigation.navigate('Main', { screen: 'Vendors' });
    };

    // Render vendor item.
    // Two shapes can land here:
    //   1) Backend response — { save_id, item_type, saved_at, item: { vendor_ad_id, company_name, photos, ... } }
    //   2) Local-storage fallback — already-flattened vendor object
    // Always unwrap before reading fields so both paths render real data.
    const renderVendorItem = ({ item: row }) => {
        const v = row?.item || row || {};
        const vendorId =
            v.vendor_ad_id || v.item_id || v.itemId || v.vendorId || v.id ||
            row?.item_id || row?.id;
        const name = String(v.company_name || v.title || v.name || v.vendor_name || 'Unknown Vendor');
        const type = String(v.category?.name || v.type || v.vendor_type || 'Service');
        // Prefer the new structured city; fall back to the first segment of
        // the legacy location string so cards show just "Chandigarh" instead
        // of "Chandigarh, Chandigarh, India".
        const location = String(
            v.city || (v.location ? String(v.location).split(',')[0].trim() : '') || 'Location not specified',
        );
        const ratingNum = Number(v.rating);
        const ratingDisplay = (Number.isFinite(ratingNum) ? ratingNum : 0).toFixed(1);

        // photos is a JSON-stringified array of file objects on the DB. Parse
        // and pick the first url; prepend the api host when relative.
        let image = null;
        if (v.photos) {
            try {
                const parsed = typeof v.photos === 'string' ? JSON.parse(v.photos) : v.photos;
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const first = parsed[0];
                    const raw = first?.url || (typeof first === 'string' ? first : null);
                    if (raw) {
                        image = raw.startsWith('http') ? raw : `https://api.evnzo.com${raw}`;
                    }
                }
            } catch (_) {}
        }
        if (!image) {
            image = v.image || v.images?.[0] || v.vendor_image || null;
        }

        return (
            <TouchableOpacity
                style={styles.vendorCard}
                onPress={() => handleVendorPress(row)}
                activeOpacity={0.9}
            >
                <Image
                    source={image ? { uri: image } : require('../../assets/images/dummy.png')}
                    style={styles.vendorImage}
                />
                <View style={styles.vendorInfo}>
                    <Text style={styles.vendorName} numberOfLines={1}>{name}</Text>
                    <Text style={styles.vendorType} numberOfLines={1}>{type}</Text>
                    {/* Icon inside Text with numberOfLines is fragile on RN — split into a row */}
                    <View style={styles.vendorLocationRow}>
                        <Icon name="location-outline" size={12} color="#666" />
                        <Text style={styles.vendorLocation} numberOfLines={1}>
                            {' '}{location}
                        </Text>
                    </View>
                    <View style={styles.vendorFooter}>
                        <View style={styles.ratingContainer}>
                            <FontAwesome name="star" size={12} color="#FFB800" />
                            <Text style={styles.ratingText}>{ratingDisplay}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.unsaveButton}
                            onPress={() => handleUnsave(vendorId)}
                        >
                            <Icon name="heart" size={20} color="#ff4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // Empty state
    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Icon name="heart-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No Saved Vendors Yet</Text>
            <Text style={styles.emptySubtitle}>
                Start exploring and save vendors you're interested in
            </Text>
            <TouchableOpacity
                style={styles.exploreButton}
                onPress={navigateToVendors}
            >
                <Text style={styles.exploreButtonText}>Explore Vendors</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading && savedVendors.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2C3D5B" />
            </View>
        );
    }

    // Handle back button
    const handleBackPress = () => {
        console.log('🔙 Back button pressed in SavedVendors');
        console.log('🔙 Navigation state:', navigation.getState());

        try {
            // Try multiple navigation methods
            if (navigation.canGoBack()) {
                console.log('✅ Can go back, using goBack()');
                navigation.goBack();
            } else {
                console.log('⚠️ Cannot go back, trying to navigate to Profile');
                // Try to navigate back to Main/Profile
                navigation.reset({
                    index: 0,
                    routes: [
                        {
                            name: 'Main',
                            state: {
                                routes: [{ name: 'Profile' }],
                                index: 0,
                            },
                        },
                    ],
                });
            }
        } catch (error) {
            console.error('❌ Navigation error:', error);
            // Fallback: just navigate to Main
            navigation.navigate('Main');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBackPress}
                    activeOpacity={0.6}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPressIn={() => console.log('🔘 Back button PRESS IN')}
                    onPressOut={() => console.log('🔘 Back button PRESS OUT')}
                >
                    <Icon name="arrow-back" size={24} color="#2C3D5B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Saved Vendors</Text>
                <View style={styles.headerRight}>
                    <Text style={styles.countText}>{savedVendors.length} saved</Text>
                </View>
            </View>

            <FlatList
                data={savedVendors}
                renderItem={renderVendorItem}
                keyExtractor={(item) => {
                    const id = item.vendor_ad_id || item.item_id || item.itemId || item.vendorId || item.id;
                    return String(id);
                }}
                contentContainerStyle={[
                    styles.listContainer,
                    savedVendors.length === 0 && styles.emptyListContainer
                ]}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#2C3D5B']}
                        tintColor="#2C3D5B"
                    />
                }
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        zIndex: 1000,
        elevation: 5,
    },
    backButton: {
        padding: 8,
        zIndex: 1001,
        elevation: 6,
        backgroundColor: 'transparent',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2C3D5B',
        flex: 1,
        textAlign: 'center',
        marginLeft: -32, // Compensate for back button
    },
    headerRight: {
        minWidth: 32,
    },
    countText: {
        fontSize: 14,
        color: '#666',
    },
    listContainer: {
        padding: 16,
    },
    emptyListContainer: {
        flex: 1,
    },
    vendorCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        flexDirection: 'row',
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    vendorImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    vendorInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    vendorName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3D5B',
        marginBottom: 4,
    },
    vendorType: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    vendorLocation: {
        fontSize: 12,
        color: '#999',
    },
    vendorLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    vendorFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    unsaveButton: {
        padding: 8,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginTop: 20,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    exploreButton: {
        backgroundColor: '#2C3D5B',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 25,
    },
    exploreButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default SavedVendors;