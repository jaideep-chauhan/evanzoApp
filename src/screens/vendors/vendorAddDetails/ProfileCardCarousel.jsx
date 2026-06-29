import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    FlatList,
    Animated,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import vendorDetailsService from '../../../services/vendorDetailsService';
import vendorService from '../../../services/vendorService';
import img from '../../../assets/images/dummy.png';
import { icons } from '../../../assets/icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.55;


const ProfileCard = ({ item, onPress }) => {
    const navigation = useNavigation();
    
    // Handle image source
    const getImageSource = () => {
        if (item.image) {
            if (typeof item.image === 'string') {
                return { uri: item.image };
            }
            return item.image;
        }
        return img;
    };
    
    const handleViewPress = () => {
        if (onPress) {
            onPress(item);
        } else {
            // Pass the fully-formatted vendor (real image URLs, offers, etc.) —
            // same shape the main list passes — so the detail page renders the
            // actual ad data instead of dummy placeholders.
            // Use push (not navigate): the current screen is already
            // VendorAddDetail, so navigate() would just swap params on the same
            // instance and keep the old scroll position (stuck near the
            // carousel at the bottom). push() opens a fresh detail at the top.
            navigation.push('VendorAddDetail', {
                vendor: item.fv || item,
                scrollToOffer: false,
            });
        }
    };
    
    return (
        <View style={styles.card}>
            <View style={styles.ratingBadge}>
                <FontAwesome name="star" size={14} color="#f6c945" />
                <Text style={styles.ratingText}>{item.rating || 0}</Text>
            </View>

            <TouchableOpacity style={styles.closeIcon}>
                <Entypo name="cross" size={16} color="#333" />
            </TouchableOpacity>

            <View style={styles.avatarWrap}>
                <Image source={getImageSource()} style={styles.avatar} />
                {/* Small owner avatar overlaid on the corner — same idea as
                    WhatsApp's group avatar with the sender chip. Renders only
                    if the vendor owner has uploaded a profile pic. */}
                {item.ownerProfilePic ? (
                    <Image
                        source={{ uri: item.ownerProfilePic }}
                        style={styles.ownerAvatar}
                    />
                ) : null}
            </View>

            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.role}>{item.role || item.type}</Text>

            <View style={styles.locationBadge}>
                <Image source={icons.location} style={styles.locationBadgeIcon} />
                <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleViewPress}>
                <Text style={styles.buttonText}>View</Text>
            </TouchableOpacity>
        </View>
    );
};

// Pulsing placeholder card shown while similar vendors load — matches the real
// ProfileCard footprint so the section doesn't jump when data arrives.
const SkeletonCard = () => {
    const pulse = useRef(new Animated.Value(0.45)).current;
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0.45, duration: 650, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [pulse]);

    return (
        <Animated.View style={[styles.card, { opacity: pulse }]}>
            <View style={styles.skelAvatar} />
            <View style={[styles.skelLine, { width: '55%', alignSelf: 'center', marginTop: 14 }]} />
            <View style={[styles.skelLine, { width: '35%', alignSelf: 'center', marginTop: 8 }]} />
            <View style={styles.skelBadge} />
            <View style={styles.skelButton} />
        </Animated.View>
    );
};

