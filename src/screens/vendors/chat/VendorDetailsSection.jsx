import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TextInput,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import img from '../../../assets/images/evanzoLogo.png'; // Adjust the path as needed

export default function VendorDetailsSection({
    photos = [],
    onSend,
    description,
    reviews = [],
}) {
    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Photos Section */}
            <View style={styles.card}>
                <View style={styles.rowBetween}>
                    <Text style={styles.sectionTitle}>Photos</Text>
                    <Text style={styles.linkText}>See all</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                    {photos.map((photo, idx) => (
                        <Image key={idx} source={photo} style={styles.photo} />
                    ))}
                </ScrollView>
            </View>

            {/* Message Input */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Send a Message</Text>
                <View style={styles.messageBox}>
                    <Icon name="chatbubble-outline" size={20} color="#1E2B4F" style={styles.inputIcon} />
                    <TextInput
                        placeholder="Type your message..."
                        placeholderTextColor="#888"
                        style={styles.input}
                    />
                    <TouchableOpacity style={styles.sendBtn} onPress={onSend}>
                        <Icon name="send" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Description */}
            <View style={styles.card}>
                <Text style={styles.descriptionText}>{description}</Text>
            </View>

            {/* Review Section */}
            <View style={styles.card}>
                <View style={styles.rowBetween}>
                    <Text style={styles.sectionTitle}>Reviews</Text>
                    <Text style={styles.linkText}>See all</Text>
                </View>

                <View style={{ marginTop: 14 }}>
                    {reviews && reviews.length > 0 ? (
                        reviews.map((review) => (
                            <View key={review.id} style={styles.reviewBlock}>
                                <View style={styles.rowBetween}>
                                    <Text style={styles.reviewTitle}>{review.user}</Text>
                                    <Text style={styles.reviewDate}>{review.date}</Text>
                                </View>
                                <View style={styles.ratingRow}>
                                    {[...Array(5)].map((_, i) => (
                                        <Icon
                                            key={i}
                                            name="star"
                                            size={16}
                                            color={i < review.rating ? "#1E2B4F" : "#E0E0E0"}
                                        />
                                    ))}
                                </View>
                                <Text style={styles.reviewDescription}>{review.comment}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={{ color: '#888', fontSize: 13 }}>No reviews yet.</Text>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 18,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
    },
    linkText: {
        color: '#1E2B4F',
        fontWeight: '500',
        fontSize: 14,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    photo: {
        width: 130,
        height: 130,
        borderRadius: 12,
        marginRight: 12,
    },
    messageBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        borderWidth: 1.2,
        borderColor: '#E5EAF2',
        borderRadius: 12,
        backgroundColor: '#F4F6FA',
        paddingHorizontal: 10,
        paddingVertical: 2,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 10,
        color: '#1E2B4F',
        fontSize: 15,
        backgroundColor: 'transparent',
    },
    sendBtn: {
        backgroundColor: '#1E2B4F',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendText: {
        color: '#fff',
        fontWeight: '600',
    },
    descriptionText: {
        color: '#444',
        fontSize: 14,
        lineHeight: 20,
    },
    reviewBlock: {
        marginBottom: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        paddingBottom: 12,
    },
    reviewTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
        color: '#1E2B4F',
    },
    reviewDate: {
        fontSize: 12,
        color: '#888',
    },
    ratingRow: {
        flexDirection: 'row',
        gap: 2,
        marginBottom: 6,
        marginTop: 2,
    },
    reviewDescription: {
        color: '#666',
        fontSize: 13,
        marginBottom: 4,
    },
    reviewerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 8,
    },
    reviewerName: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    eyeIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
        gap: 4,
    },
    eyeText: {
        fontSize: 12,
        color: '#aaa',
    },
});
