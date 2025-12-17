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
    ActivityIndicator,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import vendorDetailsService from '../../../services/vendorDetailsService';
import img from '../../../assets/images/dummy.png';

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
            // Navigate to vendor details
            navigation.navigate('VendorChat', { 
                vendor: item,
                scrollToOffer: false 
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

            <Image source={getImageSource()} style={styles.avatar} />

            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.role}>{item.role || item.type}</Text>

            <View style={styles.locationBadge}>
                <Ionicons name="location-sharp" size={16} color="#2c3a58" />
                <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleViewPress}>
                <Text style={styles.buttonText}>View</Text>
            </TouchableOpacity>
        </View>
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
                    // Format the vendor data - check for both company_name and name
                    const formattedVendors = response.data.map(vendor => {
                        // Parse images if it's a string
                        let images = vendor.images;
                        if (typeof images === 'string') {
                            try {
                                images = JSON.parse(images);
                            } catch (e) {
                                images = [];
                            }
                        }
                        
                        return {
                            id: vendor.vendor_ad_id || vendor.id,
                            name: vendor.company_name || vendor.name || vendor.title,
                            role: vendor.type || vendor.category?.name || vendor.category || 'Photography',
                            location: vendor.location || 'Location not specified',
                            rating: vendor.rating || 0,
                            image: Array.isArray(images) ? images[0] : images || vendor.image,
                            type: vendor.type || vendor.category?.name,
                            description: vendor.description,
                            images: images,
                            _original: vendor
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
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / (CARD_WIDTH + 10));
        
        if (index === 0) {
            // If scrolled to the clone at the beginning, jump to the last real item
            currentIndex.current = data.length;
            scrollRef.current.scrollToIndex({ 
                index: data.length, 
                animated: false 
            });
        } else if (index === extendedData.length - 1) {
            // If scrolled to the clone at the end, jump to the first real item
            currentIndex.current = 1;
            scrollRef.current.scrollToIndex({ 
                index: 1, 
                animated: false 
            });
        } else {
            currentIndex.current = index;
        }
    };
    
    const getItemLayout = (_, index) => ({
        length: CARD_WIDTH + 10,
        offset: (CARD_WIDTH + 10) * index,
        index,
    });
    
    // Don't render if no data and still loading
    if (isLoading && similarVendors.length === 0) {
        return (
            <View style={[styles.carouselContainer, styles.loadingContainer]}>
                <Text style={styles.sectionTitle}>You might also like</Text>
                <ActivityIndicator size="small" color="#2c3a58" />
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
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignSelf: 'center',
        marginBottom: 12,
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
        color: '#777',
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