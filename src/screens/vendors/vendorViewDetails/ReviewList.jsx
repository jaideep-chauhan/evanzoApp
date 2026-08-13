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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import vendorDetailsService from '../../../services/vendorDetailsService';
import vendorService from '../../../services/vendorService';
import chatService from '../../../services/chatService';
import VendorAdCard from '../VendorCard';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { getImageSource } from '../../../utils/imageUtils';
import img from '../../../assets/images/dummy.png';

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
    const [activeTab, setActiveTab] = useState('ADS');
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [reviewStats, setReviewStats] = useState({
        totalReviews: 0,
        averageRating: 0
    });
    // Real vendor ads for the ADS tab. Populated from the public vendor-ad
    // endpoint (same source as the home Vendors list) — NOT the old hardcoded
    // "Raya James / Lorem ipsum" placeholder list.
    const [ads, setAds] = useState([]);
    const [adsLoading, setAdsLoading] = useState(false);
    
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

    // Fetch real vendor ads once for the ADS tab.
    useEffect(() => {
        fetchAds();
    }, []);

    const fetchAds = async () => {
        // This is THIS vendor's profile page, so the ADS tab must show only
        // this vendor's own ads — not every vendor's ads. Scope by the owner's
        // user_id via GET /vendor_ad/user/:userId.
        const vendorObj = route.params?.vendor || null;
        const ownerUserId =
            vendorObj?._original?.user_id ||
            vendorObj?.user_id ||
            vendorObj?._original?.user?.user_id ||
            vendorObj?._original?.User?.user_id;

        if (!ownerUserId) {
            // No owner id → don't fall back to showing everyone's ads.
            setAds([]);
            return;
        }

        try {
            setAdsLoading(true);
            const res = await vendorService.getUserVendorAds(ownerUserId);
            if (res.success && Array.isArray(res.data)) {
                // Only approved ads, formatted for display (same as home list).
                const formatted = res.data
                    .filter((v) => v.approval_status === 'approved')
                    .map((v) => vendorService.formatVendorForDisplay(v));
                setAds(formatted);
            } else {
                setAds([]);
            }
        } catch (error) {
            console.error('Error fetching ads:', error);
            setAds([]);
        } finally {
            setAdsLoading(false);
        }
    };

    // Tapping the 💬 tab opens a direct chat with THIS vendor (the one whose
    // page we're on). Mirrors the home Vendors list chat flow: reuse an
    // existing direct chat if one exists, otherwise open ChatScreen with the
    // recipientId so a new one is created.
    const startChatWithVendor = async () => {
        const vendorObj = route.params?.vendor || null;
        const vendorUserId =
            vendorObj?._original?.user_id ||
            vendorObj?.user_id ||
            vendorObj?._original?.user?.user_id ||
            vendorObj?._original?.User?.user_id;

        if (!vendorUserId) {
            Alert.alert('Chat Unavailable', 'Could not find this vendor to start a chat.');
            return;
        }

        // Prevent starting a chat with your own listing.
        try {
            const currentUserData = await AsyncStorage.getItem('userData');
            const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
            const currentUserId = currentUser?.user_id || currentUser?.id;
            if (String(vendorUserId) === String(currentUserId)) {
                Alert.alert('Cannot Start Chat', 'You cannot start a chat with your own vendor listing.');
                return;
            }
        } catch (_) {
            // userData missing/corrupt — fall through and let the chat flow handle auth.
        }

        const chatName =
            vendorObj?.owner_name ||
            vendorObj?._original?.user?.full_name ||
            vendorObj?._original?.User?.full_name ||
            vendorObj?.company_name ||
            vendorObj?.name ||
            vendorName;
        const avatar =
            vendorObj?.owner_profile_pic ||
            vendorObj?._original?.user?.profile_pic ||
            vendorObj?._original?.User?.profile_pic ||
            null;

        try {
            const existing = await chatService.findDirectChat(vendorUserId);
            if (existing?.exists) {
                navigation.navigate('ChatScreen', {
                    chatId: existing.chatId,
                    chatName,
                    avatar,
                    isOnline: false,
                });
            } else {
                navigation.navigate('ChatScreen', {
                    recipientId: vendorUserId,
                    chatName,
                    avatar,
                    isOnline: false,
                });
            }
        } catch (error) {
            console.error('Error starting chat with vendor:', error);
            // Fallback: open ChatScreen directly with the recipientId.
            navigation.navigate('ChatScreen', {
                recipientId: vendorUserId,
                chatName,
                avatar,
                isOnline: false,
            });
        }
    };

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
                        {adsLoading && ads.length === 0 ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#2C3D5B" />
                                <Text style={styles.loadingText}>Loading ads...</Text>
                            </View>
                        ) : ads.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Icon name="briefcase" size={48} color="#ccc" />
                                <Text style={styles.emptyTitle}>No Ads Yet</Text>
                            </View>
                        ) : (
                            ads.map((vendor, idx) => (
                                <VendorAdCard
                                    key={`ad-${vendor._original?.vendor_ad_id || vendor.id}-${idx}`}
                                    vendorId={vendor._original?.vendor_ad_id || vendor.id}
                                    fullVendorData={vendor}
                                    initials={vendor.initials}
                                    ownerProfilePic={vendor.owner_profile_pic}
                                    name={vendor.name}
                                    type={vendor.type}
                                    rating={vendor.rating}
                                    description={vendor.description}
                                    images={vendor.images}
                                    extraCount={vendor.extraCount}
                                    location={vendor.location}
                                    offers={vendor.offers || []}
                                    currency={vendor.currency}
                                    onChatPress={() =>
                                        navigation.navigate('VendorAddDetail', { vendor })
                                    }
                                />
                            ))
                        )}
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
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            {/* Tabs: ADS (real vendor ads) | REVIEWS | 💬 chat */}
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
                {/* 💬 is an action, not a content tab — tapping it opens a
                    direct chat with this vendor. */}
                <TouchableOpacity
                    style={[styles.tab, { flex: 0.7 }]}
                    onPress={startChatWithVendor}
                >
                    <Text style={styles.tabText}>💬</Text>
                </TouchableOpacity>
            </View>

            {/* Tab Content */}
            {renderTabContent()}
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
