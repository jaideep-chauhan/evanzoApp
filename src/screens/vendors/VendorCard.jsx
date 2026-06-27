import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Animated,
    Dimensions,
    ActivityIndicator,
    Alert,
    ActionSheetIOS,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import vendorService from '../../services/vendorService';
import { StarIcon, TagIcon } from 'react-native-heroicons/solid';
import { getCurrencySymbol } from '../../utils/currency';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../ThemeContext';
import theme from '../../theme';
import img from '../../assets/images/dummy.png'; // Fallback image
import { icons, getCategoryIcon } from '../../assets/icons';
import FastImage from 'react-native-fast-image';
import { thumbnailUrl } from '../../utils/imageUtils';

// FastImage source helper: it expects {uri,priority,cache} for remote URLs
// and a require() number for local assets. Pass remotes through, fall back
// to the local placeholder when the source is missing.
const toFastSource = (src, fallback) => {
    if (!src) return fallback;
    if (typeof src === 'number') return src; // require() result
    if (typeof src === 'string') return { uri: src, priority: FastImage.priority.normal };
    if (src.uri) return { ...src, priority: src.priority || FastImage.priority.normal };
    return fallback;
};

// Card images render at ~240dp wide, so a 600px thumbnail is plenty and decodes
// far faster than the full-res original. `thumbnailUrl` (shared in imageUtils)
// appends `?w=600`, served by the backend's sharp resize middleware; the vendor
// detail screen still loads originals.
const withThumb = (url) => thumbnailUrl(url, 600);

const { width } = Dimensions.get('window');

