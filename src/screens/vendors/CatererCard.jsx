import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated, Image } from 'react-native';
import { useTheme } from '../../ThemeContext';
import img from '../../assets/images/dummy.png';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Foundation from 'react-native-vector-icons/Foundation';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import percent from '../../assets/icons/percent.png';
import dollar from '../../assets/icons/dollar.png';
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
        <View style={[styles.maincard, { backgroundColor: '#fff' }]}>
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
                    <AntDesign name="star" color="#2C3D5BF5" size={13} />
                    <Text style={styles.rating}> 4.0</Text>
                </View>
            </View>
            <View style={styles.card}>
                {/* Sub-card with border for grouped content */}
                <View style={styles.subCard}>
                    {/* Offer Info */}
                    <View style={styles.offerRow}>
                        <View style={styles.offerTextContainer}>
                            <Text style={styles.offerText}>Offer:</Text>
                            <View style={styles.offerItem}>
                                <Text style={[styles.offerLabel, { color: theme.colors.textSecondary }]}>Amount spent</Text>
                                <View style={[styles.offerValueContainer, { backgroundColor: theme.colors.background }]}>
                                    <View style={styles.iconBox}>
                                        <Image source={dollar} style={{ width: 10, height: 10, resizeMode: 'contain' }} />
                                    </View>
                                    <Text style={styles.offerValue}>150</Text>
                                </View>
                            </View>
                            <View style={styles.offerItem}>
                                <Text style={[styles.offerLabel, { color: theme.colors.textSecondary }]}>Percentage</Text>
                                <View style={[styles.offerValueContainer, { backgroundColor: theme.colors.background }]}>
                                    <View style={styles.iconBox}>
                                        <Image source={percent} style={{ width: 10, height: 10, resizeMode: 'contain' }} />
                                    </View>
                                    <Text style={styles.offerValue}>10%</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.seeMoreBox}>
                            <Text style={[styles.seeMore, { color: theme.colors.white }]}>SEE MORE</Text>
                        </View>
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
        marginTop: 10,
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
    },
    card: {
        marginHorizontal: 12,
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 10, // As per your spec
        shadowColor: '#000000',
        shadowOffset: { width: 1, height: 1 }, // Matches 1px x 1px
        shadowOpacity: 0.16, // ~16% (29 in hex is ~16% opacity)
        shadowRadius: 6.5, // Approximates the 13px blur
        elevation: 2,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginBottom: 10,
        paddingHorizontal: 12,
    },
    avatar: {
        backgroundColor: '#2C3D5BF5',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    avatarText: {
        fontWeight: '500',
        fontSize: 16,
        color: '#fff'
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1D1B20',
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
        backgroundColor: '#F4F4F4',
        height: 30,
        width: 60,
        borderRadius: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    rating: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333'
    },
    subCard: {
        backgroundColor: '#fafbfc',
        borderRadius: 12,
        borderColor: '#e1e5e9',
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    offerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomColor: '#fff'
    },
    offerTextContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    offerText: {
        fontSize: 12,
        fontWeight: '400',
        color: '#344562',
        alignSelf: 'flex-end',
        marginBottom: 6
    },
    offerItem: {
        alignItems: 'center'
    },
    offerLabel: {
        fontSize: 10,
        fontWeight: '400',
        marginBottom: 6
    },
    iconBox: {
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    offerValueContainer: {
        backgroundColor: '#F4F4F4',
        borderRadius: 30,
        flexDirection: 'row',
        gap: 4,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4
    },
    offerValue: {
        fontSize: 10,
        fontWeight: '500',
        color: '#2C3D5BF5'
    },
    seeMoreBox: {
        height: 20,
        width: 60,
        borderRadius: 10,
        alignSelf: 'flex-end',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2C3D5B'
    },
    seeMore: {
        fontWeight: '500',
        fontSize: 8,
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
        fontSize: 10,
        fontWeight: '400',
        color: '#495057',
        lineHeight: 20
    },
    chatButton: {
        height: 40,
        width: 80,
        backgroundColor: '#15253F',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    chatButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14
    }
});
