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

import bg1 from '../../../assets/images/bg1.png';

const { width } = Dimensions.get('window');
const AVATAR_SIZE = 80;

const VendorCard = ({
    logo,
    name = '4x90 Studio',
    category = 'Photography',
    location = 'Ontario, Canada',
    onBackPress,
    onBellPress,
    navigation,
}) => {
    return (
        <View style={{ backgroundColor: '#fff', marginBottom: 3, }}>
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
                            source={typeof logo === 'string' ? { uri: logo } : logo}
                            style={styles.avatar}
                        />
                    </View>

                    {/* Name & Meta */}
                    <Text style={styles.name}>{name}</Text>
                    <View style={styles.metaRow}>
                        {/* Location */}
                        <View style={styles.metaItem}>
                            <FontAwesome name="map-marker" size={12} color="#334462" />
                            <Text style={styles.metaText}>Ontario, Canada</Text>
                        </View>


                        {/* Category */}
                        <View style={styles.metaItem}>
                            <Feather name="camera" size={12} color="#334462" />
                            <Text style={styles.metaText}>Photography</Text>
                        </View>


                        {/* Rating */}
                        <View style={styles.metaItem}>
                            <FontAwesome name="star" size={12} color="#2C3D5B" />
                            <Text style={styles.metaText}>
                                5.0 <Text style={styles.reviewCount}>(10)</Text>
                            </Text>
                        </View>
                    </View>


                    {/* Description */}
                    <Text style={styles.description}>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore.
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default VendorCard;

const styles = StyleSheet.create({
    banner: {
        height: 180,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
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
        marginTop: -60,
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
        fontSize: 20,
        fontWeight: '700',
        color: '#1D1B20',
        marginTop: 6,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: "space-around",
        marginTop: 4,
        width: '100%',
        marginTop: 10,
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
        marginTop: 8,
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
});
