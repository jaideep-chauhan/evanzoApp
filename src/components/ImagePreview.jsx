import React, { useState } from 'react';
import {
    View,
    Modal,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    StatusBar,
    ActivityIndicator,
    Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

const ImagePreview = ({ visible, imageUrl, imageName, onClose, onDownload }) => {
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    // Reset loading and error states when modal opens or image changes
    React.useEffect(() => {
        if (visible && imageUrl) {
            setLoading(true);
            setImageError(false);
        }
    }, [visible, imageUrl]);

    const handleClose = () => {
        setLoading(true);
        setImageError(false);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleClose}
            statusBarTranslucent={true}
        >
            <View style={styles.container}>
                <StatusBar backgroundColor="rgba(0, 0, 0, 0.9)" barStyle="light-content" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleClose}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Icon name="close" size={28} color="#fff" />
                    </TouchableOpacity>

                    {imageName && (
                        <Text style={styles.imageName} numberOfLines={1}>
                            {imageName}
                        </Text>
                    )}

                    {onDownload && (
                        <TouchableOpacity
                            style={styles.downloadButton}
                            onPress={() => onDownload(imageUrl, imageName)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Icon name="download-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Image */}
                <View style={styles.imageContainer}>
                    {loading && !imageError && (
                        <ActivityIndicator
                            size="large"
                            color="#fff"
                            style={styles.loader}
                        />
                    )}

                    {imageError ? (
                        <View style={styles.errorContainer}>
                            <Icon name="image-outline" size={64} color="#999" />
                            <Text style={styles.errorText}>Failed to load image</Text>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={() => {
                                    setImageError(false);
                                    setLoading(true);
                                }}
                            >
                                <Text style={styles.retryText}>Tap to retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <Image
                            key={imageUrl}
                            source={{ uri: imageUrl }}
                            style={styles.image}
                            resizeMode="contain"
                            onLoadStart={() => setLoading(true)}
                            onLoadEnd={() => setLoading(false)}
                            onError={(error) => {
                                console.error('Image preview load error:', error.nativeEvent.error);
                                console.log('Failed image URL:', imageUrl);
                                setLoading(false);
                                setImageError(true);
                            }}
                        />
                    )}
                </View>

                {/* Footer - Optional actions */}
                <View style={styles.footer}>
                    {/* You can add more actions here like share, forward, etc. */}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: StatusBar.currentHeight || 40,
        paddingBottom: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    closeButton: {
        padding: 8,
    },
    imageName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#fff',
        marginHorizontal: 16,
    },
    downloadButton: {
        padding: 8,
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: width,
        height: height - 120, // Account for header and footer
    },
    loader: {
        position: 'absolute',
    },
    errorContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#999',
        marginTop: 16,
    },
    retryButton: {
        marginTop: 12,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    retryText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '500',
    },
    footer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        minHeight: 50,
    },
});

export default ImagePreview;
