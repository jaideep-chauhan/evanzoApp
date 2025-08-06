import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    Dimensions,
    ImageBackground,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import img from '../../assets/images/dummy.png';
import bg1 from '../../assets/images/bg1.png';
import { useTheme } from '../../ThemeContext';
import Icon2 from 'react-native-vector-icons/Feather'
import Icon3 from 'react-native-vector-icons/Entypo'
const { width } = Dimensions.get('window');
const AVATAR_SIZE = 40;

export default function EventDetailView() {
    const navigation = useNavigation();
    const theme = useTheme();

    const [quoteText, setQuoteText] = useState('');
    const [isFavorited, setIsFavorited] = useState(false);
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [descTruncated, setDescTruncated] = useState(false);
    const descTextRef = useRef(null);

    const eventData = {
        title: 'Corporate Event',
        location: 'Ontario, Canada',
        date: '30 May 2025',
        duration: '04',
        time: '07:00 pm',
        budget: '$1500',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do...',
        images: [img, bg1, img], // Example images for carousel
        organizer: {
            name: 'Tushar Dhania',
            avatar: img,
            rating: 5.0,
            reviewCount: 10,
        },
    };

    const handleSendQuote = () => {
        console.log('Sending quote:', quoteText);
        setQuoteText('');
    };

    const toggleFavorite = () => {
        setIsFavorited(!isFavorited);
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        for (let i = 0; i < fullStars; i++) {
            stars.push(<Icon key={i} name="star" size={14} color="#334462" />);
        }
        const remainingStars = 5 - fullStars;
        for (let i = 0; i < remainingStars; i++) {
            stars.push(<Icon key={`empty-${i}`} name="star-outline" size={14} color="#334462" />);
        }
        return stars;
    };

    return (
        <ScrollView style={styles.container}>
            <ImageBackground source={bg1} style={styles.banner} resizeMode="cover">
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                        <Icon name="arrow-back-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}>
                        <Icon2 name="bell" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </ImageBackground>

            <View style={styles.infoCard}>
                {/* Header Row with Title/Location on left and Icons on right */}
                <View style={styles.headerRow}>
                    <View style={styles.titleSection}>
                        <Text style={styles.title}>{eventData.title}</Text>
                        <View style={styles.locationRow}>
                            <Icon name="location-outline" size={14} color="#334462" style={{ marginRight: 4 }} />
                            <Text style={styles.location}>{eventData.location}</Text>
                        </View>
                    </View>
                    <View style={styles.actionIcons}>
                        <TouchableOpacity style={styles.actionBtn}>
                            <Icon3 name="share" size={20} color="#334462" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={toggleFavorite}>
                            <Icon
                                name={isFavorited ? "heart" : "heart-outline"}
                                size={20}
                                color={isFavorited ? "#e91e63" : "#334462"}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Meta Information Grid */}
                <View style={styles.metaContainer}>
                    <View style={styles.metaColumn}>
                        <Text style={styles.metaLabel}>Date</Text>
                        <View style={styles.metaBox}>
                            <Text style={styles.metaValue}>{eventData.date}</Text>
                        </View>
                    </View>
                    <View style={styles.metaColumn}>
                        <Text style={styles.metaLabel}>Duration</Text>
                        <View style={styles.metaBox}>
                            <Text style={styles.metaValue}>{eventData.duration} Hr</Text>
                        </View>
                    </View>
                    <View style={styles.metaColumn}>
                        <Text style={styles.metaLabel}>Time</Text>
                        <View style={styles.metaBox}>
                            <Text style={styles.metaValue}>{eventData.time}</Text>
                        </View>
                    </View>
                    <View style={styles.metaColumn}>
                        <Text style={styles.metaLabel}>Budget</Text>
                        <View style={styles.metaBox}>
                            <Text style={styles.metaValue}>{eventData.budget}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={{ flex: 1, paddingHorizontal: 20 }}>
                {/* About Section */}
                <View style={styles.aboutSection}>
                    <Text style={styles.aboutText}>About</Text>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        style={styles.carousel}
                        contentContainerStyle={{ gap: 10 }}
                    >
                        {eventData.images.map((imageSrc, idx) => (
                            <Image
                                key={idx}
                                source={imageSrc}
                                style={styles.carouselImage}
                                resizeMode="cover"
                            />
                        ))}
                    </ScrollView>
                    <Text
                        style={styles.description}
                        numberOfLines={showFullDesc ? undefined : 3}
                        ellipsizeMode="tail"
                        ref={descTextRef}
                        onTextLayout={e => {
                            if (!showFullDesc && e.nativeEvent.lines.length > 3 && !descTruncated) {
                                setDescTruncated(true);
                            }
                        }}
                    >
                        {eventData.description}
                    </Text>
                    {descTruncated && !showFullDesc && (
                        <TouchableOpacity onPress={() => setShowFullDesc(true)}>
                            <Text style={styles.readMoreText}>Read more</Text>
                        </TouchableOpacity>
                    )}
                    {showFullDesc && descTruncated && (
                        <TouchableOpacity onPress={() => setShowFullDesc(false)}>
                            <Text style={styles.readMoreText}>Show less</Text>
                        </TouchableOpacity>
                    )}

                </View>

                {/* User Info Section */}
                <View style={styles.userInfo}>
                    <View style={styles.userInfoBox}>
                        <Text style={styles.userInfoTitle}>User Information</Text>
                        <View style={styles.rating}>
                            {renderStars(eventData.organizer.rating)}
                            <Text style={styles.ratingText}>({eventData.organizer.reviewCount})</Text>
                        </View>
                    </View>
                    <View style={styles.userInfoBox2}>
                        <Image source={eventData.organizer.avatar} style={styles.avatar} />
                        <Text style={styles.organizerName}>{eventData.organizer.name}</Text>
                    </View>
                    <Text style={styles.seeAllText}>See All</Text>
                </View>

                {/* Suggestion Section */}
                <View style={styles.suggestionSection}>
                    <Text style={styles.suggestionText}>You might also like</Text>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.suggestionList}
                    >
                        {[1, 2].map((_, index) => (
                            <View key={index} style={styles.suggestionCard}>
                                {/* Close Button */}
                                <TouchableOpacity style={styles.closeIcon}>
                                    <Icon name="close" size={16} color="#334462" />
                                </TouchableOpacity>

                                {/* Duration Tag */}
                                <View style={styles.durationTag}>
                                    <Text style={styles.durationText}>2 Hours</Text>
                                </View>

                                {/* Title */}
                                <Text style={styles.suggestionTitle}>Corporate Event</Text>

                                {/* Organizer Info */}
                                <View style={styles.nameBox}>
                                    <View style={styles.iconBox}>
                                        <Icon name="person" size={12} color="#2C3D5BF5" />
                                    </View>
                                    <Text style={styles.suggestionOrganizer}>Tushar Dhania</Text>
                                </View>

                                {/* Location and Date */}
                                <View style={styles.detailRow}>
                                    <View style={styles.pill}>
                                        <Icon name="location-outline" size={12} color="#334462" style={{ marginRight: 4 }} />
                                        <Text style={styles.pillText}>Ontario, Canada</Text>
                                    </View>
                                    <View style={styles.pill}>
                                        <Icon name="calendar-outline" size={12} color="#334462" style={{ marginRight: 4 }} />
                                        <Text style={styles.pillText}>October 30, 2023</Text>
                                    </View>
                                </View>

                                {/* View Button */}
                                <TouchableOpacity style={styles.viewBtn}>
                                    <Text style={styles.viewText}>View</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>


                {/* Quote Section */}
                <View style={styles.quoteSection}>
                    <TextInput
                        style={styles.quoteInput}
                        placeholder="Give a quote..."
                        placeholderTextColor="#ccc"
                        value={quoteText}
                        onChangeText={setQuoteText}
                    />
                    <TouchableOpacity style={styles.sendBtn} onPress={handleSendQuote}>
                        <Text style={styles.sendText}>Send</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingBottom: 100,
    },
    banner: {
        height: 250,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: 'hidden',
        paddingTop: 50,
    },
    headerIcons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
    },
    iconBtn: {
        padding: 8,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 18,
        marginTop: -100,
        width: '95%',
        alignSelf: 'center',
        boxShadow: '1px 1px 4px 0px #00000029',

    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
        backgroundColor: '#E7F0FF80',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,

    },
    titleSection: {
        flex: 1,
        alignItems: 'flex-start',
    },
    actionIcons: {
        flexDirection: 'column',
        gap: 8,
    },
    actionBtn: {
        padding: 8,
        backgroundColor: '#F4F4F4',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1D1B20',
        textAlign: 'left',
        marginBottom: 4,
    },
    location: {
        fontSize: 14,
        color: '#666',
        textAlign: 'left',
    },
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 0,
        paddingHorizontal: 0,
        marginHorizontal: -4, // compensate for child margin
    },
    metaColumn: {
        flex: 1,
        marginHorizontal: 4,
    },
    metaLabel: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
        textAlign: 'left',
        paddingLeft: 0,
    },
    metaBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 2,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: 32,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    metaValue: {
        fontSize: 11,
        color: '#1D1B20',
        fontWeight: '700',
        textAlign: 'center',
        paddingHorizontal: 0,
        flexShrink: 1,
        flexWrap: 'nowrap',
        includeFontPadding: false,
        numberOfLines: 1,
    },
    aboutSection: {
        marginVertical: 20,
        borderRadius: 10,
        padding: 10,
        boxShadow: '1px 1px 4px 0px #00000029',

    },
    aboutText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
        marginBottom: 10,
    },
    carousel: {
        width: '100%',
        marginBottom: 10,
    },
    carouselImage: {
        width: 300,
        height: 200,
        borderRadius: 10,
        marginRight: 0,
    },
    description: {
        fontSize: 12,
        color: '#2C3D5B',
        lineHeight: 18,
    },
    readMoreText: {
        color: '#334462',
        fontWeight: '600',
        marginTop: 4,
        fontSize: 13,
        alignSelf: 'flex-start',
    },
    readMoreText: {
        color: '#334462',
        fontWeight: '600',
        marginTop: 4,
        fontSize: 13,
        alignSelf: 'flex-start',
    },
    userInfo: {
        // borderWidth: 1,
        borderRadius: 10,
        marginBottom: 20,
        backgroundColor: '#fff', // Required for shadow to appear properly

        // iOS shadow
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.16,
        shadowRadius: 4,
        paddingHorizontal: 7,
        paddingVertical: 5,
        // Android shadow (elevation)
        elevation: 2,
    },

    userInfoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 10,
        // marginBottom: 4,
    },
    userInfoBox2: {
        flexDirection: 'row',
        alignItems: 'center',
        // justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 10,
        // marginBottom: 4,
    },
    userInfoTitle: {
        fontSize: 8,
        fontWeight: '500',
        color: '#000000',
        marginBottom: 4,
    },
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        marginRight: 10,
    },
    organizerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1D1B20',
    },
    seeAllText: {
        fontSize: 10,
        color: '#003A9B',
        fontWeight: '500',
        marginBottom: 4,
        alignSelf: 'flex-end',
        paddingHorizontal: 10,
    },
    rating: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
    },
    ratingText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    suggestionSection: {
        marginBottom: 20,
    },
    suggestionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#111',
        marginBottom: 10,
    },
    suggestionSection: {
        marginBottom: 20,
    },

    suggestionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111',
        marginBottom: 10,
        paddingHorizontal: 10,
    },

    suggestionList: {
        paddingLeft: 10,
        paddingRight: 10,
        gap: 16,
    },

    suggestionCard: {
        width: 320,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginRight: 10,
        position: 'relative',

        // Shadow (iOS)
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.16,
        shadowRadius: 4,

        // Shadow (Android)
        elevation: 4,
    },

    closeIcon: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#F3F7FF',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },

    durationTag: {
        alignSelf: 'flex-start',
        backgroundColor: '#E8F0FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 10,
    },

    durationText: {
        fontSize: 12,
        color: '#334462',
        fontWeight: '700',
    },

    suggestionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1D1B20',
        marginBottom: 8,
    },

    nameBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },

    iconBox: {
        height: 24,
        width: 24,
        borderRadius: 12,
        backgroundColor: '#F3F7FF',
        justifyContent: 'center',
        alignItems: 'center',
    },

    suggestionOrganizer: {
        fontSize: 14,
        color: '#334462',
        fontWeight: '500',
    },

    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16,
    },

    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4F4F4',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },

    pillText: {
        fontSize: 12,
        color: '#334462',
    },

    viewBtn: {
        backgroundColor: '#2C3D5BF5',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 4,
    },

    viewText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },


    quoteSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2C3D5B',
        padding: 25,
        borderRadius: 50,
        marginVertical: 20,
        // marginHorizontal: 10,
    },

    quoteInput: {
        flex: 1,
        backgroundColor: 'transparent',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
        color: '#fff',
        marginRight: 10,
    },

    sendBtn: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },

    sendText: {
        color: '#2C3D5B',
        fontSize: 16,
        fontWeight: '600',
    },

});