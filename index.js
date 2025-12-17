/**
 * @format
 */

import {AppRegistry} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import App from './App';
import {name as appName} from './app.json';

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

// Register background event handler for notifee
notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('Notifee background event:', type, detail);
});

AppRegistry.registerComponent(appName, () => App);
