import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import VendorCard from '../VendorCard';
import vendorDetailsService from '../../../services/vendorDetailsService';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { getImageSource } from '../../../utils/imageUtils';
import img from '../../../assets/images/dummy.png';


const dummyReviews = [
    {
        id: 1,
        title: 'Meeting with customer',
        description:
            'First, a disclaimer – the entire process writing a blog post often takes a couple of hours if you can type',
        name: 'Raya James',
        avatar: 'https://i.pravatar.cc/100?img=5',
        rating: 2,
        comments: 6,
    },
    {
        id: 2,
        title: 'Meeting with customer',
        description:
            'First, a disclaimer – the entire process writing a blog post often takes a couple of hours if you can type',
        name: 'Raya James',
        avatar: 'https://i.pravatar.cc/100?img=6',
        rating: 4,
        comments: 6,
    },
    {
        id: 3,
        title: 'Meeting with customer',
        description:
            'First, a disclaimer – the entire process writing a blog post often takes a couple of hours if you can type',
        name: 'Raya James',
        avatar: 'https://i.pravatar.cc/100?img=7',
        rating: 5,
        comments: 6,
    },
];

const vendors = [
    {
        initials: '4S',
        name: '4x90 Studio',
        type: 'Photography',
        rating: 5,
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do',
        images: [img, img, img],
        extraCount: 10,
        location: 'Toronto, ON',
    },
    {
        initials: 'AB',
        name: 'Alpha Bakers',
        type: 'Bakery',
        rating: 4.5,
        description: 'Freshly baked goods for every occasion.',
        images: [img, img, img],
        extraCount: 5,
        location: 'Vancouver, BC',
    },
    {
        initials: 'DJ',
        name: 'DJ Max',
        type: 'Music',
        rating: 4.8,
        description: 'Professional DJ services for weddings and parties.',
        images: [img, img, img],
        extraCount: 7,
        location: 'Toronto, ON',
    },
    {
        initials: 'FL',
        name: 'Floral Lane',
        type: 'Florist',
        rating: 4.7,
        description: 'Beautiful flower arrangements and bouquets.',
        images: [img, img, img],
        extraCount: 3,
        location: 'Montreal, QC',
    },
    {
        initials: 'CT',
        name: 'Catering Time',
        type: 'Catering',
        rating: 4.9,
        description: 'Delicious food and excellent service for your events.',
        images: [img, img, img],
        extraCount: 8,
        location: 'Calgary, AB',
    },
    {
        initials: 'EV',
        name: 'Eventify',
        type: 'Event Planner',
        rating: 5,
        description: 'Making your events memorable and stress-free.',
        images: [img, img, img],
        extraCount: 12,
        location: 'Toronto, ON',
    },
    {
        initials: 'PH',
        name: 'PhotoHub',
        type: 'Photography',
        rating: 4.6,
        description: 'Capturing moments that last a lifetime.',
        images: [img, img, img],
        extraCount: 6,
        location: 'Vancouver, BC',
    },
    {
        initials: 'DS',
        name: 'Decor Studio',
        type: 'Decor',
        rating: 4.4,
        description: 'Creative decor solutions for all occasions.',
        images: [img, img, img],
        extraCount: 4,
        location: 'Ottawa, ON',
    },
];

