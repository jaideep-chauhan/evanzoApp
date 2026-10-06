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
import {secureStorage} from '../utils/secureStorage';
import {APP_VERSION} from '../config/appVersion';

// Android notification channels. The backend picks one of these ids per push
// (see pushNotification.service channelForType), so they must stay in sync.
export const NOTIFICATION_CHANNELS = [
  {
    id: 'chat_messages',
    name: 'Chat Messages',
    description: 'Notifications for new chat messages',
    importance: AndroidImportance.HIGH,
  },
  {
    id: 'admin_notifications',
    name: 'Ad Updates',
    description: 'Your ads being approved or rejected',
    importance: AndroidImportance.HIGH,
  },
  {
    id: 'general',
    name: 'General',
    description: 'Gigs, responses, reviews and other updates',
    importance: AndroidImportance.HIGH,
  },
];

// Idempotent — safe to call from the headless background handler too.
export const ensureNotificationChannels = async () => {
  if (Platform.OS !== 'android') return;
  await Promise.all(
    NOTIFICATION_CHANNELS.map((channel) =>
      notifee.createChannel({...channel, sound: 'default', vibration: true, badge: true}),
    ),
  );
};

const channelForData = (data = {}) => {
  const {type, action_type: actionType} = data;
  if (type === 'message' || type === 'chat_message' || actionType === 'open_chat') {
    return 'chat_messages';
  }
  if (['ad_approved', 'ad_rejected', 'admin_notification'].includes(actionType || type)) {
    return 'admin_notifications';
  }
  return 'general';
};

class NotificationService {
  constructor() {
    this.messageListener = null;
    this.notificationOpenedListener = null;
    this.foregroundEventUnsubscribe = null;
    this.tokenRefreshUnsubscribe = null;
    this.listenersReady = false;
    // Signed-in user (set by AuthContext) — some notifications are about the
    // user themself, e.g. "New Review" opens their own profile's Reviews tab.
    this.currentUserId = null;
  }

  setCurrentUserId(userId) {
    this.currentUserId = userId || null;
  }

