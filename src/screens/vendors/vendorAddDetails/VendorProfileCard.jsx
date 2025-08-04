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
import bg1 from '../../../assets/images/bg1.png';

import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';

const { width } = Dimensions.get('window');
const AVATAR_SIZE = 100;
const INFO_CARD_WIDTH = width - 20;

// 👇 ActionIcons component (Moved outside VendorProfileCard)
const ActionIcons = () => {
    return (
        <View style={actionIconStyles.container}>
            {/* Rating */}
            <TouchableOpacity style={actionIconStyles.item}>
                <View style={actionIconStyles.iconCircle}>
                    <FontAwesome name="star" size={12} color="#2c2c3d" />
                    <Text style={actionIconStyles.iconText}>4.</Text>
                </View>
                <Text style={actionIconStyles.label}>Rating</Text>
            </TouchableOpacity>

            {/* Reviews */}
            <TouchableOpacity style={actionIconStyles.item}>
                <View style={actionIconStyles.iconCircle}>
                    <Text style={actionIconStyles.reviewText}>15</Text>
                </View>
                <Text style={actionIconStyles.label}>Reviews</Text>
            </TouchableOpacity>

            {/* Save */}
            <TouchableOpacity style={actionIconStyles.item}>
                <View style={actionIconStyles.iconCircle}>
                    <Feather name="heart" size={20} color="#2c2c3d" />
                </View>
                <Text style={actionIconStyles.label}>Save</Text>
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity style={actionIconStyles.item}>
                <View style={actionIconStyles.iconCircle}>
                    <Entypo name="share" size={20} color="#2c2c3d" />
                </View>
                <Text style={actionIconStyles.label}>Share</Text>
            </TouchableOpacity>
        </View>
    );
};

// 👇 Main component
export default function VendorProfileCard({
    logo,
    name,
    category,
    location,
    onBackPress,
    onBellPress,
    navigation,
}) {
    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* Header Background */}
            <ImageBackground source={bg1} style={styles.headerBackground} resizeMode="cover">
                <View style={styles.headerIconsRow}>
                    <TouchableOpacity style={styles.circleBtn} onPress={onBackPress}>
                        <Icon name="arrow-back-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.circleBtn} onPress={onBellPress}>
                        <Icon name="notifications-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </ImageBackground>

            {/* White Info Card */}
            <View style={[styles.infoCardWrapper, { flex: 1 }]}>
                <View style={[styles.infoCard, { flexGrow: 1 }]}>
                    <TouchableOpacity style={styles.seeAllBtn} onPress={() => navigation.navigate('AllReviews')} activeOpacity={0.7}>
                        <Text style={styles.seeAllText}>See All</Text>
                    </TouchableOpacity>
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={typeof logo === 'string' ? { uri: logo } : logo}
                            style={styles.avatar}
                        />
                    </View>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.category}>{category}</Text>
                    <Text style={styles.location}>{location}</Text>
                    <ActionIcons />
                </View>
            </View>
        </View>
    );
}

// 👇 Styles
const styles = StyleSheet.create({
    headerBackground: {
        height: 250,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        paddingTop: 50,
        justifyContent: 'flex-start',
        position: 'relative',
        zIndex: 1,
        paddingHorizontal: 16,
        overflow: 'hidden',
    },
    headerIconsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        zIndex: 2,
    },
    circleBtn: {
        padding: 10,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.44)',
    },
    infoCardWrapper: {
        position: 'absolute',
        top: 150,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 2,
        flex: 1,
    },
    infoCard: {
        backgroundColor: '#FCFAFA',
        alignItems: 'center',
        paddingTop: AVATAR_SIZE / 2,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 4,
        width: INFO_CARD_WIDTH,
        minHeight: 10,
        boxShadow: '1px 1px 4px 0px #00000029',

    },
    avatarWrapper: {
        position: 'absolute',
        top: -(AVATAR_SIZE / 2),
        left: '50%',
        marginLeft: -(AVATAR_SIZE / 2),
        zIndex: 3,
    },
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        borderWidth: 4,
        borderColor: '#FCFAFA',
        backgroundColor: '#eee',
    },
    name: {
        fontSize: 22,
        fontWeight: '600',
        color: '#1D1B20',
        marginTop: 4,
    },
    category: {
        fontSize: 14,
        color: '#49454F',
        marginTop: 4,
    },
    location: {
        fontSize: 15,
        color: '#1D1B20',
        marginTop: 4,
        fontWeight: '400',
    },
    seeAllBtn: {
        position: 'absolute',
        top: 16,
        right: 18,
        zIndex: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    seeAllText: {
        color: '#003A9B',
        fontWeight: '600',
        fontSize: 12,
        letterSpacing: 0.2,
    },
});

const actionIconStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 10,
        paddingHorizontal: 12,
        paddingBottom: 20,
    },
    item: {
        alignItems: 'center',
        flex: 1,
    },
    iconCircle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E7F0FF',
        borderRadius: 40,
        width: 50,
        height: 50,
    },
    iconText: {
        fontSize: 16,
        color: '#334462',
        marginLeft: 4,
        fontWeight: '600',
    },
    reviewText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2c2c3d',
    },
    label: {
        marginTop: 8,
        fontSize: 14,
        color: '#49454F',
        fontWeight: '500',
    },
});
