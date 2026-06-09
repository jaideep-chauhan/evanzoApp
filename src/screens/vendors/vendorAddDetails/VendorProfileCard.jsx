import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ImageBackground,
    Alert,
    ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bg1 from '../../../assets/images/smallHeader.jpg';
import vendorDetailsService from '../../../services/vendorDetailsService';

import Icon from 'react-native-vector-icons/Ionicons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';

const { width } = Dimensions.get('window');
const AVATAR_SIZE = 100;
const INFO_CARD_WIDTH = width - 20;

// 👇 ActionIcons component with functionality
const ActionIcons = ({ vendor, navigation }) => {
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true); // Separate loading state for initial check
    const [rating, setRating] = useState(Number(vendor?.rating) || 0);
    const [reviewCount, setReviewCount] = useState(vendor?.reviews_count || 0);

    useEffect(() => {
        // Don't reset saved state immediately, let checkSavedStatus determine it
        setIsLoading(false);
        
        // Check if vendor is saved from backend/storage
        checkSavedStatus();
        // Fetch reviews
        fetchReviews();
    }, [vendor]); // Re-run when vendor prop changes

    const checkSavedStatus = async () => {
        const vendorId = vendor?._original?.vendor_ad_id || 
                        vendor?.vendor_ad_id || 
                        vendor?.id ||
                        vendor?._id;
        
        if (vendorId) {
            try {
                setIsCheckingStatus(true);
                
                const authToken = await AsyncStorage.getItem('authToken');
                if (!authToken) {
                    setIsSaved(false);
                    return;
                }
                
                const savedStatus = await vendorDetailsService.isVendorSaved(vendorId);
                setIsSaved(savedStatus);
                
            } catch (error) {
                setIsSaved(false);
            } finally {
                setIsCheckingStatus(false);
            }
        } else {
            setIsSaved(false);
            setIsCheckingStatus(false);
        }
    };

    const fetchReviews = async () => {
        const vendorId = vendor?._original?.vendor_ad_id || 
                        vendor?.vendor_ad_id || 
                        vendor?.id ||
                        vendor?._id;
                        
        if (vendorId) {
            const response = await vendorDetailsService.getVendorReviews(vendorId);
            if (response.success && response.data) {
                setReviewCount(response.data.totalReviews || 0);
                setRating(Number(response.data.averageRating || vendor?.rating) || 0);
            }
        }
    };

    const handleSave = async () => {
        if (isLoading) return;
        
        // Get vendor ID
        const vendorId = vendor?._original?.vendor_ad_id || 
                        vendor?.vendor_ad_id || 
                        vendor?.id ||
                        vendor?._id;
        
        if (!vendorId) {
            Alert.alert('Error', 'Cannot save vendor: ID not found');
            return;
        }
        
        // Optimistically update UI immediately for better UX
        const newSavedState = !isSaved;
        setIsSaved(newSavedState);
        setIsLoading(true);
        
        // Prepare vendor data to save
        const vendorData = {
            name: vendor?.name || vendor?.company_name || vendor?.title,
            type: vendor?.type || vendor?.category,
            location: vendor?.location,
            rating: Number(rating || vendor?.rating) || 0,
            reviewCount: reviewCount || 0,
            image: vendor?.images?.[0] || vendor?.image || vendor?.logo,
            description: vendor?.description,
            price: vendor?.price,
            offers: vendor?.offers,
            vendor_ad_id: vendorId
        };
        
        try {
            const response = await vendorDetailsService.toggleSaveVendor(vendorId, vendorData);
            
            if (response.success) {
                const finalSavedState = response.saved !== undefined ? response.saved : newSavedState;
                setIsSaved(finalSavedState);
            } else {
                setIsSaved(!newSavedState);
                Alert.alert('Error', response.message || 'Failed to save vendor');
            }
        } catch (error) {
            setIsSaved(!newSavedState);
            Alert.alert('Error', 'Failed to save vendor. Please try again.');
        }
        
        setIsLoading(false);
    };

    const handleShare = async () => {
        const response = await vendorDetailsService.shareVendor(vendor);
        if (!response.success && response.message !== 'Share cancelled') {
            console.error('Share error:', response.message);
        }
    };

    const handleRatingPress = () => {
        // Navigate to reviews screen or show rating modal
        if (navigation) {
            const vendorId = vendor?._original?.vendor_ad_id || 
                            vendor?.vendor_ad_id || 
                            vendor?.id ||
                            vendor?._id;
            navigation.navigate('AllReviews', {
                vendorId: vendorId,
                vendorName: vendor?.name || vendor?.company_name || vendor?.title,
                // Pass the whole vendor object too so the AllReviews header
                // can render real data (name, location, rating, category,
                // photos, offers, description) instead of the placeholder.
                vendor: vendor,
            });
        }
    };

    const handleReviewsPress = () => {
        // Navigate to reviews screen
        if (navigation) {
            const vendorId = vendor?._original?.vendor_ad_id || 
                            vendor?.vendor_ad_id || 
                            vendor?.id ||
                            vendor?._id;
            navigation.navigate('AllReviews', {
                vendorId: vendorId,
                vendorName: vendor?.name || vendor?.company_name || vendor?.title,
                // Pass the whole vendor object too so the AllReviews header
                // can render real data (name, location, rating, category,
                // photos, offers, description) instead of the placeholder.
                vendor: vendor,
            });
        }
    };

    return (
        <View style={actionIconStyles.container}>
            {/* Rating */}
            <TouchableOpacity style={actionIconStyles.item} onPress={handleRatingPress}>
                <View style={actionIconStyles.iconCircle}>
                    <FontAwesome name="star" size={12} color="#2c2c3d" />
                    <Text style={actionIconStyles.iconText}>{Number(rating || 0).toFixed(1)}</Text>
                </View>
                <Text style={actionIconStyles.label}>Rating</Text>
            </TouchableOpacity>

            {/* Reviews */}
            <TouchableOpacity style={actionIconStyles.item} onPress={handleReviewsPress}>
                <View style={actionIconStyles.iconCircle}>
                    <Text style={actionIconStyles.reviewText}>{reviewCount}</Text>
                </View>
                <Text style={actionIconStyles.label}>Reviews</Text>
            </TouchableOpacity>

            {/* Save */}
            <TouchableOpacity style={actionIconStyles.item} onPress={handleSave} disabled={isLoading || isCheckingStatus}>
                <View style={[actionIconStyles.iconCircle, isSaved && actionIconStyles.savedCircle]}>
                    {(isLoading || isCheckingStatus) ? (
                        <ActivityIndicator size="small" color={isSaved ? "#ff4444" : "#2c2c3d"} />
                    ) : (
                        <Ionicons 
                            name={isSaved ? "heart" : "heart-outline"} 
                            size={22} 
                            color={isSaved ? "#ff4444" : "#2c2c3d"}
                        />
                    )}
                </View>
                <Text style={[actionIconStyles.label, isSaved && actionIconStyles.savedLabel]}>
                    {isSaved ? 'Saved' : 'Save'}
                </Text>
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity style={actionIconStyles.item} onPress={handleShare}>
                <View style={actionIconStyles.iconCircle}>
                    <Entypo name="share" size={20} color="#2c2c3d" />
                </View>
                <Text style={actionIconStyles.label}>Share</Text>
            </TouchableOpacity>
        </View>
    );
};

