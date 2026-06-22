import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SectionList,
    RefreshControl,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import notificationService from '../../services/notificationService';
import { NotificationSkeleton, renderSkeletons } from '../../components/SkeletonLoader';
import { getCached, setCached } from '../../services/listCacheService';

const PRIMARY = '#2C3D5B';
const UNREAD_BG = '#EAF2FF';
const DIVIDER = '#EEF1F5';
const TEXT_PRIMARY = '#1F2A44';
const TEXT_SECONDARY = '#6B7280';
const TEXT_TERTIARY = '#9CA3AF';

const ICON_MAP = {
    message: 'chatbubbles',
    ad_response: 'megaphone',
    vendor_quote: 'megaphone',
    event_reminder: 'time',
    ad_boost: 'megaphone',
    review: 'star',
    system: 'information-circle',
    promotion: 'gift',
    default: 'notifications',
};

const formatTime = (timestamp) => {
    const date = new Date(Number(timestamp));
    const diff = Date.now() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return `${Math.max(seconds, 1)} sec ago`;
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 14) return 'last week';
    return `${days} days ago`;
};

// Group notifications into "New" (< 2 days), "This Week" (< 14 days), "Earlier"
const groupByAge = (items) => {
    const dayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const buckets = { new: [], week: [], earlier: [] };
    items.forEach((n) => {
        const age = now - Number(n.created_at);
        if (age < 2 * dayMs) buckets.new.push(n);
        else if (age < 14 * dayMs) buckets.week.push(n);
        else buckets.earlier.push(n);
    });
    const sections = [];
    if (buckets.new.length) sections.push({ title: 'New', data: buckets.new });
    if (buckets.week.length) sections.push({ title: 'This Week', data: buckets.week });
    if (buckets.earlier.length) sections.push({ title: 'Earlier', data: buckets.earlier });
    return sections;
};

const NotificationItem = ({ notification, onPress, onLongPress }) => {
    const iconName = ICON_MAP[notification.type] || ICON_MAP.default;
    const isRead = notification.is_read;

    return (
        <TouchableOpacity
            style={[styles.item, !isRead && styles.itemUnread]}
            onPress={() => onPress(notification)}
            onLongPress={() => onLongPress(notification)}
            activeOpacity={0.6}
        >
            <View style={styles.iconCircle}>
                <Icon name={iconName} size={20} color={PRIMARY} />
            </View>
            <View style={styles.itemContent}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                    {notification.title}
                </Text>
                {!!notification.message && (
                    <Text style={styles.itemMessage} numberOfLines={2}>
                        {notification.message}
                    </Text>
                )}
            </View>
            <Text style={styles.itemTime}>{formatTime(notification.created_at)}</Text>
        </TouchableOpacity>
    );
};

