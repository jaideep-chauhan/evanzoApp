import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import MainNavigator from './src/navigation/MainNavigator';
import Toast from 'react-native-toast-message';
import { ThemeProvider } from './src/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import notificationService from './src/services/notificationService';
import socketService from './src/services/socketService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const App = () => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Initialize notification service
    notificationService.initialize();

    // Handle app state changes for socket connection
    const subscription = AppState.addEventListener('change', async nextAppState => {
      // App came to foreground
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('📱 App came to foreground');

        // Check if user is authenticated and reconnect socket
        const token = await AsyncStorage.getItem('authToken');
        if (token && !socketService.isSocketConnected()) {
          console.log('🔌 Reconnecting socket after app foreground...');
          try {
            await socketService.connect();
            socketService.setOnlineStatus(true);
            console.log('✅ Socket reconnected successfully');
          } catch (error) {
            console.log('⚠️ Socket reconnection failed:', error.message);
          }
        }
      }

      // App went to background
      if (nextAppState.match(/inactive|background/) && appState.current === 'active') {
        console.log('📱 App went to background');
        if (socketService.isSocketConnected()) {
          socketService.setOnlineStatus(false);
        }
      }

      appState.current = nextAppState;
    });

    // Cleanup on unmount
    return () => {
      notificationService.cleanup();
      subscription.remove();
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <MainNavigator />
        <Toast />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
