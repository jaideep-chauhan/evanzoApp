import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Alert,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import vendorDetailsService from '../../services/vendorDetailsService';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Review = () => {
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [selectedImages, setSelectedImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigation = useNavigation();
    const route = useRoute();
    const { user, isAuthenticated } = useAuth();
    
    // Get vendor data from route params
    const { vendorId, vendorName, onReviewSubmitted } = route.params || {};

    const handleStarPress = (index) => {
        setRating(index + 1);
    };

    const handleSubmit = async () => {
        if (!vendorId) {
            Alert.alert('Error', 'Vendor information is missing');
            return;
        }
        
        if (!isAuthenticated) {
            Alert.alert('Authentication Required', 'Please log in to submit a review');
            return;
        }
        
        if (rating === 0) {
            Alert.alert('Rating Required', 'Please select a rating before submitting');
            return;
        }
        
        if (!reviewText.trim()) {
            Alert.alert('Review Required', 'Please write a review before submitting');
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            // Debug auth state
            const authToken = await AsyncStorage.getItem('authToken');
            const userData = await AsyncStorage.getItem('userData');
            const userId = await AsyncStorage.getItem('userId');
            
            console.log('Auth Debug Info:');
            console.log('- isAuthenticated:', isAuthenticated);
            console.log('- user:', user);
            console.log('- authToken exists:', !!authToken);
            console.log('- userData exists:', !!userData);
            console.log('- userId:', userId);
            
            const reviewData = {
                rating,
                comment: reviewText.trim(),
                media: selectedImages
            };
            
            console.log('Submitting review for vendorId:', vendorId);
            console.log('Review data:', reviewData);
            
            const response = await vendorDetailsService.submitVendorReview(vendorId, reviewData);
            
            if (response.success) {
                Alert.alert(
                    'Success', 
                    'Your review has been submitted successfully!',
                    [{
                        text: 'OK',
                        onPress: () => {
                            // Call the callback to refresh reviews
                            if (onReviewSubmitted) {
                                onReviewSubmitted();
                            }
                            navigation.goBack();
                        }
                    }]
                );
            } else {
                Alert.alert('Error', response.message || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            Alert.alert('Error', 'Failed to submit review. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const showImagePicker = () => {
        Alert.alert(
            'Select Image',
            'Choose an option',
            [
                { text: 'Camera', onPress: openCamera },
                { text: 'Gallery', onPress: openGallery },
                { text: 'Cancel', style: 'cancel' }
            ],
            { cancelable: true }
        );
    };
    
    const openCamera = () => {
        const options = {
            mediaType: 'photo',
            quality: 0.8,
            maxWidth: 1024,
            maxHeight: 1024,
        };
        
        launchCamera(options, (response) => {
            if (response.assets && response.assets[0]) {
                const newImage = {
                    uri: response.assets[0].uri,
                    type: response.assets[0].type,
                    name: response.assets[0].fileName || 'image.jpg'
                };
                setSelectedImages(prev => [...prev, newImage]);
            }
        });
    };
    
    const openGallery = () => {
        const options = {
            mediaType: 'photo',
            quality: 0.8,
            maxWidth: 1024,
            maxHeight: 1024,
            selectionLimit: 5 - selectedImages.length, // Allow up to 5 images total
        };
        
        launchImageLibrary(options, (response) => {
            if (response.assets) {
                const newImages = response.assets.map(asset => ({
                    uri: asset.uri,
                    type: asset.type,
                    name: asset.fileName || 'image.jpg'
                }));
                setSelectedImages(prev => [...prev, ...newImages]);
            }
        });
    };
    
    const removeImage = (index) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                        <Icon name="arrow-back-outline" size={22} color="#2C3D5BF5" />
                    </TouchableOpacity>
                    <Text style={styles.backText}> Write Review for {vendorName || 'Vendor'}</Text>
                </View>

                <Text style={styles.label}>Rate the service</Text>
                <View style={styles.starsContainer}>
                    {[...Array(5)].map((_, index) => (
                        <TouchableOpacity key={index} onPress={() => handleStarPress(index)}>
                            <FontAwesome
                                name={index < rating ? 'star' : 'star-o'}
                                size={25}
                                color="#FFB800"
                                style={styles.star}
                            />
                        </TouchableOpacity>
                    ))}
                    {rating > 0 && (
                        <Text style={styles.ratingText}>({rating}/5)</Text>
                    )}
                </View>

                <Text style={styles.label}>Write a review</Text>
                <TextInput
                    style={styles.textArea}
                    placeholder="What should other customers know?"
                    multiline
                    numberOfLines={4}
                    value={reviewText}
                    onChangeText={setReviewText}
                    maxLength={500}
                />
                <Text style={styles.characterCount}>{reviewText.length}/500</Text>

                <Text style={styles.label}>Share photos (optional)</Text>
                
                {/* Selected Images */}
                {selectedImages.length > 0 && (
                    <ScrollView horizontal style={styles.selectedImagesContainer} showsHorizontalScrollIndicator={false}>
                        {selectedImages.map((image, index) => (
                            <View key={index} style={styles.selectedImageWrapper}>
                                <Image source={{ uri: image.uri }} style={styles.selectedImage} />
                                <TouchableOpacity 
                                    style={styles.removeImageBtn}
                                    onPress={() => removeImage(index)}
                                >
                                    <Icon name="close" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                )}
                
                {/* Add Photo Button */}
                {selectedImages.length < 5 && (
                    <TouchableOpacity style={styles.mediaBox} onPress={showImagePicker}>
                        <FontAwesome name="camera" size={24} color="#2C3D5B" />
                        <Text style={styles.mediaText}>Add Photo</Text>
                        <Text style={styles.mediaSubtext}>({selectedImages.length}/5)</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity 
                    style={[styles.submitButton, (isSubmitting || rating === 0 || !reviewText.trim()) && styles.disabledButton]} 
                    onPress={handleSubmit}
                    disabled={isSubmitting || rating === 0 || !reviewText.trim()}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.submitText}>Submit Review</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Review;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
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
        height: 80,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        marginTop: 10,
        borderWidth: 2,
        borderColor: '#E9ECEF',
        borderStyle: 'dashed',
    },
    mediaText: {
        fontSize: 14,
        color: '#2C3D5B',
        fontWeight: '500',
        marginTop: 8,
    },
    mediaSubtext: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    selectedImagesContainer: {
        marginTop: 10,
        marginBottom: 10,
    },
    selectedImageWrapper: {
        position: 'relative',
        marginRight: 12,
    },
    selectedImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    removeImageBtn: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#FF4444',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ratingText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#2C3D5B',
        fontWeight: '600',
    },
    characterCount: {
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
        marginTop: 4,
    },
    disabledButton: {
        backgroundColor: '#ccc',
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
