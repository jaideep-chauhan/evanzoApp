import React, { useEffect, useState, useCallback } from 'react';
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
    const handleVendorPress = (vendor) => {
        // Convert saved vendor data to match expected format
        const vendorData = {
            _original: vendor,
            vendor_ad_id: vendor.vendor_ad_id || vendor.item_id || vendor.itemId || vendor.vendorId,
            id: vendor.vendor_ad_id || vendor.item_id || vendor.itemId || vendor.vendorId,
            name: vendor.name || vendor.vendor_name || vendor.title,
            type: vendor.type || vendor.category || vendor.vendor_type,
            location: vendor.location || vendor.address,
            rating: vendor.rating || 0,
            description: vendor.description,
            images: vendor.images || (vendor.image ? [vendor.image] : []),
            offers: vendor.offers || []
        };
        
        navigation.navigate('VendorChat', { vendor: vendorData });
    };

    // Render vendor item
    const renderVendorItem = ({ item }) => {
        const vendorId = item.vendor_ad_id || item.item_id || item.itemId || item.vendorId || item.id;
        const name = item.name || item.vendor_name || item.title || 'Unknown Vendor';
        const type = item.type || item.category || item.vendor_type || 'Service';
        const location = item.location || item.address || 'Location not specified';
        const rating = item.rating || 0;
        const image = item.image || item.images?.[0] || item.vendor_image;
        
        return (
            <TouchableOpacity 
                style={styles.vendorCard}
                onPress={() => handleVendorPress(item)}
                activeOpacity={0.9}
            >
                <Image 
                    source={image ? { uri: image } : require('../../assets/images/dummy.png')}
                    style={styles.vendorImage}
                />
                <View style={styles.vendorInfo}>
                    <Text style={styles.vendorName} numberOfLines={1}>{name}</Text>
                    <Text style={styles.vendorType} numberOfLines={1}>{type}</Text>
                    <Text style={styles.vendorLocation} numberOfLines={1}>
                        <Icon name="location-outline" size={12} color="#666" /> {location}
                    </Text>
                    <View style={styles.vendorFooter}>
                        <View style={styles.ratingContainer}>
                            <FontAwesome name="star" size={12} color="#FFB800" />
                            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
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
                onPress={() => navigation.navigate('Vendors')}
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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
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
    },
    backButton: {
        padding: 8,
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