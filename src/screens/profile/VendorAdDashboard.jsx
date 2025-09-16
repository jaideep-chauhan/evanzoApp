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
import VendorCard from '../vendors/VendorCard';
import EventAdCard from './EventAdCard';
import PreSavedMessage from './PreSavedMessage';
import ChangeProfile from './ChangeProfile';
import CreateAd from './CreateAd';
import CreateAddForm from './CreateAddForm';
import img from '../../assets/images/dummy.png';
import bg from '../../assets/images/profileBG.png';

import { useTheme } from '../../ThemeContext';
import vendorService from '../../services/vendorService';
import eventService from '../../services/eventService';
import profileService from '../../services/profileService';
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
                    const formattedVendors = response.data.map(vendor => {
                        const formatted = vendorService.formatVendorForDisplay(vendor);
                        return formatted;
                    });
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
        }
    };

    return (
        <View style={[styles.safe, { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
            {/* Entire scrollable content */}
            <ScrollView 
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header and all content before tabs */}
                <View style={styles.headerBox}>
                        <ImageBackground
                            source={bg}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}
                            resizeMode="cover"
                            pointerEvents="none"
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
                            </View>
                            <Text style={[styles.location, { color: theme.colors.primary }]}>Ontario, Canada</Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={[styles.actionBtn, styles.primary, { backgroundColor: theme.colors.primary }]}>
                            <Text style={styles.primaryText}>MY ADS</Text>
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
                    <TouchableOpacity 
                        style={styles.createAdBox}
                        onPress={() => setShowCreateAd(true)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.createAdInnerVertical} pointerEvents="none">
                            <View style={styles.addIconOutlineBox}>
                                <Icon name="add" size={24} color={theme.colors.primary} />
                            </View>
                            <Text style={[styles.createAdTextLarge, { color: theme.colors.primary }]}>Create New Ad</Text>
                        </View>
                    </TouchableOpacity>

                {/* Tabs */}
                <View style={[styles.tabRow, { backgroundColor: theme.colors.background }]}>
                    <TouchableOpacity
                        style={[
                            styles.activeTab,
                            activeTab === 'vendor' ? { backgroundColor: theme.colors.primary } : styles.inactiveTab,
                        ]}
                        onPress={() => setActiveTab('vendor')}
                        activeOpacity={0.7}
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
                        activeOpacity={0.7}
                    >
                        <Text style={activeTab === 'event' ? styles.activeTabText : [styles.inactiveTabText, { color: theme.colors.primary }]}>
                            Event Ads
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* List content */}
                {/* List */}
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadingText, { color: theme.colors.primary }]}>Loading ads...</Text>
                    </View>
                ) : activeTab === 'vendor' ? (
                    vendorAds.length > 0 ? (
                        vendorAds.map((vendor, idx) => {
                            return (
                                <VendorCard
                                    key={vendor.id || idx}
                                    initials={vendor.initials}
                                    name={vendor.name}
                                    type={vendor.type}
                                    rating={vendor.rating}
                                    description={vendor.description}
                                    images={vendor.images}
                                    extraCount={vendor.extraCount}
                                    location={vendor.location}
                                    offers={vendor.offers}
                                    onChatPress={() => navigation && navigation.navigate ? navigation.navigate('Chat') : null}
                                    isFirst={idx === 0}
                                    isChat={false}
                                />
                            );
                        })
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: theme.colors.primary }]}>No vendor ads yet</Text>
                            <Text style={[styles.emptySubText, { color: theme.colors.textSecondary }]}>Create your first vendor ad to get started</Text>
                        </View>
                    )
                ) : (
                    eventAds.length > 0 ? (
                        eventAds.map((event) => (
                            <EventAdCard
                                key={event.id}
                                title={event.title}
                                location={event.location}
                                duration={event.duration}
                                date={event.date ? new Date(event.date).toLocaleDateString('en-US', { 
                                    month: 'long', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                }) : 'Date TBD'}
                                time={event.time}
                                budget={event.budget}
                                guests={event.guests_count || event.guests}
                                service_needed={event.service_needed}
                                event_type={event.event_type}
                                status={event.status === 'active' ? 'LIVE' : event.status.toUpperCase()}
                                statusColor={event.status === 'active' ? '#2ECC71' : '#FFA500'}
                                description={event.description}
                                attachments={event.attachments || event.images}
                                profile={{
                                    name: user?.full_name || 'User',
                                    image: img
                                }}
                                onComplete={() => {}}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: theme.colors.primary }]}>No event ads yet</Text>
                            <Text style={[styles.emptySubText, { color: theme.colors.textSecondary }]}>Create your first event ad to get started</Text>
                        </View>
                    )
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
                        <PreSavedMessage 
                            onClose={() => {
                                console.log('PreSavedMessage onClose called');
                                setShowPreSaved(false);
                            }} 
                            visible={showPreSaved} 
                        />
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => {
                                console.log('Close button pressed');
                                setShowPreSaved(false);
                            }}
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
                    <TouchableOpacity 
                        style={{flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent'}}
                        activeOpacity={1}
                        onPress={() => setShowCreateAd(false)}
                    >
                        <TouchableOpacity 
                            style={{backgroundColor: theme.colors.primary, padding: 22, borderTopLeftRadius: 24, borderTopRightRadius: 24}}
                            activeOpacity={1}
                            onPress={() => {}}
                        >
                            <Text style={{fontSize: 20, fontWeight: '700', marginBottom: 24, textAlign: 'center', color: '#fff'}}>Create Ad</Text>
                            
                            <TouchableOpacity
                                style={{borderWidth: 2, borderColor: '#fff', padding: 18, borderRadius: 14, marginBottom: 14}}
                                onPress={() => {
                                    setCreateAddFormType('vendor');
                                    setShowCreateAddForm(true);
                                    setShowCreateAd(false);
                                }}
                            >
                                <Text style={{color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '700'}}>Vendor</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={{borderWidth: 2, borderColor: '#fff', padding: 18, borderRadius: 14, opacity: 0.7}}
                                onPress={() => {
                                    setCreateAddFormType('event');
                                    setShowCreateAddForm(true);
                                    setShowCreateAd(false);
                                }}
                            >
                                <Text style={{color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600'}}>Event</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </TouchableOpacity>
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
        zIndex: 1,
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
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.16,
        shadowOffset: { width: 1, height: 1 },
        shadowRadius: 13,
        marginBottom: 20,
        marginTop: 20,
        zIndex: 10,
        position: 'relative',
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    transparentModalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    bottomModalContent: {
        backgroundColor: '#fff',
        width: '100%',
        position: 'relative',
        minHeight: 200,
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
        borderColor: '#2C3D5B',
        borderRadius: 10,
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.7,
    },
});
