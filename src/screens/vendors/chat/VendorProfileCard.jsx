import React from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
const { width } = Dimensions.get('window');

export default function VendorProfileCard({
    logo,
    name,
    category,
    location,
    onBackPress,
    onBellPress,
}) {
    return (
        <View>
            {/* Header Background */}
            <View style={styles.headerBackground}>
                <View style={styles.headerIconsRow}>
                    <TouchableOpacity style={styles.circleBtn} onPress={onBackPress}>
                        <Icon name="arrow-back-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.circleBtn} onPress={onBellPress}>
                        <Icon name="notifications-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
            {/* White Info Card - half in blue, half out */}
            <View style={styles.infoCardWrapper}>
                <View style={styles.infoCard}>
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={logo}
                            style={styles.avatar}
                        />
                    </View>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.category}>{category}</Text>
                    <Text style={styles.location}>{location}</Text>
                </View>
            </View>
        </View>
    );
}

const AVATAR_SIZE = 100;
const INFO_CARD_WIDTH = width - 20;

const styles = StyleSheet.create({
    headerBackground: {
        backgroundColor: '#1E2B4F',
        height: 200,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        paddingTop: 16,
        justifyContent: 'flex-start',
        position: 'relative',
        zIndex: 1,
    },
    headerIconsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        zIndex: 2,
    },
    circleBtn: {
        backgroundColor: '#2F3E5C',
        padding: 10,
        borderRadius: 30,
    },
    infoCardWrapper: {
        position: 'absolute',
        top: 100,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 2,
    },
    infoCard: {
        backgroundColor: '#FCFAFA',
        alignItems: 'center',
        paddingTop: AVATAR_SIZE / 2,
        paddingBottom: 0,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 4,
        width: INFO_CARD_WIDTH,
        minHeight: 150,
        position: 'relative',
    },
    avatarWrapper: {
        position: 'absolute',
        top: -(AVATAR_SIZE / 2),
        left: '50%',
        marginLeft: -(AVATAR_SIZE / 2),
        zIndex: 3,
        backgroundColor: 'transparent',
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
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        marginTop: 8,
    },
    category: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    location: {
        fontSize: 15,
        color: '#1E2B4F',
        marginTop: 6,
        fontWeight: '500',
    },
});
