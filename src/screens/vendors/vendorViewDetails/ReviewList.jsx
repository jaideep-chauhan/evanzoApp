import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

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

export default function ReviewList({ navigation }) {
    return (
        <View style={styles.container}>
            {/* Tabs */}
            <View style={[styles.tabs, { flex: 1, gap: 8 }]}>
                <TouchableOpacity style={[styles.tab, { flex: 2 }]}>
                    <Text style={styles.tabText}>ADS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, styles.activeTab, { flex: 2 }]}>
                    <Text style={styles.activeText}>REVIEWS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, { flex: 0.7 }]}>
                    <Text style={styles.tabText}>💬</Text>
                </TouchableOpacity>
            </View>

            {/* Write Review */}
            <TouchableOpacity
                onPress={() => navigation.navigate('Review')}
                style={styles.writeReview}
            >
                <Text style={styles.writeText}>Write a review</Text>
                <Icon name="chevron-right" size={16} color="#000" />
            </TouchableOpacity>

            {/* Review List */}
            {dummyReviews.map((review) => (
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
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingTop: 10,
        backgroundColor: '#fff',
        flex: 1,
    },
    tabs: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        backgroundColor: '#fff',
        marginBottom: 20,
    },
    tab: {
        backgroundColor: '#F4F4F4',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
        // paddingHorizontal: 16,
        borderRadius: 20,
    },
    activeTab: {
        backgroundColor: '#26335D',
    },
    tabText: {
        color: '#2C3D5BF5',
        fontSize: 12,
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
        padding: 6,
        // backgroundColor: '#f5f5f5',
        paddingLeft: 18,
        borderRadius: 10,
        marginBottom: 20,
    },
    writeText: {
        fontWeight: '500',
        fontSize: 10,
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
});
