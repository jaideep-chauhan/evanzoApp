import React, { useState } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import img from '../../assets/images/dummy.png';
import { useTheme } from '../../ThemeContext';

const { width } = Dimensions.get('window');

export default function EventDetailView() {
    const navigation = useNavigation();
    const route = useRoute();
    const { event } = route.params || {};
    const theme = useTheme();

    const [quoteText, setQuoteText] = useState('');
    const [isFavorited, setIsFavorited] = useState(false);

    const eventData = event || {
        title: 'Corporate Event',
        location: 'Ontario, Canada',
        date: '30 May 2025',
        hours: '4 Hours',
        time: '07:00 PM',
        budget: '$1,500',
        description: 'Join us for an exclusive corporate networking event featuring industry leaders, innovative presentations, and valuable business connections. This event will showcase the latest trends in business development and provide opportunities for meaningful professional relationships.',
        photos: [img, img, img, img, img],
        organizer: {
            name: 'Tushar Dhania',
            avatar: img,
            rating: 5.0,
            reviewCount: 10,
        },
        reviews: [
            {
                id: 1,
                user: 'Alice Johnson',
                rating: 5,
                comment: 'Amazing event! Very well organized and professional.',
                date: '2024-07-01',
            },
            {
                id: 2,
                user: 'Bob Smith',
                rating: 4,
                comment: 'Great networking opportunities and excellent venue.',
                date: '2024-06-28',
            },
            {
                id: 3,
                user: 'Charlie Brown',
                rating: 5,
                comment: 'Highly recommended for corporate events.',
                date: '2024-06-15',
            },
        ]
    };

    const handleSendQuote = () => {
        console.log('Sending quote:', quoteText);
        setQuoteText('');
    };

    const toggleFavorite = () => {
        setIsFavorited(!isFavorited);
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <Icon key={i} name="star" size={14} color={theme.colors.primary} />
            );
        }

        if (hasHalfStar) {
            stars.push(
                <Icon key="half" name="star-half" size={14} color={theme.colors.primary} />
            );
        }

        const remainingStars = 5 - Math.ceil(rating);
        for (let i = 0; i < remainingStars; i++) {
            stars.push(
                <Icon key={`empty-${i}`} name="star-outline" size={14} color={theme.colors.primary} />
            );
        }

        return stars;
    };

    return (
        <ImageBackground source={theme.images.background} style={styles.backgroundImage} resizeMode="cover">
            <View style={[styles.overlay, { backgroundColor: theme.colors.overlay, opacity: theme.colors.overlayOpacity }]} />
            <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
                <View style={styles.androidPad} />
                <View style={[styles.headerBackground, { backgroundColor: 'transparent' }]}>
                    <View style={styles.headerIconsRow}>
                        <TouchableOpacity
                            style={styles.circleBtn}
                            onPress={() => navigation.goBack()}
                        >
                            <Icon name="arrow-back-outline" size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.circleBtn}>
                            <Icon name="notifications-outline" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    {/* Move info card here */}
                    <View style={styles.infoCardWrapper}>
                        <View style={styles.infoCard}>
                            <Text style={[styles.eventTitle, { color: theme.colors.primary }]}>{eventData.title}</Text>
                            <View style={[styles.locationBadge, { borderColor: theme.colors.primary + '33' }]}>
                                <Icon name="location" size={14} color={theme.colors.primary} />
                                <Text style={[styles.locationText, { color: theme.colors.primary }]}>{eventData.location}</Text>
                            </View>
                            <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteBtn}>
                                <Icon
                                    name={isFavorited ? "heart" : "heart-outline"}
                                    size={20}
                                    color={isFavorited ? "#e91e63" : "#666"}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Event Details */}
                    <View style={styles.card}>
                        <Text style={[styles.detailsTitle, { color: theme.colors.primary }]}>Event Details</Text>
                        <View style={styles.detailsContainer}>
                            <View style={styles.detailBox}>
                                <Icon name="calendar-outline" size={20} color={theme.colors.primary} style={styles.detailIcon} />
                                <Text style={styles.detailLabel}>Date</Text>
                                <Text style={[styles.detailValue, { color: theme.colors.primary }]}>{eventData.date}</Text>
                            </View>
                            <View style={styles.detailBox}>
                                <Icon name="time-outline" size={20} color={theme.colors.primary} style={styles.detailIcon} />
                                <Text style={styles.detailLabel}>Time</Text>
                                <Text style={[styles.detailValue, { color: theme.colors.primary }]}>{eventData.time}</Text>
                            </View>
                        </View>
                        <View style={styles.detailsContainer}>
                            <View style={styles.detailBox}>
                                <Icon name="hourglass-outline" size={20} color={theme.colors.primary} style={styles.detailIcon} />
                                <Text style={styles.detailLabel}>Duration</Text>
                                <Text style={[styles.detailValue, { color: theme.colors.primary }]}>{eventData.hours}</Text>
                            </View>
                            <View style={styles.detailBox}>
                                <Icon name="wallet-outline" size={20} color={theme.colors.primary} style={styles.detailIcon} />
                                <Text style={styles.detailLabel}>Budget</Text>
                                <Text style={[styles.detailValue, { color: theme.colors.primary }]}>{eventData.budget}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Photos Section */}
                    <View style={styles.card}>
                        <View style={styles.rowBetween}>
                            <Text style={styles.sectionTitle}>Photos</Text>
                            <Text style={[styles.linkText, { color: theme.colors.primary }]}>See all</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                            {eventData?.photos?.map((photo, idx) => (
                                <Image key={idx} source={photo} style={styles.photo} />
                            ))}
                        </ScrollView>
                    </View>

                    {/* Message Input */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Send a Quote</Text>
                        <View style={styles.messageBox}>
                            <Icon name="chatbubble-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                            <TextInput
                                placeholder="Type your quote..."
                                placeholderTextColor="#888"
                                style={[styles.input, { color: theme.colors.primary }]}
                                value={quoteText}
                                onChangeText={setQuoteText}
                                multiline
                            />
                            <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.colors.primary }]} onPress={handleSendQuote}>
                                <Icon name="send" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Text style={styles.descriptionText}>{eventData.description}</Text>
                    </View>

                    {/* Organizer Info */}
                    <View style={styles.card}>
                        <View style={styles.rowBetween}>
                            <Text style={styles.sectionTitle}>Event Organizer</Text>
                            <Text style={[styles.linkText, { color: theme.colors.primary }]}>View Profile</Text>
                        </View>
                        <View style={styles.organizerInfo}>
                            <Image
                                source={eventData.organizer.avatar}
                                style={styles.organizerAvatar}
                            />
                            <View style={styles.organizerDetails}>
                                <Text style={[styles.organizerName, { color: theme.colors.primary }]}>{eventData.organizer.name}</Text>
                                <View style={styles.ratingContainer}>
                                    <View style={styles.starsContainer}>
                                        {renderStars(eventData.organizer.rating)}
                                    </View>
                                    <Text style={styles.ratingText}>
                                        {eventData.organizer.rating} ({eventData.organizer.reviewCount})
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Review Section */}
                    <View style={styles.card}>
                        <View style={styles.rowBetween}>
                            <Text style={styles.sectionTitle}>Reviews</Text>
                            <Text style={[styles.linkText, { color: theme.colors.primary }]}>See all</Text>
                        </View>

                        <View style={{ marginTop: 14 }}>
                            {eventData.reviews && eventData.reviews.length > 0 ? (
                                eventData?.reviews?.map((review) => (
                                    <View key={review.id} style={styles.reviewBlock}>
                                        <View style={styles.rowBetween}>
                                            <Text style={[styles.reviewTitle, { color: theme.colors.primary }]}>{review.user}</Text>
                                            <Text style={styles.reviewDate}>{review.date}</Text>
                                        </View>
                                        <View style={styles.ratingRow}>
                                            {[...Array(5)].map((_, i) => (
                                                <Icon
                                                    key={i}
                                                    name="star"
                                                    size={16}
                                                    color={i < review.rating ? theme.colors.primary : "#E0E0E0"}
                                                />
                                            ))}
                                        </View>
                                        <Text style={styles.reviewDescription}>{review.comment}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={{ color: '#888', fontSize: 13 }}>No reviews yet.</Text>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
    },
    container: {
        flex: 1,
        zIndex: 2,
    },
    headerBackground: {
        backgroundColor: 'transparent',
        height: 50,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        paddingTop: 16,
        justifyContent: 'flex-start',
        position: 'relative',
        zIndex: 1,
        alignItems: 'center',
    },
    headerIconsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 16,
        zIndex: 2,
    },
    circleBtn: {
        backgroundColor: '#2F3E5C',
        padding: 10,
        borderRadius: 30,
    },
    infoCardWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: -180,
        alignItems: 'center',
        zIndex: 2,
    },
    infoCard: {
        backgroundColor: '#FCFAFA',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 16,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 6,
        width: width - 20,
        position: 'relative',
    },
    eventTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E2B4F',
        textAlign: 'center',
        marginBottom: 8,
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f4ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 4,
    },
    locationText: {
        fontSize: 12,
        color: '#1E2B4F',
        marginLeft: 4,
        fontWeight: '500',
    },
    favoriteBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#fff',
        marginTop: 140,
        paddingTop: 80,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        marginHorizontal: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 6,
        elevation: 4,
    },
    detailsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E2B4F',
        marginBottom: 16,
        textAlign: 'center',
    },
    detailsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 12,
    },
    detailBox: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#1E2B4F',
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
    },
    detailIcon: {
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 11,
        color: '#64748B',
        marginBottom: 6,
        textAlign: 'center',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E2B4F',
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
    },
    linkText: {
        color: '#1E2B4F',
        fontWeight: '500',
        fontSize: 14,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    photo: {
        width: 130,
        height: 130,
        borderRadius: 12,
        marginRight: 12,
    },
    messageBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        borderWidth: 1.2,
        borderColor: '#E5EAF2',
        borderRadius: 12,
        backgroundColor: '#F4F6FA',
        paddingHorizontal: 10,
        paddingVertical: 2,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 10,
        color: '#1E2B4F',
        fontSize: 15,
        backgroundColor: 'transparent',
    },
    sendBtn: {
        backgroundColor: '#1E2B4F',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    descriptionText: {
        color: '#444',
        fontSize: 14,
        lineHeight: 20,
        marginTop: 8,
    },
    organizerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    organizerAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    organizerDetails: {
        flex: 1,
    },
    organizerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E2B4F',
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    starsContainer: {
        flexDirection: 'row',
    },
    ratingText: {
        fontSize: 12,
        color: '#666',
    },
    reviewBlock: {
        marginBottom: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        paddingBottom: 12,
    },
    reviewTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
        color: '#1E2B4F',
    },
    reviewDate: {
        fontSize: 12,
        color: '#888',
    },
    ratingRow: {
        flexDirection: 'row',
        gap: 2,
        marginBottom: 6,
        marginTop: 2,
    },
    reviewDescription: {
        color: '#666',
        fontSize: 13,
        marginBottom: 4,
    },
});
