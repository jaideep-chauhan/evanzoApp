import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Full-screen, swipeable photo viewer for ad photos. Shows each photo whole
 * (contain) on black, with an "n / total" counter and a close button.
 *
 *   <ImageGalleryModal
 *       visible={open}
 *       images={[{ uri }, …]}   // Image sources (uri objects or require()s)
 *       initialIndex={tapped}
 *       onClose={() => setOpen(false)}
 *   />
 */
export default function ImageGalleryModal({ visible, images = [], initialIndex = 0, onClose }) {
    const insets = useSafeAreaInsets();
    const [index, setIndex] = useState(initialIndex);

    useEffect(() => {
        if (visible) setIndex(initialIndex);
    }, [visible, initialIndex]);

    if (!visible || images.length === 0) return null;

    return (
        <Modal visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <View style={styles.backdrop}>
                <FlatList
                    data={images}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    initialScrollIndex={Math.min(initialIndex, images.length - 1)}
                    getItemLayout={(_, i) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * i, index: i })}
                    keyExtractor={(_, i) => String(i)}
                    onMomentumScrollEnd={(e) =>
                        setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))
                    }
                    renderItem={({ item }) => (
                        <View style={styles.page}>
                            <Image source={item} style={styles.image} resizeMode="contain" />
                        </View>
                    )}
                />
                <View style={[styles.topBar, { top: insets.top + 8 }]}>
                    <Text style={styles.counter}>
                        {images.length > 1 ? `${index + 1} / ${images.length}` : ''}
                    </Text>
                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.closeButton}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        accessibilityLabel="Close photo"
                    >
                        <Icon name="close" size={26} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: '#000',
    },
    page: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    topBar: {
        position: 'absolute',
        left: 16,
        right: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    counter: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    closeButton: {
        padding: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
});
