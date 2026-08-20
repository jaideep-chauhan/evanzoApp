import React, { useRef, useState, useEffect } from 'react'
import VendorProfileCard from './VendorProfileCard';
// Removed SafeAreaView
import { ScrollView, StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Keyboard, Platform, Alert, ActivityIndicator } from 'react-native';
import img from '../../../assets/images/dummy.png';
import VendorDetailsSection from './VendorDetailsSection';
import { useRoute } from '@react-navigation/native';
import chatService from '../../../services/chatService';
import { useAuth } from '../../../context/AuthContext';
import preSavedMessageService from '../../../services/preSavedMessageService';
import Icon from 'react-native-vector-icons/Ionicons';
import vendorService from '../../../services/vendorService';
import vendorDetailsService from '../../../services/vendorDetailsService';

export default function VendorChat({ navigation }) {
    const route = useRoute();
    const { user } = useAuth();
    const scrollViewRef = useRef(null);
    const offerSectionRef = useRef(null);
    const [quoteText, setQuoteText] = useState('');
    // Android: lift the absolute quote bar by the keyboard height (adjustResize
    // doesn't move it under edge-to-edge + react-native-screens); reset on hide.
    const [kbHeight, setKbHeight] = useState(0);
    const [quoteBarHeight, setQuoteBarHeight] = useState(130);
    useEffect(() => {
        if (Platform.OS !== 'android') return undefined;
        const show = Keyboard.addListener('keyboardDidShow', (e) => setKbHeight(e.endCoordinates?.height || 0));
        const hide = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));
        return () => { show.remove(); hide.remove(); };
    }, []);
    const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
    const [loadingQuickMessage, setLoadingQuickMessage] = useState(false);

    // Pre-fill the quote input with the user's saved Quick Message template.
    // Same surface ChatScreen uses; lives in profile settings. If the user
    // never created one, surface a friendly hint instead of silently failing.
    const handleQuickMessage = async () => {
        if (loadingQuickMessage) return;
        setLoadingQuickMessage(true);
        try {
            const response = await preSavedMessageService.getPreSavedMessage();
            if (response?.success && response.data?.message_template) {
                setQuoteText(response.data.message_template);
            } else {
                Alert.alert(
                    'No Quick Message',
                    "You haven't created a quick message template yet. Add one in Profile → Settings → Pre-saved Messages.",
                );
            }
        } catch (error) {
            console.error('❌ Quick message fetch failed:', error);
            Alert.alert('Error', 'Failed to load your quick message template.');
        } finally {
            setLoadingQuickMessage(false);
        }
    };

    const scrollToOffer = route.params?.scrollToOffer;
    // Accept a full vendor object (in-app navigation) or just an id (deep link
    // "vendor/:vendorId"). For the id-only case we fetch the full ad so a
    // shared link opens with real photos + details instead of an empty stub.
    const [vendor, setVendor] = useState(route.params?.vendor || null);
    const [vendorLoading, setVendorLoading] = useState(
        !route.params?.vendor && !!route.params?.vendorId,
    );

    useEffect(() => {
        if (route.params?.vendor || !route.params?.vendorId) return undefined;
        let alive = true;
        (async () => {
            try {
                setVendorLoading(true);
                const res = await vendorDetailsService.getVendorDetails(
                    route.params.vendorId,
                );
                if (alive && res?.success && res.data) {
                    setVendor(vendorService.formatVendorForDisplay(res.data));
                }
            } catch (e) {
                console.warn('Deep-link vendor fetch failed:', e?.message);
            } finally {
                if (alive) setVendorLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [route.params?.vendor, route.params?.vendorId]);


    // Format images to ensure they're in the correct format
    const formattedImages = (() => {
        console.log('Formatting images for vendor:', vendor?.name);
        console.log('Raw vendor images:', vendor?.images);

        if (vendor?.images && Array.isArray(vendor.images) && vendor.images.length > 0) {
            const formatted = vendor.images.map((image, index) => {
                console.log(`Processing image ${index}:`, image);

                // If it's already an object with uri, use the uri
                if (typeof image === 'object' && image.uri) {
                    console.log(`Image ${index} is object with uri:`, image.uri);
                    return image.uri;
                }
                // If it's a string URL, return it as is
                if (typeof image === 'string') {
                    if (image.startsWith('http') || image.startsWith('https')) {
                        console.log(`Image ${index} is HTTP URL:`, image);
                        return image;
                    } else if (image.startsWith('file://') || image.startsWith('/')) {
                        console.log(`Image ${index} is file path:`, image);
                        return image;
                    } else {
                        console.log(`Image ${index} is invalid string, using fallback:`, image);
                        return img;
                    }
                }
                // If it's a local image (number from require), return it as is
                if (typeof image === 'number') {
                    console.log(`Image ${index} is require() number:`, image);
                    return image;
                }
                // Default fallback
                console.log(`Image ${index} unknown format, using fallback:`, image);
                return img;
            });
            console.log('Formatted images:', formatted);
            return formatted;
        } else {
            // No real photos — return an empty array so the carousel can show a
            // single neutral empty state instead of fabricating dummy images.
            return [];
        }
    })();

    const handleSendQuote = async () => {
        if (!quoteText.trim()) {
            Alert.alert('Error', 'Please enter a quote message');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'You must be logged in to send a quote');
            return;
        }

        // Get vendor's user_id - try different possible fields
        const vendorUserId = vendor?.user_id ||
            vendor?._original?.user_id ||
            vendor?.owner_id ||
            vendor?.vendor_user_id;

        if (!vendorUserId) {
            Alert.alert('Error', 'Unable to identify vendor. Please try again.');
            return;
        }

        setIsSubmittingQuote(true);

        try {
            // Step 1: Create or get direct chat with vendor
            const chatResult = await chatService.createDirectChat(vendorUserId);

            if (!chatResult.success) {
                Alert.alert('Error', chatResult.message || 'Failed to create chat with vendor');
                return;
            }

            const chatId = chatResult.data.chat_id;

            // Step 2: Format quote message
            const quoteMessage = `📋 Quote Request:\n\n${quoteText.trim()}\n\n💼 Service: ${vendor?.type || vendor?.category || 'General Service'}\n📍 Location: ${vendor?.location || 'Not specified'}`;

            // Step 3: Send quote message
            const messageResult = await chatService.sendMessage(chatId, quoteMessage, 'text');

            if (messageResult.success) {
                Alert.alert(
                    'Quote Sent!',
                    'Your quote has been sent to the vendor. They will respond to you via chat.',
                    [
                        {
                            text: 'View Chat',
                            onPress: () => {
                                // ChatScreen reads `chatName` from route.params,
                                // not `chatTitle` — using the wrong key here
                                // meant the title silently never appeared.
                                // Also prefer the ad title (company_name) over
                                // the vendor owner's personal display name.
                                // Prefer the vendor owner's personal name
                                // (owner_name from formatVendorForDisplay) so
                                // the chat header shows the human, not the
                                // ad title. Fall back to ad fields only if no
                                // person name is available.
                                navigation.navigate('ChatScreen', {
                                    chatId: chatId,
                                    chatName:
                                        vendor?.owner_name ||
                                        vendor?._original?.user?.full_name ||
                                        vendor?._original?.User?.full_name ||
                                        vendor?.company_name ||
                                        vendor?.name ||
                                        'Vendor',
                                });
                            }
                        },
                        {
                            text: 'OK',
                            style: 'default'
                        }
                    ]
                );
                setQuoteText('');
            } else {
                Alert.alert('Error', messageResult.message || 'Failed to send quote');
            }

        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmittingQuote(false);
        }
    };

    // Set initial scroll position based on scrollToOffer flag
    const initialScrollY = scrollToOffer ? 350 : 0;

    // Deep link opened with only an id: show a spinner while the full ad loads
    // instead of the empty "no photos / no data" stub.
    if (vendorLoading && !vendor) {
        return (
            <View style={[styles.safe, { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }]}>
                <ActivityIndicator size="large" color="#2C3D5B" />
                <Text style={{ marginTop: 12, color: '#2C3D5B' }}>Loading…</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.safe}
            // Android: disable KAV (native adjustResize handles it). 'height'
            // leaves the quote bar floating above its resting spot after the
            // keyboard closes. Matches the chat screen's fix.
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            enabled={Platform.OS === 'ios'}
        >
            <View style={styles.container}>
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentOffset={{ x: 0, y: initialScrollY }}
                    contentContainerStyle={{ paddingBottom: quoteBarHeight + 20 }}
                >
                    <VendorProfileCard
                        // Avatar at the top of the detail page should be the
                        // OWNER'S profile picture only — NOT a thumbnail of the
                        // ad's photos. If the owner hasn't uploaded a profile
                        // pic, pass null so the card renders a name-initials
                        // avatar instead of an ad photo.
                        logo={
                            vendor?.owner_profile_pic ||
                            vendor?._original?.user?.profile_pic ||
                            vendor?._original?.User?.profile_pic ||
                            null
                        }
                        // Show the VENDOR's name (the owner/person behind the
                        // ad) — NOT the ad title. `name` from the formatter is
                        // company_name/title (the ad's business title); the
                        // vendor's actual name is the joined user's full_name.
                        // Falls back to the ad title only if there's no owner
                        // name at all. The avatar's initials derive from this
                        // same name, so a pic-less vendor shows their initials.
                        name={
                            vendor?.owner_name ||
                            vendor?._original?.user?.full_name ||
                            vendor?._original?.User?.full_name ||
                            [vendor?._original?.user?.first_name, vendor?._original?.user?.last_name]
                                .filter(Boolean)
                                .join(' ')
                                .trim() ||
                            vendor?.name ||
                            ''
                        }
                        category={vendor?.type || ''}
                        location={vendor?.location || ''}
                        onBackPress={() => navigation && navigation.goBack ? navigation.goBack() : null}
                        onBellPress={() => {
                            if (navigation && navigation.navigate) {
                                // NotificationInbox = the received-notifications
                                // list. 'Notifications' is the settings-preferences
                                // screen — the wrong target for a bell icon.
                                navigation.navigate('NotificationInbox');
                            }
                        }}
                        navigation={navigation}
                        vendor={vendor} // Pass the full vendor object
                    />
                    <View style={{ marginTop: 130 }} ref={offerSectionRef}>
                        <VendorDetailsSection
                            photos={formattedImages}
                            description={vendor?.description || ''}
                            onSend={() => console.log('Send button pressed')}
                            hideMessageSection={true}
                            offers={vendor?.offers || []}
                            currency={vendor?.currency || vendor?._original?.currency || 'USD'}
                            vendorId={vendor?._original?.vendor_ad_id || vendor?.id}
                        />
                    </View>
                </ScrollView>

                {/* Quote Section — fixed at the bottom (white box removed). */}
                <View onLayout={(e) => setQuoteBarHeight(e.nativeEvent.layout.height)} style={[styles.quoteSectionContainer, Platform.OS === 'android' && kbHeight > 0 && { bottom: 10 + kbHeight }]}>
                    <View style={styles.quoteSection}>
                        {/* Input + Quick Message button share a rounded
                            wrapper so the flash icon sits flush against the
                            right edge of the input. Send button stays
                            outside the wrapper. */}
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.quoteInput}
                                placeholder="Send a quote request"
                                placeholderTextColor="#ccc"
                                value={quoteText}
                                onChangeText={setQuoteText}
                                multiline
                                maxLength={500}
                                textAlignVertical="top"
                                editable={!isSubmittingQuote}
                            />
                            <TouchableOpacity
                                style={styles.quickMsgBtn}
                                onPress={handleQuickMessage}
                                disabled={loadingQuickMessage || isSubmittingQuote}
                                accessibilityLabel="Insert quick message"
                            >
                                {loadingQuickMessage ? (
                                    <ActivityIndicator size="small" color="#2C3D5B" />
                                ) : (
                                    <Icon name="flash" size={16} color="#2C3D5B" />
                                )}
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={[styles.sendBtn, isSubmittingQuote && styles.sendBtnDisabled]}
                            onPress={handleSendQuote}
                            disabled={isSubmittingQuote}
                        >
                            {isSubmittingQuote ? (
                                <ActivityIndicator size="small" color="#2C3D5B" />
                            ) : (
                                <Text style={styles.sendText}>Send</Text>
                            )}
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
        backgroundColor: '#FCFAFA',
    },
    container: {
        flex: 1,
        backgroundColor: '#FCFAFA',
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#FCFAFA',
    },
    quoteSectionContainer: {
        // Fixed at the bottom (sticky), but the white box that used to sit
        // behind the quote — semi-transparent background, blur and shadow —
        // has been removed; only the dark quote pill renders.
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    quoteSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2C3D5B',
        // Slimmed to match the bottom tab-bar pill height (~56) and its 20px
        // horizontal inset, so this detail-page bar lines up with the tab bar.
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 50,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 12,
        marginRight: 10,
        paddingRight: 8,
        overflow: 'hidden',
    },
    quoteInput: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        color: '#fff',
        fontSize: 14,
        minHeight: 40,
        maxHeight: 80,
    },
    quickMsgBtn: {
        backgroundColor: '#FFD700',
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
    sendBtn: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.7,
    },
    sendText: {
        color: '#2C3D5B',
        fontSize: 16,
        fontWeight: '600',
    },
});