export default function NotificationInbox() {
    const navigation = useNavigation();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async (pageNum = 1, isRefresh = false) => {
        try {
            if (pageNum > 1) setLoadingMore(true);
            // For first page we deliberately don't flip `loading` to true —
            // the cached snapshot (if any) is already painted; refreshing
            // silently in the background is the WhatsApp pattern.

            const result = await notificationService.getNotifications({
                page: pageNum,
                limit: 20,
            });

            if (result.success && result.data) {
                const newNotifications = result.data.results || [];
                if (pageNum === 1) {
                    setNotifications(newNotifications);
                    // Persist page-1 snapshot so the next mount renders instantly.
                    setCached('notifications:inbox', newNotifications);
                } else {
                    setNotifications((prev) => [...prev, ...newNotifications]);
                }
                setHasMore(pageNum < (result.data.totalPages || 1));
                setPage(pageNum);
            }

            const countResult = await notificationService.getUnreadCount();
            if (countResult.success) setUnreadCount(countResult.count);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, []);

    // Hydrate from cache synchronously-ish on mount, then revalidate.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const cached = await getCached('notifications:inbox');
            if (cancelled) return;
            if (Array.isArray(cached) && cached.length > 0) {
                setNotifications(cached);
                setLoading(false);
            }
            fetchNotifications(1);
        })();
        return () => { cancelled = true; };
    }, [fetchNotifications]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchNotifications(1, true);
    }, [fetchNotifications]);

    const loadMore = useCallback(() => {
        if (!loadingMore && hasMore && !loading) {
            fetchNotifications(page + 1);
        }
    }, [loadingMore, hasMore, loading, page, fetchNotifications]);

    const handleNotificationPress = async (notification) => {
        if (!notification.is_read) {
            const result = await notificationService.markAsRead(notification.notification_id);
            if (result.success) {
                setNotifications((prev) =>
                    prev.map((n) =>
                        n.notification_id === notification.notification_id
                            ? { ...n, is_read: true }
                            : n,
                    ),
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        }

        // Drill into the relevant screen based on type / action.
        const data = notification.data || {};
        switch (notification.action_type || notification.type) {
            case 'open_chat':
            case 'message':
                if (data.chat_id) {
                    navigation.navigate('ChatScreen', {
                        chatId: data.chat_id,
                        chatName: data.sender_name || 'Chat',
                    });
                }
                break;
            case 'view_event_ad':
            case 'event_reminder':
                if (data.event_ad_id) {
                    navigation.navigate('EventDetailView', { eventId: data.event_ad_id });
                }
                break;
            case 'view_response':
            case 'ad_response':
                // No deep target — just return to the profile.
                navigation.goBack();
                break;
            case 'view_inquiry':
            case 'vendor_quote':
                if (data.vendor_ad_id) {
                    navigation.navigate('Main', {
                        screen: 'Vendors',
                        params: {
                            screen: 'VendorAddDetail',
                            params: { vendorId: data.vendor_ad_id },
                        },
                    });
                }
                break;
            default:
                break;
        }
    };

    const handleLongPress = (notification) => {
        Alert.alert(
            'Delete Notification',
            'Are you sure you want to delete this notification?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await notificationService.deleteNotification(
                            notification.notification_id,
                        );
                        if (result.success) {
                            setNotifications((prev) =>
                                prev.filter(
                                    (n) => n.notification_id !== notification.notification_id,
                                ),
                            );
                            if (!notification.is_read) {
                                setUnreadCount((prev) => Math.max(0, prev - 1));
                            }
                        } else {
                            Alert.alert('Error', result.error || 'Failed to delete notification');
                        }
                    },
                },
            ],
        );
    };

    const handleMarkAllRead = async () => {
        if (unreadCount === 0) return;
        const result = await notificationService.markAllAsRead();
        if (result.success) {
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } else {
            Alert.alert('Error', result.error || 'Failed to mark all as read');
        }
    };

    const sections = useMemo(() => groupByAge(notifications), [notifications]);

    const renderSection = ({ section }) => (
        <Text style={styles.sectionTitle}>{section.title}</Text>
    );

    const renderEmpty = () => {
        // Skeletons replace the old spinner: same shape as the real row, no
        // jarring "blank → list" jump. Only shown on first-ever open (no cache).
        if (loading) {
            return renderSkeletons(NotificationSkeleton, 6);
        }
        return (
            <View style={styles.emptyContainer}>
                <Icon name="notifications-off-outline" size={64} color={TEXT_TERTIARY} />
                <Text style={styles.emptyTitle}>All Caught Up!</Text>
                <Text style={styles.emptySubtitle}>
                    You have no notifications right now.
                </Text>
            </View>
        );
    };

    const renderFooter = () =>
        loadingMore ? (
            <View style={styles.footerLoader}>
                {renderSkeletons(NotificationSkeleton, 2)}
            </View>
        ) : null;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Icon name="chevron-back" size={22} color={PRIMARY} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <TouchableOpacity
                    onPress={handleMarkAllRead}
                    disabled={unreadCount === 0}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Text
                        style={[
                            styles.markAllText,
                            unreadCount === 0 && styles.markAllTextDisabled,
                        ]}
                    >
                        Mark All as Read
                    </Text>
                </TouchableOpacity>
            </View>

            <SectionList
                sections={sections}
                keyExtractor={(item) => String(item.notification_id)}
                renderItem={({ item }) => (
                    <NotificationItem
                        notification={item}
                        onPress={handleNotificationPress}
                        onLongPress={handleLongPress}
                    />
                )}
                renderSectionHeader={renderSection}
                stickySectionHeadersEnabled={false}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={PRIMARY}
                        colors={[PRIMARY]}
                    />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.3}
                contentContainerStyle={[
                    styles.listContent,
                    sections.length === 0 && styles.listContentEmpty,
                ]}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: DIVIDER,
    },
    backBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: DIVIDER,
        marginRight: 8,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '700',
        color: PRIMARY,
        marginRight: -32, // optical centering compensation for back button width
    },
    markAllText: {
        fontSize: 12,
        fontWeight: '500',
        color: TEXT_SECONDARY,
    },
    markAllTextDisabled: {
        color: TEXT_TERTIARY,
    },
    listContent: {
        paddingBottom: 24,
        flexGrow: 1,
    },
    listContentEmpty: {
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: TEXT_SECONDARY,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fff',
    },
    itemUnread: {
        backgroundColor: UNREAD_BG,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(44,61,91,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemContent: {
        flex: 1,
        marginRight: 8,
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: TEXT_PRIMARY,
        marginBottom: 2,
    },
    itemMessage: {
        fontSize: 13,
        color: TEXT_SECONDARY,
        lineHeight: 18,
    },
    itemTime: {
        fontSize: 11,
        color: TEXT_TERTIARY,
        marginTop: 2,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: TEXT_PRIMARY,
        marginTop: 16,
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 14,
        color: TEXT_SECONDARY,
        textAlign: 'center',
        lineHeight: 20,
    },
    center: {
        paddingTop: 80,
        alignItems: 'center',
    },
    footerLoader: {
        paddingVertical: 16,
        alignItems: 'center',
    },
});