  // Called once at app start. Registering the device with the backend needs a
  // logged-in user, so that happens separately via registerDeviceToken(),
  // which AuthContext calls whenever a user signs in (or a session is restored).
  async initialize() {
    try {
      if (Platform.OS === 'android') {
        await this.createNotificationChannels();
      }

      this.setupNotificationListeners();

      // Handle initial notification (app opened from notification)
      await this.checkInitialNotification();

      console.log('✅ Notification service initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing notification service:', error);
      console.log('ℹ️ App will continue without push notifications');
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

  async waitForApnsToken(timeoutMs = 10000) {
    try {
      if (!messaging().isDeviceRegisteredForRemoteMessages) {
        await messaging().registerDeviceForRemoteMessages();
      }
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        if (await messaging().getAPNSToken()) return true;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      console.warn('APNs token not available yet');
    } catch (error) {
      console.warn('APNs registration failed:', error?.message);
    }
    return false;
  }

  // Register this device's FCM token with the backend for the logged-in user.
  // No-op when logged out (the endpoint needs auth); AuthContext calls this
  // again as soon as someone signs in.
  async registerDeviceToken() {
    try {
      if (!(await secureStorage.getItem('authToken'))) return;

      await this.requestPermission();
      // iOS: FCM can only mint a token once APNs has handed the app its device
      // token, which arrives asynchronously after registration. Asking too
      // early fails with "No APNS token specified before fetching FCM Token".
      if (Platform.OS === 'ios') await this.waitForApnsToken();
      const fcmToken = await messaging().getToken();
      console.log('📱 FCM Token:', fcmToken);
      await AsyncStorage.setItem('fcm_token', fcmToken);
      await this.sendTokenToBackend(fcmToken);
      this.syncBadge();

      // Only one refresh listener, however many times the user logs in.
      if (!this.tokenRefreshUnsubscribe) {
        this.tokenRefreshUnsubscribe = messaging().onTokenRefresh(async newToken => {
          console.log('🔄 FCM Token refreshed:', newToken);
          await AsyncStorage.setItem('fcm_token', newToken);
          if (await secureStorage.getItem('authToken')) {
            await this.sendTokenToBackend(newToken);
          }
        });
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
  }

  // Send FCM token to backend
  async sendTokenToBackend(token) {
    try {
      const response = await api.post('/push-notifications/register-device', {
        device_token: token,
        platform: Platform.OS,
        app_version: APP_VERSION,
      });

      if (response.data.success) {
        console.log('✅ FCM token registered with backend');
      }
    } catch (error) {
      console.error('Error sending token to backend:', error?.response?.data || error.message);
    }
  }

  // Stop pushes to this device for the current user. Must run BEFORE the auth
  // token is cleared on logout — otherwise the next person to log in on a
  // shared phone would still get the previous user's messages.
  async unregisterDevice() {
    try {
      const token = await AsyncStorage.getItem('fcm_token');
      if (!token) return;
      await api.post('/push-notifications/unregister-device', {device_token: token});
      console.log('✅ FCM token unregistered');
    } catch (error) {
      console.log('⚠️ Could not unregister FCM token:', error?.response?.data || error.message);
    }
  }

  // Create notification channels for Android
  async createNotificationChannels() {
    try {
      await ensureNotificationChannels();
      console.log('✅ Notification channels created');
    } catch (error) {
      console.error('Error creating notification channels:', error);
    }
  }

  // Set up notification listeners
  setupNotificationListeners() {
    if (this.listenersReady) return;
    this.listenersReady = true;

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
        this.syncBadge();
      }
    });

    // Notification interaction handler (when user taps notification)
    this.foregroundEventUnsubscribe = notifee.onForegroundEvent(({type, detail}) => {
      if (type === EventType.PRESS) {
        console.log('👆 Notification pressed:', detail);
        this.handleNotificationPress(detail.notification);
      }
    });

    // Tap on a notification the system displayed while the app was in the background
    this.notificationOpenedListener = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('📱 App opened from notification:', remoteMessage);
      this.handleNotificationNavigation(remoteMessage.data);
    });
  }

  // True when the user is already looking at the chat this message belongs to.
  isViewingChat(chatId) {
    if (!chatId) return false;
    try {
      const route = navigationRef.current?.getCurrentRoute?.();
      return route?.name === 'ChatScreen' && String(route?.params?.chatId) === String(chatId);
    } catch (_) {
      return false;
    }
  }

  // Display notification using Notifee (app in the foreground — FCM doesn't
  // show anything on its own then)
  async displayNotification(remoteMessage) {
    try {
      const {data, notification} = remoteMessage;

      // The message is already on screen; don't also pop a notification for it.
      if (channelForData(data) === 'chat_messages' && this.isViewingChat(data?.chat_id)) {
        return;
      }

      const channelId = channelForData(data);

      // Prepare notification payload
      const notificationPayload = {
        // Sender's name only for chat pushes (older backends prefix it).
        title: (notification?.title || data?.title || 'Evnzo').replace(/^New message from\s+/i, '') || 'Evnzo',
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

      // Chat messages use Android's conversation style. Tapping opens the chat
      // (no Reply/View buttons — nothing handled them, so they did nothing).
      if (channelId === 'chat_messages') {
        notificationPayload.android.style = {
          type: AndroidStyle.MESSAGING,
          person: {
            name: data?.sender_name || 'User',
          },
          messages: [
            {
              text: notification?.body || data?.message || '',
              timestamp: Date.now(),
            },
          ],
        };
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
    const senderId = merged.sender_id || merged.senderId;

    switch (key) {
      // ---- Chat (two backend payloads: message/open_chat and chat_message) ----
      case 'open_chat':
      case 'message':
      case 'chat_message':
        return chatId
          ? {
              name: 'ChatScreen',
              params: { chatId, chatName, ...(senderId ? { recipientId: senderId } : {}) },
            }
          : { name: 'Main', params: { screen: 'Messages' } };

      // ---- Admin decision on the user's own ad ----
      case 'ad_approved':
        if (vendorAdId) return { name: 'VendorAddDetail', params: { vendorId: vendorAdId } };
        if (eventAdId) return { name: 'EventDetailView', params: { eventId: eventAdId } };
        return { name: 'Main', params: { screen: 'Profile' } };
      case 'ad_rejected':
        // A rejected ad isn't publicly viewable — send the owner to their profile/ads.
        return { name: 'Main', params: { screen: 'Profile' } };

      // ---- Gig date jobs (backend gigDateJobs.js) ----
      case 'gig_date_reminder':
        return eventAdId
          ? { name: 'EventDetailView', params: { eventId: eventAdId } }
          : { name: 'Main', params: { screen: 'Profile' } };
      case 'gig_expired':
        // Closed gigs no longer show publicly — the owner manages them from Profile.
        return { name: 'Main', params: { screen: 'Profile' } };

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

      // ---- New review of you → your own profile, Reviews tab ----
      // (Reviews are per user, and older notifications only carry review_id.)
      case 'view_review':
      case 'review':
        if (this.currentUserId) {
          return {
            name: 'UserProfile',
            params: { userId: this.currentUserId, initialTab: 'reviews' },
          };
        }
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

  // Keep the app-icon badge in step with what's actually unread (chats +
  // other notifications, same number the backend puts on iOS pushes). At zero
  // it also clears the tray: Android launchers count tray notifications, so
  // leftovers kept the number on the icon after everything was read.
  async syncBadge() {
    try {
      if (!(await secureStorage.getItem('authToken'))) return;
      let count;
      try {
        const res = await api.get('/notifications/badge-count');
        count = res.data?.data?.count;
      } catch (e) {
        // Older backend without /badge-count
        const [chat, inbox] = await Promise.all([
          api.get('/chat/unread-count').catch(() => null),
          api.get('/notifications/unread-count').catch(() => null),
        ]);
        count = (chat?.data?.data?.unread_count || 0) + (inbox?.data?.data?.count || 0);
      }
      count = Number(count) || 0;
      await notifee.setBadgeCount(count);
      if (count === 0) {
        await notifee.cancelDisplayedNotifications();
      }
    } catch (error) {
      console.log('⚠️ Could not sync badge:', error?.message);
    }
  }

  // Kept for existing callers.
  async updateBadgeCount() {
    await this.syncBadge();
  }

  // Remove a chat's notifications from the tray once the user opens it.
  async clearChatNotifications(chatId) {
    if (!chatId) return;
    try {
      const displayed = await notifee.getDisplayedNotifications();
      await Promise.all(
        displayed
          .filter(({notification}) => {
            const data = notification?.data || {};
            return String(data.chat_id || data.chatId || '') === String(chatId);
          })
          .map(({id, notification}) =>
            notifee.cancelDisplayedNotification(id, notification?.android?.tag),
          ),
      );
    } catch (error) {
      console.log('⚠️ Could not clear chat notifications:', error?.message);
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
    [
      this.messageListener,
      this.notificationOpenedListener,
      this.foregroundEventUnsubscribe,
      this.tokenRefreshUnsubscribe,
    ].forEach((unsubscribe) => unsubscribe?.());
    this.appStateSub?.remove?.();
    this.messageListener = null;
    this.notificationOpenedListener = null;
    this.foregroundEventUnsubscribe = null;
    this.tokenRefreshUnsubscribe = null;
    this.listenersReady = false;
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
