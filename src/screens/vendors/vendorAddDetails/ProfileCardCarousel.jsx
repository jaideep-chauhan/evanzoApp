import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    FlatList,
    Animated,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.55;

const data = [
    {
        id: '1',
        name: 'Mega Pixel Studio',
        role: 'Photography',
        location: 'Ontario, Canada',
        rating: 5,
        image: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
    {
        id: '2',
        name: 'Mega Pixel Studio',
        role: 'Photography',
        location: 'Ontario, Canada',
        rating: 5,
        image: 'https://randomuser.me/api/portraits/men/2.jpg',
    },
    {
        id: '1',
        name: 'Mega Pixel Studio',
        role: 'Photography',
        location: 'Ontario, Canada',
        rating: 5,
        image: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
    {
        id: '2',
        name: 'Mega Pixel Studio',
        role: 'Photography',
        location: 'Ontario, Canada',
        rating: 5,
        image: 'https://randomuser.me/api/portraits/men/2.jpg',
    },
    // Add more if needed
];

const ProfileCard = ({ item }) => {
    return (
        <View style={styles.card}>
            <View style={styles.ratingBadge}>
                <FontAwesome name="star" size={14} color="#f6c945" />
                <Text style={styles.ratingText}>{item.rating}.</Text>
            </View>

            <TouchableOpacity style={styles.closeIcon}>
                <Entypo name="cross" size={16} color="#333" />
            </TouchableOpacity>

            <Image source={{ uri: item.image }} style={styles.avatar} />

            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.role}>{item.role}</Text>

            <View style={styles.locationBadge}>
                <Ionicons name="location-sharp" size={16} color="#2c3a58" />
                <Text style={styles.locationText}>{item.location}</Text>
            </View>

            <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>View</Text>
            </TouchableOpacity>
        </View>
    );
};

const ProfileCardCarousel = () => {
    const scrollRef = useRef(null);
    const intervalRef = useRef(null);
    const currentIndex = useRef(0);
    
    // Create extended data for infinite loop
    const extendedData = [data[data.length - 1], ...data, data[0]];
    
    useEffect(() => {
        // Initial positioning to the first real item
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollToIndex({ index: 1, animated: false });
                currentIndex.current = 1;
            }
        }, 100);
        
        // Auto-scroll interval
        intervalRef.current = setInterval(() => {
            if (scrollRef.current) {
                try {
                    currentIndex.current += 1;
                    
                    // Check if we've reached the end clone
                    if (currentIndex.current >= extendedData.length - 1) {
                        // Reset to the first real item after showing last clone
                        setTimeout(() => {
                            currentIndex.current = 1;
                            scrollRef.current.scrollToIndex({ 
                                index: 1, 
                                animated: false 
                            });
                        }, 500);
                    } else {
                        scrollRef.current.scrollToIndex({ 
                            index: currentIndex.current, 
                            animated: true 
                        });
                    }
                } catch (error) {
                    // Reset to safe index if error occurs
                    currentIndex.current = 1;
                    scrollRef.current.scrollToIndex({ 
                        index: 1, 
                        animated: false 
                    });
                }
            }
        }, 3000);
        
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [extendedData.length]);
    
    const handleScrollEnd = (event) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / (CARD_WIDTH + 10));
        
        if (index === 0) {
            // If scrolled to the clone at the beginning, jump to the last real item
            currentIndex.current = data.length;
            scrollRef.current.scrollToIndex({ 
                index: data.length, 
                animated: false 
            });
        } else if (index === extendedData.length - 1) {
            // If scrolled to the clone at the end, jump to the first real item
            currentIndex.current = 1;
            scrollRef.current.scrollToIndex({ 
                index: 1, 
                animated: false 
            });
        } else {
            currentIndex.current = index;
        }
    };
    
    const getItemLayout = (_, index) => ({
        length: CARD_WIDTH + 10,
        offset: (CARD_WIDTH + 10) * index,
        index,
    });

    return (
        <View style={styles.carouselContainer}>
            <Text style={styles.sectionTitle}>You might also like</Text>
            <FlatList
                ref={scrollRef}
                data={extendedData}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => `${item.id}_${index}`}
                contentContainerStyle={{ paddingHorizontal: 0 }}
                ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
                renderItem={({ item }) => <ProfileCard item={item} />}
                onMomentumScrollEnd={handleScrollEnd}
                onScrollToIndexFailed={() => {}}
                getItemLayout={getItemLayout}
                pagingEnabled={false}
                snapToInterval={CARD_WIDTH + 10}
                decelerationRate="fast"
            />
        </View>
    );
};

export default ProfileCardCarousel;

const styles = StyleSheet.create({
    carouselContainer: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 16,
        marginBottom: 16,
        color: '#1D1B20',
        
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 16,
        paddingTop: 24,
        position: 'relative',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
        elevation: 3,
        boxShadow: '2px 2px 6px 0px #0000001A',
        paddingVertical: 20,

    },
    ratingBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        borderWidth: 1,
        borderColor: '#F6CD4A',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontWeight: '600',
        color: '#F6CD4A',
        marginLeft: 4,
    },
    closeIcon: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignSelf: 'center',
        marginBottom: 12,
    },
    name: {
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '700',
        color: '#2A282F',
    },
    role: {
        textAlign: 'center',
        fontSize: 12,
        color: '#777',
        marginTop: 2,
        marginBottom: 10,
        color: '#49454F'
    },
    locationBadge: {
        backgroundColor: '#edf3ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    locationText: {
        marginLeft: 6,
        fontSize: 10,
        color: '#2C3D5BF5',
    },
    button: {
        backgroundColor: '#2c3a58',
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: 'center',
        
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