const ProfileCardCarousel = ({ vendorId }) => {
    const scrollRef = useRef(null);
    const intervalRef = useRef(null);
    const currentIndex = useRef(0);
    const [similarVendors, setSimilarVendors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Fetch similar vendors from API
    useEffect(() => {
        const fetchSimilarVendors = async () => {
            if (!vendorId) {
                setSimilarVendors([]);
                setIsLoading(false);
                return;
            }
            
            try {
                setIsLoading(true);
                const response = await vendorDetailsService.getSimilarVendors(vendorId);
                
                if (response.success && response.data && response.data.length > 0) {
                    // Format through the SAME formatter the main vendor list uses,
                    // so `images` are full URLs (the raw record stores them under
                    // `photos`, not `images`) and the object shape matches what the
                    // detail page (VendorChat) expects on navigation. `fv` is kept
                    // on each item and passed verbatim when the user taps "View",
                    // so the opened page shows the REAL images, not dummies.
                    const formattedVendors = response.data.map(vendor => {
                        const fv = vendorService.formatVendorForDisplay(vendor);
                        return {
                            id: fv.id,
                            name: fv.name,
                            role: fv.type,
                            location: fv.location,
                            rating: fv.rating,
                            image: fv.images?.[0],
                            ownerProfilePic: fv.owner_profile_pic || null,
                            type: fv.type,
                            description: fv.description,
                            images: fv.images,
                            fv, // full formatted object for navigation
                        };
                    });
                    setSimilarVendors(formattedVendors);
                } else {
                    setSimilarVendors([]);
                }
            } catch (error) {
                setSimilarVendors([]);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchSimilarVendors();
    }, [vendorId]);
    
    // Use similarVendors data
    const data = similarVendors;
    
    // Create extended data for infinite loop
    const extendedData = data.length > 1 ? [data[data.length - 1], ...data, data[0]] : data;
    
    useEffect(() => {
        // Initial positioning to the first real item
        setTimeout(() => {
            if (scrollRef.current && extendedData.length > 1) {
                scrollRef.current.scrollToIndex({ index: 1, animated: false });
                currentIndex.current = 1;
            }
        }, 100);
        
        // Auto-scroll interval
        intervalRef.current = setInterval(() => {
            if (scrollRef.current && extendedData.length > 1) {
                try {
                    currentIndex.current += 1;
                    
                    // Check if we've reached the end clone
                    if (currentIndex.current >= extendedData.length - 1) {
                        // Reset to the first real item after showing last clone
                        setTimeout(() => {
                            currentIndex.current = 1;
                            scrollRef.current.scrollToIndex({ 
                                index: 1, 
                                animated: false 
                            });
                        }, 500);
                    } else {
                        scrollRef.current.scrollToIndex({ 
                            index: currentIndex.current, 
                            animated: true 
                        });
                    }
                } catch (error) {
                    // Reset to safe index if error occurs
                    currentIndex.current = 1;
                    if (scrollRef.current) {
                        scrollRef.current.scrollToIndex({ 
                            index: 1, 
                            animated: false 
                        });
                    }
                }
            }
        }, 3000);
        
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [extendedData.length]);
    
    const handleScrollEnd = (event) => {
        // The wrap-around clones only exist when we built `extendedData` with
        // the head/tail clones — i.e. when data.length > 1. With 0 or 1 real
        // items there's nothing to wrap to, and calling scrollToIndex with
        // any non-zero index throws "out of range". Bail early in that case.
        if (!scrollRef.current || extendedData.length <= 1) return;

        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / (CARD_WIDTH + 10));

        // Final safety net: clamp every target index into the actual range
        // before handing it to FlatList, so a stray race can never re-trigger
        // the invariant.
        const safeScroll = (target) => {
            const max = extendedData.length - 1;
            const clamped = Math.max(0, Math.min(max, target));
            scrollRef.current.scrollToIndex({ index: clamped, animated: false });
        };

        if (index === 0) {
            // Scrolled to the head clone → jump to the last real item.
            currentIndex.current = data.length;
            safeScroll(data.length);
        } else if (index === extendedData.length - 1) {
            // Scrolled to the tail clone → jump to the first real item.
            currentIndex.current = 1;
            safeScroll(1);
        } else {
            currentIndex.current = index;
        }
    };
    
    const getItemLayout = (_, index) => ({
        length: CARD_WIDTH + 10,
        offset: (CARD_WIDTH + 10) * index,
        index,
    });
    
    // Skeleton placeholders while loading (no jarring spinner / layout jump).
    if (isLoading && similarVendors.length === 0) {
        return (
            <View style={styles.carouselContainer}>
                <Text style={styles.sectionTitle}>You might also like</Text>
                <View style={styles.skeletonRow}>
                    <SkeletonCard />
                    <SkeletonCard />
                </View>
            </View>
        );
    }
    
    // Show "no data found" message if no vendors available
    if (!isLoading && data.length === 0) {
        return (
            <View style={styles.carouselContainer}>
                <Text style={styles.sectionTitle}>You might also like</Text>
                <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>No similar vendors found</Text>
                    <Text style={styles.noDataSubtext}>Try exploring other categories or check back later</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.carouselContainer}>
            <Text style={styles.sectionTitle}>You might also like</Text>
            <FlatList
                ref={scrollRef}
                data={extendedData}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => `${item.id}_${index}`}
                contentContainerStyle={{ paddingHorizontal: 0 }}
                ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
                renderItem={({ item }) => <ProfileCard item={item} />}
                onMomentumScrollEnd={handleScrollEnd}
                onScrollToIndexFailed={() => {}}
                getItemLayout={getItemLayout}
                pagingEnabled={false}
                snapToInterval={CARD_WIDTH + 10}
                decelerationRate="fast"
            />
        </View>
    );
};

export default ProfileCardCarousel;

const styles = StyleSheet.create({
    carouselContainer: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 16,
        marginBottom: 16,
        color: '#1D1B20',
        
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 16,
        paddingTop: 24,
        position: 'relative',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
        elevation: 3,
        boxShadow: '2px 2px 6px 0px #0000001A',
        paddingVertical: 20,

    },
    ratingBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        borderWidth: 1,
        borderColor: '#F6CD4A',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontWeight: '600',
        color: '#F6CD4A',
        marginLeft: 4,
    },
    closeIcon: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    avatarWrap: {
        alignSelf: 'center',
        marginBottom: 12,
        position: 'relative',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    // 24x24 circular badge anchored to the bottom-right of the main image,
    // shows the vendor owner's personal profile pic.
    ownerAvatar: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#fff',
        backgroundColor: '#eee',
    },
    name: {
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '700',
        color: '#2A282F',
    },
    role: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 2,
        marginBottom: 10,
        color: '#49454F'
    },
    locationBadge: {
        backgroundColor: '#edf3ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    locationText: {
        marginLeft: 6,
        fontSize: 10,
        color: '#2C3D5BF5',
    },
    locationBadgeIcon: {
        width: 16,
        height: 16,
        resizeMode: 'contain',
    },
    button: {
        backgroundColor: '#2c3a58',
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: 'center',
        
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skeletonRow: {
        flexDirection: 'row',
        paddingLeft: 16,
        gap: 10,
    },
    skelAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignSelf: 'center',
        backgroundColor: '#E5E7EB',
    },
    skelLine: {
        height: 12,
        borderRadius: 6,
        backgroundColor: '#E5E7EB',
    },
    skelBadge: {
        width: 90,
        height: 24,
        borderRadius: 12,
        alignSelf: 'center',
        backgroundColor: '#E5E7EB',
        marginVertical: 12,
    },
    skelButton: {
        height: 40,
        borderRadius: 12,
        backgroundColor: '#E5E7EB',
    },
    noDataContainer: {
        paddingVertical: 40,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        marginHorizontal: 16,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    noDataText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#495057',
        marginBottom: 8,
        textAlign: 'center',
    },
    noDataSubtext: {
        fontSize: 14,
        color: '#6c757d',
        textAlign: 'center',
        lineHeight: 20,
    },
});