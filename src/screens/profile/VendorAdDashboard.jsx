import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ImageBackground,
    Image,
    Platform,
    StatusBar,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import VendorCard from '../vendors/VendorCard';
import EventAdCard from './EventAdCard';
import { icons } from '../../assets/icons';
import PreSavedMessage from './PreSavedMessage';
import ChangeProfile from './ChangeProfile';
import CreateAd from './CreateAd';
import CreateAddForm from './CreateAddForm';
import EditProfileModal from './EditProfileModal';
import RefreshableScrollView from '../../components/RefreshableScrollView';
import {
    VendorCardSkeleton,
    EventCardSkeleton,
    renderSkeletons,
} from '../../components/SkeletonLoader';
import useCachedList from '../../hooks/useCachedList';
import img from '../../assets/images/dummy.png';
import bg from '../../assets/images/profileBG.png';

import { useTheme } from '../../ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import vendorService from '../../services/vendorService';
import eventService from '../../services/eventService';
import profileService from '../../services/profileService';
import { useAuth } from '../../context/AuthContext';
import useAdminNotifications from '../../hooks/useAdminNotifications';

const { height: screenHeight } = Dimensions.get('window');

export default function VendorAdDashboard({ navigation }) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('vendor');
    
    // Initialize admin notifications listener
    useAdminNotifications();
    const [showPreSaved, setShowPreSaved] = useState(false);
    const [showChangeProfile, setShowChangeProfile] = useState(false);
    const [showCreateAd, setShowCreateAd] = useState(false);
    const [showCreateAddForm, setShowCreateAddForm] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [createAddFormType, setCreateAddFormType] = useState('vendor');
    // Stale-while-revalidate: each sub-tab is cached independently in
    // AsyncStorage. Tab switches re-render with whatever's already in state
    // (no network, no spinner). On first mount both lists hydrate from cache
    // synchronously-ish, then a background fetch overwrites the cache silently.
    const fetchMyVendorAds = useCallback(async () => {
        const r = await vendorService.getMyVendorAds();
        return {
            success: !!r.success,
            data: r.success && Array.isArray(r.data)
                ? r.data.map((v) => vendorService.formatVendorForDisplay(v))
                : [],
            message: r.message,
        };
    }, []);

    const fetchMyEventAds = useCallback(async () => {
        const r = await eventService.getMyEventAds();
        return {
            success: !!r.success,
            data: r.success && Array.isArray(r.data)
                ? r.data.map((e) => eventService.formatEventForDisplay(e))
                : [],
            message: r.message,
        };
    }, []);

    const vendorList = useCachedList('my-ads:vendor', fetchMyVendorAds);
    const eventList = useCachedList('my-ads:event', fetchMyEventAds);

    const vendorAds = vendorList.data || [];
    const eventAds = eventList.data || [];

    // Loading is *only* true the first time, before either cache or fresh data
    // is available for the active tab. Tab switches go straight to rendered
    // data with no spinner / skeleton flash.
    const isLoading =
        activeTab === 'vendor' ? vendorList.isLoading : eventList.isLoading;

    // Pull-to-refresh hits both lists so the user gets fresh state on both tabs.
    const fetchAds = useCallback(async () => {
        await Promise.all([vendorList.refresh(), eventList.refresh()]);
    }, [vendorList, eventList]);

    return (
        <View style={[styles.safe, { flex: 1 }]}>
            {/* Entire scrollable content */}
            <RefreshableScrollView
                onRefresh={fetchAds}
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentInsetAdjustmentBehavior="never"
            >
                {/* Header and all content before tabs */}
                <View style={[styles.headerBox, { paddingTop: insets.top + 12 }]}>
                        <ImageBackground
                            source={bg}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}
                            resizeMode="cover"
                            pointerEvents="none"
                        >
                        </ImageBackground>
                        {/* Header icons removed — Settings + Notification
                            entry points still exist below the avatar; the
                            top-of-banner row is intentionally bare. */}
                        {/* Profile Info inside blue box */}
                        <View style={styles.profileSection}>
                            {user?.profile_pic ? (
                                <Image
                                    source={{ uri: user.profile_pic }}
                                    style={styles.profileImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.profileImage}>
                                    <Text style={styles.profileInitialsText}>
                                        {user?.full_name
                                            ? user.full_name
                                                  .split(' ')
                                                  .map((name) => name[0])
                                                  .slice(0, 2)
                                                  .join('')
                                                  .toUpperCase()
                                            : 'U'}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.nameRow}>
                                <Text style={[styles.name, { color: theme.colors.primary }]}>
                                    {user?.full_name || 'User'}
                                </Text>
                                <TouchableOpacity 
                                    onPress={() => setShowEditProfile(true)}
                                    style={styles.editButton}
                                >
                                    <Icon name="create-outline" size={20} color={theme.colors.primary} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.locationRow}>
                                <Image source={icons.location} style={styles.locationPin} />
                                <Text style={[styles.location, { color: theme.colors.primary }]}>{user?.location || 'Add Location'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={[styles.actionBtn, styles.primary, { backgroundColor: theme.colors.primary }]}>
                            <Text style={styles.primaryText}>MY ADS</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => navigation.navigate('SavedVendors')}
                        >
                            <Icon name="heart" size={14} color={theme.colors.primary} style={{ marginRight: 4 }} />
                            <Text style={[styles.secondaryText, { color: theme.colors.primary }]}>SAVED</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => setShowPreSaved(true)}
                        >
                            <Text style={[styles.secondaryText, { color: theme.colors.primary }]}>MESSAGE</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.bellBtn}
                            onPress={() => navigation.navigate('NotificationInbox')}
                        >
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

                {/* Tabs — no explicit background; inherit the page so the
                    row blends with the white area instead of showing a band. */}
                <View style={styles.tabRow}>
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

                {/* List content. We only show skeletons when there's no
                    cached data AND no fresh data yet — that's first-ever
                    open. Tab switches and pull-to-refresh keep showing the
                    last known list (cached or live). */}
                {isLoading ? (
                    renderSkeletons(
                        activeTab === 'vendor' ? VendorCardSkeleton : EventCardSkeleton,
                        3,
                    )
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
                                    approval_status={vendor.approval_status}
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
                        eventAds.map((event) => {
                            // Determine status display. Order matters:
                            //  - terminal states (completed / cancelled) win over approval state
                            //  - approval state wins over operational state when still pending/rejected
                            let displayStatus = 'LIVE';
                            let displayStatusColor = '#2ECC71';

                            if (event.status === 'completed') {
                                displayStatus = 'COMPLETED';
                                displayStatusColor = '#2C3D5B'; // navy — matches brand
                            } else if (event.status === 'cancelled') {
                                displayStatus = 'CANCELLED';
                                displayStatusColor = '#7F8C8D';
                            } else if (event.approval_status === 'pending') {
                                displayStatus = 'PENDING';
                                displayStatusColor = '#FFA500';
                            } else if (event.approval_status === 'rejected') {
                                displayStatus = 'REJECTED';
                                displayStatusColor = '#FF4444';
                            } else if (event.approval_status === 'approved' && event.status === 'active') {
                                displayStatus = 'LIVE';
                                displayStatusColor = '#2ECC71';
                            } else if (event.status === 'inactive') {
                                displayStatus = 'INACTIVE';
                                displayStatusColor = '#999999';
                            }

                            const eventAdId = event._original?.event_ad_id || event.id;
                            return (
                                <EventAdCard
                                    key={eventAdId}
                                    eventId={eventAdId}
                                    title={event.title}
                                    location={event.location}
                                    duration={event.duration}
                                    /* event.date is already a human string
                                       ("May 30, 2026") produced by
                                       eventService.formatEventForDisplay.
                                       Re-running new Date(...) on it gave
                                       "Invalid Date" — just pass it through. */
                                    date={event.date || 'Date TBD'}
                                    time={event.time}
                                    budget={event.budget}
                                    guests={event.guests_count || event.guests}
                                    service_needed={event.service_needed}
                                    event_type={event.event_type}
                                    status={displayStatus}
                                    statusColor={displayStatusColor}
                                    approval_status={event.approval_status}
                                    description={event.description}
                                    attachments={event.attachments || event.images}
                                    profile={{
                                        name: user?.full_name || 'User',
                                        image: img,
                                    }}
                                    onComplete={() => eventList.refresh()}
                                    onDelete={() => {
                                        // Optimistic remove from local list +
                                        // cache, no full refetch needed.
                                        eventList.setData(
                                            (eventList.data || []).filter(
                                                (e) => (e._original?.event_ad_id || e.id) !== eventAdId,
                                            ),
                                        );
                                    }}
                                />
                            );
                        })
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: theme.colors.primary }]}>No event ads yet</Text>
                            <Text style={[styles.emptySubText, { color: theme.colors.textSecondary }]}>Create your first event ad to get started</Text>
                        </View>
                    )
                )}
            </RefreshableScrollView>

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

            {/* Edit Profile Modal */}
            <EditProfileModal
                visible={showEditProfile}
                onClose={() => setShowEditProfile(false)}
                onUpdate={() => {
                    // Optionally refresh user data after update
                    setShowEditProfile(false);
                }}
            />
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
        // paddingTop is set inline as insets.top + 12 so the doodle
        // ImageBackground inside this box paints all the way to the device top,
        // and the action row still has breathing room below the notch.
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
        gap: 8,
    },
    editButton: {
        padding: 4,
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
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
        gap: 4,
    },
    locationPin: {
        width: 14,
        height: 14,
        resizeMode: 'contain',
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 18,
        width: '90%',
        maxWidth: 400,
        height: '80%',
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
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 8,
        zIndex: 100,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
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