// 👇 Main component
export default function VendorProfileCard({
    logo,
    name,
    category,
    location,
    onBackPress,
    onBellPress,
    navigation,
    vendor, // Pass the full vendor object
}) {
    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* Header Background */}
            <ImageBackground source={bg1} style={styles.headerBackground} resizeMode="cover">
                <View style={styles.headerIconsRow}>
                    <TouchableOpacity style={styles.circleBtn} onPress={onBackPress}>
                        <Icon name="arrow-back-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.circleBtn} onPress={onBellPress}>
                        <Icon name="notifications-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </ImageBackground>

            {/* White Info Card */}
            <View style={[styles.infoCardWrapper, { flex: 1 }]}>
                <View style={[styles.infoCard, { flexGrow: 1 }]}>
                    <TouchableOpacity 
                        style={styles.seeAllBtn} 
                        onPress={() => {
                            const vendorId = vendor?._original?.vendor_ad_id || 
                                            vendor?.vendor_ad_id || 
                                            vendor?.id ||
                                            vendor?._id;
                            navigation?.navigate('AllReviews', {
                                vendorId: vendorId,
                                vendorName: name,
                                vendor: vendor,
                            });
                        }} 
                        activeOpacity={0.7}
                    >
                        <Text style={styles.seeAllText}>See All</Text>
                    </TouchableOpacity>
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={typeof logo === 'string' ? { uri: logo } : logo}
                            style={styles.avatar}
                        />
                    </View>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.category}>{category}</Text>
                    <Text style={styles.location}>{location}</Text>
                    <ActionIcons vendor={vendor} navigation={navigation} />
                </View>
            </View>
        </View>
    );
}

