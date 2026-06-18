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

// Pure-number durations like "6" become "6 hours"; strings that already
// contain letters ("6 hour", "2 days") pass through untouched. Identical
// to eventService.formatDuration — duplicated here because the similar-
// events endpoint returns raw DB rows that don't go through that formatter.
const formatDuration = (raw) => {
    if (raw == null) return 'TBD';
    const s = String(raw).trim();
    if (!s) return 'TBD';
    if (/[a-zA-Z]/.test(s)) return s;
    const n = Number(s);
    if (!Number.isFinite(n)) return s;
    return `${n} ${n === 1 ? 'hour' : 'hours'}`;
};

// Compact card design — matches Figma. No hero image, no price, no guest
// count. Just: duration pill, close icon, title, owner avatar+name, two
// info pills (location + date), full-width View button.
const SimilarEventCard = ({ item, onPress }) => {
    const navigation = useNavigation();

    const handleViewPress = () => {
        if (onPress) {
            onPress(item);
        } else {
            navigation.push('EventDetailView', {
                eventId: item.event_ad_id || item.id,
                event: item,
            });
        }
    };

    const ownerName =
        item.organizer?.full_name ||
        item.user?.full_name ||
        item.owner_name ||
        'Organizer';
    const ownerAvatar =
        item.organizer?.profile_pic ||
        item.user?.profile_pic ||
        item.owner_profile_pic ||
        null;

    // Format date — backend may return ISO ("2026-04-13T00:00:00.000Z") or
    // already-formatted ("October 30, 2023"). Detect and convert.
    const dateLabel = (() => {
        const raw = item.date || item.event_date;
        if (!raw) return 'Date TBD';
        const d = new Date(raw);
        if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            });
        }
        return String(raw);
    })();

    return (
        <TouchableOpacity style={styles.card} onPress={handleViewPress} activeOpacity={0.9}>
            {/* Top row: duration pill + close icon */}
            <View style={styles.topRow}>
                <View style={styles.durationPill}>
                    <Text style={styles.durationText} numberOfLines={1}>
                        {formatDuration(item.duration)}
                    </Text>
                </View>
                <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close" size={16} color="#9aa1ad" />
                </TouchableOpacity>
            </View>

            <Text style={styles.eventTitle} numberOfLines={1}>
                {item.title || 'Event'}
            </Text>

            {/* Owner row */}
            <View style={styles.ownerRow}>
                {ownerAvatar ? (
                    <Image source={{ uri: ownerAvatar }} style={styles.ownerAvatar} />
                ) : (
                    <View style={[styles.ownerAvatar, styles.ownerAvatarPlaceholder]}>
                        <Ionicons name="person" size={14} color="#fff" />
                    </View>
                )}
                <Text style={styles.ownerName} numberOfLines={1}>
                    {ownerName}
                </Text>
            </View>

            {/* Info pills row */}
            <View style={styles.pillRow}>
                <View style={styles.pill}>
                    <Ionicons name="location-outline" size={12} color="#666" />
                    <Text style={styles.pillText} numberOfLines={1}>
                        {item.location || 'Location TBD'}
                    </Text>
                </View>
                <View style={styles.pill}>
                    <MaterialCommunityIcons name="calendar-outline" size={12} color="#666" />
                    <Text style={styles.pillText} numberOfLines={1}>
                        {dateLabel}
                    </Text>
                </View>
            </View>

            <TouchableOpacity style={styles.viewButton} onPress={handleViewPress}>
                <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
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
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 3,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    durationPill: {
        backgroundColor: '#f1f3f6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    durationText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#3a4760',
    },
    eventTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1D1B20',
        marginBottom: 10,
    },
    ownerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    ownerAvatar: {
        width: 22,
        height: 22,
        borderRadius: 11,
        marginRight: 8,
        backgroundColor: '#eee',
    },
    ownerAvatarPlaceholder: {
        backgroundColor: '#9aa1ad',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ownerName: {
        fontSize: 13,
        color: '#3a4760',
        flex: 1,
    },
    pillRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 14,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f7f8fa',
        borderRadius: 14,
        paddingHorizontal: 10,
        paddingVertical: 5,
        gap: 4,
    },
    pillText: {
        fontSize: 11,
        color: '#4a4f5c',
        maxWidth: 130,
    },
    viewButton: {
        backgroundColor: '#2c3a58',
        borderRadius: 10,
        paddingVertical: 11,
        alignItems: 'center',
    },
    viewButtonText: {
        color: '#fff',
        fontSize: 14,
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