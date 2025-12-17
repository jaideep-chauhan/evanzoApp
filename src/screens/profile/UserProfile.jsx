import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
    FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../ThemeContext';
import api from '../../services/api';
import EventCard from '../events/EventCard';
import VendorCard from '../vendors/VendorCard';
import eventService from '../../services/eventService';

export default function UserProfile() {
    const navigation = useNavigation();
    const route = useRoute();
    const theme = useTheme();

    const { userId, userName, userAvatar } = route.params;

    const [activeTab, setActiveTab] = useState('events'); // 'events' or 'services'
    const [eventAds, setEventAds] = useState([]);
    const [vendorAds, setVendorAds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userInfo, setUserInfo] = useState({
        name: userName || 'User',
        avatar: userAvatar || 'https://randomuser.me/api/portraits/lego/1.jpg',
        rating: 5.0,
        reviewCount: 10,
        totalAds: 0
    });

    useEffect(() => {
        fetchUserData();
    }, [userId]);

    const fetchUserData = async () => {
        setIsLoading(true);
        try {
            console.log('🔍 Fetching user data for userId:', userId);

            // Fetch user's profile information
            try {
                const profileResponse = await api.get(`/profile/public/${userId}`);
                console.log('👤 Profile API response:', profileResponse.data);

                if (profileResponse.data?.status && profileResponse.data?.data) {
                    const profile = profileResponse.data.data;
                    console.log('👤 Profile data:', profile);

                    // Construct full name from first_name and last_name
                    const fullName = profile.first_name && profile.last_name
                        ? `${profile.first_name} ${profile.last_name}`.trim()
                        : profile.full_name || profile.name || userName || 'User';

                    // Use profile_pic field from database
                    let profileAvatar = profile.profile_pic || profile.profile_picture || profile.avatar || userAvatar;

                    // Ensure we have a valid avatar URL (not null, not empty string)
                    if (!profileAvatar || profileAvatar.trim() === '') {
                        profileAvatar = 'https://randomuser.me/api/portraits/lego/1.jpg';
                    }

                    console.log('👤 Extracted name:', fullName);
                    console.log('👤 Extracted avatar:', profileAvatar);

                    setUserInfo(prev => ({
                        ...prev,
                        name: fullName,
                        avatar: profileAvatar,
                        rating: profile.rating || 5.0,
                        reviewCount: profile.review_count || 0,
                    }));
                }
            } catch (profileError) {
                console.log('⚠️ Could not fetch profile, using passed data:', profileError.message);
            }

            // Fetch user's event ads
            const eventsResponse = await api.get(`/event_ad/user/${userId}`);
            console.log('📅 Events API response:', eventsResponse.data);

            if (eventsResponse.data?.success) {
                const events = eventsResponse.data.data || [];
                console.log('✅ Found', events.length, 'event ads');

                // Format events for display using eventService
                const formattedEvents = events.map(event => eventService.formatEventForDisplay(event));
                setEventAds(formattedEvents);
            } else {
                console.log('❌ Events API returned success=false');
            }

            // Fetch user's vendor ads
            const vendorsResponse = await api.get(`/vendor_ad/user/${userId}`);
            console.log('🏢 Vendors API response:', vendorsResponse.data);

            if (vendorsResponse.data?.success) {
                const vendors = vendorsResponse.data.data || [];
                console.log('✅ Found', vendors.length, 'vendor ads');
                setVendorAds(vendors);
            } else {
                console.log('❌ Vendors API returned success=false');
            }

            // Update total ads count
            const totalCount = (eventsResponse.data?.data?.length || 0) + (vendorsResponse.data?.data?.length || 0);
            console.log('📊 Total ads count:', totalCount);

            setUserInfo(prev => ({
                ...prev,
                totalAds: totalCount
            }));
        } catch (error) {
            console.error('❌ Error fetching user data:', error);
            console.error('Error details:', error.response?.data || error.message);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchUserData();
    };

    const handleContactUser = () => {
        navigation.navigate('ChatScreen', {
            recipientId: userId,
            chatName: userInfo.name,
            avatar: userInfo.avatar,
            isOnline: false
        });
    };

    const renderEventAd = ({ item }) => (
        <EventCard
            event={item}
            onGiveQuote={() => {
                // Navigate to event details
                navigation.navigate('EventDetailView', { event: item });
            }}
        />
    );

    const renderVendorAd = ({ item }) => (
        <VendorCard
            vendor={item}
            onPress={() => {
                // Navigate to vendor details
                navigation.navigate('VendorDetailsSection', { vendor: item });
            }}
        />
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>User Profile</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                    />
                }
            >
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <Image
                        source={{ uri: userInfo.avatar }}
                        style={styles.avatar}
                    />
                    <Text style={styles.userName}>{userInfo.name}</Text>

                    <View style={styles.ratingContainer}>
                        <View style={styles.stars}>
                            {[...Array(5)].map((_, i) => (
                                <Icon
                                    key={i}
                                    name={i < Math.floor(userInfo.rating) ? "star" : "star-outline"}
                                    size={16}
                                    color="#FFB800"
                                />
                            ))}
                        </View>
                        <Text style={styles.ratingText}>
                            {userInfo.rating.toFixed(1)} ({userInfo.reviewCount} reviews)
                        </Text>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{userInfo.totalAds}</Text>
                            <Text style={styles.statLabel}>Total Ads</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{eventAds.length}</Text>
                            <Text style={styles.statLabel}>Events</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{vendorAds.length}</Text>
                            <Text style={styles.statLabel}>Services</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.contactButton, { backgroundColor: theme.colors.primary }]}
                        onPress={handleContactUser}
                    >
                        <Icon name="chatbubble-ellipses-outline" size={20} color="#fff" />
                        <Text style={styles.contactButtonText}>Contact User</Text>
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === 'events' && [styles.activeTab, { borderBottomColor: theme.colors.primary }]
                        ]}
                        onPress={() => setActiveTab('events')}
                    >
                        <Text style={[
                            styles.tabText,
                            activeTab === 'events' && [styles.activeTabText, { color: theme.colors.primary }]
                        ]}>
                            Event Ads ({eventAds.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === 'services' && [styles.activeTab, { borderBottomColor: theme.colors.primary }]
                        ]}
                        onPress={() => setActiveTab('services')}
                    >
                        <Text style={[
                            styles.tabText,
                            activeTab === 'services' && [styles.activeTabText, { color: theme.colors.primary }]
                        ]}>
                            Service Ads ({vendorAds.length})
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.contentContainer}>
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                            <Text style={styles.loadingText}>Loading ads...</Text>
                        </View>
                    ) : (
                        <>
                            {activeTab === 'events' && (
                                eventAds.length > 0 ? (
                                    <FlatList
                                        data={eventAds}
                                        renderItem={renderEventAd}
                                        keyExtractor={(item) => item.event_ad_id?.toString() || item.id?.toString()}
                                        scrollEnabled={false}
                                        contentContainerStyle={styles.listContent}
                                    />
                                ) : (
                                    <View style={styles.emptyContainer}>
                                        <Icon name="calendar-outline" size={60} color="#ccc" />
                                        <Text style={styles.emptyText}>No event ads found</Text>
                                    </View>
                                )
                            )}

                            {activeTab === 'services' && (
                                vendorAds.length > 0 ? (
                                    <FlatList
                                        data={vendorAds}
                                        renderItem={renderVendorAd}
                                        keyExtractor={(item) => item.vendor_ad_id?.toString() || item.id?.toString()}
                                        scrollEnabled={false}
                                        contentContainerStyle={styles.listContent}
                                    />
                                ) : (
                                    <View style={styles.emptyContainer}>
                                        <Icon name="briefcase-outline" size={60} color="#ccc" />
                                        <Text style={styles.emptyText}>No service ads found</Text>
                                    </View>
                                )
                            )}
                        </>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingTop: 50,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    profileCard: {
        backgroundColor: '#fff',
        padding: 24,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f0f0f0',
        marginBottom: 16,
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    stars: {
        flexDirection: 'row',
        marginRight: 8,
    },
    ratingText: {
        fontSize: 14,
        color: '#64748B',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#f0f0f0',
    },
    statBox: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1E293B',
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 4,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 25,
        gap: 8,
    },
    contactButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomWidth: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
    },
    activeTabText: {
        fontWeight: '700',
    },
    contentContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#64748B',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748B',
    },
    listContent: {
        paddingBottom: 20,
    },
});
