import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    ImageBackground,
    Platform,
    StatusBar,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import evanzoLogo from '../../assets/images/evanzoLogo.png';
import LinearGradient from 'react-native-linear-gradient';
import VendorCard from '../vendors/VendorCard';
import EventAdCard from './EventAdCard';
import PreSavedMessage from './PreSavedMessage';
import ChangeProfile from './ChangeProfile';
import CreateAd from './CreateAd';
import CreateAddForm from './CreateAddForm';
import img from '../../assets/images/dummy.png';
import bg from '../../assets/images/profileBG.png';

import { useTheme } from '../../ThemeContext';
import theme from '../../theme';
import vendorService from '../../services/vendorService';
import eventService from '../../services/eventService';
import { useAuth } from '../../context/AuthContext';

const { height: screenHeight } = Dimensions.get('window');

export default function VendorAdDashboard({ navigation }) {
    const theme = useTheme();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('vendor');
    const [showPreSaved, setShowPreSaved] = useState(false);
    const [showChangeProfile, setShowChangeProfile] = useState(false);
    const [showCreateAd, setShowCreateAd] = useState(false);
    const [showCreateAddForm, setShowCreateAddForm] = useState(false);
    const [createAddFormType, setCreateAddFormType] = useState('vendor');
    const [vendorAds, setVendorAds] = useState([]);
    const [eventAds, setEventAds] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch ads on component mount and when tab changes
    useEffect(() => {
        fetchAds();
    }, [activeTab]);

    const fetchAds = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'vendor') {
                const response = await vendorService.getMyVendorAds();
                if (response.success) {
                    const formattedVendors = response.data.map(vendor => 
                        vendorService.formatVendorForDisplay(vendor)
                    );
                    setVendorAds(formattedVendors);
                }
            } else {
                const response = await eventService.getMyEventAds();
                if (response.success) {
                    const formattedEvents = response.data.map(event => 
                        eventService.formatEventForDisplay(event)
                    );
                    setEventAds(formattedEvents);
                }
            }
        } catch (error) {
            console.error('Error fetching ads:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchAds();
    };

    // Dummy data fallback (remove this when API is fully working)
    const dummyVendors = [
        {
            initials: '4S',
            name: '4x90 Studio',
            type: 'Photography',
            rating: 5,
            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do',
            images: [img, img, img],
            extraCount: 10,
        },
        {
            initials: 'AB',
            name: 'Alpha Bakers',
            type: 'Bakery',
            rating: 4.5,
            description: 'Freshly baked goods for every occasion.',
            images: [img, img, img],
            extraCount: 5,
        },
        {
            initials: 'DJ',
            name: 'DJ Max',
            type: 'Music',
            rating: 4.8,
            description: 'Professional DJ services for weddings and parties.',
            images: [img, img, img],
            extraCount: 7,
        },
        {
            initials: 'FL',
            name: 'Floral Lane',
            type: 'Florist',
            rating: 4.7,
            description: 'Beautiful flower arrangements and bouquets.',
            images: [img, img, img],
            extraCount: 3,
        },
        {
            initials: 'CT',
            name: 'Catering Time',
            type: 'Catering',
            rating: 4.9,
            description: 'Delicious food and excellent service for your events.',
            images: [img, img, img],
            extraCount: 8,
        },
        {
            initials: 'EV',
            name: 'Eventify',
            type: 'Event Planner',
            rating: 5,
            description: 'Making your events memorable and stress-free.',
            images: [img, img, img],
            extraCount: 12,
        },
        {
            initials: 'PH',
            name: 'PhotoHub',
            type: 'Photography',
            rating: 4.6,
            description: 'Capturing moments that last a lifetime.',
            images: [img, img, img],
            extraCount: 6,
        },
        {
            initials: 'DS',
            name: 'Decor Studio',
            type: 'Decor',
            rating: 4.4,
            description: 'Creative decor solutions for all occasions.',
            images: [img, img, img],
            extraCount: 4,
        },
    ];

    const dummyEventAds = [
        {
            id: 1,
            attachments: [img, img],
            onComplete: () => console.log("Marked Complete"),
        },
        {
            id: 2,
            attachments: [img],
            onComplete: () => console.log("Marked Complete"),
        },
    ];

    return (
        <View style={[styles.safe, { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
            <ScrollView contentContainerStyle={[styles.container, { flexGrow: 1 }]}>
                <View style={styles.headerBox}>
                    <ImageBackground
                        source={bg}
                        style={[StyleSheet.absoluteFill, { zIndex: 0 }]}
                        resizeMode="cover"
                    >
                    </ImageBackground>
                    <View style={styles.header}>
                        <TouchableOpacity>
                            <Icon name="settings-outline" size={30} color="#fff" />
                        </TouchableOpacity>
                        <View style={{ width: 32 }} />
                        <TouchableOpacity>
                            <Icon name="chatbubble-ellipses-outline" size={30} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    {/* Profile Info inside blue box */}
                    <View style={styles.profileSection}>
                        <View style={styles.profileImage}>
                            <Text style={styles.profileInitialsText}>
                                {user?.full_name ? (
                                    user.full_name.split(' ').map(name => name[0]).slice(0, 2).join('').toUpperCase()
                                ) : 'U'}
                            </Text>
                        </View>
                        <View style={styles.nameRow}>
                            <Text style={[styles.name, { color: theme.colors.primary }]}>
                                {user?.full_name || 'User'}
                            </Text>
                            {/* <TouchableOpacity
                                style={styles.editBtn}
                                onPress={() => setShowChangeProfile(true)}
                            >
                                <Icon name="create-outline" size={20} color={theme.colors.primary} />
                            </TouchableOpacity> */}
                        </View>
                        <Text style={[styles.location, { color: theme.colors.primary }]}>Ontario, Canada</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity style={[styles.actionBtn, styles.primary, { backgroundColor: theme.colors.primary }]}>
                        <Text style={styles.primaryText}>MY ADS</Text>
                        {/* <Icon name="options-outline" size={16} color="#fff" /> */}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => setShowPreSaved(true)}
                    >
                        <Text style={[styles.secondaryText, { color: theme.colors.primary }]}>PRE SAVE MESSAGE</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.bellBtn}>
                        <Icon name="notifications-outline" size={18} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Create New Ad Box */}
                <View style={styles.createAdBox}>
                    <TouchableOpacity
                        style={styles.createAdInnerVertical}
                        onPress={() => setShowCreateAd(true)}
                    >
                        <View style={styles.addIconOutlineBox}>
                            <Icon name="add" size={24} color={theme.colors.primary} />
                        </View>
                        <Text style={[styles.createAdTextLarge, { color: theme.colors.primary }]}>Create New Ad</Text>
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={styles.tabRow}>
                    <TouchableOpacity
                        style={[
                            styles.activeTab,
                            activeTab === 'vendor' ? { backgroundColor: theme.colors.primary } : styles.inactiveTab,
                        ]}
                        onPress={() => setActiveTab('vendor')}
                    >
                        <Text style={activeTab === 'vendor' ? styles.activeTabText : [styles.inactiveTabText, { color: theme.colors.primary }]}>
                            Vendor Ads
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.activeTab,
                            activeTab === 'event' ? { backgroundColor: theme.colors.primary } : styles.inactiveTab,
                        ]}
                        onPress={() => setActiveTab('event')}
                    >
                        <Text style={activeTab === 'event' ? styles.activeTabText : [styles.inactiveTabText, { color: theme.colors.primary }]}>
                            Event Ads
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* List */}
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadingText, { color: theme.colors.primary }]}>Loading ads...</Text>
                    </View>
                ) : activeTab === 'vendor' ? (
                    (vendorAds.length > 0 ? vendorAds : dummyVendors).map((vendor, idx) => (
                        <VendorCard
                            key={idx}
                            initials={vendor.initials}
                            name={vendor.name}
                            type={vendor.type}
                            rating={vendor.rating}
                            description={vendor.description}
                            images={vendor.images}
                            extraCount={vendor.extraCount}
                            onChatPress={() => navigation && navigation.navigate ? navigation.navigate('Chat') : null}
                            isFirst={idx === 0}
                            isChat={false}
                        />
                    ))
                ) : (
                    (eventAds.length > 0 ? eventAds : dummyEventAds).map((event) => (
                        <EventAdCard
                            key={event.id}
                            attachments={event.attachments}
                            onComplete={event.onComplete}
                        />
                    ))
                )}
            </ScrollView>

            {/* Popup Modal for PreSavedMessage */}
            <Modal
                    visible={showPreSaved}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowPreSaved(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <PreSavedMessage />
                            <TouchableOpacity
                                style={styles.closeBtn}
                                onPress={() => setShowPreSaved(false)}
                            >
                                <Icon name="close" size={24} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Popup Modal for ChangeProfile */}
                <Modal
                    visible={showChangeProfile}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowChangeProfile(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <ChangeProfile />
                            <TouchableOpacity
                                style={styles.closeBtn}
                                onPress={() => setShowChangeProfile(false)}
                            >
                                <Icon name="close" size={24} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* CreateAd Modal */}
                <Modal
                    visible={showCreateAd}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowCreateAd(false)}
                >
                    <View style={styles.bottomModalOverlay}>
                        <View style={styles.bottomModalContent}>
                            <CreateAd
                                onClose={() => {
                                    setShowCreateAd(false);
                                    fetchAds(); // Refresh ads after closing
                                }}
                                onTabPress={(type) => {
                                    setShowCreateAd(false);
                                    setCreateAddFormType(type);
                                    setTimeout(() => setShowCreateAddForm(true), 300);
                                }}
                            />
                            <TouchableOpacity
                                style={styles.closeBtn}
                                onPress={() => setShowCreateAd(false)}
                            >
                                <Icon name="close" size={24} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* CreateAddForm Modal */}
                <Modal
                    visible={showCreateAddForm}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowCreateAddForm(false)}
                >
                    <View style={styles.modalFullScreen}>
                        <TouchableOpacity 
                            style={styles.modalTopSpace}
                            activeOpacity={1}
                            onPress={() => setShowCreateAddForm(false)}
                        />
                        <View style={[styles.modalBottomContent, { backgroundColor: theme.colors.primary }]}>
                            <CreateAddForm
                                type={createAddFormType}
                                onClose={() => {
                                    setShowCreateAddForm(false);
                                    fetchAds(); // Refresh ads after creating new ad
                                }}
                            />
                            <TouchableOpacity
                                style={styles.modalCloseBtnNew}
                                onPress={() => setShowCreateAddForm(false)}
                            >
                                <Icon name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#fff',
    },
    headerBox: {
        backgroundColor: 'transparent',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        paddingBottom: 24,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40,
        paddingHorizontal: 0,
        alignItems: 'center',
        minHeight: 100,
        overflow: 'hidden',
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        zIndex: 2,
    },
    logo: {
        width: 110,
        height: 30,
    },
    profileSection: {
        alignItems: 'center',
        marginTop: 10,
        zIndex: 2,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        gap: 4,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#D9D9D9',
        borderWidth: 2,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInitialsText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#2C3D5B',
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    editBtn: {
        marginLeft: 6,
        padding: 4,
    },
    location: {
        fontSize: 14,
        marginTop: 1,
        fontWeight: '500',
        textAlign: 'center',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        width: '100%',
        paddingHorizontal: 10,
        gap: 8,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderRadius: 22,
        backgroundColor: '#F4F4F4',
        flex: 1,
        justifyContent: 'center',
        minWidth: 0,
    },
    primaryText: {
        color: '#fff',
        fontWeight: '600',
        marginRight: 4,
        fontSize: 13,
    },
    secondaryText: {
        fontWeight: '600',
        fontSize: 13,
    },
    bellBtn: {
        backgroundColor: '#F2F2F2',
        borderRadius: 22,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginLeft: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 0,
        minHeight: 0,
    },
    createAdBox: {
        margin: 8,
        paddingVertical: 30,
        paddingHorizontal: 18,
        minHeight: 80,
        backgroundColor: '#F2F2F2',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.16,
        shadowOffset: { width: 1, height: 1 },
        shadowRadius: 13,
        marginBottom: 20,
        marginTop: 20,
        boxShadow: '1px 1px 10px 0px #00000019',

    },
    createAdInnerVertical: {
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 8,
    },
    createAdTextLarge: {
        marginTop: 0,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 0,
        letterSpacing: 0.2,
    },
    tabRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 14,
        marginTop: 0,
        width: '100%',
        paddingHorizontal: 10,
        marginBottom: 18,
    },
    activeTab: {
        paddingHorizontal: 0,
        paddingVertical: 13,
        borderRadius: 22,
        flex: 1,
        alignItems: 'center',
    },
    activeTabText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
        letterSpacing: 0.2,
    },
    inactiveTab: {
        backgroundColor: '#E7F0FF',
        paddingHorizontal: 0,
        paddingVertical: 13,
        borderRadius: 22,
        flex: 1,
        alignItems: 'center',
    },
    inactiveTabText: {
        fontWeight: '700',
        fontSize: 13,
        letterSpacing: 0.2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 18,
        width: '90%',
        maxWidth: 400,
        position: 'relative',
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
    },
    bottomModalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'transparent',
    },
    bottomModalContent: {
        backgroundColor: 'transparent',
        width: '100%',
        position: 'relative',
    },
    bottomModalContentLarge: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 24,
        width: '100%',
        maxHeight: '90%',
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
        position: 'relative',
    },
    modalFullScreen: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    modalTopSpace: {
        height: screenHeight * 0.15,  // 15% space at top
        backgroundColor: 'transparent',
    },
    modalBottomContent: {
        flex: 1,
        maxHeight: screenHeight * 0.85,  // Maximum 85% of screen
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
        overflow: 'hidden',
    },
    modalCloseBtnNew: {
        position: 'absolute',
        top: 15,
        right: 15,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        padding: 8,
        zIndex: 100,
        elevation: 5,
    },
    fullModalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
        paddingTop: screenHeight * 0.2,
    },
    fullModalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 20,
        width: '100%',
        flex: 1,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
        overflow: 'hidden',
    },
    closeBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        padding: 8,
        zIndex: 10,
    },
    addIconOutlineBox: {
        borderWidth: 1,
        borderColor: theme.colors.primary,
        borderRadius: 10,
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        fontWeight: '500',
    },
});