// Review media on the DB lives in a TEXT column holding a JSON-stringified
// array of `{file_url, ...}` objects (or sometimes plain URL strings). Parse
// it into a uniform array and prepend the API host for relative paths so
// <Image> can actually load each thumbnail.
//
// Also force any `http://api.evnzo.com/...` URL to `https://` — historic
// records were stored with http because the backend ran without
// `trust proxy` set and `req.protocol` resolved to the in-cluster scheme.
// iOS App Transport Security silently blocks plaintext HTTP image loads,
// so without this rewrite the thumbnails render as blank tiles.
const HOST = 'https://api.evnzo.com';
const forceHttps = (u) => {
    if (typeof u !== 'string') return u;
    if (u.startsWith('http://api.evnzo.com')) return u.replace('http://', 'https://');
    return u;
};
const normalizeReviewMedia = (raw) => {
    if (!raw) return [];
    let arr = raw;
    if (typeof arr === 'string') {
        try {
            arr = JSON.parse(arr);
        } catch (_) {
            return [];
        }
    }
    if (!Array.isArray(arr)) return [];
    return arr
        .map((m) => {
            if (typeof m === 'string') {
                const url = m.startsWith('http')
                    ? forceHttps(m)
                    : `${HOST}${m.startsWith('/') ? '' : '/'}${m}`;
                return { file_url: url };
            }
            if (m && typeof m === 'object') {
                const rawUrl = m.file_url || m.url || m.uri;
                if (!rawUrl) return null;
                const url = rawUrl.startsWith('http')
                    ? forceHttps(rawUrl)
                    : `${HOST}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
                return { ...m, file_url: url };
            }
            return null;
        })
        .filter(Boolean);
};

export default function ReviewList({ navigation }) {
    const route = useRoute();
    const [activeTab, setActiveTab] = useState('REVIEWS');
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [reviewStats, setReviewStats] = useState({
        totalReviews: 0,
        averageRating: 0
    });
    
    // Get vendor ID from route params
    const vendorId = route.params?.vendorId;
    const vendorName = route.params?.vendorName || 'Vendor';
    
    console.log('ReviewList - vendorId:', vendorId, 'vendorName:', vendorName);

    // Fetch reviews when component mounts
    useEffect(() => {
        if (vendorId) {
            fetchReviews();
        }
    }, [vendorId]);

    // Refetch on every focus, so coming back from the Write-a-Review screen
    // (or from any push that mutated reviews) shows fresh data without a
    // manual pull-to-refresh.
    useFocusEffect(
        useCallback(() => {
            if (vendorId) {
                fetchReviews();
            }
            return undefined;
        }, [vendorId]),
    );

    const fetchReviews = async (isRefresh = false) => {
        if (!vendorId) {
            console.warn('No vendor ID provided');
            return;
        }

        try {
            if (isRefresh) {
                setRefreshing(true);
            } else if (reviews.length === 0) {
                // Only show the big loader on first paint. Subsequent focus
                // refreshes (returning from the Write-a-Review screen) keep
                // the existing list visible and swap in fresh data silently.
                setIsLoading(true);
            }

            console.log('Fetching reviews for vendor:', vendorId);
            const response = await vendorDetailsService.getVendorReviews(vendorId, 1, 50);
            
            console.log('Reviews response:', response);

            if (response.success && response.data) {
                const reviewsData = response.data.reviews || response.data;
                // Normalize each review so the renderer can read consistent
                // fields. Two things to fix:
                //  1) `media_attachments` is stored as a JSON-stringified
                //     array on the DB — string `.length` is truthy and
                //     `.map` iterates characters, breaking the renderer.
                //  2) Attachment URLs may be relative (`/uploads/...`) and
                //     need the API host prepended before <Image> can load.
                const normalized = (Array.isArray(reviewsData) ? reviewsData : []).map(
                    (r) => ({
                        ...r,
                        media_attachments: normalizeReviewMedia(r.media_attachments),
                        rating: Number(r.rating) || 0,
                    }),
                );
                setReviews(normalized);

                // PostgreSQL DECIMAL columns come back from the API as strings
                // (Sequelize never coerces them to JS numbers). Force-cast at
                // the boundary so render-time `.toFixed(1)` doesn't blow up.
                const avgRaw = response.data.averageRating;
                const avgNum = Number(avgRaw);
                setReviewStats({
                    totalReviews: Number(response.data.totalReviews) || normalized.length || 0,
                    averageRating: Number.isFinite(avgNum) ? avgNum : 0,
                });
            } else {
                // Real empty state — don't seed dummy "Raya James" reviews.
                console.warn('Failed to fetch reviews:', response.message);
                setReviews([]);
                setReviewStats({ totalReviews: 0, averageRating: 0 });
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            setReviews([]);
            setReviewStats({ totalReviews: 0, averageRating: 0 });
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        fetchReviews(true);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'ADS':
                return (
                    <View style={styles.adsContainer}>
                        {vendors.map((vendor, idx) => (
                            <VendorCard
                                key={idx}
                                initials={vendor.initials}
                                name={vendor.name}
                                type={vendor.type}
                                rating={vendor.rating}
                                description={vendor.description}
                                images={vendor.images}
                                extraCount={vendor.extraCount}
                                location={vendor.location}
                                onChatPress={() => navigation.navigate('ChatScreen', {
                                    chatId: `vendor_${idx}`,
                                    chatName: vendor.name,
                                    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
                                    isOnline: Math.random() > 0.5,
                                })}
                            />
                        ))}
                    </View>
                );
            case 'REVIEWS':
                return (
                    <FlatList
                        style={{ flex: 1 }}
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
                        data={reviews}
                        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#2C3D5B']}
                                tintColor="#2C3D5B"
                            />
                        }
                        ListHeaderComponent={() => (
                            <View>
                                {/* Review Stats */}
                                {reviewStats.totalReviews > 0 && (
                                    <View style={styles.statsContainer}>
                                        <View style={styles.statItem}>
                                            <Text style={styles.statNumber}>
                                                {(Number(reviewStats.averageRating) || 0).toFixed(1)}
                                            </Text>
                                            <Text style={styles.statLabel}>Average Rating</Text>
                                            <View style={styles.starsRow}>
                                                {[...Array(5)].map((_, index) => (
                                                    <FontAwesome
                                                        key={index}
                                                        name={index < Math.round(Number(reviewStats.averageRating) || 0) ? 'star' : 'star-o'}
                                                        size={12}
                                                        color="#FFB800"
                                                        style={{ marginRight: 2 }}
                                                    />
                                                ))}
                                            </View>
                                        </View>
                                        <View style={styles.statItem}>
                                            <Text style={styles.statNumber}>{reviewStats.totalReviews || 0}</Text>
                                            <Text style={styles.statLabel}>Total Reviews</Text>
                                        </View>
                                    </View>
                                )}

                                {/* Write Review */}
                                <TouchableOpacity 
                                    style={styles.writeReview} 
                                    onPress={() => navigation.navigate('Review', { 
                                        vendorId, 
                                        vendorName,
                                        onReviewSubmitted: fetchReviews
                                    })}
                                >
                                    <Text style={styles.writeText}>Write a review</Text>
                                    <Icon name="chevron-right" size={16} color="#000" />
                                </TouchableOpacity>

                                {/* Loading State */}
                                {isLoading && (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#2C3D5B" />
                                        <Text style={styles.loadingText}>Loading reviews...</Text>
                                    </View>
                                )}
                            </View>
                        )}
                        renderItem={({ item: review }) => {
                            // Reviewer info is nested under `review.reviewer`
                            // (Sequelize include with `as: 'reviewer'`).
                            const reviewerName =
                                review.reviewer?.full_name ||
                                review.user_name ||
                                review.name ||
                                'Anonymous User';

                            // profile_pic may be relative (`/uploads/...`).
                            // Prepend the API host so <Image> can load it.
                            const rawAvatar =
                                review.reviewer?.profile_pic ||
                                review.user_avatar ||
                                review.avatar ||
                                null;
                            const avatarSource =
                                rawAvatar && typeof rawAvatar === 'string'
                                    ? {
                                          uri: rawAvatar.startsWith('http')
                                              ? rawAvatar
                                              : `https://api.evnzo.com${rawAvatar.startsWith('/') ? '' : '/'}${rawAvatar}`,
                                      }
                                    : img;

                            // created_at is BIGINT epoch-ms on the backend
                            // and arrives as a STRING through Sequelize. Cast
                            // to Number before constructing Date, otherwise
                            // `new Date("1717…")` parses as ISO → Invalid Date.
                            const tsRaw = review.created_at;
                            const tsNum = typeof tsRaw === 'string' ? Number(tsRaw) : tsRaw;
                            const dateLabel =
                                Number.isFinite(tsNum) && tsNum > 0
                                    ? new Date(tsNum).toLocaleDateString()
                                    : '';

                            return (
                                <View style={styles.card}>
                                    <View style={styles.top}>
                                        <Text style={styles.title}>
                                            {review.title || review.review_title || `Review by ${reviewerName}`}
                                        </Text>
                                        <View style={styles.stars}>
                                            {[...Array(5)].map((_, index) => (
                                                <FontAwesome
                                                    key={index}
                                                    name={index < (review.rating || 0) ? 'star' : 'star-o'}
                                                    size={12}
                                                    color="#2C3D5B"
                                                    style={{ marginRight: 2 }}
                                                />
                                            ))}
                                        </View>
                                    </View>

                                    <Text style={styles.description}>
                                        {review.description || review.review_text || review.comment || 'No comment provided'}
                                    </Text>

                                    {/* Review Images */}
                                    {review.media_attachments && review.media_attachments.length > 0 && (
                                        <View style={styles.reviewImages}>
                                            {review.media_attachments.slice(0, 3).map((media, index) => (
                                                <Image
                                                    key={index}
                                                    source={getImageSource(media.file_url || media.url, img)}
                                                    style={styles.reviewImage}
                                                    resizeMode="cover"
                                                />
                                            ))}
                                            {review.media_attachments.length > 3 && (
                                                <View style={styles.moreImagesOverlay}>
                                                    <Text style={styles.moreImagesText}>+{review.media_attachments.length - 3}</Text>
                                                </View>
                                            )}
                                        </View>
                                    )}

                                    <View style={styles.footer}>
                                        <View style={styles.userInfo}>
                                            <Image
                                                source={avatarSource}
                                                style={styles.avatar}
                                            />
                                            <View>
                                                <Text style={styles.userName}>{reviewerName}</Text>
                                                <Text style={styles.reviewDate}>{dateLabel}</Text>
                                            </View>
                                        </View>
                                        {review.helpful_count > 0 && (
                                            <View style={styles.helpfulInfo}>
                                                <Icon name="thumbs-up" size={12} color='rgba(28, 28, 28, 0.4)' />
                                                <Text style={styles.helpfulCount}>{review.helpful_count}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        }}
                        ListEmptyComponent={() => (
                            !isLoading && (
                                <View style={styles.emptyContainer}>
                                    <Icon name="message-circle" size={48} color="#ccc" />
                                    <Text style={styles.emptyTitle}>No Reviews Yet</Text>
                                    <Text style={styles.emptySubtitle}>Be the first to review {vendorName}</Text>
                                    <TouchableOpacity 
                                        style={styles.emptyButton}
                                        onPress={() => navigation.navigate('Review', { 
                                            vendorId, 
                                            vendorName,
                                            onReviewSubmitted: fetchReviews
                                        })}
                                    >
                                        <Text style={styles.emptyButtonText}>Write First Review</Text>
                                    </TouchableOpacity>
                                </View>
                            )
                        )}
                    />
                );
            case 'CHAT':
                return (
                    <View style={styles.chatContainer}>
                        <Text style={styles.placeholderText}>Chat functionality coming soon...</Text>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            {/* Tabs */}
            <View style={[styles.tabs, { flex: 1, gap: 8 }]}>
                <TouchableOpacity
                    style={[styles.tab, { flex: 2 }, activeTab === 'ADS' && styles.activeTab]}
                    onPress={() => setActiveTab('ADS')}
                >
                    <Text style={[styles.tabText, activeTab === 'ADS' && styles.activeText]}>ADS</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, { flex: 2 }, activeTab === 'REVIEWS' && styles.activeTab]}
                    onPress={() => setActiveTab('REVIEWS')}
                >
                    <Text style={[styles.tabText, activeTab === 'REVIEWS' && styles.activeText]}>REVIEWS</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, { flex: 0.7 }, activeTab === 'CHAT' && styles.activeTab]}
                    onPress={() => setActiveTab('CHAT')}
                >
                    <Text style={[styles.tabText, activeTab === 'CHAT' && styles.activeText]}>💬</Text>
                </TouchableOpacity>
            </View>

            {/* Tab Content */}
            {renderTabContent()}
            {/* Write Review */}
            {/* <TouchableOpacity
                onPress={() => navigation.navigate('Review')}
                style={styles.writeReview}
            >
                <Text style={styles.writeText}>Write a review</Text>
                <Icon name="chevron-right" size={16} color="#000" />
            </TouchableOpacity> */}

            {/* Review List */}
            {/* {dummyReviews.map((review) => (
                <View key={review.id} style={styles.card}>
                    <View style={styles.top}>
                        <Text style={styles.title}>{review.title}</Text>
                        <View style={styles.stars}>
                            {[...Array(5)].map((_, index) => (
                                <FontAwesome
                                    key={index}
                                    name={index < review.rating ? 'star' : 'star-o'}
                                    size={12}
                                    color="#2C3D5B"
                                    style={{ marginRight: 2 }}
                                />
                            ))}
                        </View>
                    </View>

                    <Text style={styles.description}>{review.description}</Text>

                    <View style={styles.footer}>
                        <View style={styles.userInfo}>
                            <Image source={{ uri: review.avatar }} style={styles.avatar} />
                            <Text style={styles.userName}>{review.name}</Text>
                        </View>
                        <View style={styles.commentInfo}>
                            <Icon name="message-circle" size={14} color='rgba(28, 28, 28, 0.4)' />
                            <Text style={styles.commentCount}>{review.comments}</Text>
                        </View>
                    </View>
                </View>
            ))} */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        // paddingTop: 10,
        backgroundColor: '#fff',
        flex: 1,
    },
    tabs: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        backgroundColor: '#fff',
        marginBottom: 10,
        paddingHorizontal: 20,

    },
    tab: {
        backgroundColor: '#F4F4F4',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        // paddingHorizontal: 16,
        borderRadius: 20,
    },
    activeTab: {
        backgroundColor: '#26335D',
    },
    tabText: {
        color: '#2C3D5BF5',
        fontSize: 14,
        fontWeight: 600,
    },
    activeText: {
        color: '#fff',
    },
    writeReview: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#7C8594',
        padding: 8,
        // backgroundColor: '#f5f5f5',
        paddingLeft: 18,
        borderRadius: 10,
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    writeText: {
        fontWeight: '500',
        fontSize: 12,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,

        // iOS Shadow
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.16, // For #00000029 (16% opacity)
        shadowRadius: 4,

        // Android Shadow
        elevation: 2,
    },
    top: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,

    },
    title: {
        fontWeight: '600',
        fontSize: 14,
        color: '#000',
    },
    stars: {
        flexDirection: 'row',
        marginLeft: 8,
        alignItems: 'center',
    },

    description: {
        fontSize: 12,
        fontWeight: 400,
        marginBottom: 10,
        color: 'rgba(28, 28, 28, 0.4)',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 6,
    },
    userName: {
        fontSize: 12,
        fontWeight: 400,
        color: '#5A5A5A',
    },
    commentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    commentCount: {
        fontWeight: 400,
        fontSize: 12,
        color: 'rgba(28, 28, 28, 0.4)',
    },
    adsContainer: {
        flex: 1,
        marginTop: 10,


    },
    chatContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    placeholderText: {
        fontSize: 16,
        color: '#666',
        fontStyle: 'italic',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2C3D5B',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    starsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    reviewImages: {
        flexDirection: 'row',
        marginVertical: 8,
        position: 'relative',
    },
    reviewImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 8,
        backgroundColor: '#f0f0f0',
    },
    moreImagesOverlay: {
        position: 'absolute',
        right: 8,
        top: 0,
        width: 60,
        height: 60,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    moreImagesText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    reviewDate: {
        fontSize: 10,
        color: '#999',
        marginTop: 2,
    },
    helpfulInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    helpfulCount: {
        fontSize: 12,
        color: 'rgba(28, 28, 28, 0.4)',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyButton: {
        backgroundColor: '#2C3D5B',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
    },
    emptyButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
});
