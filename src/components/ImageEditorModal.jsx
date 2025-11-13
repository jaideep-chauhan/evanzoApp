import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    Modal,
    StyleSheet,
    ScrollView,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { cropImage, IMAGE_DIMENSIONS } from '../utils/imageCropperUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ImageEditorModal = ({ visible, images, onClose, onDone }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [editedImages, setEditedImages] = useState(images || []);
    const [isCropping, setIsCropping] = useState(false);

    // Sync editedImages with images prop when modal opens
    useEffect(() => {
        console.log('🖼️ ImageEditorModal - visible:', visible, 'images:', images?.length || 0);
        if (visible && images && images.length > 0) {
            console.log('🖼️ Setting edited images:', images.length);
            setEditedImages(images);
            setCurrentIndex(0);
        }
    }, [visible, images]);

    const currentImage = editedImages[currentIndex];

    const handleCropImage = async () => {
        try {
            setIsCropping(true);
            const croppedImage = await cropImage(
                editedImages[currentIndex].originalUri || editedImages[currentIndex].uri,
                { ...IMAGE_DIMENSIONS.FIXED_SQUARE }
            );

            if (croppedImage) {
                const updatedImages = [...editedImages];
                updatedImages[currentIndex] = {
                    ...updatedImages[currentIndex],
                    uri: croppedImage.uri,
                    width: croppedImage.width,
                    height: croppedImage.height,
                    cropped: true,
                };
                setEditedImages(updatedImages);
            }
            setIsCropping(false);
        } catch (error) {
            console.error('Error cropping image:', error);
            setIsCropping(false);
        }
    };

    const handleNext = () => {
        if (currentIndex < editedImages.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleDone = () => {
        onDone(editedImages);
        onClose();
    };

    const handleRemoveImage = () => {
        const updatedImages = editedImages.filter((_, index) => index !== currentIndex);

        if (updatedImages.length === 0) {
            // No images left, close modal
            onDone([]);
            onClose();
            return;
        }

        setEditedImages(updatedImages);

        // Adjust current index if necessary
        if (currentIndex >= updatedImages.length) {
            setCurrentIndex(updatedImages.length - 1);
        }
    };

    if (!visible) {
        return null;
    }

    // Show loading or empty state if no images
    if (!editedImages || editedImages.length === 0) {
        return (
            <Modal
                visible={visible}
                animationType="slide"
                statusBarTranslucent
                onRequestClose={onClose}
            >
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={{ color: '#fff', marginTop: 16 }}>Loading images...</Text>
                </View>
            </Modal>
        );
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                        <Icon name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        Edit Images ({currentIndex + 1}/{editedImages.length})
                    </Text>
                    <TouchableOpacity onPress={handleDone} style={styles.headerButton}>
                        <Text style={styles.doneText}>Done</Text>
                    </TouchableOpacity>
                </View>

                {/* Main Image Display with Fixed Frame */}
                <View style={styles.mainImageContainer}>
                    {/* Fixed Square Frame */}
                    <View style={styles.imageFrame}>
                        {currentImage && (
                            <Image
                                source={{ uri: currentImage.uri }}
                                style={styles.mainImage}
                                resizeMode="cover"
                            />
                        )}

                        {/* Frame Border Overlay */}
                        <View style={styles.frameBorder} pointerEvents="none">
                            <View style={styles.frameCorner} />
                        </View>

                        {/* Crop Status Badge */}
                        {currentImage?.cropped && (
                            <View style={styles.croppedBadge}>
                                <Icon name="checkmark-circle" size={16} color="#4CAF50" />
                                <Text style={styles.croppedText}>Cropped</Text>
                            </View>
                        )}
                    </View>

                    {/* Info Text */}
                    <Text style={styles.infoText}>
                        {currentImage?.cropped
                            ? '✓ Image cropped to square format'
                            : 'Image may need cropping to fit square format'}
                    </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleCropImage}
                        disabled={isCropping}
                    >
                        {isCropping ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Icon name="crop" size={24} color="#fff" />
                                <Text style={styles.actionButtonText}>
                                    {currentImage?.cropped ? 'Re-crop' : 'Crop'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={handleRemoveImage}
                    >
                        <Icon name="trash" size={24} color="#fff" />
                        <Text style={styles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>
                </View>

                {/* Navigation Buttons */}
                <View style={styles.navigationContainer}>
                    <TouchableOpacity
                        style={[
                            styles.navButton,
                            currentIndex === 0 && styles.navButtonDisabled,
                        ]}
                        onPress={handlePrevious}
                        disabled={currentIndex === 0}
                    >
                        <Icon
                            name="chevron-back"
                            size={24}
                            color={currentIndex === 0 ? '#666' : '#fff'}
                        />
                        <Text
                            style={[
                                styles.navButtonText,
                                currentIndex === 0 && styles.navButtonTextDisabled,
                            ]}
                        >
                            Previous
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.navButton,
                            currentIndex === editedImages.length - 1 && styles.navButtonDisabled,
                        ]}
                        onPress={handleNext}
                        disabled={currentIndex === editedImages.length - 1}
                    >
                        <Text
                            style={[
                                styles.navButtonText,
                                currentIndex === editedImages.length - 1 &&
                                    styles.navButtonTextDisabled,
                            ]}
                        >
                            Next
                        </Text>
                        <Icon
                            name="chevron-forward"
                            size={24}
                            color={
                                currentIndex === editedImages.length - 1 ? '#666' : '#fff'
                            }
                        />
                    </TouchableOpacity>
                </View>

                {/* Thumbnail Strip */}
                <View style={styles.thumbnailContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.thumbnailScrollContent}
                    >
                        {editedImages.map((image, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.thumbnail,
                                    index === currentIndex && styles.thumbnailActive,
                                ]}
                                onPress={() => setCurrentIndex(index)}
                            >
                                <Image
                                    source={{ uri: image.uri }}
                                    style={styles.thumbnailImage}
                                    resizeMode="cover"
                                />
                                {image.cropped && (
                                    <View style={styles.thumbnailBadge}>
                                        <Icon name="checkmark-circle" size={14} color="#4CAF50" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#2C3D5B',
    },
    headerButton: {
        padding: 8,
        minWidth: 60,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    doneText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4CAF50',
    },
    mainImageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        padding: 16,
    },
    imageFrame: {
        width: SCREEN_WIDTH - 80,
        height: SCREEN_WIDTH - 80,
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 3,
        borderColor: '#4CAF50',
    },
    mainImage: {
        width: '100%',
        height: '100%',
    },
    frameBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderWidth: 2,
        borderColor: '#4CAF50',
        borderRadius: 13,
        opacity: 0.5,
    },
    frameCorner: {
        position: 'absolute',
        top: -1,
        left: -1,
        right: -1,
        bottom: -1,
        borderWidth: 1,
        borderColor: '#ffffff40',
        borderRadius: 14,
    },
    infoText: {
        color: '#ffffff80',
        fontSize: 13,
        marginTop: 16,
        textAlign: 'center',
        paddingHorizontal: 24,
    },
    croppedBadge: {
        position: 'absolute',
        top: 24,
        right: 24,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    croppedText: {
        color: '#4CAF50',
        fontSize: 12,
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 16,
        backgroundColor: '#1a1a1a',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2C3D5B',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
        minWidth: 120,
        justifyContent: 'center',
    },
    deleteButton: {
        backgroundColor: '#ff4444',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    navigationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#1a1a1a',
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    navButtonDisabled: {
        opacity: 0.3,
    },
    navButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    navButtonTextDisabled: {
        color: '#666',
    },
    thumbnailContainer: {
        backgroundColor: '#2C3D5B',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#ffffff20',
    },
    thumbnailScrollContent: {
        paddingHorizontal: 16,
        gap: 12,
    },
    thumbnail: {
        width: 70,
        height: 70,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
        overflow: 'hidden',
        position: 'relative',
    },
    thumbnailActive: {
        borderColor: '#4CAF50',
        borderWidth: 3,
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
    thumbnailBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 10,
        padding: 2,
    },
});

export default ImageEditorModal;
