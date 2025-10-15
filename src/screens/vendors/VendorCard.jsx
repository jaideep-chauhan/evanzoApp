import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Animated,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { StarIcon, CurrencyDollarIcon, TagIcon } from 'react-native-heroicons/solid';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../ThemeContext';
import theme from '../../theme';
import img from '../../assets/images/dummy.png'; // Fallback image

const { width } = Dimensions.get('window');

export default function VendorCard({
    initials,
    name,
    type,
    rating,
    description,
    images,
    extraCount,
    location,
    offers = [],
    onChatPress,
    isChat = true,
    isFocused = false,
    vendorId,
    fullVendorData, // Full vendor object with all data
    approval_status, // Approval status for the ad
    isCheckingChat = false, // Loading state for chat button
}) {
    const navigation = useNavigation();
    const theme = useTheme();

    // Carousel logic for infinite auto-scroll
    // Use fallback image if no images available
    console.log('🎯 VendorCard - received images:', { 
        images, 
        imagesLength: images ? images.length : 0, 
        imagesType: typeof images,
        vendorId: vendorId || 'unknown',
        name,
        firstImage: images && images.length > 0 ? images[0] : null,
        imageDetails: images ? images.map((img, idx) => ({
            index: idx,
            type: typeof img,
            value: img,
            isValidUrl: typeof img === 'string' && img.startsWith('http')
        })) : []
    });
    
    const safeImages = images && images.length > 0 ? images : [img, img, img];
    
    // Convert image URLs to proper format for React Native Image component
    const formattedImages = safeImages.map(image => {
        // Handle null or undefined
        if (!image) {
            return img;
        }
        // If it's already an object with uri, use it as is
        if (typeof image === 'object' && image.uri) {
            return image;
        }
        // If it's a string URL, convert to {uri: url} format
        if (typeof image === 'string' && image.startsWith('http')) {
            return { uri: image };
        }
        // If it's a local image (number from require), use it directly
        if (typeof image === 'number') {
            return image;
        }
        // Default fallback
        return img;
    });
    
    const extendedImages = [formattedImages[formattedImages.length - 1], ...formattedImages, formattedImages[0]];
    const scrollRef = useRef(null);
    const currentIndex = useRef(1);
    const intervalRef = useRef(null);
    const carouselWidth = (width - 48) * 0.65; // 65% of available width for carousel

    useEffect(() => {
        // Initial positioning
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTo({ x: carouselWidth * 1, animated: false });
            }
        }, 10);

        // Auto-scroll interval only when focused
        if (isFocused) {
            intervalRef.current = setInterval(() => {
                if (scrollRef.current) {
                    currentIndex.current += 1;
                    scrollRef.current.scrollTo({ x: carouselWidth * currentIndex.current, animated: true });
                }
            }, 2500);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [carouselWidth, isFocused]);

    const handleScrollEnd = (e) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const slideWidth = carouselWidth;
        let idx = Math.round(offsetX / slideWidth);

        if (idx === extendedImages.length - 1) {
            currentIndex.current = 1;
            if (scrollRef.current) {
                scrollRef.current.scrollTo({ x: slideWidth, animated: false });
            }
        } else if (idx === 0) {
            currentIndex.current = images.length;
            if (scrollRef.current) {
                scrollRef.current.scrollTo({ x: slideWidth * images.length, animated: false });
            }
        } else {
            currentIndex.current = idx;
        }
    };

    const handleCardPress = () => {
        // Pass the full vendor data if available, otherwise construct from props
        const vendorData = fullVendorData || { 
            id: vendorId,
            vendor_ad_id: vendorId,
            initials, 
            name, 
            type, 
            rating, 
            description, 
            images, 
            extraCount, 
            location,
            offers 
        };
        
        console.log('VendorCard handleCardPress - vendorId:', vendorId);
        console.log('VendorCard handleCardPress - fullVendorData:', fullVendorData);
        console.log('VendorCard handleCardPress - vendorData being passed:', vendorData);
        
        navigation.navigate('VendorAddDetail', { 
            vendor: vendorData
        });
    };

    const handleSeeMorePress = () => {
        // Pass the full vendor data if available, otherwise construct from props
        const vendorData = fullVendorData || { 
            id: vendorId,
            vendor_ad_id: vendorId,
            initials, 
            name, 
            type, 
            rating, 
            description, 
            images, 
            extraCount, 
            location,
            offers 
        };
        
        navigation.navigate('VendorAddDetail', {
            vendor: vendorData,
            scrollToOffer: true
        });
    };

    return (
        <TouchableOpacity onPress={handleCardPress} style={styles.cardWrapper}>
            {/* Approval Status Banner for pending/rejected ads */}
            {approval_status && approval_status !== 'approved' && (
                <View style={[
                    styles.approvalBanner,
                    { backgroundColor: approval_status === 'pending' ? '#FFA500' : '#FF4444' }
                ]}>
                    <Text style={styles.approvalBannerText}>
                        {approval_status === 'pending' ? '⏳ Waiting for approval' : '❌ Rejected - Please review and resubmit'}
                    </Text>
                </View>
            )}
            
            {/* Header OUTSIDE the card */}
            <View style={styles.header}>
                <View style={[styles.avatarShadow, { shadowColor: theme.colors.primary }]}>
                    <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                </View>
                <View style={styles.nameBlock}>
                    <Text style={[styles.vendorName, { color: theme.colors.primary }]}>{name}</Text>
                    <View style={styles.tagRow}>
                        <Text style={styles.tag}>
                            {type === 'Photography' ? '📷' : type === 'Catering' ? '🍽️' : type === 'Music' ? '🎵' : type === 'Florist' ? '🌸' : type === 'Event Planner' ? '🎉' : type === 'Decor' ? '🎨' : type === 'Bakery' ? '🍰' : '🏷️'} {type}
                        </Text>
                        {location && (
                            <Text style={styles.tag}>📍 {location}</Text>
                        )}
                    </View>
                </View>
                <View style={[styles.ratingBox, { backgroundColor: theme.colors.tabBackground }]}>
                    <StarIcon size={14} color={theme.colors.primary} />
                    <Text style={[styles.ratingText, { color: theme.colors.primary }]}>{rating}</Text>
                </View>
            </View>

            {/* Card */}
            <View style={styles.card}>
                {/* Offer Section */}
                <View style={styles.offerSection}>
                    <View style={styles.offerTable}>
                        {/* Header Row */}
                        <View style={styles.offerHeaderRow}>
                            <Text style={styles.offerHeaderEmpty}></Text>
                            <Text style={[styles.offerHeaderText, { color: theme.colors.textSecondary }]}>Amount spent</Text>
                            <Text style={[styles.offerHeaderText, { color: theme.colors.textSecondary }]}>Discount</Text>
                        </View>
                        {/* Values Row - Show first offer or default values */}
                        <View style={styles.offerValueRow}>
                            <Text style={styles.offerLabel}>Offer:</Text>
                            <View style={[styles.offerValueContainer, { backgroundColor: theme.colors.background }]}>
                                <CurrencyDollarIcon size={12} color={theme.colors.primary} />
                                <Text style={styles.offerValue}>
                                    {offers && offers.length > 0 && offers[0].amount ? offers[0].amount : '0'}
                                </Text>
                            </View>
                            <View style={[styles.offerValueContainer, { backgroundColor: theme.colors.background }]}>
                                <TagIcon size={12} color={theme.colors.primary} />
                                <Text style={styles.offerValue}>
                                    {offers && offers.length > 0 && offers[0].discount ? `${offers[0].discount}%` : '0%'}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.seeMoreBox} onPress={handleSeeMorePress}>
                        <Text style={[styles.seeMore, { color: theme.colors.primary }]}>SEE MORE</Text>
                    </TouchableOpacity>
                </View>

                {/* Images Grid */}
                <View style={styles.imageGrid}>
                    {/* Carousel for large image */}
                    <View style={styles.carouselWrapper}>
                        <Animated.ScrollView
                            ref={scrollRef}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            style={styles.carouselContainer}
                            scrollEventThrottle={16}
                            onMomentumScrollEnd={handleScrollEnd}
                            snapToInterval={carouselWidth}
                            decelerationRate="fast"
                        >
                            {extendedImages.map((img, idx) => (
                                <Image
                                    key={idx}
                                    source={img}
                                    style={[styles.carouselImage, { width: carouselWidth }]}
                                    resizeMode="cover"
                                />
                            ))}
                        </Animated.ScrollView>
                    </View>
                    <View style={styles.smallImages}>
                        <Image source={formattedImages[1] || img} style={styles.smallImage} />
                        <View style={styles.overlayWrapper}>
                            <Image source={formattedImages[2] || img} style={styles.smallImage} />
                            {extraCount > 0 && (
                                <View style={[styles.overlay, { backgroundColor: theme.colors.primary + '99' }]}>
                                    <Text style={styles.overlayText}>{`+${extraCount}`}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Description and Chat Button in a row */}
                <View style={styles.rowContent}>
                    <Text style={styles.description} numberOfLines={2}>{description}</Text>
                    {isChat && (
                        <TouchableOpacity 
                            style={[styles.chatBtn, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]} 
                            onPress={isCheckingChat ? null : onChatPress}
                            disabled={isCheckingChat}
                        >
                            {isCheckingChat ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.chatText}>Chat</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    cardWrapper: {
        marginHorizontal: 12,
        marginBottom: 18,
        backgroundColor: '#fff',
        marginTop: 12,
    },
    approvalBanner: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        marginBottom: 8,
        alignItems: 'center',
    },
    approvalBannerText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        marginLeft: 4,
        backgroundColor: '#fff',

    },
    avatarShadow: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
        elevation: 3,
        borderRadius: 24,
    },
    avatar: {
        borderRadius: 24,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 18,
        letterSpacing: 0.5,
    },
    nameBlock: {
        flex: 1,
        marginLeft: 10,
    },
    vendorName: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    tagRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    tag: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        fontSize: 12,
        color: '#666',
    },
    filtersRow: {
        flexDirection: 'row',
        marginTop: 2,
    },
    filterItem: {
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 10,
        marginRight: 4,
    },
    filterItemEnhanced: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.tabBackground,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginRight: 0,
        gap: 6,
    },
    filterText: {
        fontSize: 10,
        fontWeight: '500',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    locationText: {
        fontSize: 11,
        marginLeft: 2,
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 16,
    },
    ratingText: {
        fontSize: 12,
        marginLeft: 4,
        fontWeight: '600',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    imageGrid: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    carouselWrapper: {
        width: '65%',
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
    },
    carouselContainer: {
        height: 200,
    },
    carouselImage: {
        height: 200,
        backgroundColor: '#F2F2F2',
    },
    smallImages: {
        flex: 1,
        width: '35%',
        justifyContent: 'space-between',
        gap: 8,
    },
    smallImage: {
        width: '100%',
        height: 95,
        borderRadius: 12,
    },
    overlayWrapper: {
        position: 'relative',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    overlayText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    rowContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        marginTop: 4,
    },
    description: {
        fontSize: 12,
        color: '#444',
        flex: 1,
        marginRight: 8,
    },
    chatBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 16,
        alignSelf: 'flex-end',
        gap: 4,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 2,
    },
    chatText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },
    // Offer Section Styles
    offerSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
        paddingBottom: 4,
    },
    offerTable: {
        flexDirection: 'column',
    },
    noOffersText: {
        fontSize: 12,
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 8,
    },
    offerHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3,
        gap: 6,
    },
    offerHeaderEmpty: {
        width: 40,
    },
    offerHeaderText: {
        fontSize: 8,
        fontWeight: '400',
        minWidth: 40,
    },
    offerValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    offerLabel: {
        fontSize: 10,
        fontWeight: '400',
        color: '#344562',
        width: 40,
    },
    offerValueContainer: {
        backgroundColor: '#F4F4F4',
        borderRadius: 30,
        flexDirection: 'row',
        gap: 4,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 2,
        paddingVertical: 4,
        minWidth: 50,
    },
    offerValue: {
        fontSize: 12,
        fontWeight: '500',
        color: '#2C3D5BF5',
    },
    seeMoreBox: {
        height: 20,
        width: 60,
        borderRadius: 10,
        alignSelf: 'flex-end',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    seeMore: {
        fontWeight: '500',
        fontSize: 8,
        textDecorationLine: 'underline',
    },
});