// 👇 Styles
const styles = StyleSheet.create({
    headerBackground: {
        height: 250,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        paddingTop: 50,
        justifyContent: 'flex-start',
        position: 'relative',
        zIndex: 1,
        paddingHorizontal: 16,
        overflow: 'hidden',
    },
    headerIconsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        zIndex: 2,
    },
    circleBtn: {
        padding: 10,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.44)',
    },
    infoCardWrapper: {
        position: 'absolute',
        top: 150,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 2,
        flex: 1,
    },
    infoCard: {
        backgroundColor: '#FCFAFA',
        alignItems: 'center',
        paddingTop: AVATAR_SIZE / 2,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 4,
        width: INFO_CARD_WIDTH,
        minHeight: 10,
        boxShadow: '1px 1px 4px 0px #00000029',

    },
    avatarWrapper: {
        position: 'absolute',
        top: -(AVATAR_SIZE / 2),
        left: '50%',
        marginLeft: -(AVATAR_SIZE / 2),
        zIndex: 3,
    },
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        borderWidth: 4,
        borderColor: '#FCFAFA',
        backgroundColor: '#eee',
    },
    name: {
        fontSize: 22,
        fontWeight: '600',
        color: '#1D1B20',
        marginTop: 4,
    },
    category: {
        fontSize: 14,
        color: '#49454F',
        marginTop: 4,
    },
    location: {
        fontSize: 15,
        color: '#1D1B20',
        marginTop: 4,
        fontWeight: '400',
    },
    seeAllBtn: {
        position: 'absolute',
        top: 16,
        right: 18,
        zIndex: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    seeAllText: {
        color: '#003A9B',
        fontWeight: '600',
        fontSize: 12,
        letterSpacing: 0.2,
    },
});

const actionIconStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 10,
        paddingHorizontal: 12,
        paddingBottom: 20,
    },
    item: {
        alignItems: 'center',
        flex: 1,
    },
    iconCircle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E7F0FF',
        borderRadius: 40,
        width: 50,
        height: 50,
    },
    iconText: {
        fontSize: 16,
        color: '#334462',
        marginLeft: 4,
        fontWeight: '600',
    },
    reviewText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2c2c3d',
    },
    label: {
        marginTop: 8,
        fontSize: 14,
        color: '#49454F',
        fontWeight: '500',
    },
    savedCircle: {
        backgroundColor: '#ffe0e0', // Light red background when saved
    },
    savedLabel: {
        color: '#ff4444', // Red text when saved
        fontWeight: '600',
    },
});
