import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import settingsService from '../../services/settingsService';

export default function LoginHistory() {
    const navigation = useNavigation();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await settingsService.getLoginHistory(1, 50);
            if (result.success && result.data) {
                const logins = Array.isArray(result.data) ? result.data : result.data.logins || [];
                setHistory(logins);
            } else {
                setError(result.message || 'Failed to load login history');
            }
        } catch (err) {
            setError('Failed to load login history');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        try {
            const d = new Date(dateString);
            return d.toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
            });
        } catch {
            return dateString;
        }
    };

    const getDeviceIcon = (device) => {
        if (!device) return 'phone-portrait-outline';
        const d = device.toLowerCase();
        if (d.includes('iphone') || d.includes('ios')) return 'logo-apple';
        if (d.includes('android')) return 'logo-android';
        if (d.includes('web') || d.includes('chrome') || d.includes('browser')) return 'globe-outline';
        return 'phone-portrait-outline';
    };

    const renderItem = ({ item, index }) => (
        <View style={[styles.card, index === 0 && styles.cardFirst]}>
            <View style={styles.cardRow}>
                <View style={styles.iconContainer}>
                    <Icon name={getDeviceIcon(item.device)} size={22} color="#2C3D5B" />
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.deviceText}>{item.device || 'Unknown Device'}</Text>
                    <Text style={styles.timeText}>{formatDate(item.loginTime)}</Text>
                    {item.location ? (
                        <View style={styles.locationRow}>
                            <Icon name="location-outline" size={14} color="#8B95A5" />
                            <Text style={styles.locationText}>{item.location}</Text>
                        </View>
                    ) : null}
                    {item.ipAddress ? (
                        <Text style={styles.ipText}>IP: {item.ipAddress}</Text>
                    ) : null}
                </View>
                <View style={[
                    styles.statusBadge,
                    { backgroundColor: item.status === 'success' ? '#E8F5E9' : '#FFEBEE' }
                ]}>
                    <Text style={[
                        styles.statusText,
                        { color: item.status === 'success' ? '#2E7D32' : '#C62828' }
                    ]}>
                        {item.status === 'success' ? 'Success' : 'Failed'}
                    </Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safe}>
            <View style={{ height: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#2C3D5B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Login History</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2C3D5B" />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Icon name="cloud-offline-outline" size={48} color="#8B95A5" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={fetchHistory}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : history.length === 0 ? (
                <View style={styles.center}>
                    <Icon name="time-outline" size={48} color="#8B95A5" />
                    <Text style={styles.emptyText}>No login history available</Text>
                </View>
            ) : (
                <FlatList
                    data={history}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => `login-${index}`}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#F6F8FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E8ECF0',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2C3D5B',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    cardFirst: {
        borderLeftWidth: 3,
        borderLeftColor: '#2C3D5B',
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F2F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardContent: {
        flex: 1,
    },
    deviceText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2C3D5B',
        marginBottom: 4,
    },
    timeText: {
        fontSize: 13,
        color: '#8B95A5',
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    locationText: {
        fontSize: 12,
        color: '#8B95A5',
        marginLeft: 4,
    },
    ipText: {
        fontSize: 11,
        color: '#B0B8C1',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    errorText: {
        fontSize: 15,
        color: '#8B95A5',
        marginTop: 12,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 15,
        color: '#8B95A5',
        marginTop: 12,
    },
    retryBtn: {
        marginTop: 16,
        backgroundColor: '#2C3D5B',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
});
