/**
 * @format
 */

import {AppRegistry} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, {EventType} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from './App';
import {name as appName} from './app.json';
import {initCrashReporting} from './src/services/crashReporting';

// Crash + JS-error reporting (Firebase Crashlytics). Init as early as possible
// so startup crashes are captured too. Native crashes are automatic; the JS
// global-error handler installed here turns uncaught JS errors into non-fatals
// with a stack trace + breadcrumbs.
initCrashReporting();

// Register background handler for Firebase messaging
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background message received:', remoteMessage);

  // Display notification using notifee
  if (remoteMessage.notification) {
    await notifee.displayNotification({
      title: remoteMessage.notification.title,
      body: remoteMessage.notification.body,
      android: {
        channelId: 'general',
        pressAction: {
          id: 'default',
        },
      },
      ios: {
        sound: 'default',
      },
      data: remoteMessage.data,
    });
  }
});

// Background/quit-state notification TAP. We can't navigate from here (the
// navigator isn't mounted yet, especially from a killed state), so stash the
// payload; the app consumes it once the navigator is ready — see
// notificationService.checkInitialNotification() (cold start) and its AppState
// 'active' handler (return-to-foreground).
notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('Notifee background event:', type, detail?.notification?.data);
  if (type === EventType.PRESS && detail?.notification?.data) {
    try {
      await AsyncStorage.setItem(
        'pendingNotificationNav',
        JSON.stringify(detail.notification.data),
      );
    } catch (e) {
      console.log('Failed to stash pending notification nav:', e?.message);
    }
  }
});

AppRegistry.registerComponent(appName, () => App);
