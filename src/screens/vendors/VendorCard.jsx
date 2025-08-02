import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../ThemeContext';
import locationIcon from '../../assets/icons/location.png';
import cateogiry from '../../assets/icons/cateogiry.png';
import date from '../../assets/icons/date.png'
import theme from '../../theme';

export default function VendorCard({
    initials,
    name,
    type,
    rating,
    description,
    images,
    extraCount,
    location,
    onChatPress,
    isChat = true

}) {
    const navigation = useNavigation();
    const theme = useTheme();

    const handleCardPress = () => {
        navigation.navigate('VendorAddDetail', { vendor: { initials, name, type, rating, description, images, extraCount, location } });
    };

    // Reusable filter item for icon+label
    const FilterItem = ({ icon, label }) => (
        <View style={styles.filterItemEnhanced}>
            <Image source={icon} style={styles.filterIconEnhanced} />
            <Text style={[styles.filterText, { color: theme.colors.primary }]}>{label}</Text>
        </View>
    );

    return (
        <TouchableOpacity onPress={handleCardPress} style={styles.cardWrapper}>
            {/* Header OUTSIDE the card */}
            <View style={styles.header}>
                <View style={[styles.avatarShadow, { shadowColor: theme.colors.primary }]}>
                    <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                </View>
                <View style={styles.nameBlock}>
                    <Text style={[styles.vendorName, { color: theme.colors.primary }]}>{name}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
                        <FilterItem icon={cateogiry} label={type} />
                        {location && <FilterItem icon={locationIcon} label={location} />}
                    </ScrollView>
                </View>
                <View style={[styles.ratingBox, { backgroundColor: theme.colors.tabBackground }]}>
                    <Icon name="star" size={16} color={theme.colors.primary} />
                    <Text style={[styles.ratingText, { color: theme.colors.primary }]}>{rating}</Text>
                </View>
            </View>

            {/* Card */}
            <View style={styles.card}>
                {/* Images Grid */}
                <View style={styles.imageGrid}>
                    <Image source={images[0]} style={styles.largeImage} />
                    <View style={styles.smallImages}>
                        <Image source={images[1]} style={styles.smallImage} />
                        <View style={styles.overlayWrapper}>
                            <Image source={images[2]} style={styles.smallImage} />
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
                        <TouchableOpacity style={[styles.chatBtn, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]} onPress={onChatPress}>
                            <Text style={styles.chatText}>Chat</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    cardWrapper: {
        marginHorizontal: 12,
        marginBottom: 18,
        backgroundColor: '#fff',
        marginTop: 12,
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
    vendorName: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 1,
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
        marginRight: 0
    },
    filterIconEnhanced: {
        width: 15,
        height: 15,
        marginRight: 6,
        resizeMode: 'contain',
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
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    imageGrid: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    largeImage: {
        width: '60%',
        height: 200,
        borderRadius: 12,
        backgroundColor: '#F2F2F2',
    },
    smallImages: {
        flex: 1,
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
});
