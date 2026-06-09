import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import settingsService from '../../services/settingsService';

export default function BlockedUsers() {
    const navigation = useNavigation();
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unblockingUserId, setUnblockingUserId] = useState(null);

    const fetchBlockedUsers = useCallback(async () => {
        try {
            const result = await settingsService.getBlockedUsers();
            if (result.success) {
                setBlockedUsers(result.data || []);
            } else {
                setBlockedUsers([]);
            }
        } catch (error) {
            console.error('[BlockedUsers] Error fetching blocked users:', error);
            setBlockedUsers([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchBlockedUsers();
    }, [fetchBlockedUsers]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchBlockedUsers();
    }, [fetchBlockedUsers]);

    const handleUnblock = (user) => {
        Alert.alert(
            'Unblock User',
            `Are you sure you want to unblock ${user.fullName || user.full_name || user.name || 'this user'}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Unblock',
                    onPress: () => performUnblock(user),
                },
            ]
        );
    };

    const performUnblock = async (user) => {
        const userId = user.userId || user.user_id || user.id || user.blocked_user_id;
        setUnblockingUserId(userId);

        try {
            const result = await settingsService.unblockUser(userId);

            if (result.success) {
                // Remove from local state
                setBlockedUsers(prev => prev.filter(u =>
                    (u.userId || u.user_id || u.id) !== userId
                ));
                Alert.alert('Success', result.message || `${user.full_name || user.name || 'User'} has been unblocked.`);
            } else {
                Alert.alert('Error', result.message || 'Failed to unblock user. Please try again.');
            }
        } catch (error) {
            console.error('[BlockedUsers] Error unblocking user:', error);
            Alert.alert('Error', 'Failed to unblock user. Please try again.');
        } finally {
            setUnblockingUserId(null);
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const renderBlockedUser = ({ item }) => {
        const userId = item.userId || item.user_id || item.id;
        const userName = item.fullName || item.full_name || item.name || 'Unknown User';
        const isUnblocking = unblockingUserId === userId;

        return (
            <View style={styles.userItem}>
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getInitials(userName)}</Text>
                    </View>
                    <View style={styles.userDetails}>
                        <Text style={styles.userName}>{userName}</Text>
                        {item.email && (
                            <Text style={styles.userEmail}>{item.email}</Text>
                        )}
                        {(item.blockedAt || item.blocked_at) && (
                            <Text style={styles.blockedDate}>
                                Blocked {new Date(item.blockedAt || item.blocked_at).toLocaleDateString()}
                            </Text>
                        )}
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.unblockButton, isUnblocking && styles.unblockButtonDisabled]}
                    onPress={() => handleUnblock(item)}
                    disabled={isUnblocking}
                >
                    {isUnblocking ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.unblockButtonText}>Unblock</Text>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <Icon name="checkmark-circle-outline" size={64} color="#4CAF50" />
            <Text style={styles.emptyTitle}>No Blocked Users</Text>
            <Text style={styles.emptySubtitle}>
                You haven't blocked anyone yet. When you block a user, they'll appear here.
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.androidPad} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backIcon}>{'\u2190'}</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Blocked Users</Text>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Loading blocked users...</Text>
                </View>
            ) : (
                <FlatList
                    data={blockedUsers}
                    renderItem={renderBlockedUser}
                    keyExtractor={(item) => String(item.user_id || item.id || item.blocked_user_id)}
                    contentContainerStyle={[
                        styles.listContainer,
                        blockedUsers.length === 0 && styles.emptyListContainer
                    ]}
                    ListEmptyComponent={renderEmptyList}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#fff"
                            colors={['#fff']}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Info section at bottom */}
            {blockedUsers.length > 0 && (
                <View style={styles.infoSection}>
                    <Icon name="information-circle-outline" size={18} color="#B0B8C1" />
                    <Text style={styles.infoText}>
                        Blocked users cannot message you or see your profile.
                    </Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#2C3D5B',
    },
    androidPad: {
        height: 18,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#41547A',
        backgroundColor: '#2C3D5B',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: 'rgba(65,84,122,0.7)',
        marginRight: 12,
    },
    backIcon: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#B0B8C1',
        fontSize: 16,
        marginTop: 12,
    },
    listContainer: {
        padding: 18,
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#41547A',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#2C3D5B',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    userEmail: {
        color: '#B0B8C1',
        fontSize: 13,
    },
    blockedDate: {
        color: '#8B95A5',
        fontSize: 12,
        marginTop: 2,
    },
    unblockButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    unblockButtonDisabled: {
        opacity: 0.6,
    },
    unblockButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        color: '#B0B8C1',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    infoSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: '#41547A',
        backgroundColor: '#2C3D5B',
    },
    infoText: {
        color: '#B0B8C1',
        fontSize: 13,
        marginLeft: 8,
        flex: 1,
    },
});
