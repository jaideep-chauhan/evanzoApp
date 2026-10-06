import React, { useState, useEffect, useRef } from 'react';
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
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ImageEditor from '@react-native-community/image-editor';
import {
    cropImage,
    IMAGE_DIMENSIONS,
    AD_PHOTO_ASPECT_RATIO,
    isAdPhotoAspectRatio,
} from '../utils/imageCropperUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 4:5 crop frame, capped so it still leaves room for the controls on short screens
const FRAME_WIDTH = Math.round(Math.min(SCREEN_WIDTH - 32, SCREEN_HEIGHT * 0.52 * AD_PHOTO_ASPECT_RATIO));
const FRAME_HEIGHT = Math.round(FRAME_WIDTH / AD_PHOTO_ASPECT_RATIO);

// Saved ad photos are 4:5, at most this wide.
const OUTPUT_WIDTH = IMAGE_DIMENSIONS.FIXED_AD_PORTRAIT.width;

let keyCounter = 0;
const withKey = (image) => (image._key ? image : { ...image, _key: `img-${Date.now()}-${keyCounter++}` });

// How a photo sits in the frame: scaled to fill it ("cover"), so at most one
// axis overflows and can be dragged.
const layoutFor = (width, height) => {
    if (!width || !height) {
        return { scale: 1, displayWidth: FRAME_WIDTH, displayHeight: FRAME_HEIGHT, maxX: 0, maxY: 0 };
    }
    const scale = Math.max(FRAME_WIDTH / width, FRAME_HEIGHT / height);
    const displayWidth = width * scale;
    const displayHeight = height * scale;
    return {
        scale,
        displayWidth,
        displayHeight,
        maxX: Math.max(0, displayWidth - FRAME_WIDTH),
        maxY: Math.max(0, displayHeight - FRAME_HEIGHT),
    };
};

