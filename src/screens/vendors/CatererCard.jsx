import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated, Image } from 'react-native';
import { useTheme } from '../../ThemeContext';
import img from '../../assets/images/dummy.png';

const { width } = Dimensions.get('window');


const slides = [
    { bgColor: '#FFB6C1', header: 'Welcome to Evanzo!' },
    { bgColor: '#B0E0E6', header: 'Best Catering Services' },
    { bgColor: '#FFD700', header: 'Book Your Event Today' }
];

const demoImages = [
    img,
    img,
    img
];

const CatererCard = () => {
    const theme = useTheme();

    // Infinite auto-scroll logic for images
    const extendedImages = [demoImages[demoImages.length - 1], ...demoImages, demoImages[0]];
    const scrollRef = useRef(null);
    const currentIndex = useRef(1);
    const intervalRef = useRef(null);

    useEffect(() => {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTo({ x: (width - 56) * 1, animated: false });
            }
        }, 10);
        intervalRef.current = setInterval(() => {
            if (scrollRef.current) {
                currentIndex.current += 1;
                scrollRef.current.scrollTo({ x: (width - 56) * currentIndex.current, animated: true });
            }
        }, 2500);
        return () => clearInterval(intervalRef.current);
    }, []);

    const handleScrollEnd = (e) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const slideWidth = width - 56;
        let idx = Math.round(offsetX / slideWidth);
        if (idx === extendedImages.length - 1) {
            currentIndex.current = 1;
            if (scrollRef.current) {
                scrollRef.current.scrollTo({ x: slideWidth, animated: false });
            }
        } else if (idx === 0) {
            currentIndex.current = demoImages.length;
            if (scrollRef.current) {
                scrollRef.current.scrollTo({ x: slideWidth * demoImages.length, animated: false });
            }
        } else {
            currentIndex.current = idx;
        }
    };

    return (
        <View style={[styles.maincard, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>SA</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Shahi Awadh Caterer</Text>
                    <View style={styles.tagRow}>
                        <Text style={styles.tag}>🍽️ Catering</Text>
                        <Text style={styles.tag}>📍 Ontario, Canada</Text>
                    </View>
                </View>
                <View style={styles.ratingBox}>
                    <Text style={styles.rating}>⭐ 4.0</Text>
                </View>
            </View>
            <View style={styles.card}>
                {/* Sub-card with border for grouped content */}
                <View style={styles.subCard}>
                    {/* Offer Info */}
                    <View style={styles.offerRow}>
                        <View style={styles.offerItem}>
                            <Text style={[styles.offerLabel, { color: theme.colors.textSecondary }]}>Amount spent</Text>
                            <View style={[styles.offerValueContainer, { backgroundColor: theme.colors.primary }]}>
                                <Text style={styles.offerValue}>💲150</Text>
                            </View>
                        </View>
                        <View style={styles.offerItem}>
                            <Text style={[styles.offerLabel, { color: theme.colors.textSecondary }]}>Percentage</Text>
                            <View style={[styles.offerValueContainer, { backgroundColor: theme.colors.primary }]}>
                                <Text style={styles.offerValue}>🔟%</Text>
                            </View>
                        </View>
                        <Text style={[styles.seeMore, { color: theme.colors.primary }]}>SEE MORE</Text>
                    </View>

                    {/* Image Carousel (infinite auto-scroll) */}
                    <Animated.ScrollView
                        ref={scrollRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        style={styles.carouselContainer}
                        contentContainerStyle={{ alignItems: 'center' }}
                        scrollEventThrottle={16}
                        onMomentumScrollEnd={handleScrollEnd}
                    >
                        {extendedImages.map((img, idx) => (
                            <Image
                                key={idx}
                                source={img}
                                style={styles.carouselImage}
                                resizeMode="cover"
                            />
                        ))}
                    </Animated.ScrollView>

                    {/* Description and Chat Button in a row */}
                    <View style={styles.rowContent}>
                        <Text style={styles.description} numberOfLines={2}>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do ..........
                        </Text>
                        <TouchableOpacity style={[styles.chatButton, { backgroundColor: theme.colors.primary }]}>
                            <Text style={styles.chatButtonText}>Chat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default CatererCard;

const styles = StyleSheet.create({
    maincard: {
        margin: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        // padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16
    },
    avatar: {
        backgroundColor: '#f0f0f0',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    avatarText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#333'
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4
    },
    tagRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap'
    },
    tag: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        fontSize: 12,
        color: '#666'
    },
    ratingBox: {
        alignItems: 'center'
    },
    rating: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333'
    },
    subCard: {
        backgroundColor: '#fafbfc',
        borderRadius: 12,
        // borderWidth: 1,
        borderColor: '#e1e5e9',
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        // elevation: 2,
    },
    offerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        // borderBottomWidth: 1,
        borderBottomColor: '#e9ecef'
    },
    offerItem: {
        alignItems: 'center'
    },
    offerLabel: {
        fontSize: 12,
        marginBottom: 6
    },
    offerValueContainer: {
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        minWidth: 60,
        alignItems: 'center'
    },
    offerValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff'
    },
    seeMore: {
        fontWeight: 'bold',
        fontSize: 12,
        textDecorationLine: 'underline'
    },
    carouselContainer: {
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden'
    },
    carouselImage: {
        width: width,
        height: 200,
        // borderRadius: 12,
        // backgroundColor: '#f8f9fa',
    },
    rowContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12
    },
    description: {
        flex: 1,
        fontSize: 14,
        color: '#495057',
        lineHeight: 20
    },
    chatButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        minWidth: 80,
        alignItems: 'center'
    },
    chatButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14
    }
});
