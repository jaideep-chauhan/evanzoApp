import React, { useRef, useState } from 'react'
import VendorProfileCard from './VendorProfileCard';
// Removed SafeAreaView
import { ScrollView, StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import img from '../../../assets/images/dummy.png';
import VendorDetailsSection from './VendorDetailsSection';
import { useRoute } from '@react-navigation/native';

const dummyReviews = [
    {
        id: 1,
        user: 'Alice',
        rating: 5,
        comment: 'Amazing service and beautiful photos!',
        date: '2024-07-01',
    },
    {
        id: 2,
        user: 'Bob',
        rating: 4,
        comment: 'Very professional and friendly.',
        date: '2024-06-28',
    },
    {
        id: 3,
        user: 'Charlie',
        rating: 5,
        comment: 'Highly recommended for any event.',
        date: '2024-06-15',
    },
];


export default function VendorChat({ navigation }) {
    const route = useRoute();
    const scrollViewRef = useRef(null);
    const offerSectionRef = useRef(null);
    const [quoteText, setQuoteText] = useState('');

    const scrollToOffer = route.params?.scrollToOffer;
    const vendor = route.params?.vendor;
    
    // Debug: Log vendor data
    console.log('VendorAddDetail - Full vendor data:', vendor);
    console.log('VendorAddDetail - Vendor offers:', vendor?.offers);
    
    // Format images to ensure they're in the correct format
    const formattedImages = vendor?.images?.map(image => {
        // If it's already an object with uri, use it as is
        if (typeof image === 'object' && image.uri) {
            return image.uri;
        }
        // If it's a string URL, return it as is
        if (typeof image === 'string' && image.startsWith('http')) {
            return image;
        }
        // If it's a local image (number from require), return it as is
        if (typeof image === 'number') {
            return image;
        }
        // Default fallback
        return img;
    }) || [img, img, img, img, img];

    const handleSendQuote = () => {
        console.log('Sending quote:', quoteText);
        setQuoteText('');
    };

    // Set initial scroll position based on scrollToOffer flag
    const initialScrollY = scrollToOffer ? 350 : 0;

    return (
        <KeyboardAvoidingView
            style={styles.safe}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.container}>
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentOffset={{ x: 0, y: initialScrollY }}
                    contentContainerStyle={{ paddingBottom: 200 }}
                >
                    <VendorProfileCard
                        logo={formattedImages[0] || img}
                        name={vendor?.name || "4x90 Studio"}
                        category={vendor?.type || "Photography"}
                        location={vendor?.location || "Ontario, Canada"}
                        onBackPress={() => navigation && navigation.goBack ? navigation.goBack() : null}
                        onBellPress={() => console.log('Notifications')}
                        navigation={navigation}
                    />
                    <View style={{ marginTop: 130 }} ref={offerSectionRef}>
                        <VendorDetailsSection
                            photos={formattedImages}
                            description={vendor?.description || "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do"}
                            onSend={() => console.log('Send button pressed')}
                            reviews={dummyReviews}
                            hideMessageSection={true}
                            offers={vendor?.offers || []}
                        />
                    </View>
                </ScrollView>

                {/* Quote Section - Sticky Bottom */}
                <View style={styles.quoteSectionContainer}>
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
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#fff'
    },
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    quoteSectionContainer: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.42)',
        backdropFilter: 'blur(10px)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    quoteSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2C3D5B',
        padding: 16,
        borderRadius: 50,
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

