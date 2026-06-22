import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function renderReviews(reviews, styles) {
    if (reviews && reviews.length > 0) {
        return reviews.map((review) => (
            <View key={review.id} style={styles.reviewBlock}>
                <View style={styles.rowBetween}>
                    <Text style={styles.reviewTitle}>{review.user}</Text>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                </View>
                <View style={styles.ratingRow}>
                    {[...Array(5)].map((_, i) => (
                        <Icon
                            key={i}
                            name="star"
                            size={16}
                            color={i < review.rating ? "#1E2B4F" : "#E0E0E0"}
                        />
                    ))}
                </View>
                <Text style={styles.reviewDescription}>{review.comment}</Text>
            </View>
        ));
    } else {
        return <Text style={{ color: '#888', fontSize: 13 }}>No reviews yet.</Text>;
    }
}
import defaultImg from '../../../assets/images/dummy.png'; // Default fallback image
import OfferGrid from './OfferCard';
import ProfileCardCarousel from './ProfileCardCarousel';
import { getImageSource } from '../../../utils/imageUtils';


export default function VendorDetailsSection({
    photos = [],
    onSend,
    description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do ds ds ds d sdsjhhs hdsi dsiucds ud hdsic dsiguc cudicgdsuc sguicds csbui chduicgdsuicds gcudis cdusicgdisucgdsug cdsgchddchd",
    reviews = [],
    hideMessageSection = false,
    offers = [],
    vendorId,
}) {
    console.log('VendorDetailsSection - Received offers:', offers);
    console.log('VendorDetailsSection - Received photos:', photos);
    console.log('VendorDetailsSection - Photos length:', photos?.length);

    const [descExpanded, setDescExpanded] = useState(false);
    const [imageDimensions, setImageDimensions] = useState({});
    return (
        // This section is already rendered inside the screen's vertical
        // ScrollView (vendorAddDetails/index.jsx). Nesting a second vertical
        // ScrollView here made the two compete for the same vertical gesture,
        // producing the janky/stuttering scroll users reported. A plain View
        // lets the parent own vertical scrolling; the horizontal photo carousel
        // and the "You might also like" FlatList scroll on their own axis.
        <View style={styles.container}>
            <View>
                {/* Photos Section */}
                <View style={styles.card}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.sectionTitle}>About</Text>
                    </View>
                    
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        style={styles.carousel}
                        nestedScrollEnabled={true}
                        // Card has padding:16 on top of container's padding:16,
                        // so the viewport here is SCREEN_WIDTH - 64, not -32.
                        snapToInterval={SCREEN_WIDTH - 64}
                        decelerationRate="fast"
                        snapToAlignment="start"
                    >
                        {photos && photos.length > 0 ?
                            photos.map((photo, idx) => {
                                console.log(`Rendering photo ${idx}:`, photo);
                                const imageSource = getImageSource(photo, defaultImg);
                                console.log(`Image source for photo ${idx}:`, imageSource);

                                return (
                                    <View key={idx} style={styles.photoWrapper}>
                                        <Image
                                            source={imageSource}
                                            style={styles.photo}
                                            onError={(error) => {
                                                console.log('Error loading image:', photo, error.nativeEvent?.error);
                                            }}
                                            onLoad={() => {
                                                console.log('Successfully loaded image:', photo);
                                            }}
                                            resizeMode="contain"
                                        />
                                    </View>
                                );
                            })
                        :
                            // Always show at least one image
                            [0, 1, 2].map((idx) => (
                                <View key={idx} style={styles.photoWrapper}>
                                    <Image
                                        source={defaultImg}
                                        style={styles.photo}
                                        resizeMode="contain"
                                    />
                                    {idx === 1 && (
                                        <View style={styles.noImageOverlay}>
                                            <Text style={styles.noImageText}>Sample Images</Text>
                                        </View>
                                    )}
                                </View>
                            ))
                        }
                    </ScrollView>
                    {/* Description below images */}
                    <View style={styles.descContainer}>
                        {!descExpanded ? (
                            <>
                                <Text style={styles.descriptionText} numberOfLines={3}>
                                    {description}
                                </Text>
                                <Text style={styles.seeMoreBtn} onPress={() => setDescExpanded(true)}>
                                    See More
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text style={styles.descriptionText}>{description}</Text>
                                <Text style={styles.seeMoreBtn} onPress={() => setDescExpanded(false)}>
                                    See Less
                                </Text>
                            </>
                        )}
                    </View>
                </View>

                <OfferGrid offers={offers} />

                <ProfileCardCarousel vendorId={vendorId} />

                {/* Message Input - Only show if not hidden */}
                {!hideMessageSection && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Send a Message</Text>
                        <View style={styles.messageBox}>
                            <Icon name="chatbubble-outline" size={20} color="#1E2B4F" style={styles.inputIcon} />
                            <TextInput
                                placeholder="Type your message..."
                                placeholderTextColor="#888"
                                style={styles.input}
                            />
                            <TouchableOpacity style={styles.sendBtn} onPress={onSend}>
                                <Icon name="send" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

            </View>
        </View>
    );
    // ...existing code ends above. Removed duplicate/erroneous JSX block.
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff',

    },
    card: {
        backgroundColor: '#FCFAFA',
        borderRadius: 14,
        padding: 16,
        marginBottom: 18,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
        boxShadow: '1px 1px 4px 0px #00000029',
        

    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1D1B20',
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    carousel: {
        marginTop: 12,
        // Square aspect — must match the photoWrapper width so the image
        // sits flush in its viewport rather than overflowing horizontally.
        height: SCREEN_WIDTH - 64,
    },
    photoWrapper: {
        // SCREEN_WIDTH - 64 accounts for the container's 16px padding AND
        // the card's 16px padding (32px total on each side). Sizing the
        // wrapper to the actual carousel viewport keeps each slide
        // perfectly centered horizontally instead of overflowing right.
        width: SCREEN_WIDTH - 64,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 4,
        backgroundColor: '#fff',
    },
    photo: {
        width: SCREEN_WIDTH - 64,
        height: SCREEN_WIDTH - 64,
        borderRadius: 12,
        opacity: 1,
        backgroundColor: '#f0f0f0', // Add background color for loading state
    },
    descContainer: {
        marginTop: 14,
    },
    seeMoreBtn: {
        color: '#1E2B4F',
        fontWeight: '700',
        marginTop: 4,
        fontSize: 14,
        alignSelf: 'flex-end',
    },
    messageBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        borderWidth: 1.2,
        borderColor: '#E5EAF2',
        borderRadius: 12,
        backgroundColor: '#F4F6FA',
        paddingHorizontal: 10,
        paddingVertical: 2,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 10,
        color: '#1E2B4F',
        fontSize: 15,
        backgroundColor: 'transparent',
    },
    sendBtn: {
        backgroundColor: '#1E2B4F',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendText: {
        color: '#fff',
        fontWeight: '600',
    },
    descriptionText: {
        color: '#444',
        fontSize: 14,
        lineHeight: 20,
    },
    reviewBlock: {
        marginBottom: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        paddingBottom: 12,
    },
    reviewTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
        color: '#1E2B4F',
    },
    reviewDate: {
        fontSize: 12,
        color: '#888',
    },
    ratingRow: {
        flexDirection: 'row',
        gap: 2,
        marginBottom: 6,
        marginTop: 2,
    },
    reviewDescription: {
        color: '#666',
        fontSize: 13,
        marginBottom: 4,
    },
    reviewerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 8,
    },
    reviewerName: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    eyeIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
        gap: 4,
    },
    eyeText: {
        fontSize: 12,
        color: '#aaa',
    },
    noImageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    noImageText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});
