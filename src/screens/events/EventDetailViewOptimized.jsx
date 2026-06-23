import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
    InteractionManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import img from '../../assets/images/dummy.png';
import bg1 from '../../assets/images/smallHeader.jpg';
import Icon2 from 'react-native-vector-icons/Feather';
import Icon3 from 'react-native-vector-icons/Entypo';
import { API_BASE_URL } from '../../services/api';
import eventDetailsService from '../../services/eventDetailsService';
import EventCardCarousel from './EventCardCarousel';
import { getCurrencySymbol } from '../../utils/currency';

const AVATAR_SIZE = 60;

// Memoized helper functions
const parseDuration = (duration) => {
    if (!duration) return '2';
    const match = duration.match(/(\d+)/);
    return match ? match[1] : '2';
};

const parseDate = (date) => {
    if (!date) return 'Date TBD';
    if (typeof date === 'string' && !date.includes('-')) return date;
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

const parseBudget = (budget, currency) => {
    if (!budget) return 'Budget TBD';
    if (typeof budget === 'string') return budget;
    if (typeof budget === 'number') {
        return `${getCurrencySymbol(currency)}${budget.toLocaleString()}`;
    }
    return 'Budget TBD';
};

// Skeleton loader component
const SkeletonLoader = () => (
    <View style={styles.skeletonContainer}>
        <View style={[styles.skeletonBanner, { backgroundColor: '#e1e1e1' }]} />
        <View style={styles.skeletonContent}>
            <View style={[styles.skeletonTitle, { backgroundColor: '#e1e1e1' }]} />
            <View style={[styles.skeletonText, { backgroundColor: '#e1e1e1', width: '80%' }]} />
            <View style={[styles.skeletonText, { backgroundColor: '#e1e1e1', width: '60%' }]} />
        </View>
    </View>
);

export default function EventDetailViewOptimized() {
    const navigation = useNavigation();
    const route = useRoute();
    
    // State
    const [quoteText, setQuoteText] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [descTruncated, setDescTruncated] = useState(false);
    const [isContentReady, setIsContentReady] = useState(false);
    const [headerImageLoaded, setHeaderImageLoaded] = useState(false);
    
    const scrollViewRef = useRef(null);
    const eventFromParams = route.params?.event || {};

    // Memoized organizer data
    const getOrganizerData = useCallback((event) => {
        if (event.organizer) return event.organizer;
        if (event.profile) return event.profile;

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
    }, []);

    // Memoized event data processing
    const eventData = useMemo(() => {
        const processEventTags = () => {
            const tags = eventFromParams.event_tags;
            if (!tags) return [];
            if (Array.isArray(tags)) return tags;
            if (typeof tags === 'string') {
                try {
                    const parsed = JSON.parse(tags);
                    return Array.isArray(parsed) ? parsed : [];
                } catch {
                    return tags.includes(',') ? tags.split(',').map(t => t.trim()) : [tags];
                }
            }
            return [];
        };

        const processImages = () => {
            const images = eventFromParams.attachments || eventFromParams.images || [];
            if (images.length === 0) return [img, bg1, img];
            
            return images.map(att => {
                if (typeof att === 'string') {
                    return att.startsWith('http') ? att : att;
                } else if (att.url) {
                    return att.url;
                } else if (att.path) {
                    return `https://api.evnzo.com${att.path}`;
                }
                return img;
            });
        };

        return {
            id: eventFromParams.id || eventFromParams.event_ad_id,
            title: eventFromParams.title || `${eventFromParams.event_type || 'Event'} - ${eventFromParams.service_needed || 'Service'}`,
            location: eventFromParams.location || 'Location TBD',
            date: parseDate(eventFromParams.date),
            duration: parseDuration(eventFromParams.duration),
            time: eventFromParams.time || '07:00 pm',
            budget: parseBudget(eventFromParams.budget, eventFromParams.currency),
            guests: eventFromParams.guests || eventFromParams.guests_count || '50',
            description: eventFromParams.description || 'Event description not available.',
            service_needed: eventFromParams.service_needed,
            event_type: eventFromParams.event_type,
            event_tags: processEventTags(),
            requirements: eventFromParams.requirements || [],
            is_urgent: eventFromParams.is_urgent || false,
            visibility: eventFromParams.visibility || 'public',
            images: processImages(),
            organizer: getOrganizerData(eventFromParams),
            status: eventFromParams.status || 'active',
            statusColor: eventFromParams.status === 'completed' ? '#28a745' :
                eventFromParams.status === 'cancelled' ? '#dc3545' : '#2ECC71',
            views_count: eventFromParams.views_count || 0,
            responses_count: eventFromParams.responses_count || 0,
            boosted: eventFromParams.boosted || false,
            created_at: eventFromParams.created_at,
            updated_at: eventFromParams.updated_at
        };
    }, [eventFromParams, getOrganizerData]);

    // Load content after navigation animation
    useEffect(() => {
        InteractionManager.runAfterInteractions(() => {
            setIsContentReady(true);
        });
    }, []);

    // Check saved status
    useEffect(() => {
        if (!isContentReady) return;
        
        const checkSavedStatus = async () => {
            const eventId = eventData.id;
            if (!eventId) {
                setIsCheckingStatus(false);
                return;
            }

            try {
                const saved = await eventDetailsService.isEventSaved(eventId);
                setIsSaved(saved);
            } catch (error) {
                console.error('Error checking saved status:', error);
            } finally {
                setIsCheckingStatus(false);
            }
        };

        checkSavedStatus();
    }, [eventData.id, isContentReady]);

    // Check description truncation
    useEffect(() => {
        if (eventData.description && eventData.description.length > 150) {
            setDescTruncated(true);
        } else {
            setDescTruncated(false);
        }
        setShowFullDesc(false);
    }, [eventData.description]);

    const handleSendQuote = useCallback(async () => {
        if (!quoteText.trim()) {
            Alert.alert('Empty Quote', 'Please enter your quote before sending.');
            return;
        }

        Alert.alert(
            'Quote Sent!',
            `Your quote has been sent to ${eventData.organizer.name}. They will be able to see your response and contact you if interested.`,
            [{ text: 'OK', onPress: () => setQuoteText('') }]
        );
    }, [quoteText, eventData.organizer.name]);

    const handleSave = useCallback(async () => {
        if (isLoading) return;
        
        setIsLoading(true);
        try {
            const eventId = eventData.id;
            if (isSaved) {
                await eventDetailsService.unsaveEvent(eventId);
                setIsSaved(false);
            } else {
                await eventDetailsService.saveEvent(eventId);
                setIsSaved(true);
            }
        } catch (error) {
            Alert.alert('Error', `Failed to ${isSaved ? 'unsave' : 'save'} event. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    }, [isSaved, isLoading, eventData.id]);

    const handleShare = useCallback(async () => {
        try {
            const { Share } = await import('react-native');
            await Share.share({
                message: `Check out this event: ${eventData.title}\n\nLocation: ${eventData.location}\nDate: ${eventData.date}\nBudget: ${eventData.budget}`,
                title: eventData.title,
            });
        } catch (error) {
            console.error('Share exception:', error);
        }
    }, [eventData]);

    const renderStars = useCallback((rating) => {
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
    }, []);

    // Show skeleton loader while content is loading
    if (!isContentReady) {
        return <SkeletonLoader />;
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Use FastImage for better performance */}
                <FastImage 
                    source={typeof bg1 === 'number' ? bg1 : { uri: bg1 }}
                    style={styles.banner}
                    resizeMode={FastImage.resizeMode.cover}
                    onLoad={() => setHeaderImageLoaded(true)}
                >
                    {headerImageLoaded && (
                        <View style={styles.headerIcons}>
                            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                                <Icon name="arrow-back-outline" size={20} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconBtn}>
                                <Icon2 name="bell" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}
                </FastImage>

                <View style={styles.infoCard}>
                    <View style={styles.headerRow}>
                        <View style={styles.titleSection}>
                            <Text style={styles.title}>{eventData.title}</Text>
                            <View style={styles.metaRowHeader}>
                                <View style={styles.locationRow}>
                                    <Icon name="location-outline" size={14} color="#334462" style={{ marginRight: 4 }} />
                                    <Text style={styles.location}>{eventData.location}</Text>
                                </View>
                                <View style={styles.budgetRow}>
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
                                        size={22}
                                        color={isSaved ? '#e91e63' : '#334462'}
                                    />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Event Tags */}
                    {eventData.event_tags && eventData.event_tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                            {eventData.event_tags.map((tag, index) => (
                                <View key={index} style={styles.tag}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Description */}
                    <View style={styles.descriptionContainer}>
                        <Text
                            style={styles.description}
                            numberOfLines={showFullDesc ? undefined : 3}
                        >
                            {eventData.description}
                        </Text>
                        {descTruncated && (
                            <TouchableOpacity onPress={() => setShowFullDesc(!showFullDesc)}>
                                <Text style={styles.readMore}>
                                    {showFullDesc ? 'Show Less' : 'Read More'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Event Details Grid */}
                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Icon name="calendar-outline" size={16} color="#7B8599" />
                            <Text style={styles.detailText}>{eventData.date}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Icon name="time-outline" size={16} color="#7B8599" />
                            <Text style={styles.detailText}>{eventData.time}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Icon name="hourglass-outline" size={16} color="#7B8599" />
                            <Text style={styles.detailText}>{eventData.duration} days</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Icon name="people-outline" size={16} color="#7B8599" />
                            <Text style={styles.detailText}>{eventData.guests} guests</Text>
                        </View>
                    </View>

                    {/* Event Images with Lazy Loading */}
                    {eventData.images && eventData.images.length > 0 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.imagesContainer}
                        >
                            {eventData.images.map((image, index) => (
                                <FastImage
                                    key={index}
                                    source={typeof image === 'string' ? { uri: image } : image}
                                    style={styles.eventImage}
                                    resizeMode={FastImage.resizeMode.cover}
                                />
                            ))}
                        </ScrollView>
                    )}

                    {/* Profile Section */}
                    <View style={styles.profileSection}>
                        <View style={styles.profileInfo}>
                            <FastImage
                                source={typeof eventData.organizer.avatar === 'string' ? 
                                    { uri: eventData.organizer.avatar } : eventData.organizer.avatar}
                                style={styles.avatar}
                                resizeMode={FastImage.resizeMode.cover}
                            />
                            <View style={styles.profileText}>
                                <Text style={styles.profileName}>{eventData.organizer.name}</Text>
                                <View style={styles.ratingRow}>
                                    <View style={styles.stars}>
                                        {renderStars(eventData.organizer.rating)}
                                    </View>
                                    <Text style={styles.reviewCount}>
                                        ({eventData.organizer.reviewCount} reviews)
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.profileBtn}>
                            <Text style={styles.profileBtnText}>View Profile</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Quote Section */}
                    <View style={styles.quoteSection}>
                        <Text style={styles.quoteTitle}>Send a Quote</Text>
                        <TextInput
                            style={styles.quoteInput}
                            placeholder="Enter your quote and message..."
                            placeholderTextColor="#7B8599"
                            multiline
                            value={quoteText}
                            onChangeText={setQuoteText}
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                        <TouchableOpacity style={styles.sendBtn} onPress={handleSendQuote}>
                            <Text style={styles.sendBtnText}>Send Quote</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Similar Events Carousel */}
                <EventCardCarousel />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FD',
    },
    scrollContent: {
        flex: 1,
    },
    banner: {
        width: '100%',
        height: 200,
        justifyContent: 'space-between',
    },
    headerIcons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: -40,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    titleSection: {
        flex: 1,
        paddingRight: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1C2340',
        marginBottom: 8,
    },
    metaRowHeader: {
        gap: 8,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    location: {
        fontSize: 14,
        color: '#334462',
    },
    budgetRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    budget: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2ECC71',
    },
    actionIcons: {
        flexDirection: 'row',
        gap: 10,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F7F9FD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 15,
    },
    tag: {
        backgroundColor: '#F0F3F7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    tagText: {
        fontSize: 12,
        color: '#334462',
    },
    descriptionContainer: {
        marginBottom: 20,
    },
    description: {
        fontSize: 14,
        color: '#7B8599',
        lineHeight: 20,
    },
    readMore: {
        fontSize: 14,
        color: '#2196F3',
        fontWeight: '600',
        marginTop: 5,
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
        gap: 15,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        width: '45%',
    },
    detailText: {
        fontSize: 14,
        color: '#334462',
    },
    imagesContainer: {
        marginBottom: 20,
    },
    eventImage: {
        width: 200,
        height: 150,
        borderRadius: 10,
        marginRight: 10,
    },
    profileSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#F0F3F7',
        marginBottom: 20,
    },
    profileInfo: {
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
    profileText: {
        flex: 1,
    },
    profileName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C2340',
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stars: {
        flexDirection: 'row',
        marginRight: 5,
    },
    reviewCount: {
        fontSize: 12,
        color: '#7B8599',
    },
    profileBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F0F3F7',
    },
    profileBtnText: {
        fontSize: 14,
        color: '#334462',
        fontWeight: '500',
    },
    quoteSection: {
        marginTop: 20,
    },
    quoteTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C2340',
        marginBottom: 12,
    },
    quoteInput: {
        backgroundColor: '#F7F9FD',
        borderRadius: 12,
        padding: 15,
        fontSize: 14,
        color: '#1C2340',
        minHeight: 100,
        marginBottom: 15,
    },
    sendBtn: {
        backgroundColor: '#2196F3',
        borderRadius: 25,
        paddingVertical: 12,
        alignItems: 'center',
    },
    sendBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    // Skeleton styles
    skeletonContainer: {
        flex: 1,
        backgroundColor: '#F7F9FD',
    },
    skeletonBanner: {
        width: '100%',
        height: 200,
    },
    skeletonContent: {
        padding: 20,
    },
    skeletonTitle: {
        width: '70%',
        height: 24,
        borderRadius: 4,
        marginBottom: 10,
    },
    skeletonText: {
        height: 16,
        borderRadius: 4,
        marginBottom: 8,
    },
});