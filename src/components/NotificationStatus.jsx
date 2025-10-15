import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationService from '../services/notificationService';

export default function NotificationStatus() {
    const [permissionStatus, setPermissionStatus] = useState('unknown');
    const [fcmToken, setFcmToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkNotificationStatus();
    }, []);

    const checkNotificationStatus = async () => {
        try {
            setLoading(true);
            
            // Check permission status
            const authStatus = await messaging().hasPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;
            
            setPermissionStatus(enabled ? 'granted' : 'denied');
            
            // Get FCM token if permission is granted
            if (enabled) {
                const token = await AsyncStorage.getItem('fcm_token');
                if (token) {
                    setFcmToken(token.substring(0, 20) + '...');
                }
            }
        } catch (error) {
            console.error('Error checking notification status:', error);
            setPermissionStatus('error');
        } finally {
            setLoading(false);
        }
    };

    const requestPermission = async () => {
        try {
            const granted = await notificationService.requestPermission();
            if (granted) {
                setPermissionStatus('granted');
                await notificationService.registerDeviceToken();
                Alert.alert('Success', 'Notification permissions granted!');
                checkNotificationStatus(); // Refresh status
            } else {
                Alert.alert('Permission Denied', 'Please enable notifications in your device settings.');
            }
        } catch (error) {
            console.error('Error requesting permission:', error);
            Alert.alert('Error', 'Failed to request notification permission.');
        }
    };

    const getStatusIcon = () => {
        switch (permissionStatus) {
            case 'granted':
                return <Icon name="checkmark-circle" size={20} color="#2ECC71" />;
            case 'denied':
                return <Icon name="close-circle" size={20} color="#E74C3C" />;
            default:
                return <Icon name="help-circle" size={20} color="#F39C12" />;
        }
    };

    const getStatusText = () => {
        switch (permissionStatus) {
            case 'granted':
                return 'Notifications Enabled';
            case 'denied':
                return 'Notifications Disabled';
            default:
                return 'Unknown Status';
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Checking notification status...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.statusRow}>
                {getStatusIcon()}
                <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
            
            {fcmToken && (
                <Text style={styles.tokenText}>Token: {fcmToken}</Text>
            )}
            
            {permissionStatus === 'denied' && (
                <TouchableOpacity style={styles.enableButton} onPress={requestPermission}>
                    <Text style={styles.enableButtonText}>Enable Notifications</Text>
                </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.refreshButton} onPress={checkNotificationStatus}>
                <Icon name="refresh" size={16} color="#3498DB" />
                <Text style={styles.refreshButtonText}>Refresh Status</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 10,
        margin: 15,
        marginTop: 0,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusText: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
    },
    loadingText: {
        textAlign: 'center',
        color: '#7f8c8d',
        fontStyle: 'italic',
    },
    tokenText: {
        fontSize: 12,
        color: '#7f8c8d',
        marginBottom: 10,
        fontFamily: 'monospace',
    },
    enableButton: {
        backgroundColor: '#3498DB',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    enableButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    refreshButtonText: {
        marginLeft: 5,
        color: '#3498DB',
        fontSize: 14,
        fontWeight: '500',
    },
});