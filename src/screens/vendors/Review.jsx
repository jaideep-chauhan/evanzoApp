import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const Review = () => {
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const navigation = useNavigation();

    const handleStarPress = (index) => {
        setRating(index + 1);
    };

    const handleSubmit = () => {
        // Handle submit logic here
        console.log({ rating, reviewText });
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back-outline" size={22} color="#2C3D5BF5" />
                </TouchableOpacity>
                <Text style={styles.backText}> Write Review</Text>
            </View>


            <Text style={styles.label}>Rate the service</Text>
            <View style={styles.starsContainer}>
                {[...Array(5)].map((_, index) => (
                    <TouchableOpacity key={index} onPress={() => handleStarPress(index)}>
                        <FontAwesome
                            name={index < rating ? 'star' : 'star-o'}
                            size={25}
                            color="#2C3D5B"
                            style={styles.star}
                        />
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Write a review</Text>
            <TextInput
                style={styles.textArea}
                placeholder="What should other customers know?"
                multiline
                numberOfLines={4}
                value={reviewText}
                onChangeText={setReviewText}
            />

            <Text style={styles.label}>Share a video or photo (optional)</Text>
            <TouchableOpacity style={styles.mediaBox}>
                <FontAwesome name="camera" size={12} color="#111827" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
        </View>
    );
};

export default Review;

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        // marginBottom: 20,
    },
    iconBtn: {
        padding: 8,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#2C3D5BF5',
    },
    backText: {
        color: '#2C3D5BF5',
        fontSize: 16,
        fontWeight: '500',

        // marginBottom: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: '400',
        color: '#000000',
        marginBottom: 10,
        marginTop: 20,
    },
    starsContainer: {
        flexDirection: 'row',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderColor: '#E6E6E6',
        paddingBottom: 15,
    },
    star: {
        marginRight: 10,
    },
    textArea: {
        height: 120,
        borderWidth: 1,
        borderColor: '#7C8594',
        borderRadius: 6,
        padding: 10,
        textAlignVertical: 'top',
        placeholderTextColor: '#939393',
        fontSize: 12,
    },
    mediaBox: {
        width: 60,
        height: 60,
        backgroundColor: '#EEEEEE',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
        marginTop: 10,
    },
    submitButton: {
        backgroundColor: '#2C3D5B',
        paddingVertical: 15,
        borderRadius: 100,
        marginHorizontal: 40,
        alignItems: 'center',
        marginTop: 30,
    },
    submitText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
});
