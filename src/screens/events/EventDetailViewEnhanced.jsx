import React, { useState, useEffect } from 'react';
import useInterstitialAd from '../../hooks/useInterstitialAd';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    Dimensions,
    Alert,
    ActivityIndicator,
    Platform,
    StatusBar,
    ImageBackground,
    KeyboardAvoidingView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { icons } from '../../assets/icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import img from '../../assets/images/dummy.png';
import bg1 from '../../assets/images/smallHeader.jpg';
import eventDetailsService from '../../services/eventDetailsService';
import vendorDetailsService from '../../services/vendorDetailsService';
import EventCardCarousel from './EventCardCarousel';
import { MEDIA_BASE_URL } from '../../services/api';
import { getCurrencySymbol } from '../../utils/currency';
import chatService from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');
const AVATAR_SIZE = 40;

export default function EventDetailViewEnhanced() {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = useAuth();

    const [quoteText, setQuoteText] = useState('');

    // Every Nth event-detail open triggers an interstitial.
    const tickInterstitial = useInterstitialAd();
    useEffect(() => { tickInterstitial(); }, [tickInterstitial]);
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    // Real organizer rating/count from the user-review system (the hardcoded
    // 5.0/10 in getOrganizerData was a placeholder). Same source as the User
    // Profile screen, so the two stay consistent.
    const [organizerRating, setOrganizerRating] = useState(0);
    const [organizerReviewCount, setOrganizerReviewCount] = useState(0);
    const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

    // Get event data from navigation params
    // Accept either a full event object (in-app navigation) or just an id
    // (deep link "event/:eventId" / notification tap) — the latter builds a
    // minimal stub so the screen still resolves the ad by id.
    const eventFromParams = route.params?.event
        || (route.params?.eventId
            ? { id: route.params.eventId, event_ad_id: route.params.eventId }
            : {});

    // Helper functions
    const parseDuration = (duration) => {
        if (!duration) return '04';
        const match = duration.match(/(\d+)/);
        return match ? match[1].padStart(2, '0') : '04';
    };

    const parseDate = (date) => {
        if (!date) return '30 May 2025';

        // If it's already a formatted string, return it
        if (typeof date === 'string' && !date.includes('-') && !date.includes('T')) {
            return date;
        }

        try {
            const dateObj = new Date(date);
            // Check if date is valid
            if (isNaN(dateObj.getTime())) {
                return '30 May 2025';
            }
            return dateObj.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return '30 May 2025';
        }
    };

    const parseBudget = (budget) => {
        if (!budget) return '150';
        if (typeof budget === 'string') return budget.replace(/[^0-9]/g, '');
        if (typeof budget === 'number') return budget.toString();
        return '150';
    };

    const getOrganizerData = (event) => {
        // Prefer the real owner's profile pic from the joined user row.
        // Backend ships event ads with `user: {profile_pic, full_name, …}`
        // — see eventEnhanced.service.js. Fall through to whatever legacy
        // fields existed before, then the local placeholder image.
        const user = event?.user || event?.User || event?.organizer || null;
        const organizerName =
            user?.full_name ||
            user?.name || // formatEventForDisplay's `organizer` uses `name`, not `full_name`
            [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() ||
            event.organizer_name ||
            event.user_name ||
            event.created_by_name ||
            'Organizer';
        const organizerAvatar =
            user?.profile_pic ||
            user?.avatar || // formatted organizer uses `avatar`
            event.organizer_avatar ||
            null;

        return {
            name: organizerName,
            avatar: organizerAvatar || img,
            // Real values come from the user-review fetch below; these are
            // just fallbacks until that resolves.
            rating: event.organizer_rating || 0,
            reviewCount: event.organizer_review_count || 0,
            user_id: user?.user_id || event.user_id,
        };
    };

    const eventData = {
        id: eventFromParams.id || eventFromParams.event_ad_id,
        title: eventFromParams.title || eventFromParams.event_type || 'Corporate Event',
        location: eventFromParams.location || 'Ontario, Canada',
        date: parseDate(eventFromParams.date),
        duration: parseDuration(eventFromParams.duration),
        time: eventFromParams.time || '07:00 pm',
        budget: parseBudget(eventFromParams.budget),
        currency: eventFromParams.currency || 'USD',
        guests: eventFromParams.guests || eventFromParams.guests_count || '200',
        description: eventFromParams.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
        // attachments / images can come in as a real array, a JSON-stringified
        // array from a TEXT column, or null. Normalize before .map() — the
        // crash was "string.map is not a function" when DB returned the
        // stringified shape and we trusted `.length > 0` as an array signal.
        images: (() => {
            const raw = eventFromParams.attachments || eventFromParams.images;
            let arr = raw;
            if (typeof raw === 'string') {
                try { arr = JSON.parse(raw); } catch (_) { arr = []; }
            }
            if (!Array.isArray(arr) || arr.length === 0) return [img];
            // Attachment urls/paths from raw rows are RELATIVE
            // ("/uploads/event-ads/..."). Without the media host the <Image>
            // gets a hostless uri and silently fails to load — which is why
            // images were blank when the detail was opened from the similar-
            // events carousel (the main list pre-formats to absolute urls).
            const toUri = (u) => {
                if (!u || typeof u !== 'string') return null;
                if (u.startsWith('http')) return u;
                return `${MEDIA_BASE_URL}${u.startsWith('/') ? '' : '/'}${u}`;
            };
            const out = arr
                .map((att) => {
                    const u = typeof att === 'string'
                        ? toUri(att)
                        : toUri(att?.url || att?.path || att?.file_url);
                    return u ? { uri: u } : null;
                })
                .filter(Boolean);
            return out.length > 0 ? out : [img];
        })(),
        organizer: getOrganizerData(eventFromParams),
        status: eventFromParams.status || 'active',
    };

    // Pull the organizer's real rating + review count (replaces the 5.0/10
    // placeholder). Keyed on user_id so it only refetches when the organizer
    // changes.
    const organizerUserId = eventData.organizer?.user_id;
    useEffect(() => {
        if (!organizerUserId) return undefined;
        let active = true;
        (async () => {
            const res = await vendorDetailsService.getUserReviews(organizerUserId);
            if (active && res.success && res.data) {
                setOrganizerRating(Number(res.data.averageRating) || 0);
                setOrganizerReviewCount(res.data.totalReviews || 0);
            }
        })();
        return () => { active = false; };
    }, [organizerUserId]);

    const handleSendQuote = async () => {
        if (!quoteText.trim()) {
            Alert.alert('Error', 'Please enter a quote message');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'You must be logged in to send a quote');
            return;
        }

        // Get event organizer's user_id
        const organizerUserId = eventData.organizer.user_id ||
            eventFromParams.user_id ||
            eventFromParams.organizer_id ||
            eventFromParams.created_by;

        if (!organizerUserId) {
            Alert.alert('Error', 'Unable to identify event organizer. Please try again.');
            return;
        }

        setIsSubmittingQuote(true);

        try {
            // Step 1: Create or get direct chat with event organizer
            const chatResult = await chatService.createDirectChat(organizerUserId);

            if (!chatResult.success) {
                Alert.alert('Error', chatResult.message || 'Failed to create chat with organizer');
                return;
            }

            const chatId = chatResult.data.chat_id;

            // Step 2: Format quote message — leading header line that names
            // the event + date so the organizer can immediately tell which
            // ad the quote is for, followed by a blank line and the
            // sender's typed message.
            const quoteMessage = `Message from event- "${eventData.title}" on "${eventData.date}"\n\n${quoteText.trim()}`;

            // Step 3: Send quote message
            const messageResult = await chatService.sendMessage(chatId, quoteMessage, 'text');

            if (messageResult.success) {
                Alert.alert(
                    'Quote Sent!',
                    'Your quote has been sent to the event organizer. They will respond to you via chat.',
                    [
                        {
                            text: 'View Chat',
                            onPress: () => {
                                navigation.navigate('ChatScreen', {
                                    chatId: chatId,
                                    chatTitle: eventData.organizer.name || 'Event Organizer',
                                });
                            }
                        },
                        {
                            text: 'OK',
                            style: 'default'
                        }
                    ]
                );
                setQuoteText('');
            } else {
                Alert.alert('Error', messageResult.message || 'Failed to send quote');
            }

        } catch (error) {
            console.error('Error sending quote:', error);
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmittingQuote(false);
        }
    };

    const handleShare = async () => {
        try {
            await eventDetailsService.shareEvent(eventData);
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        for (let i = 0; i < fullStars; i++) {
            stars.push(<Icon key={i} name="star" size={12} color="#FFB800" />);
        }
        const remainingStars = 5 - fullStars;
        for (let i = 0; i < remainingStars; i++) {
            stars.push(<Icon key={`empty-${i}`} name="star-outline" size={12} color="#FFB800" />);
        }
        return stars;
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

                <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Blue Header Banner */}
                <ImageBackground source={bg1} style={styles.banner} resizeMode="cover">
                    <View style={styles.headerIcons}>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                            <Icon name="arrow-back-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Icon name="notifications-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </ImageBackground>

                {/* Event Card */}
                <View style={styles.eventCard}>
                    {/* Title and Actions */}
                    <View style={styles.titleRow}>
                        <Text style={styles.eventTitle}>{eventData.title}</Text>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                                <Icon name="share-social-outline" size={20} color="#1E293B" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Location and Budget — location takes the remaining
                        width and ellipsizes; budget keeps its intrinsic width
                        on the right so a long location can't push it off the
                        card. */}
                    <View style={styles.metaInfo}>
                        <View style={styles.locationContainer}>
                            <Image source={icons.location} style={styles.locationIconImg} />
                            <Text style={styles.locationText} numberOfLines={1}>{eventData.location}</Text>
                        </View>
                        <View style={styles.budgetContainer}>
                            <Text style={styles.budgetLabel}>Budget </Text>
                            <Text style={[styles.budgetText, { fontWeight: '700' }]}>{getCurrencySymbol(eventData.currency)}</Text>
                            <Text style={styles.budgetText} numberOfLines={1}>{eventData.budget}</Text>
                        </View>
                    </View>

                    {/* Event Details Row */}
                    <View style={styles.detailsRow}>
                        <View style={styles.detailBox}>
                            <Text style={styles.detailLabel}>Date</Text>
                            <View style={styles.detailValueBox}>
                                <Text style={styles.detailValue}>{eventData.date}</Text>
                            </View>
                        </View>
                        <View style={styles.detailBox}>
                            <Text style={styles.detailLabel}>Duration</Text>
                            <View style={styles.detailValueBox}>
                                <Text style={styles.detailValue}>{eventData.duration}</Text>
                            </View>
                        </View>
                        <View style={styles.detailBox}>
                            <Text style={styles.detailLabel}>Time</Text>
                            <View style={styles.detailValueBox}>
                                <Text style={styles.detailValue}>{eventData.time}</Text>
                            </View>
                        </View>
                        <View style={styles.detailBox}>
                            <Text style={styles.detailLabel}>No. of Guest</Text>
                            <View style={styles.detailValueBox}>
                                <Text style={styles.detailValue}>{eventData.guests}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.aboutSection}>
                    <Text style={styles.sectionTitle}>About</Text>

                    {/* Images Carousel */}
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        style={styles.carousel}
                        nestedScrollEnabled={true}
                        snapToInterval={width - 40}
                        decelerationRate="fast"
                        snapToAlignment="start"
                        onScroll={(event) => {
                            const slideSize = event.nativeEvent.layoutMeasurement.width;
                            const index = Math.floor(event.nativeEvent.contentOffset.x / slideSize);
                            setCurrentImageIndex(index);
                        }}
                        scrollEventThrottle={16}
                    >
                        {eventData.images && eventData.images.length > 0 ? (
                            eventData.images.map((imageSource, idx) => (
                                <View key={idx} style={styles.photoWrapper}>
                                    <Image
                                        source={imageSource}
                                        style={styles.eventImage}
                                        resizeMode="cover"
                                        onError={(error) => {
                                            console.log('Error loading event image:', imageSource, error.nativeEvent?.error);
                                        }}
                                    />
                                </View>
                            ))
                        ) : (
                            <View style={styles.photoWrapper}>
                                <Image
                                    source={img}
                                    style={styles.eventImage}
                                    resizeMode="cover"
                                />
                            </View>
                        )}
                    </ScrollView>

                    {/* Description */}
                    <View style={styles.descContainer}>
                        <Text
                            style={styles.description}
                            numberOfLines={showFullDesc ? undefined : 3}
                        >
                            {eventData.description}
                        </Text>
                        {eventData.description.length > 150 && (
                            <TouchableOpacity onPress={() => setShowFullDesc(!showFullDesc)}>
                                <Text style={styles.readMoreText}>
                                    {showFullDesc ? 'Read less' : 'Read more'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* User Information */}
                <View style={styles.userInfoSection}>
                    <Text style={styles.sectionTitle}>User Information</Text>
                    <View style={styles.userCard}>
                        <View style={styles.userInfo}>
                            {/* Render the actual organiser avatar when we
                                have one (from the joined user row). Falls
                                back to the generic person-circle icon when
                                the organiser hasn't uploaded a profile pic. */}
                            {eventData?.organizer?.avatar &&
                            typeof eventData.organizer.avatar === 'string' ? (
                                <Image
                                    source={{ uri: eventData.organizer.avatar }}
                                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee' }}
                                />
                            ) : (
                                <Icon name="person-circle" size={40} color="#334462" />
                            )}
                            <Text style={styles.userName}>{eventData.organizer.name}</Text>
                        </View>
                        <View style={styles.ratingContainer}>
                            <View style={styles.stars}>
                                {renderStars(organizerRating)}
                            </View>
                            <Text style={styles.ratingText}>
                                {organizerRating.toFixed(1)} ({organizerReviewCount})
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.seeAllButton}
                        onPress={() => {
                            const userId = eventData.organizer.user_id ||
                                         eventFromParams.user_id ||
                                         eventFromParams._original?.user_id;

                            if (userId) {
                                navigation.navigate('UserProfile', {
                                    userId: userId,
                                    userName: eventData.organizer.name,
                                    userAvatar: eventData.organizer.avatar
                                });
                            } else {
                                Alert.alert('Error', 'Unable to view user profile');
                            }
                        }}
                    >
                        <Text style={styles.seeAllText}>See all</Text>
                    </TouchableOpacity>
                </View>

                {/* Similar Events — title intentionally not rendered here.
                    EventCardCarousel renders its own "You might also like"
                    header internally; duplicating it caused the empty
                    title block above the actual carousel. */}
                <View style={styles.similarSection}>
                    <EventCardCarousel
                        eventId={eventData.id}
                        eventCategory={eventData.event_type}
                        eventLocation={eventData.location}
                    />
                </View>

                {/* Bottom spacing for quote input */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Quote Input - Sticky Bottom */}
            <View style={styles.quoteSectionContainer}>
                <View style={styles.quoteSection}>
                    <TextInput
                        style={styles.quoteInput}
                        placeholder="Give a quote........"
                        placeholderTextColor="#ccc"
                        value={quoteText}
                        onChangeText={setQuoteText}
                        multiline
                        maxLength={500}
                        textAlignVertical="top"
                        editable={!isSubmittingQuote}
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, isSubmittingQuote && styles.sendBtnDisabled]}
                        onPress={handleSendQuote}
                        disabled={isSubmittingQuote}
                    >
                        {isSubmittingQuote ? (
                            <ActivityIndicator size="small" color="#2C3D5B" />
                        ) : (
                            <Text style={styles.sendText}>Send</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        flex: 1,
    },
    banner: {
        height: 240,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        overflow: 'hidden',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 10,
    },
    headerIcons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    iconBtn: {
        padding: 8,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#ffffff66',
    },
    eventCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 16,
        marginTop: -90,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.16,
        shadowRadius: 4,
        elevation: 3,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    eventTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginRight: 12,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    metaInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1, // take the leftover width so the budget stays on the card
        minWidth: 0, // allow the text child to shrink + ellipsize
    },
    locationIconImg: {
        width: 14,
        height: 14,
        resizeMode: 'contain',
    },
    locationText: {
        fontSize: 13,
        color: '#64748B',
        flexShrink: 1, // ellipsize long locations instead of overflowing
    },
    budgetContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 0, // never shrink — budget always fully visible
    },
    budgetLabel: {
        fontSize: 13,
        color: '#64748B',
    },
    budgetText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    detailsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    detailBox: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 10,
        color: '#64748B',
        marginBottom: 8,
        fontWeight: '500',
        textAlign: 'center',
    },
    detailValueBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 60,
    },
    detailValue: {
        fontSize: 11,
        color: '#1E293B',
        fontWeight: '600',
        textAlign: 'center',
    },
    aboutSection: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 16,
    },
    carousel: {
        marginBottom: 12,
        height: width - 40,
    },
    photoWrapper: {
        width: width - 40, // Full width minus margins (20 on each side)
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        backgroundColor: '#fff',
    },
    eventImage: {
        width: width - 40, // Full width single image display
        height: width - 40,
        borderRadius: 16,
    },
    descContainer: {
        marginTop: 12,
    },
    description: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 20,
    },
    readMoreText: {
        fontSize: 13,
        color: '#334462',
        fontWeight: '600',
        marginTop: 8,
        alignSelf: 'flex-end',
    },
    userInfoSection: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    userCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    ratingContainer: {
        alignItems: 'flex-end',
    },
    stars: {
        flexDirection: 'row',
        gap: 2,
        marginBottom: 4,
    },
    ratingText: {
        fontSize: 12,
        color: '#64748B',
    },
    seeAllButton: {
        alignSelf: 'flex-end',
    },
    seeAllText: {
        fontSize: 13,
        color: '#334462',
        fontWeight: '600',
    },
    similarSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    quoteSectionContainer: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 20,
        paddingVertical: 10,
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
        paddingVertical: 12,
        paddingHorizontal: 12,
        color: '#fff',
        marginRight: 10,
        minHeight: 45,
        maxHeight: 100,
    },
    sendBtn: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.7,
    },
    sendText: {
        color: '#2C3D5B',
        fontSize: 16,
        fontWeight: '600',
    },
});