// Instagram-style photo step for ad photos. Each photo is shown already
// fitted to the 4:5 frame, centred; the user only drags it if they want a
// different part to show. Nothing has to be cropped by hand — Done cuts every
// photo to what its frame shows.
const ImageEditorModal = ({ visible, images, onClose, onDone, onAddMore }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [editedImages, setEditedImages] = useState([]);
    const [isCropping, setIsCropping] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    // Real (orientation-corrected) pixel sizes, keyed by image _key
    const [sizes, setSizes] = useState({});
    // Where each photo has been dragged to, keyed by image _key. A ref: the
    // ScrollView owns the live position, we only need it when saving.
    const offsetsRef = useRef({});

    // Sync editedImages with images prop when modal opens
    useEffect(() => {
        if (visible && images && images.length > 0) {
            offsetsRef.current = {};
            setSizes({});
            setEditedImages(images.map(withKey));
            setCurrentIndex(0);
        }
    }, [visible, images]);

    // The picker reports each photo's real size. Only measure when it
    // didn't (Image.getSize is not reliable for several files at once).
    useEffect(() => {
        editedImages.forEach((image) => {
            if ((image.width && image.height) || sizes[image._key]) return;
            Image.getSize(
                image.uri,
                (width, height) => setSizes((prev) => (prev[image._key] ? prev : { ...prev, [image._key]: { width, height } })),
                () => {},
            );
        });
    }, [editedImages]); // eslint-disable-line react-hooks/exhaustive-deps

    const sizeOf = (image) =>
        image.width && image.height
            ? { width: image.width, height: image.height }
            : sizes[image._key] || { width: 0, height: 0 };

    const currentImage = editedImages[currentIndex];
    const currentLayout = currentImage
        ? layoutFor(sizeOf(currentImage).width, sizeOf(currentImage).height)
        : layoutFor(0, 0);
    const canDrag = currentLayout.maxX > 1 || currentLayout.maxY > 1;

    const offsetFor = (image, layout) =>
        offsetsRef.current[image._key] || { x: layout.maxX / 2, y: layout.maxY / 2 };

    // "Crop" opens the full cropper (zoom / rotate) for people who want more
    // than dragging. Its result is already 4:5.
    const handleCropImage = async () => {
        try {
            setIsCropping(true);
            const croppedImage = await cropImage(
                editedImages[currentIndex].originalUri || editedImages[currentIndex].uri,
                { ...IMAGE_DIMENSIONS.FIXED_AD_PORTRAIT }
            );

            if (croppedImage) {
                const updatedImages = [...editedImages];
                const key = `${updatedImages[currentIndex]._key}-c`;
                updatedImages[currentIndex] = {
                    ...updatedImages[currentIndex],
                    _key: key,
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

    // Back / Android back: confirm before throwing away the picked photos.
    const handleCancel = () => {
        if (!editedImages || editedImages.length === 0) {
            onClose();
            return;
        }
        Alert.alert(
            'Discard photos?',
            `The ${editedImages.length} photo${editedImages.length === 1 ? '' : 's'} you picked won't be added.`,
            [
                { text: 'Keep editing', style: 'cancel' },
                { text: 'Discard', style: 'destructive', onPress: onClose },
            ],
        );
    };

    // Cut one photo to the part its frame shows. Photos that are already 4:5
    // pass through untouched.
    const fitToFrame = async (image) => {
        const { width, height } = sizeOf(image);
        if (!width || !height || isAdPhotoAspectRatio(width, height)) return image;

        const layout = layoutFor(width, height);
        const offset = offsetFor(image, layout);
        const cropWidth = Math.min(width, FRAME_WIDTH / layout.scale);
        const cropHeight = Math.min(height, FRAME_HEIGHT / layout.scale);
        const x = Math.max(0, Math.min(width - cropWidth, offset.x / layout.scale));
        const y = Math.max(0, Math.min(height - cropHeight, offset.y / layout.scale));
        const outWidth = Math.round(Math.min(OUTPUT_WIDTH, cropWidth));

        const result = await ImageEditor.cropImage(image.uri, {
            offset: { x: Math.round(x), y: Math.round(y) },
            size: { width: Math.round(cropWidth), height: Math.round(cropHeight) },
            displaySize: { width: outWidth, height: Math.round(outWidth / AD_PHOTO_ASPECT_RATIO) },
            resizeMode: 'cover',
            format: 'jpeg',
            quality: 0.9,
        });
        const uri = typeof result === 'string' ? result : result.uri;
        return {
            ...image,
            uri,
            width: result.width || outWidth,
            height: result.height || Math.round(outWidth / AD_PHOTO_ASPECT_RATIO),
            cropped: true,
        };
    };

    const handleDone = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const fitted = [];
            for (const image of editedImages) {
                let result = image;
                try {
                    result = await fitToFrame(image);
                } catch (error) {
                    // Keep the photo as picked rather than losing it; ad
                    // screens show photos in a 4:5 "cover" frame anyway.
                    console.warn('Could not fit photo to 4:5:', error?.message);
                }
                const { _key, ...clean } = result;
                fitted.push(clean);
            }
            onDone(fitted);
            onClose();
        } finally {
            setIsSaving(false);
        }
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

    // "+" tile: pick more photos without leaving the editor.
    const handleAddMore = async () => {
        if (!onAddMore) return;
        try {
            const added = await onAddMore();
            if (added && added.length > 0) {
                setEditedImages((prev) => {
                    setCurrentIndex(prev.length);
                    return [...prev, ...added.map(withKey)];
                });
            }
        } catch (error) {
            console.warn('Adding photos failed:', error?.message);
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
                <View style={[styles.container, styles.centered]}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Loading images...</Text>
                </View>
            </Modal>
        );
    }

    const startOffset = currentImage ? offsetFor(currentImage, currentLayout) : { x: 0, y: 0 };
    const rememberOffset = (event) => {
        if (!currentImage) return;
        const { x, y } = event.nativeEvent.contentOffset;
        offsetsRef.current[currentImage._key] = { x, y };
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            statusBarTranslucent
            onRequestClose={handleCancel}
        >
            <View style={styles.container}>
                {/* Blurred copy of the current photo behind everything */}
                {currentImage && (
                    <Image source={{ uri: currentImage.uri }} style={StyleSheet.absoluteFill} blurRadius={30} resizeMode="cover" />
                )}
                <View style={styles.backdropTint} />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleCancel} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Icon name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        Edit Images ( {currentIndex + 1}/{editedImages.length} )
                    </Text>
                    <TouchableOpacity onPress={handleDone} style={styles.doneButton} disabled={isSaving}>
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#2C3D5B" />
                        ) : (
                            <Text style={styles.doneText}>Done</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* 4:5 crop frame — drag the photo inside it */}
                <View style={styles.mainImageContainer}>
                    <View style={styles.imageFrame}>
                        {currentImage && (
                            <ScrollView
                                // Remount per photo so each starts at its own position
                                key={`${currentImage._key}-${currentLayout.displayWidth}x${currentLayout.displayHeight}`}
                                horizontal={currentLayout.maxX > 1}
                                style={styles.frameScroll}
                                contentOffset={startOffset}
                                bounces={false}
                                overScrollMode="never"
                                showsHorizontalScrollIndicator={false}
                                showsVerticalScrollIndicator={false}
                                scrollEnabled={canDrag && !isSaving}
                                scrollEventThrottle={16}
                                onScroll={rememberOffset}
                                onMomentumScrollEnd={rememberOffset}
                                onScrollEndDrag={rememberOffset}
                            >
                                <Image
                                    source={{ uri: currentImage.uri }}
                                    style={{ width: currentLayout.displayWidth, height: currentLayout.displayHeight }}
                                    resizeMode="cover"
                                />
                            </ScrollView>
                        )}

                        {/* Rule-of-thirds grid */}
                        <View style={styles.grid} pointerEvents="none">
                            <View style={[styles.gridLineV, { left: '33.33%' }]} />
                            <View style={[styles.gridLineV, { left: '66.66%' }]} />
                            <View style={[styles.gridLineH, { top: '33.33%' }]} />
                            <View style={[styles.gridLineH, { top: '66.66%' }]} />
                        </View>
                    </View>

                    <Text style={styles.infoText}>
                        {canDrag
                            ? 'Drag the photo to choose what shows'
                            : 'This photo already fits the frame'}
                    </Text>
                </View>

                {/* Previous · Crop · Delete · Next */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.roundButton, currentIndex === 0 && styles.roundButtonDisabled]}
                        onPress={handlePrevious}
                        disabled={currentIndex === 0}
                    >
                        <Icon name="chevron-back" size={22} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.pillButton, styles.cropButton]}
                        onPress={handleCropImage}
                        disabled={isCropping || isSaving}
                    >
                        {isCropping ? (
                            <ActivityIndicator color="#2C3D5B" size="small" />
                        ) : (
                            <>
                                <Icon name="crop" size={18} color="#2C3D5B" />
                                <Text style={styles.cropButtonText}>Crop</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.pillButton, styles.deleteButton]}
                        onPress={handleRemoveImage}
                        disabled={isSaving}
                    >
                        <Icon name="trash-outline" size={18} color="#fff" />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.roundButton,
                            currentIndex === editedImages.length - 1 && styles.roundButtonDisabled,
                        ]}
                        onPress={handleNext}
                        disabled={currentIndex === editedImages.length - 1}
                    >
                        <Icon name="chevron-forward" size={22} color="#fff" />
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
                                key={image._key}
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
                            </TouchableOpacity>
                        ))}
                        {!!onAddMore && (
                            <TouchableOpacity style={[styles.thumbnail, styles.addThumbnail]} onPress={handleAddMore} disabled={isSaving}>
                                <Icon name="add" size={24} color="#fff" />
                            </TouchableOpacity>
                        )}
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
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        marginTop: 16,
    },
    backdropTint: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 56,
        paddingBottom: 12,
    },
    backButton: {
        marginRight: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    doneButton: {
        minWidth: 84,
        height: 38,
        paddingHorizontal: 20,
        borderRadius: 19,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#2C3D5B',
    },
    mainImageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageFrame: {
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#fff',
        backgroundColor: '#000',
    },
    frameScroll: {
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT,
    },
    grid: {
        ...StyleSheet.absoluteFillObject,
    },
    gridLineV: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: StyleSheet.hairlineWidth * 2,
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    gridLineH: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: StyleSheet.hairlineWidth * 2,
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    infoText: {
        color: '#ffffffcc',
        fontSize: 13,
        marginTop: 12,
        textAlign: 'center',
        paddingHorizontal: 24,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 10,
    },
    roundButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        borderWidth: 1,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    roundButtonDisabled: {
        opacity: 0.35,
    },
    pillButton: {
        flex: 1,
        height: 42,
        borderRadius: 21,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    cropButton: {
        backgroundColor: '#fff',
    },
    cropButtonText: {
        color: '#2C3D5B',
        fontSize: 15,
        fontWeight: '700',
    },
    deleteButton: {
        backgroundColor: '#E5595B',
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    thumbnailContainer: {
        paddingTop: 10,
        paddingBottom: 34,
    },
    thumbnailScrollContent: {
        paddingHorizontal: 16,
        gap: 10,
    },
    thumbnail: {
        width: 46,
        height: 58,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'transparent',
        overflow: 'hidden',
    },
    thumbnailActive: {
        borderColor: '#fff',
        borderWidth: 2,
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
    addThumbnail: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default ImageEditorModal;
