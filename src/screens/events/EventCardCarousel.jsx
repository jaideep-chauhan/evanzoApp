import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import eventDetailsService from '../../services/eventDetailsService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

const SimilarEventCard = ({ item, onPress }) => {
    const navigation = useNavigation();
    
    // Handle image source
    const getImageSource = () => {
        if (item.attachments && item.attachments.length > 0) {
            const firstAttachment = item.attachments[0];
            if (typeof firstAttachment === 'string') {
                return { uri: firstAttachment };
            }
            return firstAttachment;
        }
        // Default placeholder image
        return { uri: 'https://picsum.photos/300/200?random=' + item.id };
    };
    
    const handleViewPress = () => {
        if (onPress) {
            onPress(item);
        } else {
            // Navigate to event details
            navigation.push('EventDetailView', { 
                eventId: item.event_ad_id || item.id,
                event: item
            });
        }
    };
    
    return (
        <TouchableOpacity style={styles.card} onPress={handleViewPress} activeOpacity={0.9}>
            <Image source={getImageSource()} style={styles.eventImage} />
            
            <View style={styles.cardContent}>
                <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.eventCategory}>{item.category || item.event_type || 'Event'}</Text>
                
                <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                        <Ionicons name="location-outline" size={14} color="#666" />
                        <Text style={styles.infoText} numberOfLines={1}>{item.location || 'Location TBD'}</Text>
                    </View>
                </View>
                
                <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                        <MaterialCommunityIcons name="calendar-outline" size={14} color="#666" />
                        <Text style={styles.infoText}>{item.date || 'Date TBD'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <MaterialCommunityIcons name="account-group-outline" size={14} color="#666" />
                        <Text style={styles.infoText}>{item.guests || '0'} guests</Text>
                    </View>
                </View>
                
                <View style={styles.footer}>
                    <Text style={styles.budget}>${item.budget || '0'}</Text>
                    <TouchableOpacity style={styles.viewButton} onPress={handleViewPress}>
                        <Text style={styles.viewButtonText}>View Details</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const EventCardCarousel = ({ eventId, eventCategory, eventLocation }) => {
    const scrollRef = useRef(null);
    const intervalRef = useRef(null);
    const currentIndex = useRef(0);
    const [similarEvents, setSimilarEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Fetch similar events from API
    useEffect(() => {
        const fetchSimilarEvents = async () => {
            if (!eventId) {
                setSimilarEvents([]);
                setIsLoading(false);
                return;
            }
            
            try {
                setIsLoading(true);
                const response = await eventDetailsService.getSimilarEvents(eventId, eventCategory, eventLocation);
                
                if (response.success && response.data && response.data.length > 0) {
                    setSimilarEvents(response.data);
                } else {
                    setSimilarEvents([]);
                }
            } catch (error) {
                console.error('Error fetching similar events:', error);
                setSimilarEvents([]);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchSimilarEvents();
    }, [eventId, eventCategory, eventLocation]);
    
    // Use similarEvents data
    const data = similarEvents;
    
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
        }, 4000); // Scroll every 4 seconds
        
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [extendedData.length]);
    
    const handleScrollEnd = (event) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / (CARD_WIDTH + 15));
        
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
        length: CARD_WIDTH + 15,
        offset: (CARD_WIDTH + 15) * index,
        index,
    });
    
    // Don't render if no data and still loading
    if (isLoading && similarEvents.length === 0) {
        return (
            <View style={[styles.carouselContainer, styles.loadingContainer]}>
                <Text style={styles.sectionTitle}>You might also like</Text>
                <ActivityIndicator size="small" color="#2c3a58" />
            </View>
        );
    }
    
    // Show "no data found" message if no events available
    if (!isLoading && data.length === 0) {
        return (
            <View style={styles.carouselContainer}>
                <Text style={styles.sectionTitle}>You might also like</Text>
                <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>No similar events found</Text>
                    <Text style={styles.noDataSubtext}>Check back later for more events in your area</Text>
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
                keyExtractor={(item, index) => `${item.id || item.event_ad_id}_${index}`}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                ItemSeparatorComponent={() => <View style={{ width: 15 }} />}
                renderItem={({ item }) => <SimilarEventCard item={item} />}
                onMomentumScrollEnd={handleScrollEnd}
                onScrollToIndexFailed={() => {}}
                getItemLayout={getItemLayout}
                pagingEnabled={false}
                snapToInterval={CARD_WIDTH + 15}
                decelerationRate="fast"
            />
        </View>
    );
};

export default EventCardCarousel;

const styles = StyleSheet.create({
    carouselContainer: {
        marginTop: 24,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 16,
        marginBottom: 16,
        color: '#1D1B20',
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 4,
    },
    eventImage: {
        width: '100%',
        height: 140,
        resizeMode: 'cover',
    },
    cardContent: {
        padding: 16,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2A282F',
        marginBottom: 4,
    },
    eventCategory: {
        fontSize: 12,
        color: '#666',
        marginBottom: 12,
        textTransform: 'capitalize',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        justifyContent: 'space-between',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    infoText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    budget: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2c3a58',
    },
    viewButton: {
        backgroundColor: '#2c3a58',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    viewButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    loadingContainer: {
        height: 250,
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