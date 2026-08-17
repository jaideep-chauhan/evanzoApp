import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  AndroidStyle,
  EventType,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform, AppState} from 'react-native';
import api from './api';
import {navigationRef} from './navigationService';

class NotificationService {
  constructor() {
    this.messageListener = null;
    this.notificationOpenedListener = null;
  }

  // Initialize notification service
  async initialize() {
    try {
      // Check if Firebase is properly configured
      // If not configured, skip initialization gracefully
      if (!this.isFirebaseConfigured()) {
        console.log(
          '⚠️ Firebase not configured, skipping notification service initialization',
        );
        return;
      }

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
      console.log('ℹ️ App will continue without push notifications');
    }
  }

  // Check if Firebase is properly configured
  isFirebaseConfigured() {
    try {
      // Try to access Firebase messaging without throwing
      const app = messaging.app;
      return app !== null && app !== undefined;
    } catch (error) {
      return false;
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
      messaging().onTokenRefresh(async newToken => {
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
        device_model: Platform.OS === 'ios' ? 'iPhone' : 'Android',
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
    this.messageListener = messaging().onMessage(async remoteMessage => {
      console.log('📬 Foreground notification received:', remoteMessage);
      await this.displayNotification(remoteMessage);
    });

    // NOTE: the background/quit FCM handler is registered at MODULE scope in
    // index.js — the only place React Native runs it in headless/killed state.
    // Do NOT register it here too: a second registration inside a component
    // overrides index.js's and won't run when the app is killed.

    // When the app returns to the foreground, consume any notification tap that
    // was stashed while it was backgrounded/killed (see index.js onBackgroundEvent).
    this.appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        this.consumePendingNotificationNav();
      }
    });

    // Notification interaction handler (when user taps notification)
    notifee.onForegroundEvent(({type, detail}) => {
      if (type === EventType.PRESS) {
        console.log('👆 Notification pressed:', detail);
        this.handleNotificationPress(detail.notification);
      }
    });

    // Handle notification opened app
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('📱 App opened from notification:', remoteMessage);
      this.handleNotificationNavigation(remoteMessage.data);
    });
  }

  // Display notification using Notifee
  async displayNotification(remoteMessage) {
    try {
      const {data, notification} = remoteMessage;

      // Determine channel based on notification type
      let channelId = 'general';
      if (data?.type === 'chat_message') {
        channelId = 'chat_messages';
      } else if (data?.type === 'admin_notification') {
        channelId = 'admin_notifications';
      }

      // Prepare notification payload
      const notificationPayload = {
        title: notification?.title || data?.title || 'Evnzo',
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

  // Resolve a notification into a navigation target { name, params }.
  //
  // Works for BOTH a raw FCM `data` payload (system-tray tap) and an in-app
  // notification DB row, because the routing fields can live in different
  // places depending on the source:
  //   - key:  `action_type` (e.g. "open_chat") preferred, else `type`.
  //   - ids:  spread at the top level (push) AND/OR inside a JSON-stringified
  //           `action_data`/`data` (in-app row) — so we parse+merge all of them.
  // Always returns a target so a tap NEVER dead-ends (the old code sent
  // unknown types to a non-existent 'Home' route, so they did nothing).
  getNotificationRoute(notification = {}) {
    const parseMaybe = (v) => {
      if (!v) return {};
      if (typeof v === 'string') {
        try { return JSON.parse(v); } catch (_) { return {}; }
      }
      return v;
    };
    const merged = {
      ...parseMaybe(notification.action_data),
      ...parseMaybe(notification.data),
      ...notification,
    };
    const key =
      notification.action_type || merged.action_type ||
      notification.type || merged.type;

    // Accept snake_case (backend) and camelCase, wherever the id landed.
    const chatId = merged.chat_id || merged.chatId;
    const eventAdId = merged.event_ad_id || merged.eventId || merged.event_id;
    const vendorAdId = merged.vendor_ad_id || merged.vendorId || merged.vendor_id;
    const chatName =
      merged.sender_name ||
      (notification.title || '').replace(/^New message from\s*/i, '') ||
      'Chat';

    switch (key) {
      // ---- Chat (two backend payloads: message/open_chat and chat_message) ----
      case 'open_chat':
      case 'message':
      case 'chat_message':
        return chatId
          ? { name: 'ChatScreen', params: { chatId, chatName } }
          : { name: 'Main', params: { screen: 'Messages' } };

      // ---- Gig/event ad response + new-gig reminder ----
      case 'view_event_ad':
      case 'event_reminder':
      case 'view_response':
      case 'ad_response':
        if (eventAdId) return { name: 'EventDetailView', params: { eventId: eventAdId } };
        if (vendorAdId) return { name: 'VendorAddDetail', params: { vendorId: vendorAdId } };
        return { name: 'Main', params: { screen: 'Profile' } };

      // ---- Vendor inquiry / quote ----
      case 'view_inquiry':
      case 'vendor_quote':
        return vendorAdId
          ? { name: 'VendorAddDetail', params: { vendorId: vendorAdId } }
          : { name: 'Main', params: { screen: 'Profile' } };

      // ---- New review on your vendor ad (payload only has review_id) ----
      case 'view_review':
      case 'review':
        return vendorAdId
          ? { name: 'VendorAddDetail', params: { vendorId: vendorAdId } }
          : { name: 'Main', params: { screen: 'Profile' } };

      // ---- Account / security ----
      case 'login_alert':
        return { name: 'LoginHistory' };
      case 'new_support_ticket':
        return { name: 'HelpSupport' };

      // ---- Money / bookings + legacy admin ad-approval ----
      case 'view_booking':
      case 'booking_confirmation':
      case 'view_payment':
      case 'payment':
      case 'earning':
      case 'admin_notification':
      case 'ad_approved':
      case 'ad_rejected':
        return { name: 'Main', params: { screen: 'Profile' } };

      // ---- Informational (system/promotion/test) + anything unknown ----
      default:
        return { name: 'NotificationInbox' };
    }
  }

  // Handle navigation for a tapped system-tray push (raw FCM `data` payload).
  handleNotificationNavigation(data) {
    this.navigateWhenReady(data);
  }

  // Navigate as soon as the navigation container is mounted. On a cold start
  // from a KILLED-state tap the navigator isn't ready immediately, so retry
  // briefly (~6s) instead of the old fixed 500ms — which silently no-op'd when
  // the navigator hadn't come up yet (a big reason kill-state taps did nothing).
  navigateWhenReady(data, attempt = 0) {
    const route = this.getNotificationRoute(data);
    if (!route) return;
    if (navigationRef.current) {
      navigationRef.current.navigate(route.name, route.params);
      return;
    }
    if (attempt < 40) {
      setTimeout(() => this.navigateWhenReady(data, attempt + 1), 150);
    } else {
      console.log('Navigation container never became ready; dropped notification nav');
    }
  }

  // Consume a notification tap that was stashed (index.js onBackgroundEvent)
  // while the app was backgrounded/killed — used on return-to-foreground.
  async consumePendingNotificationNav() {
    try {
      const raw = await AsyncStorage.getItem('pendingNotificationNav');
      if (!raw) return;
      await AsyncStorage.removeItem('pendingNotificationNav');
      this.navigateWhenReady(JSON.parse(raw));
    } catch (_) {
      // ignore malformed/absent payloads
    }
  }

  // Check for initial notification (app opened from quit state)
  async checkInitialNotification() {
    try {
      // App opened from a KILLED state by tapping a notification. Notifications
      // are displayed via notifee, so we must check BOTH FCM's and notifee's
      // initial notification (previously only FCM was checked, so taps on
      // notifee-displayed notifications from a killed state did nothing). Also
      // fall back to any tap stashed by the notifee background handler.
      const [fcmInitial, notifeeInitial] = await Promise.all([
        messaging().getInitialNotification().catch(() => null),
        notifee.getInitialNotification().catch(() => null),
      ]);

      let pending = null;
      try {
        const raw = await AsyncStorage.getItem('pendingNotificationNav');
        if (raw) {
          pending = JSON.parse(raw);
          await AsyncStorage.removeItem('pendingNotificationNav');
        }
      } catch (_) {}

      const data =
        fcmInitial?.data ||
        notifeeInitial?.notification?.data ||
        pending ||
        null;

      if (data) {
        console.log('🚀 App opened from notification (killed state):', data);
        this.navigateWhenReady(data);
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

  // ───────────────────────────────────────────────────────────────────
  // Inbox API — the FCM bits above handle push delivery; the methods
  // below back the NotificationInbox screen by hitting /notifications
  // on the backend.
  // ───────────────────────────────────────────────────────────────────

  async getNotifications({page = 1, limit = 20} = {}) {
    try {
      const res = await api.get('/notifications', {params: {page, limit}});
      const payload = res.data?.data || res.data || {};
      return {
        success: true,
        data: {
          results: payload.results || [],
          page: payload.page || page,
          totalPages: payload.totalPages || 1,
          totalResults: payload.totalResults || 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async getUnreadCount() {
    try {
      const res = await api.get('/notifications/unread-count');
      return {success: true, count: res.data?.data?.count ?? 0};
    } catch (error) {
      return {
        success: false,
        count: 0,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async markAsRead(notificationId) {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      return {success: true};
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async markAllAsRead() {
    try {
      await api.post('/notifications/mark-all-read');
      return {success: true};
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async deleteNotification(notificationId) {
    try {
      await api.delete(`/notifications/${notificationId}`);
      return {success: true};
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;