function VendorCard({
    initials,
    name,
    type,
    rating,
    description,
    images,
    extraCount,
    location,
    offers = [],
    currency = 'USD',
    onChatPress,
    isChat = true,
    // Vendor owner's avatar URL — populated by formatVendorForDisplay from
    // the joined User row. Falls back to the colored initials circle when
    // null (vendor has no profile pic uploaded yet).
    ownerProfilePic,
    isFocused = false,
    vendorId,
    fullVendorData, // Full vendor object with all data
    approval_status, // Approval status for the ad
    isCheckingChat = false, // Loading state for chat button
    // Owner-only props. When `showOwnerActions` is true (profile / My Ads
    // screen), the card renders a three-dot menu with Mark Complete + Delete.
    // The parent passes vendorAdId so we know which backend row to mutate.
    showOwnerActions = false,
    vendorAdId,
    status, // 'active' | 'completed' | 'cancelled' etc.
    onComplete,
    onDelete,
}) {
    const navigation = useNavigation();
    const theme = useTheme();

    // Carousel logic for infinite auto-scroll. (Removed a verbose per-render
    // console.log that serialized the whole images array on every render — it
    // added measurable main-thread cost while scrolling the list.)

    // Memoize the formatted/extended image arrays. Rebuilding these (and the
    // {uri,...} source objects) on every render handed FastImage brand-new
    // source references each time the card re-rendered during list scroll,
    // forcing it to re-decode and flash. Keying off `images` keeps the
    // references stable until the underlying data actually changes.
    const formattedImages = useMemo(() => {
        const safeImages = images && images.length > 0 ? images : [img, img, img];
        return safeImages.map(image => {
            // Handle null or undefined
            if (!image) {
                return img;
            }
            // If it's already an object with uri, use it as is (request a thumb)
            if (typeof image === 'object' && image.uri) {
                return { ...image, uri: withThumb(image.uri) };
            }
            // If it's a string URL, convert to {uri: url} format (request a thumb)
            if (typeof image === 'string' && image.startsWith('http')) {
                return { uri: withThumb(image) };
            }
            // If it's a local image (number from require), use it directly
            if (typeof image === 'number') {
                return image;
            }
            // Default fallback
            return img;
        });
    }, [images]);

    const extendedImages = useMemo(
        () => [formattedImages[formattedImages.length - 1], ...formattedImages, formattedImages[0]],
        [formattedImages],
    );
    const scrollRef = useRef(null);
    const currentIndex = useRef(1);
    const intervalRef = useRef(null);
    const carouselWidth = (width - 48) * 0.65; // 65% of available width for carousel
    // Track if the owner-avatar Image errored. When it does, we silently fall
    // back to the colored initials circle instead of leaving a gray rectangle.
    const [avatarFailed, setAvatarFailed] = useState(false);

    // Position the carousel on its first real slide ONCE, on mount. This used
    // to live in the same effect as the auto-scroll timer (keyed on isFocused),
    // so every time the card's focus flipped while the user scrolled the list,
    // the carousel snapped back to slide 1 — the "blink on cards" users
    // reported. Keeping it mount-only means focus changes never touch scroll.
    useEffect(() => {
        const t = setTimeout(() => {
            scrollRef.current?.scrollTo({ x: carouselWidth, animated: false });
        }, 10);
        return () => clearTimeout(t);
    }, [carouselWidth]);

    // Auto-advance the carousel only while this card is the focused one.
    // Starting/stopping the timer must NOT reposition the carousel, otherwise
    // focus changes during scroll would blink the card.
    useEffect(() => {
        if (!isFocused) return undefined;
        intervalRef.current = setInterval(() => {
            if (scrollRef.current) {
                currentIndex.current += 1;
                scrollRef.current.scrollTo({ x: carouselWidth * currentIndex.current, animated: true });
            }
        }, 2500);
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isFocused, carouselWidth]);

    const handleScrollEnd = (e) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const slideWidth = carouselWidth;
        let idx = Math.round(offsetX / slideWidth);

        if (idx === extendedImages.length - 1) {
            currentIndex.current = 1;
            if (scrollRef.current) {
                scrollRef.current.scrollTo({ x: slideWidth, animated: false });
            }
        } else if (idx === 0) {
            currentIndex.current = images.length;
            if (scrollRef.current) {
                scrollRef.current.scrollTo({ x: slideWidth * images.length, animated: false });
            }
        } else {
            currentIndex.current = idx;
        }
    };

    // Prefer the full vendor object when the parent passed it; otherwise
    // reconstruct the minimum the detail screen needs from the card props.
    // Shared by the card tap and the "SEE MORE" tap so the shape stays in sync.
    const buildVendorData = () =>
        fullVendorData || {
            id: vendorId,
            vendor_ad_id: vendorId,
            initials,
            name,
            type,
            rating,
            description,
            images,
            extraCount,
            location,
            offers,
        };

    const handleCardPress = () => {
        navigation.navigate('VendorAddDetail', { vendor: buildVendorData() });
    };

    const handleSeeMorePress = () => {
        navigation.navigate('VendorAddDetail', { vendor: buildVendorData(), scrollToOffer: true });
    };

    // Owner-only actions: Mark as Complete + Delete. Mirrors the EventAdCard
    // pattern so the My Ads tab gives consistent controls across ad types.
    const markComplete = async () => {
        if (!vendorAdId) {
            Alert.alert('Error', 'Cannot update ad: ID missing.');
            return;
        }
        try {
            const res = await vendorService.updateVendorAd(vendorAdId, { status: 'completed' });
            if (res.success) {
                Alert.alert('Marked Complete', 'This ad is now hidden from the public list and tagged as completed in your profile.');
                onComplete && onComplete();
            } else {
                Alert.alert('Error', res.message || 'Failed to mark as complete.');
            }
        } catch (e) {
            Alert.alert('Error', e?.message || 'Failed to mark as complete.');
        }
    };

    const confirmDelete = () => {
        Alert.alert(
            'Delete Ad',
            'Are you sure you want to delete this vendor ad? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        if (!vendorAdId) {
                            Alert.alert('Error', 'Cannot delete ad: ID missing.');
                            return;
                        }
                        try {
                            const res = await vendorService.deleteVendorAd(vendorAdId);
                            if (res.success) {
                                onDelete && onDelete();
                            } else {
                                Alert.alert('Error', res.message || 'Failed to delete ad.');
                            }
                        } catch (e) {
                            Alert.alert('Error', e?.message || 'Failed to delete ad.');
                        }
                    },
                },
            ],
        );
    };

    const handleMoreOptions = () => {
        const isCompleted = status === 'completed';
        // Don't offer Mark Complete again if already completed.
        const options = isCompleted
            ? ['Cancel', 'Delete']
            : ['Cancel', 'Mark as Complete', 'Delete'];
        const destructiveButtonIndex = isCompleted ? 1 : 2;
        const cancelButtonIndex = 0;

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                { options, cancelButtonIndex, destructiveButtonIndex },
                (buttonIndex) => {
                    if (buttonIndex === cancelButtonIndex) return;
                    if (!isCompleted && buttonIndex === 1) markComplete();
                    else if (buttonIndex === destructiveButtonIndex) confirmDelete();
                },
            );
        } else {
            // Android: simple Alert action list. ActionSheetIOS isn't available.
            const buttons = [{ text: 'Cancel', style: 'cancel' }];
            if (!isCompleted) buttons.push({ text: 'Mark as Complete', onPress: markComplete });
            buttons.push({ text: 'Delete', style: 'destructive', onPress: confirmDelete });
            Alert.alert('Ad options', undefined, buttons);
        }
    };

    // activeOpacity=1: don't dim on press. Dimming this wrapper applies alpha
    // to the nested elevated `card` child, which makes Android render its
    // elevation shadow as a solid BLACK box on touch (the offscreen
    // alpha-compositing artifact users reported). The event card avoids this
    // because its elevation sits on the touchable itself, not a nested child.
    return (
        <TouchableOpacity onPress={handleCardPress} style={styles.cardWrapper} activeOpacity={1}>
            {/* Approval status banner intentionally removed — ads are
                auto-approved on insert (services/vendorAd.service.js:21,
                services/vendorEnhanced.service.js:617). The legacy "Waiting
                for approval" / "Rejected" banner was confusing because there
                is no moderation workflow that would ever flip the state to
                a non-approved value at this point. If moderation comes back,
                restore the conditional banner from git history. */}

            {/* COMPLETED badge — terminal state, shown to the owner only.
                Approval banner takes precedence (an ad can't be both pending
                and completed in practice). */}
            {showOwnerActions && status === 'completed' && (
                <View style={[styles.approvalBanner, { backgroundColor: '#2C3D5B' }]}>
                    <Text style={styles.approvalBannerText}>✅ Completed</Text>
                </View>
            )}
            
            {/* Header OUTSIDE the card */}
            <View style={styles.header}>
                <View style={[styles.avatarShadow, { shadowColor: theme.colors.primary }]}>
                    {ownerProfilePic && !avatarFailed ? (
                        // Owner has a profile pic — show it instead of the
                        // colored initials circle. Same circular shape so the
                        // surrounding shadow / layout stays unchanged.
                        // onError falls back to initials so a broken URL
                        // doesn't leave a blank gray rectangle.
                        <Image
                            source={{ uri: ownerProfilePic }}
                            style={[styles.avatar, { backgroundColor: '#eee' }]}
                            resizeMode="cover"
                            onError={() => setAvatarFailed(true)}
                        />
                    ) : (
                        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.nameBlock}>
                    {/* Name row — vendor name on the left, rating pill on
                        the right, both vertically centered on the same line. */}
                    <View style={styles.nameRow}>
                        <Text
                            style={[styles.vendorName, { color: theme.colors.primary }]}
                            numberOfLines={1}
                        >
                            {name}
                        </Text>
                        {/* Right cluster — rating pill + (optional) more
                            menu, grouped so `space-between` on the parent
                            row pushes them together as one right-aligned
                            block. Without this wrapper, space-between would
                            spread the three children evenly and the rating
                            pill would land in the visual center. */}
                        <View style={styles.rightCluster}>
                            <View style={[styles.ratingBox, { backgroundColor: theme.colors.tabBackground }]}>
                                <StarIcon size={14} color={theme.colors.primary} />
                                <Text style={[styles.ratingText, { color: theme.colors.primary }]}>{rating}</Text>
                            </View>
                            {showOwnerActions && (
                                <TouchableOpacity
                                    style={styles.moreBtn}
                                    onPress={(e) => {
                                        e.stopPropagation && e.stopPropagation();
                                        handleMoreOptions();
                                    }}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Icon name="ellipsis-vertical" size={18} color={theme.colors.primary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                    <View style={styles.tagRow}>
                        {/* Category pill — intrinsic width, can't shrink */}
                        <View style={styles.tagWithIcon}>
                            {getCategoryIcon(type) ? (
                                <Image source={getCategoryIcon(type)} style={styles.tagIcon} />
                            ) : (
                                <Text style={styles.tagText}>🏷️</Text>
                            )}
                            <Text style={styles.tagText} numberOfLines={1}>{type}</Text>
                        </View>
                        {/* Location pill — flexShrink so the row never wraps;
                            the text inside ellipsizes when there's no space. */}
                        {location && (
                            <View style={[styles.tagWithIcon, styles.tagLocation]}>
                                <Image source={icons.location} style={styles.tagIcon} />
                                <Text style={styles.tagText} numberOfLines={1}>{location}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* Card */}
            <View style={styles.card}>
                {/* Offer Section - Only show if there's at least one offer with non-zero values */}
                {offers && offers.length > 0 && offers.some(offer => (offer.amount && offer.amount !== 0) || (offer.discount && offer.discount !== 0)) && (
                    <View style={styles.offerSection}>
                        <View style={styles.offerTable}>
                            {/* Header Row */}
                            <View style={styles.offerHeaderRow}>
                                <Text style={styles.offerHeaderEmpty}></Text>
                                <Text style={[styles.offerHeaderText, { color: theme.colors.textSecondary }]}>Amount spent</Text>
                                <Text style={[styles.offerHeaderText, { color: theme.colors.textSecondary }]}>Discount</Text>
                            </View>
                            {/* Values Row - Show first offer or default values */}
                            <View style={styles.offerValueRow}>
                                <Text style={styles.offerLabel}>Offer:</Text>
                                <View style={[styles.offerValueContainer, { backgroundColor: theme.colors.background }]}>
                                    <Text style={[styles.offerValue, { color: theme.colors.primary, fontWeight: '700', marginRight: 2 }]}>
                                        {getCurrencySymbol(currency)}
                                    </Text>
                                    <Text style={styles.offerValue}>
                                        {offers[0].amount || '0'}
                                    </Text>
                                </View>
                                <View style={[styles.offerValueContainer, { backgroundColor: theme.colors.background }]}>
                                    <TagIcon size={12} color={theme.colors.primary} />
                                    <Text style={styles.offerValue}>
                                        {offers[0].discount ? `${offers[0].discount}%` : '0%'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.seeMoreBox} onPress={handleSeeMorePress}>
                            <Text style={[styles.seeMore, { color: theme.colors.primary }]}>SEE MORE</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Images Grid */}
                <View style={styles.imageGrid}>
                    {/* Carousel for large image */}
                    <View style={styles.carouselWrapper}>
                        <Animated.ScrollView
                            ref={scrollRef}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            style={styles.carouselContainer}
                            scrollEventThrottle={16}
                            onMomentumScrollEnd={handleScrollEnd}
                            snapToInterval={carouselWidth}
                            decelerationRate="fast"
                        >
                            {extendedImages.map((src, idx) => (
                                <FastImage
                                    key={idx}
                                    source={toFastSource(src, img)}
                                    style={[styles.carouselImage, { width: carouselWidth }]}
                                    resizeMode={FastImage.resizeMode.cover}
                                />
                            ))}
                        </Animated.ScrollView>
                    </View>
                    <View style={styles.smallImages}>
                        <FastImage
                            source={toFastSource(formattedImages[1], img)}
                            style={styles.smallImage}
                            resizeMode={FastImage.resizeMode.cover}
                        />
                        <View style={styles.overlayWrapper}>
                            <FastImage
                                source={toFastSource(formattedImages[2], img)}
                                style={styles.smallImage}
                                resizeMode={FastImage.resizeMode.cover}
                            />
                            {extraCount > 0 && (
                                <View style={[styles.overlay, { backgroundColor: theme.colors.primary + '99' }]}>
                                    <Text style={styles.overlayText}>{`+${extraCount}`}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Description and Chat Button in a row */}
                <View style={styles.rowContent}>
                    <Text style={styles.description} numberOfLines={2}>{description}</Text>
                    {isChat && (
                        <TouchableOpacity 
                            style={[styles.chatBtn, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]} 
                            onPress={isCheckingChat ? null : onChatPress}
                            disabled={isCheckingChat}
                        >
                            {isCheckingChat ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.chatText}>Chat</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

// Memoize so a parent re-render (e.g. focusedCardIndex changing on scroll)
// only re-renders the cards whose data actually changed — not every card in
// the list. We deliberately ignore the inline callback props (onChatPress /
// onComplete / onDelete), which the parent recreates on every render: they
// close over a stable vendor object per card, so skipping the re-render keeps
// the correct behavior while eliminating the scroll-time render storm that
// (together with the carousel reset) caused the cards to blink.
function areEqual(prev, next) {
    return (
        prev.vendorId === next.vendorId &&
        prev.vendorAdId === next.vendorAdId &&
        prev.isFocused === next.isFocused &&
        prev.isCheckingChat === next.isCheckingChat &&
        prev.name === next.name &&
        prev.type === next.type &&
        prev.rating === next.rating &&
        prev.description === next.description &&
        prev.location === next.location &&
        prev.initials === next.initials &&
        prev.ownerProfilePic === next.ownerProfilePic &&
        prev.extraCount === next.extraCount &&
        prev.status === next.status &&
        prev.showOwnerActions === next.showOwnerActions &&
        prev.isChat === next.isChat &&
        prev.images === next.images &&
        prev.offers === next.offers
    );
}

export default React.memo(VendorCard, areEqual);

const styles = StyleSheet.create({
    cardWrapper: {
        marginHorizontal: 12,
        marginBottom: 18,
        backgroundColor: '#fff',
        marginTop: 12,
    },
    approvalBanner: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        marginBottom: 8,
        alignItems: 'center',
    },
    approvalBannerText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        marginLeft: 4,
        backgroundColor: '#fff',

    },
    avatarShadow: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
        elevation: 3,
        borderRadius: 24,
    },
    avatar: {
        borderRadius: 24,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 18,
        letterSpacing: 0.5,
    },
    nameBlock: {
        flex: 1,
        marginLeft: 10,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
        gap: 8,
    },
    vendorName: {
        fontSize: 18,
        fontWeight: '700',
        flexShrink: 1, // long names ellipsize instead of pushing the pill off-screen
    },
    tagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        // No flexWrap: the row stays single-line. The location pill below has
        // flexShrink:1 so it gives way when the row is too narrow.
    },
    tag: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        fontSize: 12,
        color: '#666',
    },
    tagWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingHorizontal: 7,
        paddingVertical: 4,
        gap: 4,
        minWidth: 0, // lets the inner Text ellipsize instead of overflowing
    },
    tagLocation: {
        flexShrink: 1, // location pill is the shrinker — keeps the row 1 line
    },
    tagIcon: {
        width: 12,
        height: 12,
        resizeMode: 'contain',
    },
    tagText: {
        fontSize: 11,
        color: '#666',
        flexShrink: 1,
    },
    filtersRow: {
        flexDirection: 'row',
        marginTop: 2,
    },
    filterItem: {
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 10,
        marginRight: 4,
    },
    filterItemEnhanced: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.tabBackground,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginRight: 0,
        gap: 6,
    },
    filterText: {
        fontSize: 10,
        fontWeight: '500',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    locationText: {
        fontSize: 11,
        marginLeft: 2,
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 16,
    },
    ratingText: {
        fontSize: 12,
        marginLeft: 4,
        fontWeight: '600',
    },
    moreBtn: {
        padding: 4,
    },
    rightCluster: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        // iOS shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        // Android shadow — without elevation the box shadow renders on iOS only.
        elevation: 4,
    },
    imageGrid: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    carouselWrapper: {
        width: '65%',
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
    },
    carouselContainer: {
        height: 200,
    },
    carouselImage: {
        height: 200,
        backgroundColor: '#F2F2F2',
    },
    smallImages: {
        flex: 1,
        width: '35%',
        justifyContent: 'space-between',
        gap: 8,
    },
    smallImage: {
        width: '100%',
        height: 95,
        borderRadius: 12,
    },
    overlayWrapper: {
        position: 'relative',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    overlayText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    rowContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        marginTop: 4,
    },
    description: {
        fontSize: 12,
        color: '#444',
        flex: 1,
        marginRight: 8,
    },
    chatBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 16,
        alignSelf: 'flex-end',
        gap: 4,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 2,
    },
    chatText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },
    // Offer Section Styles
    offerSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
        paddingBottom: 4,
    },
    offerTable: {
        flexDirection: 'column',
    },
    noOffersText: {
        fontSize: 12,
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 8,
    },
    offerHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3,
        gap: 6,
    },
    offerHeaderEmpty: {
        width: 40,
    },
    offerHeaderText: {
        fontSize: 8,
        fontWeight: '400',
        minWidth: 40,
    },
    offerValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    offerLabel: {
        fontSize: 10,
        fontWeight: '400',
        color: '#344562',
        width: 40,
    },
    offerValueContainer: {
        backgroundColor: '#F4F4F4',
        borderRadius: 30,
        flexDirection: 'row',
        gap: 4,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 2,
        paddingVertical: 4,
        minWidth: 50,
    },
    offerValue: {
        fontSize: 12,
        fontWeight: '500',
        color: '#2C3D5BF5',
    },
    seeMoreBox: {
        height: 20,
        width: 60,
        borderRadius: 10,
        alignSelf: 'flex-end',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    seeMore: {
        fontWeight: '500',
        fontSize: 8,
        textDecorationLine: 'underline',
    },
});
