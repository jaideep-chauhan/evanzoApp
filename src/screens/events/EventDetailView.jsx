import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    ImageBackground,
    Alert,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import img from '../../assets/images/dummy.png';
import bg1 from '../../assets/images/smallHeader.jpg';
import Icon2 from 'react-native-vector-icons/Feather'
import Icon3 from 'react-native-vector-icons/Entypo'
import { API_BASE_URL } from '../../services/api';
import eventDetailsService from '../../services/eventDetailsService';
import EventCardCarousel from './EventCardCarousel';
const AVATAR_SIZE = 60;

export default function EventDetailView() {
    const navigation = useNavigation();
    const route = useRoute();

    const [quoteText, setQuoteText] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [descTruncated, setDescTruncated] = useState(false);
    const descTextRef = useRef(null);
    const [textMeasured, setTextMeasured] = useState(false);
    const scrollViewRef = useRef(null);

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
        event_tags: (() => {
            // Handle different formats of event_tags
            const tags = eventFromParams.event_tags;
            if (!tags) return [];
            if (Array.isArray(tags)) return tags;
            if (typeof tags === 'string') {
                // Try to parse if it's JSON string
                try {
                    const parsed = JSON.parse(tags);
                    return Array.isArray(parsed) ? parsed : [];
                } catch {
                    // If not JSON, split by comma or return as single item
                    return tags.includes(',') ? tags.split(',').map(t => t.trim()) : [tags];
                }
            }
            return [];
        })(),

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


    // Handle save/unsave event - using real API
    const handleSave = async () => {
        if (isLoading) return;

        setIsLoading(true);
        const eventId = eventData.id || eventData.event_ad_id;

        try {
            console.log('Toggling save for event:', {
                eventId,
                title: eventData.title,
                currentState: isSaved
            });

            // Use the real API service
            const response = await eventDetailsService.toggleSaveEvent(eventId);

            if (response.success) {
                const newSavedState = response.saved;
                setIsSaved(newSavedState);

                // Show Instagram-like feedback
                const message = newSavedState
                    ? `Added to saved events`
                    : `Removed from saved events`;

                Alert.alert(
                    newSavedState ? '❤️ Saved' : '💔 Removed',
                    message
                );
            } else {
                console.error('Failed to toggle save event:', response.message);
                Alert.alert('Error', response.message || 'Failed to save event');
            }
        } catch (error) {
            console.error('Error toggling save event:', error);
            Alert.alert('Error', 'Failed to save event. Please try again.');
        } finally {
            setIsLoading(false);
        }
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

    // Check if event is already saved when component loads
    useEffect(() => {
        const checkSavedStatus = async () => {
            const eventId = eventData.id || eventData.event_ad_id;
            if (!eventId) {
                setIsCheckingStatus(false);
                return;
            }

            try {
                console.log('Checking if event is saved:', eventId);
                const isSaved = await eventDetailsService.isEventSaved(eventId);
                setIsSaved(isSaved);
            } catch (error) {
                console.error('Error checking saved status:', error);
                setIsSaved(false);
            } finally {
                setIsCheckingStatus(false);
            }
        };

        setIsCheckingStatus(true);
        checkSavedStatus();
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
                                disabled={isLoading || isCheckingStatus}
                            >
                                {(isLoading || isCheckingStatus) ? (
                                    <ActivityIndicator size="small" color="#e91e63" />
                                ) : (
                                    <Icon
                                        name={isSaved ? "heart" : "heart-outline"}
                                        size={20}
                                        color={isSaved ? "#e91e63" : "#334462"}
                                    />
                                )}
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

                    {/* Event Type and Service Needed Section */}
                    <View style={styles.eventDetailsContainer}>
                        {/* Event Type Card */}
                        {eventData.event_type && (
                            <View style={styles.detailCard}>
                                <View style={styles.detailCardHeader}>
                                    <Icon name="calendar-outline" size={16} color="#2C3D5B" />
                                    <Text style={styles.detailCardTitle}>Event Type</Text>
                                </View>
                                <View style={styles.detailCardContent}>
                                    <View style={styles.eventTypePill}>
                                        <Text style={styles.eventTypeText}>{eventData.event_type}</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Service Needed Card */}
                        {eventData.service_needed && (
                            <View style={styles.detailCard}>
                                <View style={styles.detailCardHeader}>
                                    <Icon name="briefcase-outline" size={16} color="#2C3D5B" />
                                    <Text style={styles.detailCardTitle}>Service Needed</Text>
                                </View>
                                <View style={styles.detailCardContent}>
                                    <View style={styles.serviceNeededPill}>
                                        <Text style={styles.serviceNeededText}>{eventData.service_needed}</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Event Tags Section */}
                    {/* {eventData.event_tags && Array.isArray(eventData.event_tags) && eventData.event_tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                            <View style={styles.tagsHeader}>
                                <Icon name="pricetags-outline" size={16} color="#666" />
                                <Text style={styles.tagsTitle}>Event Tags</Text>
                            </View>
                            <View style={styles.tagsContent}>
                                {eventData.event_tags.map((tag, index) => (
                                    <View key={index} style={styles.tagPill}>
                                        <Text style={styles.tagText}>#{typeof tag === 'string' ? tag : String(tag)}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )} */}

                    {/* Status Section */}
                    <View style={styles.statusSection}>
                        <View style={styles.statusHeader}>
                            <View style={styles.statusMainInfo}>
                                <Text style={styles.statusSectionTitle}>Event Status</Text>
                                <View style={[styles.statusBadge, { backgroundColor: eventData.statusColor + '20' }]}>
                                    <View style={[styles.statusDot, { backgroundColor: eventData.statusColor }]} />
                                    <Text style={[styles.statusBadgeText, { color: eventData.statusColor }]}>
                                        {eventData.status.toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                            {eventData.is_urgent && (
                                <View style={styles.urgentBadge}>
                                    <Icon name="alert-circle" size={14} color="#ff4757" />
                                    <Text style={styles.urgentText}>URGENT</Text>
                                </View>
                            )}
                        </View>

                        {/* Metadata Row */}
                        {/* <View style={styles.metadataRow}> */}
                        {/* {eventData.views_count > 0 && (
                            <View style={styles.metadataItem}>
                                <Icon name="eye-outline" size={14} color="#666" />
                                <Text style={styles.metadataText}>{eventData.views_count} views</Text>
                            </View>
                        )}
                        {eventData.responses_count > 0 && (
                            <View style={styles.metadataItem}>
                                <Icon name="chatbubbles-outline" size={14} color="#666" />
                                <Text style={styles.metadataText}>{eventData.responses_count} responses</Text>
                            </View>
                        )}
                        {eventData.boosted && (
                            <View style={styles.metadataItem}>
                                <Icon name="trending-up" size={14} color="#f39c12" />
                                <Text style={[styles.metadataText, { color: '#f39c12' }]}>Boosted</Text>
                            </View>
                        )} */}
                        {/* </View>  */}
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

                    {/* Suggestion Section - Dynamic Similar Events */}
                    <EventCardCarousel
                        eventId={eventData.id}
                        eventCategory={eventData.category || eventData.event_type}
                        eventLocation={eventData.location}
                    />


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

    // New Event Details Styles
    eventDetailsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 15,
        marginBottom: 10,
    },
    detailCard: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    detailCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    detailCardTitle: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    detailCardContent: {
        alignItems: 'center',
    },
    eventTypePill: {
        backgroundColor: '#e3f2fd',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    eventTypeText: {
        fontSize: 13,
        color: '#1976d2',
        fontWeight: '600',
    },
    serviceNeededPill: {
        backgroundColor: '#f3e5f5',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    serviceNeededText: {
        fontSize: 13,
        color: '#8e24aa',
        fontWeight: '600',
    },

    // Tags Section Styles
    tagsContainer: {
        backgroundColor: '#fafafa',
        borderRadius: 12,
        padding: 14,
        marginTop: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    tagsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    tagsTitle: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    tagsContent: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagPill: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    tagText: {
        fontSize: 12,
        color: '#555',
        fontWeight: '500',
    },

    // Status Section Styles
    statusSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginTop: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#e9ecef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusMainInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statusSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    urgentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ff475720',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    urgentText: {
        fontSize: 11,
        color: '#ff4757',
        fontWeight: '600',
    },
    metadataRow: {
        flexDirection: 'row',
        gap: 16,
        flexWrap: 'wrap',
    },
    metadataItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metadataText: {
        fontSize: 12,
        color: '#666',
    },

    // Keep old styles for compatibility
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