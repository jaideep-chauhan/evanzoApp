import React, { useRef } from 'react'
import VendorProfileCard from './VendorProfileCard';
// Removed SafeAreaView
import { ScrollView, StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import img from '../../../assets/images/dummy.png';
import VendorDetailsSection from './VendorDetailsSection';
import { useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../ThemeContext';

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
    const theme = useTheme();
    const scrollViewRef = useRef(null);
    const offerSectionRef = useRef(null);

    const scrollToOffer = route.params?.scrollToOffer;
    const vendor = route.params?.vendor;

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
                        logo={vendor?.images?.[0] || img}
                        name={vendor?.name || "4x90 Studio"}
                        category={vendor?.type || "Photography"}
                        location={vendor?.location || "Ontario, Canada"}
                        onBackPress={() => navigation && navigation.goBack ? navigation.goBack() : null}
                        onBellPress={() => console.log('Notifications')}
                        navigation={navigation}
                    />
                    <View style={{ marginTop: 130 }} ref={offerSectionRef}>
                        <VendorDetailsSection
                            photos={vendor?.images || [img, img, img, img, img]}
                            description={vendor?.description || "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do"}
                            onSend={() => console.log('Send button pressed')}
                            reviews={dummyReviews}
                            hideMessageSection={true}
                        />
                    </View>
                </ScrollView>

                {/* Sticky Send Message Section */}
                <View style={[styles.messageContainer, { backgroundColor: theme.colors.background || '#FCFAFA' }]}>
                    <Text style={styles.sectionTitle}>Send a Message</Text>
                    <View style={styles.messageBox}>
                        <Icon name="chatbubble-outline" size={20} color="#1E2B4F" style={styles.inputIcon} />
                        <TextInput
                            placeholder="Type your message..."
                            placeholderTextColor="#888"
                            style={styles.input}
                        />
                        <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.colors.primary || '#1E2B4F' }]} onPress={() => console.log('Send message')}>
                            <Icon name="send" size={18} color="#fff" />
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
    messageContainer: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 0 : 0,
        left: 0,
        right: 0,
        backgroundColor: '#FCFAFA',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 24 : 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: -4 },
        shadowRadius: 8,
        elevation: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1D1B20',
        marginBottom: 12,
    },
    messageBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 30,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 40,
        fontSize: 14,
        color: '#333',
    },
    sendBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1E2B4F',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
});

