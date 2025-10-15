import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidStyle, EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, AppState } from 'react-native';
import api from './api';
import { navigationRef } from './navigationService';

class NotificationService {
    constructor() {
        this.messageListener = null;
        this.notificationOpenedListener = null;
    }

    // Initialize notification service
    async initialize() {
        try {
            // Request notification permissions
            await this.requestPermission();

            // Get and save FCM token
            await this.registerDeviceToken();

            // Create notification channels for Android
            if (Platform.OS === 'android') {
                await this.createNotificationChannels();
            }

            // Set up notification listeners
            this.setupNotificationListeners();

            // Handle initial notification (app opened from notification)
            await this.checkInitialNotification();

            console.log('✅ Notification service initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing notification service:', error);
        }
    }

    // Request notification permissions
    async requestPermission() {
        try {
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                console.log('✅ Notification permission granted');
                return true;
            } else {
                console.log('❌ Notification permission denied');
                return false;
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    // Register device token with backend
    async registerDeviceToken() {
        try {
            // Get FCM token
            const fcmToken = await messaging().getToken();
            console.log('📱 FCM Token:', fcmToken);

            // Save token locally
            await AsyncStorage.setItem('fcm_token', fcmToken);

            // Send token to backend
            await this.sendTokenToBackend(fcmToken);

            // Listen for token refresh
            messaging().onTokenRefresh(async (newToken) => {
                console.log('🔄 FCM Token refreshed:', newToken);
                await AsyncStorage.setItem('fcm_token', newToken);
                await this.sendTokenToBackend(newToken);
            });
        } catch (error) {
            console.error('Error getting FCM token:', error);
        }
    }

    // Send FCM token to backend
    async sendTokenToBackend(token) {
        try {
            const response = await api.post('/notifications/register-device', {
                fcm_token: token,
                device_type: Platform.OS,
                device_model: Platform.OS === 'ios' ? 'iPhone' : 'Android'
            });

            if (response.data.success) {
                console.log('✅ FCM token registered with backend');
            }
        } catch (error) {
            console.error('Error sending token to backend:', error);
        }
    }

    // Create notification channels for Android
    async createNotificationChannels() {
        try {
            // Chat messages channel
            await notifee.createChannel({
                id: 'chat_messages',
                name: 'Chat Messages',
                description: 'Notifications for new chat messages',
                importance: AndroidImportance.HIGH,
                sound: 'default',
                vibration: true,
                badge: true,
            });

            // Admin notifications channel
            await notifee.createChannel({
                id: 'admin_notifications',
                name: 'Admin Notifications',
                description: 'Notifications from admin (ad approvals, rejections)',
                importance: AndroidImportance.HIGH,
                sound: 'default',
                vibration: true,
                badge: true,
            });

            // General notifications channel
            await notifee.createChannel({
                id: 'general',
                name: 'General',
                description: 'General app notifications',
                importance: AndroidImportance.DEFAULT,
                sound: 'default',
                vibration: true,
                badge: true,
            });

            console.log('✅ Notification channels created');
        } catch (error) {
            console.error('Error creating notification channels:', error);
        }
    }

    // Set up notification listeners
    setupNotificationListeners() {
        // Foreground message handler
        this.messageListener = messaging().onMessage(async (remoteMessage) => {
            console.log('📬 Foreground notification received:', remoteMessage);
            await this.displayNotification(remoteMessage);
        });

        // Background/Quit message handler
        messaging().setBackgroundMessageHandler(async (remoteMessage) => {
            console.log('📬 Background notification received:', remoteMessage);
            await this.displayNotification(remoteMessage);
        });

        // Notification interaction handler (when user taps notification)
        notifee.onForegroundEvent(({ type, detail }) => {
            if (type === EventType.PRESS) {
                console.log('👆 Notification pressed:', detail);
                this.handleNotificationPress(detail.notification);
            }
        });

        // Handle notification opened app
        messaging().onNotificationOpenedApp((remoteMessage) => {
            console.log('📱 App opened from notification:', remoteMessage);
            this.handleNotificationNavigation(remoteMessage.data);
        });
    }

    // Display notification using Notifee
    async displayNotification(remoteMessage) {
        try {
            const { data, notification } = remoteMessage;
            
            // Determine channel based on notification type
            let channelId = 'general';
            if (data?.type === 'chat_message') {
                channelId = 'chat_messages';
            } else if (data?.type === 'admin_notification') {
                channelId = 'admin_notifications';
            }

            // Prepare notification payload
            const notificationPayload = {
                title: notification?.title || data?.title || 'Evanzo',
                body: notification?.body || data?.body || 'You have a new notification',
                android: {
                    channelId,
                    importance: AndroidImportance.HIGH,
                    pressAction: {
                        id: 'default',
                    },
                    smallIcon: 'ic_notification', // Make sure to add this icon to Android resources
                    color: '#2C3D5B',
                },
                ios: {
                    sound: 'default',
                    badge: 1,
                    foregroundPresentationOptions: {
                        badge: true,
                        sound: true,
                        banner: true,
                        list: true,
                    },
                },
                data: data || {},
            };

            // Add specific handling for chat messages
            if (data?.type === 'chat_message') {
                notificationPayload.android.style = {
                    type: AndroidStyle.MESSAGING,
                    person: {
                        name: data.sender_name || 'User',
                    },
                    messages: [
                        {
                            text: notification?.body || data?.message,
                            timestamp: Date.now(),
                        },
                    ],
                };

                // Add action buttons for chat
                notificationPayload.android.actions = [
                    {
                        title: 'Reply',
                        pressAction: {
                            id: 'reply',
                        },
                        input: {
                            allowFreeFormInput: true,
                            placeholder: 'Type your reply...',
                        },
                    },
                    {
                        title: 'View',
                        pressAction: {
                            id: 'view',
                        },
                    },
                ];
            }

            // Display the notification
            await notifee.displayNotification(notificationPayload);

            // Update badge count
            await this.updateBadgeCount();

        } catch (error) {
            console.error('Error displaying notification:', error);
        }
    }

    // Handle notification press
    handleNotificationPress(notification) {
        const data = notification.data || {};
        this.handleNotificationNavigation(data);
    }

    // Handle navigation based on notification data
    handleNotificationNavigation(data) {
        if (!navigationRef.current) {
            console.log('Navigation ref not ready');
            return;
        }

        setTimeout(() => {
            switch (data.type) {
                case 'chat_message':
                    // Navigate to chat screen
                    if (data.chat_id) {
                        navigationRef.current?.navigate('ChatScreen', {
                            chatId: data.chat_id,
                            chatName: data.sender_name || 'Chat',
                        });
                    }
                    break;

                case 'admin_notification':
                    // Navigate based on admin action
                    if (data.action === 'ad_approved' || data.action === 'ad_rejected') {
                        // Navigate to My Ads section in profile
                        navigationRef.current?.navigate('Profile');
                    }
                    break;

                case 'vendor_message':
                    // Navigate to vendor details
                    if (data.vendor_id) {
                        navigationRef.current?.navigate('VendorAddDetail', {
                            vendorId: data.vendor_id,
                        });
                    }
                    break;

                case 'event_response':
                    // Navigate to event details
                    if (data.event_id) {
                        navigationRef.current?.navigate('EventDetailView', {
                            eventId: data.event_id,
                        });
                    }
                    break;

                default:
                    // Navigate to home or notifications screen
                    navigationRef.current?.navigate('Home');
                    break;
            }
        }, 500);
    }

    // Check for initial notification (app opened from quit state)
    async checkInitialNotification() {
        try {
            const initialNotification = await messaging().getInitialNotification();
            if (initialNotification) {
                console.log('🚀 App opened from notification:', initialNotification);
                this.handleNotificationNavigation(initialNotification.data);
            }
        } catch (error) {
            console.error('Error checking initial notification:', error);
        }
    }

    // Update app badge count
    async updateBadgeCount() {
        try {
            // Get unread count from backend or local storage
            const unreadCount = await this.getUnreadNotificationCount();
            
            if (Platform.OS === 'ios') {
                await notifee.setBadgeCount(unreadCount);
            }
        } catch (error) {
            console.error('Error updating badge count:', error);
        }
    }

    // Get unread notification count
    async getUnreadNotificationCount() {
        try {
            const response = await api.get('/notifications/unread-count');
            if (response.data.success) {
                return response.data.data.count || 0;
            }
            return 0;
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    }

    // Clear all notifications
    async clearAllNotifications() {
        try {
            await notifee.cancelAllNotifications();
            await notifee.setBadgeCount(0);
            console.log('✅ All notifications cleared');
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    }

    // Send local notification (for testing)
    async sendLocalNotification(title, body, data = {}) {
        await notifee.displayNotification({
            title,
            body,
            android: {
                channelId: 'general',
                importance: AndroidImportance.HIGH,
                pressAction: {
                    id: 'default',
                },
            },
            ios: {
                sound: 'default',
                badge: 1,
            },
            data,
        });
    }

    // Clean up listeners
    cleanup() {
        if (this.messageListener) {
            this.messageListener();
        }
        if (this.notificationOpenedListener) {
            this.notificationOpenedListener();
        }
    }
}

const notificationService = new NotificationService();
export default notificationService;