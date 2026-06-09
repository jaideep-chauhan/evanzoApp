import React from 'react';
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
import percent from '../../../assets/icons/percent.png';
import dollar from '../../../assets/icons/dollar.png';

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

const firstPhotoUrl = (vendor) => {
    if (!vendor) return null;
    const photos = parseMaybeJson(vendor.photos);
    if (Array.isArray(photos) && photos.length > 0) {
        const first = photos[0];
        const raw = first?.url || (typeof first === 'string' ? first : null);
        if (raw) return raw.startsWith('http') ? raw : `https://api.evnzo.com${raw}`;
    }
    if (Array.isArray(vendor.images) && vendor.images.length > 0) {
        const first = vendor.images[0];
        if (typeof first === 'string') return first;
        if (first?.uri) return first.uri;
    }
    if (typeof vendor.image === 'string') return vendor.image;
    return null;
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
    const logoUri = firstPhotoUrl(vendor);
    const name = vendor?.name || vendor?.company_name || vendor?.title || 'Vendor';
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

    // Offers JSON: prefer the first offer's amount + percentage if present.
    const offersArr = parseMaybeJson(vendor?.offers);
    const firstOffer = Array.isArray(offersArr) ? offersArr[0] : null;
    const offerAmount = firstOffer?.amount_spent ?? firstOffer?.amount ?? null;
    const offerPercent = firstOffer?.percentage ?? firstOffer?.percent ?? null;

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

                    {/* Avatar */}
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={
                                logoUri
                                    ? { uri: logoUri }
                                    : require('../../../assets/images/dummy.png')
                            }
                            style={styles.avatar}
                        />
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
                        <Text style={styles.description} numberOfLines={4}>
                            {description}
                        </Text>
                    ) : null}

                    {/* Offer Section — render only if at least one value present. */}
                    {(offerAmount != null || offerPercent != null) && (
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
                                                <View style={styles.iconBox}>
                                                    <Image source={dollar} style={{ width: 10, height: 10, resizeMode: 'contain' }} />
                                                </View>
                                                <Text style={styles.offerValue}>{String(offerAmount)}</Text>
                                            </View>
                                        </View>
                                    )}
                                    {offerPercent != null && (
                                        <View style={styles.offerItem}>
                                            <Text style={[styles.offerLabel, { color: theme.colors.textSecondary }]}>
                                                Percentage
                                            </Text>
                                            <View style={[styles.offerValueContainer, { backgroundColor: theme.colors.background }]}>
                                                <View style={styles.iconBox}>
                                                    <Image source={percent} style={{ width: 10, height: 10, resizeMode: 'contain' }} />
                                                </View>
                                                <Text style={styles.offerValue}>{`${offerPercent}%`}</Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.seeMoreBox}>
                                    <Text style={[styles.seeMore, { color: theme.colors.primary }]}>SEE MORE</Text>
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
    iconBox: {
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    seeMoreBox: {
        height: 20,
        width: 60,
        borderRadius: 10,
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
    },
    seeMore: {
        fontWeight: '500',
        fontSize: 8,
        textDecorationLine: 'underline',
    },
});
