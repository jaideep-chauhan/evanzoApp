import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ImageBackground,
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import { useTheme } from '../../../ThemeContext';

import bg1 from '../../../assets/images/smallHeader.jpg';
import { getCurrencySymbol } from '../../../utils/currency';

const { width } = Dimensions.get('window');
const AVATAR_SIZE = 100;

// photos / offers / extra DB fields land here as JSON strings (Sequelize
// returns the raw TEXT column unparsed). Defensive parse-or-passthrough.
const parseMaybeJson = (val) => {
    if (Array.isArray(val) || (val && typeof val === 'object')) return val;
    if (typeof val !== 'string') return null;
    try {
        return JSON.parse(val);
    } catch (_) {
        return null;
    }
};

const VendorCard = ({
    vendor,
    onBackPress,
    onBellPress,
    navigation,
}) => {
    const theme = useTheme();

    // Pull out the bits the header actually shows. Every field has a clear
    // fallback so the screen never blows up if backend is sparse.
    // Avatar circle uses ONLY the owner's profile picture (this header
    // identifies the vendor, not the ad). No ad-photo fallback — if there's
    // no profile pic we render name-initials below instead.
    const logoUri =
        vendor?.owner_profile_pic ||
        vendor?._original?.user?.profile_pic ||
        vendor?._original?.User?.profile_pic ||
        null;
    // Show the VENDOR's name (the owner/person), not the ad title. Falls back
    // to the business/ad name only when there's no owner name.
    const name =
        vendor?.owner_name ||
        vendor?._original?.user?.full_name ||
        vendor?._original?.User?.full_name ||
        [vendor?._original?.user?.first_name, vendor?._original?.user?.last_name]
            .filter(Boolean)
            .join(' ')
            .trim() ||
        vendor?.name ||
        vendor?.company_name ||
        vendor?.title ||
        'Vendor';
    // Initials for the avatar when the vendor has no profile pic.
    const initials =
        (name || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0])
            .join('')
            .toUpperCase() || '?';
    const category = vendor?.type || vendor?.category?.name || vendor?.vendor_type || '';
    const location =
        vendor?.city ||
        (typeof vendor?.location === 'string'
            ? vendor.location.split(',')[0].trim()
            : '') ||
        vendor?.address ||
        '';

    const ratingNum = Number(vendor?.rating);
    const rating = Number.isFinite(ratingNum) && ratingNum > 0 ? ratingNum.toFixed(1) : null;
    const reviewsCount = Number(vendor?.reviews_count) || 0;
    const description = vendor?.description || '';
    // Description "See more/less" toggle. A hidden measurer lays out the full
    // text once and hands us the per-line breakdown (descLines). If it spills
    // past 4 lines we rebuild the collapsed text from the first 4 lines, trim
    // the 4th to leave room, and append "… See more" INLINE on that line
    // (rather than on a new 5th line).
    const [descExpanded, setDescExpanded] = useState(false);
    const [descLines, setDescLines] = useState(null);
    const descTruncatable = Array.isArray(descLines) && descLines.length > 4;
    const collapsedText = React.useMemo(() => {
        if (!descTruncatable) return description;
        const visible = descLines.slice(0, 4).map((l) => l.text);
        let last = (visible[3] || '').replace(/\s+$/, '');
        // Reserve room for the "… See more" suffix so it stays on line 4. Trim a
        // generous number of chars, then back off to a word boundary so the
        // suffix (which is wider than the trimmed lowercase text) always fits.
        last = last.slice(0, Math.max(0, last.length - 12)).replace(/\s+\S*$/, '');
        return visible.slice(0, 3).join('') + last.replace(/\s+$/, '');
    }, [descTruncatable, descLines, description]);

    // Offers JSON: prefer the first offer's amount + percentage if present.
    const offersArr = parseMaybeJson(vendor?.offers);
    const firstOffer = Array.isArray(offersArr) ? offersArr[0] : null;
    // Offers are stored as { amount, discount }. (The discount was previously
    // read from `percentage`/`percent`, which the data never has — so the
    // discount column always went missing.) Show the offer block whenever an
    // offer exists; inside it, ALWAYS show the Discount column, defaulting to 0%
    // when no discount was set rather than hiding it.
    const isPresent = (v) => v != null && String(v).trim() !== '';
    const rawAmount = firstOffer?.amount_spent ?? firstOffer?.amount;
    const rawPercent = firstOffer?.discount ?? firstOffer?.percentage ?? firstOffer?.percent;
    const hasOffer = firstOffer != null && (isPresent(rawAmount) || isPresent(rawPercent));
    const offerAmount = isPresent(rawAmount) ? rawAmount : null;
    const offerPercent = isPresent(rawPercent) ? rawPercent : 0;
    const currency = vendor?.currency || 'USD';

    return (
        <View style={{ backgroundColor: '#fff', marginBottom: 3 }}>
            {/* Top Banner */}
            <ImageBackground source={bg1} style={styles.banner} resizeMode="cover">
                <View style={styles.headerIcons}>
                    <TouchableOpacity onPress={onBackPress} style={styles.iconBtn}>
                        <Icon name="arrow-back-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onBellPress} style={styles.iconBtn}>
                        <Icon name="notifications-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </ImageBackground>

            {/* Overlapping Info Card */}
            <View style={styles.infoCardWrapper}>
                <View style={styles.infoCard}>
                    {/* Share button */}
                    <TouchableOpacity style={styles.shareBtn}>
                        <Entypo name="share" size={18} color="#334462" />
                    </TouchableOpacity>

                    {/* Avatar — owner profile pic, or name-initials if none. */}
                    <View style={styles.avatarWrapper}>
                        {logoUri ? (
                            <Image source={{ uri: logoUri }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarInitials]}>
                                <Text style={styles.avatarInitialsText}>{initials}</Text>
                            </View>
                        )}
                    </View>

                    {/* Name & Meta */}
                    <Text style={styles.name} numberOfLines={1}>{name}</Text>
                    <View style={styles.metaRow}>
                        {location ? (
                            <View style={styles.metaItem}>
                                <FontAwesome name="map-marker" size={12} color="#334462" />
                                <Text style={styles.metaText} numberOfLines={1}>{location}</Text>
                            </View>
                        ) : null}
                        {rating ? (
                            <View style={styles.metaItem}>
                                <FontAwesome name="star" size={12} color="#2C3D5B" />
                                <Text style={styles.metaText}>
                                    {rating}{' '}
                                    <Text style={styles.reviewCount}>({reviewsCount})</Text>
                                </Text>
                            </View>
                        ) : null}
                        {category ? (
                            <View style={styles.metaItem}>
                                <Feather name="camera" size={12} color="#334462" />
                                <Text style={styles.metaText} numberOfLines={1}>{category}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Description — only render if real text exists, so we
                        don't lock a fake lorem-ipsum into the layout. */}
                    {description ? (
                        descLines == null ? (
                            // First pass: render the full text (real, full-width element)
                            // purely to capture the per-line breakdown via onTextLayout.
                            // Swaps to the collapsed/expanded view on the next render.
                            <Text
                                style={styles.description}
                                onTextLayout={(e) => setDescLines(e.nativeEvent.lines)}
                            >
                                {description}
                            </Text>
                        ) : descTruncatable && !descExpanded ? (
                            // Collapsed: 4 lines with "… See more" appended INLINE to
                            // the end of the 4th line.
                            <Text style={styles.description}>
                                {collapsedText}
                                <Text
                                    style={[styles.seeMore, { color: theme.colors.primary }]}
                                    onPress={() => setDescExpanded(true)}
                                >
                                    {' … See more'}
                                </Text>
                            </Text>
                        ) : (
                            // Full text (not truncatable, or expanded). When expanded,
                            // "See less" follows inline at the end.
                            <Text style={styles.description}>
                                {description}
                                {descTruncatable && (
                                    <Text
                                        style={[styles.seeMore, { color: theme.colors.primary }]}
                                        onPress={() => setDescExpanded(false)}
                                    >
                                        {'  See less'}
                                    </Text>
                                )}
                            </Text>
                        )
                    ) : null}

                    {/* Offer Section — render whenever the vendor has an offer. */}
                    {hasOffer && (
                        <View style={styles.offerSection}>
                            <View style={styles.offerRow}>
                                <View style={styles.offerTextContainer}>
                                    <Text style={styles.offerText}>Offer:</Text>
                                    {offerAmount != null && (
                                        <View style={styles.offerItem}>
                                            <Text style={[styles.offerLabel, { color: theme.colors.textSecondary }]}>
                                                Amount spent
                                            </Text>
                                            <View style={[styles.offerValueContainer, { backgroundColor: theme.colors.background }]}>
                                                <Text style={[styles.offerValue, { color: theme.colors.primary, fontWeight: '700', marginRight: 2 }]}>
                                                    {getCurrencySymbol(currency)}
                                                </Text>
                                                <Text style={styles.offerValue}>{String(offerAmount)}</Text>
                                            </View>
                                        </View>
                                    )}
                                    {/* Always shown (defaults to 0%) so the Discount
                                        column never disappears. */}
                                    <View style={styles.offerItem}>
                                        <Text style={[styles.offerLabel, { color: theme.colors.textSecondary }]}>
                                            Discount
                                        </Text>
                                        <View style={[styles.offerValueContainer, { backgroundColor: theme.colors.background }]}>
                                            <Text style={styles.offerValue}>{`${offerPercent}%`}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

export default VendorCard;

const styles = StyleSheet.create({
    banner: {
        height: 240,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        overflow: 'hidden',
        paddingHorizontal: 16,
        paddingTop: 50,
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
    infoCardWrapper: {
        marginTop: -90,
        paddingHorizontal: 16,
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingTop: 50,
        paddingBottom: 20,
        alignItems: 'center',

        // iOS Shadow
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.16, // Approx for #00000029
        shadowRadius: 4,

        // Android Shadow
        elevation: 3,
    },

    avatarWrapper: {
        position: 'absolute',
        top: -AVATAR_SIZE / 2,
    },
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        backgroundColor: '#ddd',
        borderWidth: 3,
        borderColor: '#fff',
    },
    avatarInitials: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#334462',
    },
    avatarInitialsText: {
        color: '#fff',
        fontSize: 34,
        fontWeight: '700',
        letterSpacing: 1,
    },
    name: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1D1B20',
        marginTop: 6,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: "center",
        marginTop: 4,
        width: '100%',
        marginTop: 10,
        gap: 8,
        // flexWrap: 'wrap',
    },
    metaItem: {
        height: 20,
        borderRadius: 10,
        backgroundColor: '#F4F4F4',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        gap: 4,
    },

    metaText: {
        fontSize: 12,
        color: '#334462',
        fontWeight: '500',
    },
    dot: {
        marginHorizontal: 6,
        marginTop: 1,
    },

    reviewCount: {
        color: '#868686',
        fontWeight: '400',
    },
    description: {
        fontSize: 12,
        color: '#8A8A8A',
        marginTop: 20,
        textAlign: 'center',
        paddingHorizontal: 16,
        lineHeight: 18,
    },
    seeMore: {
        fontSize: 12,
        fontWeight: '600',
    },
    shareBtn: {
        position: 'absolute',
        top: 14,
        right: 14,
        padding: 6,
        backgroundColor: '#E7F0FF',
        borderRadius: 20,
    },
    tabs: {
        marginTop: 16,
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingHorizontal: 20,
    },
    tabBtn: {
        paddingVertical: 6,
        paddingHorizontal: 18,
        borderRadius: 20,
    },
    tabText: {
        color: '#334462',
        fontWeight: '600',
    },
    activeTab: {
        backgroundColor: '#334462',
    },
    activeTabText: {
        color: '#fff',
    },
    // Offer Section Styles
    offerSection: {
        marginTop: 16,
        paddingHorizontal: 16,
        width: '100%',
    },
    offerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: '#fafbfc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e1e5e9',
    },
    offerTextContainer: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    offerText: {
        fontSize: 12,
        fontWeight: '400',
        color: '#344562',
        marginRight: 4,
    },
    offerItem: {
        alignItems: 'center',
    },
    offerLabel: {
        fontSize: 10,
        fontWeight: '400',
        marginBottom: 6,
    },
    offerValueContainer: {
        backgroundColor: '#F4F4F4',
        borderRadius: 30,
        flexDirection: 'row',
        gap: 4,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    offerValue: {
        fontSize: 10,
        fontWeight: '500',
        color: '#2C3D5BF5',
    },
});
