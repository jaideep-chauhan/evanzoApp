import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    Dimensions,
    ImageBackground,
    Alert,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import img from '../../assets/images/dummy.png';
import bg1 from '../../assets/images/smallHeader.jpg';
import { useTheme } from '../../ThemeContext';
import Icon2 from 'react-native-vector-icons/Feather'
import Icon3 from 'react-native-vector-icons/Entypo'
import { API_BASE_URL } from '../../services/api';
import eventDetailsService from '../../services/eventDetailsService';
const { width } = Dimensions.get('window');
const AVATAR_SIZE = 60;

export default function EventDetailView() {
    const navigation = useNavigation();
    const route = useRoute();
    const theme = useTheme();

    const [quoteText, setQuoteText] = useState('');
    const [isFavorited, setIsFavorited] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [descTruncated, setDescTruncated] = useState(false);
    const descTextRef = useRef(null);
    const [textMeasured, setTextMeasured] = useState(false);
    const scrollViewRef = useRef(null);
    const currentIndex = useRef(1);
    const intervalRef = useRef(null);
    const [suggestionCards] = useState([1, 2, 3, 4]);
    const cardWidth = 336; // 320 width + 16 gap

    // Get event data from navigation params
    const eventFromParams = route.params?.event || {};
    
    console.log('🎯 EventDetailView - eventFromParams:', JSON.stringify(eventFromParams, null, 2));
    
    // Parse additional fields from event data
    const parseDuration = (duration) => {
        if (!duration) return '2';
        const match = duration.match(/(\d+)/);
        return match ? match[1] : '2';
    };
    
    const parseDate = (date) => {
        if (!date) return 'Date TBD';
        // If it's already formatted, return as is
        if (typeof date === 'string' && !date.includes('-')) return date;
        // Parse ISO date or date string
        try {
            const dateObj = new Date(date);
            return dateObj.toLocaleDateString('en-US', { 
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch (e) {
            return date;
        }
    };

    // Parse budget to display format
    const parseBudget = (budget) => {
        if (!budget) return 'Budget TBD';
        if (typeof budget === 'string') return budget;
        if (typeof budget === 'number') {
            return `$${budget.toLocaleString()}`;
        }
        return 'Budget TBD';
    };

    // Get organizer data from event
    const getOrganizerData = (event) => {
        // Try to get organizer info from various possible fields
        if (event.organizer) return event.organizer;
        if (event.profile) return event.profile;
        
        // Create organizer from user data if available
        const organizerName = event.organizer_name || 
                             event.user_name || 
                             event.created_by_name || 
                             `User ${event.user_id || 'Unknown'}`;
        
        return {
            name: organizerName,
            avatar: event.organizer_avatar || img,
            rating: event.organizer_rating || 4.8,
            reviewCount: event.organizer_review_count || 12,
            user_id: event.user_id
        };
    };

    const eventData = {
        // Core event info
        id: eventFromParams.id || eventFromParams.event_ad_id,
        title: eventFromParams.title || `${eventFromParams.event_type || 'Event'} - ${eventFromParams.service_needed || 'Service'}`,
        location: eventFromParams.location || 'Location TBD',
        date: parseDate(eventFromParams.date),
        duration: parseDuration(eventFromParams.duration),
        time: eventFromParams.time || '07:00 pm',
        budget: parseBudget(eventFromParams.budget),
        guests: eventFromParams.guests || eventFromParams.guests_count || '50',
        description: eventFromParams.description || 'Event description not available.',
        
        // Event categories
        service_needed: eventFromParams.service_needed,
        event_type: eventFromParams.event_type,
        event_tags: eventFromParams.event_tags || [],
        
        // Requirements and additional info
        requirements: eventFromParams.requirements || [],
        is_urgent: eventFromParams.is_urgent || false,
        visibility: eventFromParams.visibility || 'public',
        
        // Images - handle both attachments and images fields
        images: (eventFromParams.attachments || eventFromParams.images || []).length > 0 
            ? (eventFromParams.attachments || eventFromParams.images).map(att => {
                // Handle different attachment formats
                if (typeof att === 'string') {
                    return att.startsWith('http') ? { uri: att } : { uri: att };
                } else if (att.url) {
                    return { uri: att.url };
                } else if (att.path) {
                    return { uri: `${API_BASE_URL.replace('/api', '')}${att.path}` };
                }
                return img;
            })
            : [img, bg1, img], // Fallback images
            
        // Organizer info
        organizer: getOrganizerData(eventFromParams),
        
        // Status and metadata
        status: eventFromParams.status || 'active',
        statusColor: eventFromParams.status === 'completed' ? '#28a745' : 
                    eventFromParams.status === 'cancelled' ? '#dc3545' : '#2ECC71',
        views_count: eventFromParams.views_count || 0,
        responses_count: eventFromParams.responses_count || 0,
        boosted: eventFromParams.boosted || false,
        created_at: eventFromParams.created_at,
        updated_at: eventFromParams.updated_at
    };
    
    console.log('🎯 EventDetailView - processed eventData:', JSON.stringify(eventData, null, 2));

    const handleSendQuote = async () => {
        if (!quoteText.trim()) {
            Alert.alert('Empty Quote', 'Please enter your quote before sending.');
            return;
        }

        try {
            console.log('Sending quote for event:', {
                eventId: eventData.id,
                quote: quoteText,
                organizerId: eventData.organizer.user_id
            });

            // Here you would call your event response/quote service
            // const response = await eventService.sendQuoteResponse(eventData.id, quoteText);
            
            // For now, just show success message
            Alert.alert(
                'Quote Sent!', 
                `Your quote has been sent to ${eventData.organizer.name}. They will be able to see your response and contact you if interested.`,
                [{ text: 'OK', onPress: () => setQuoteText('') }]
            );
        } catch (error) {
            console.error('Error sending quote:', error);
            Alert.alert('Error', 'Failed to send quote. Please try again.');
        }
    };

    const toggleFavorite = () => {
        setIsFavorited(!isFavorited);
    };

    // Handle save/unsave event - simple local storage approach
    const handleSave = async () => {
        if (isLoading) return;
        
        // Simple toggle for event saving (different from vendor approach)
        const newSavedState = !isSaved;
        setIsSaved(newSavedState);
        setIsLoading(true);
        
        const eventId = eventData.id || eventData.event_ad_id;
        
        console.log('Toggling save for event:', {
            eventId,
            title: eventData.title,
            saved: newSavedState
        });
        
        // Simulate API call with timeout (simpler than vendor implementation)
        setTimeout(() => {
            setIsLoading(false);
            
            // Show simple feedback
            const message = newSavedState 
                ? `"${eventData.title}" saved to your bookmarks!`
                : `"${eventData.title}" removed from bookmarks.`;
                
            Alert.alert(
                newSavedState ? '🔖 Event Saved' : '📄 Event Removed',
                message
            );
        }, 500);
    };

    // Handle share event - simpler approach than vendor ads
    const handleShare = async () => {
        try {
            const response = await eventDetailsService.shareEvent(eventData);
            // Don't show error alerts for cancelled shares, just log success/failure
            if (response.success) {
                console.log('Event shared successfully:', response.shared);
            } else if (response.message !== 'Share cancelled') {
                console.error('Share error:', response.message);
            }
        } catch (error) {
            console.error('Share exception:', error);
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        for (let i = 0; i < fullStars; i++) {
            stars.push(<Icon key={i} name="star" size={14} color="#334462" />);
        }
        const remainingStars = 5 - fullStars;
        for (let i = 0; i < remainingStars; i++) {
            stars.push(<Icon key={`empty-${i}`} name="star-outline" size={14} color="#334462" />);
        }
        return stars;
    };

    // Handle scroll end to create infinite loop effect
    const handleScrollEnd = (e) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const slideWidth = cardWidth;
        let idx = Math.round(offsetX / slideWidth);

        // Create array with duplicated cards for infinite scroll
        const extendedCards = suggestionCards.length + 2; // +1 at start, +1 at end

        if (idx === extendedCards - 1) {
            // At the end duplicate, jump to first real card
            currentIndex.current = 1;
            if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ x: slideWidth, animated: false });
            }
        } else if (idx === 0) {
            // At the start duplicate, jump to last real card
            currentIndex.current = suggestionCards.length;
            if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ x: slideWidth * suggestionCards.length, animated: false });
            }
        } else {
            currentIndex.current = idx;
        }
    };

    // Initialize saved state as false (different approach from vendor ads)
    useEffect(() => {
        setIsSaved(false);
        setIsCheckingStatus(false);
    }, [eventData.id, eventData.event_ad_id]);

    // Reset text measurement when event changes and check description length
    useEffect(() => {
        setTextMeasured(false);
        setShowFullDesc(false);
        // Simple check: if description is longer than ~150 characters, it's likely more than 3 lines
        if (eventData.description && eventData.description.length > 150) {
            setDescTruncated(true);
        } else {
            setDescTruncated(false);
        }
    }, [eventFromParams.description, eventData.description]);

    // Carousel auto-scroll functionality (similar to VendorCard)
    useEffect(() => {
        // Initial positioning to first real card
        setTimeout(() => {
            if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ x: cardWidth * 1, animated: false });
            }
        }, 10);

        // Auto-scroll interval
        intervalRef.current = setInterval(() => {
            if (scrollViewRef.current) {
                currentIndex.current += 1;
                scrollViewRef.current.scrollTo({
                    x: cardWidth * currentIndex.current,
                    animated: true
                });
            }
        }, 2500); // Change slide every 2.5 seconds

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [cardWidth]);

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <ImageBackground source={bg1} style={styles.banner} resizeMode="cover">
                    <View style={styles.headerIcons}>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                            <Icon name="arrow-back-outline" size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Icon2 name="bell" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </ImageBackground>

                <View style={styles.infoCard}>
                    {/* Header Row with Title/Location on left and Icons on right */}
                    <View style={styles.headerRow}>
                        <View style={styles.titleSection}>
                            <Text style={styles.title}>{eventData.title}</Text>
                            <View style={styles.metaRowHeader}>
                                <View style={styles.locationRow}>
                                    <Icon name="location-outline" size={14} color="#334462" style={{ marginRight: 4 }} />
                                    <Text style={styles.location}>{eventData.location}</Text>
                                </View>
                                <View style={styles.budgetRow}>
                                    {/* <Icon name="cash-outline" size={14} color="#334462" style={{ marginRight: 4 }} /> */}
                                    <Text style={styles.location}>Budget: </Text>

                                    <Text style={styles.budget}>{eventData.budget}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.actionIcons}>
                            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                                <Icon3 name="share" size={20} color="#334462" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.actionBtn} 
                                onPress={handleSave}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#334462" />
                                ) : (
                                    <Icon
                                        name={isSaved ? "bookmark" : "bookmark-outline"}
                                        size={20}
                                        color={isSaved ? theme.colors.primary : "#334462"}
                                    />
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn} onPress={toggleFavorite}>
                                <Icon
                                    name={isFavorited ? "heart" : "heart-outline"}
                                    size={20}
                                    color={isFavorited ? "#e91e63" : "#334462"}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Meta Information Grid */}
                    <View style={styles.metaContainer}>
                        <View style={styles.metaColumn}>
                            <Text style={styles.metaLabel}>Date</Text>
                            <View style={styles.metaBox}>
                                <Text style={styles.metaValue}>{eventData.date}</Text>
                            </View>
                        </View>
                        <View style={styles.metaColumn}>
                            <Text style={styles.metaLabel}>Duration</Text>
                            <View style={styles.metaBox}>
                                <Text style={styles.metaValue}>{eventData.duration} Hr</Text>
                            </View>
                        </View>
                        <View style={styles.metaColumn}>
                            <Text style={styles.metaLabel}>Time</Text>
                            <View style={styles.metaBox}>
                                <Text style={styles.metaValue}>{eventData.time}</Text>
                            </View>
                        </View>
                        <View style={styles.metaColumn}>
                            <Text style={styles.metaLabel}>Guests</Text>
                            <View style={styles.metaBox}>
                                <Text style={styles.metaValue}>{eventData.guests}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Event Tags */}
                    {eventData.event_tags && eventData.event_tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                            <Text style={styles.tagsLabel}>Event Tags</Text>
                            <View style={styles.tagsWrapper}>
                                {(typeof eventData.event_tags === 'string' 
                                    ? JSON.parse(eventData.event_tags) 
                                    : eventData.event_tags
                                ).map((tag, index) => (
                                    <View key={index} style={styles.tagPill}>
                                        <Text style={styles.tagText}>{tag}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Service Type and Event Type */}
                    <View style={styles.categoryContainer}>
                        {eventData.service_needed && (
                            <View style={styles.categoryItem}>
                                <Text style={styles.categoryLabel}>Service Needed</Text>
                                <View style={styles.categoryPill}>
                                    <Text style={styles.categoryText}>{eventData.service_needed}</Text>
                                </View>
                            </View>
                        )}
                        {eventData.event_type && (
                            <View style={styles.categoryItem}>
                                <Text style={styles.categoryLabel}>Event Type</Text>
                                <View style={styles.categoryPill}>
                                    <Text style={styles.categoryText}>{eventData.event_type}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Status and Metadata */}
                    <View style={styles.statusContainer}>
                        <View style={styles.statusItem}>
                            <Text style={styles.statusLabel}>Status</Text>
                            <View style={[styles.statusPill, { backgroundColor: eventData.statusColor + '20' }]}>
                                <Text style={[styles.statusText, { color: eventData.statusColor }]}>
                                    {eventData.status.toUpperCase()}
                                </Text>
                            </View>
                        </View>
                        {eventData.is_urgent && (
                            <View style={styles.statusItem}>
                                <View style={[styles.statusPill, { backgroundColor: '#ff4757' + '20' }]}>
                                    <Text style={[styles.statusText, { color: '#ff4757' }]}>URGENT</Text>
                                </View>
                            </View>
                        )}
                        {eventData.views_count > 0 && (
                            <View style={styles.statusItem}>
                                <Text style={styles.statusLabel}>{eventData.views_count} views</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={{ flex: 1, paddingHorizontal: 20 }}>
                    {/* About Section */}
                    <View style={styles.aboutSection}>
                        <Text style={styles.aboutText}>About</Text>
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            style={styles.carousel}
                            contentContainerStyle={{ gap: 10 }}
                        >
                            {eventData.images.map((imageSrc, idx) => (
                                <Image
                                    key={idx}
                                    source={imageSrc}
                                    style={styles.carouselImage}
                                    resizeMode="cover"
                                />
                            ))}
                        </ScrollView>
                        <Text
                            style={styles.description}
                            numberOfLines={showFullDesc ? undefined : 3}
                            ellipsizeMode="tail"
                            ref={descTextRef}
                            onTextLayout={(e) => {
                                // Check if text is truncated (more than 3 lines)
                                if (!textMeasured) {
                                    const { lines } = e.nativeEvent;
                                    if (lines.length > 3) {
                                        setDescTruncated(true);
                                    }
                                    setTextMeasured(true);
                                }
                            }}
                        >
                            {eventData.description}
                        </Text>
                        {descTruncated && !showFullDesc && (
                            <TouchableOpacity onPress={() => setShowFullDesc(true)} style={{ marginTop: 4, alignSelf: 'flex-end' }}>
                                <Text style={styles.seeMoreText}>See more</Text>
                            </TouchableOpacity>
                        )}
                        {showFullDesc && descTruncated && (
                            <TouchableOpacity onPress={() => setShowFullDesc(false)} style={{ marginTop: 4, alignSelf: 'flex-end' }}>
                                <Text style={styles.seeMoreText}>See less</Text>
                            </TouchableOpacity>
                        )}

                    </View>

                    {/* User Info Section */}
                    <View style={styles.userInfo}>
                        <View style={styles.userInfoContent}>
                            <View style={styles.leftSection}>
                                <Image 
                                    source={
                                        typeof eventData.organizer.avatar === 'string' && eventData.organizer.avatar.startsWith('http')
                                            ? { uri: eventData.organizer.avatar }
                                            : eventData.organizer.avatar
                                    } 
                                    style={styles.avatar} 
                                />
                                <Text style={styles.organizerName}>{eventData.organizer.name}</Text>
                            </View>
                            <View style={styles.rating}>
                                {renderStars(eventData.organizer.rating)}
                                <Text style={styles.ratingText}>({eventData.organizer.reviewCount})</Text>
                            </View>
                        </View>
                    </View>

                    {/* Suggestion Section */}
                    <View style={styles.suggestionSection}>
                        <Text style={styles.suggestionText}>You might also like</Text>

                        <ScrollView
                            ref={scrollViewRef}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.suggestionList}
                            scrollEventThrottle={16}
                            onMomentumScrollEnd={handleScrollEnd}
                            snapToInterval={cardWidth}
                            decelerationRate="fast"
                        >
                            {/* Add last card at beginning and first card at end for infinite scroll */}
                            {[suggestionCards[suggestionCards.length - 1], ...suggestionCards, suggestionCards[0]].map((_, index) => (
                                <View key={index} style={styles.suggestionCard}>
                                    {/* Close Button */}
                                    <TouchableOpacity style={styles.closeIcon}>
                                        <Icon name="close" size={16} color="#334462" />
                                    </TouchableOpacity>

                                    {/* Duration Tag */}
                                    <View style={styles.durationTag}>
                                        <Text style={styles.durationText}>{eventData.duration} Hr</Text>
                                    </View>

                                    {/* Title */}
                                    <Text style={styles.suggestionTitle}>Similar: {eventData.event_type || 'Event'}</Text>

                                    {/* Organizer Info */}
                                    <View style={styles.nameBoxContainer}>
                                        <View style={styles.nameBox}>
                                            <View style={styles.iconBox}>
                                                <Icon name="person" size={12} color="#2C3D5BF5" />
                                            </View>
                                            <Text style={styles.suggestionOrganizer}>{eventData.organizer.name}</Text>
                                        </View>
                                    </View>

                                    {/* Location and Date */}
                                    <View style={styles.detailRow}>
                                        <View style={styles.pill}>
                                            <Icon name="location-outline" size={12} color="#334462" style={{ marginRight: 4 }} />
                                            <Text style={styles.pillText}>{eventData.location}</Text>
                                        </View>
                                        <View style={styles.pill}>
                                            <Icon name="calendar-outline" size={12} color="#334462" style={{ marginRight: 4 }} />
                                            <Text style={styles.pillText}>{eventData.date}</Text>
                                        </View>
                                    </View>

                                    {/* View Button */}
                                    <TouchableOpacity style={styles.viewBtn}>
                                        <Text style={styles.viewText}>View</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>


                </View>
            </ScrollView>

            {/* Quote Section - Sticky Bottom */}
            <View style={styles.quoteSectionContainer}>
                <View style={styles.quoteSection}>
                    <TextInput
                        style={styles.quoteInput}
                        placeholder="Give a quote..."
                        placeholderTextColor="#ccc"
                        value={quoteText}
                        onChangeText={setQuoteText}
                    />
                    <TouchableOpacity style={styles.sendBtn} onPress={handleSendQuote}>
                        <Text style={styles.sendText}>Send</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },

    scrollContent: {
        flex: 1,
    },
    banner: {
        height: 250,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: 'hidden',
        paddingTop: 50,
    },
    headerIcons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
    },
    iconBtn: {
        padding: 8,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 18,
        marginTop: -100,
        width: '95%',
        alignSelf: 'center',
        boxShadow: '1px 1px 4px 0px #00000029',

    },
    metaRowHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E7F0FF80',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    budgetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E7F0FF80',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    budget: {
        fontSize: 14,
        color: '#666',
        textAlign: 'left',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,

    },
    titleSection: {
        flex: 1,
        alignItems: 'flex-start',
    },
    actionIcons: {
        flexDirection: 'column',
        gap: 8,
    },
    actionBtn: {
        padding: 8,
        backgroundColor: '#F4F4F4',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1D1B20',
        textAlign: 'left',
        marginBottom: 4,
    },
    location: {
        fontSize: 14,
        color: '#666',
        textAlign: 'left',
    },
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        // marginBottom: 20,
        gap: 8,
        paddingHorizontal: 0,
    },
    metaColumn: {
        flex: 1,
        // marginHorizontal: 4,
        justifyContent: 'center',
        alignItems: 'center',

    },
    metaLabel: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
        textAlign: 'left',
        paddingLeft: 0,
    },
    metaBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingVertical: 24,
        paddingHorizontal: 2,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: 40,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    metaValue: {
        fontSize: 11,
        color: '#1D1B20',
        fontWeight: '700',
        textAlign: 'center',
        paddingHorizontal: 0,
        flexShrink: 1,
        flexWrap: 'nowrap',
        includeFontPadding: false,
        numberOfLines: 1,
    },
    aboutSection: {
        marginVertical: 20,
        borderRadius: 10,
        padding: 10,
        boxShadow: '1px 1px 4px 0px #00000029',

    },
    aboutText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
        marginBottom: 10,
    },
    carousel: {
        width: '100%',
        marginBottom: 10,
    },
    carouselImage: {
        width: 300,
        height: 200,
        borderRadius: 10,
        marginRight: 0,
    },
    description: {
        fontSize: 12,
        color: '#2C3D5B',
        lineHeight: 18,
    },
    seeMoreText: {
        color: '#334462',
        fontWeight: '600',
        fontSize: 13,
    },
    userInfo: {
        borderRadius: 10,
        marginBottom: 20,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.16,
        shadowRadius: 4,
        elevation: 2,
        paddingVertical: 20,
        paddingHorizontal: 15,
    },

    userInfoContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },

    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        marginRight: 12,
    },

    organizerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1D1B20',
        flex: 1,
    },

    rating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    suggestionSection: {
        marginBottom: 20,
    },
    suggestionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#111',
        marginBottom: 10,
    },

    suggestionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111',
        marginBottom: 10,
        paddingHorizontal: 10,
    },

    suggestionList: {
        paddingLeft: 10,
        paddingRight: 10,
        gap: 16,
        marginBottom: 100, // Added extra space for sticky quote section
    },

    suggestionCard: {
        width: 320,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginRight: 16, // Match the gap for proper spacing
        position: 'relative',

        // Shadow (iOS)
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.16,
        shadowRadius: 4,

        // Shadow (Android)
        elevation: 4,
    },

    closeIcon: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#F3F7FF',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },

    durationTag: {
        alignSelf: 'flex-start',
        backgroundColor: '#E8F0FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 10,
    },

    durationText: {
        fontSize: 12,
        color: '#334462',
        fontWeight: '700',
    },

    suggestionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1D1B20',
        marginBottom: 8,
    },

    nameBoxContainer: {
        width: '100%',
        alignItems: 'flex-start',
        paddingVertical: 12,
    },

    nameBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    iconBox: {
        height: 24,
        width: 24,
        borderRadius: 12,
        backgroundColor: '#F3F7FF',
        justifyContent: 'center',
        alignItems: 'center',
    },

    suggestionOrganizer: {
        fontSize: 14,
        color: '#334462',
        fontWeight: '500',
    },

    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16,
    },

    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4F4F4',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },

    pillText: {
        fontSize: 12,
        color: '#334462',
    },

    viewBtn: {
        backgroundColor: '#2C3D5BF5',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 4,
    },

    viewText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },


    quoteSectionContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.42)',
        backdropFilter: 'blur(10px)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },

    quoteSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2C3D5B',
        padding: 16,
        borderRadius: 50,
    },

    quoteInput: {
        flex: 1,
        backgroundColor: 'transparent',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
        color: '#fff',
        marginRight: 10,
    },

    sendBtn: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },

    sendText: {
        color: '#2C3D5B',
        fontSize: 16,
        fontWeight: '600',
    },
    
    // New styles for dynamic sections
    tagsContainer: {
        marginTop: 15,
        marginBottom: 10,
    },
    tagsLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334462',
        marginBottom: 8,
    },
    tagsWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagPill: {
        backgroundColor: '#f0f4f8',
        borderRadius: 15,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    tagText: {
        fontSize: 12,
        color: '#334462',
        fontWeight: '500',
    },
    
    categoryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
        marginBottom: 10,
        gap: 10,
    },
    categoryItem: {
        flex: 1,
    },
    categoryLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    categoryPill: {
        backgroundColor: '#e3f2fd',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 8,
        alignItems: 'center',
    },
    categoryText: {
        fontSize: 12,
        color: '#1976d2',
        fontWeight: '600',
    },
    
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 15,
        gap: 10,
        flexWrap: 'wrap',
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    statusLabel: {
        fontSize: 12,
        color: '#666',
    },
    statusPill: {
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },

});