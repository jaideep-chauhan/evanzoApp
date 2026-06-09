import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainNavigator from './src/navigation/MainNavigator';
import Toast from 'react-native-toast-message';
import { ThemeProvider } from './src/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import notificationService from './src/services/notificationService';
import socketService from './src/services/socketService';
import { initAds } from './src/services/adsService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// React Query client. Single instance, shared by every screen that pulls
// in a hook from src/hooks/. Defaults tuned for a mobile app:
//   - 30s staleTime so quick re-mounts don't refetch
//   - retry: 1 (one quick retry, then fall through to error)
//   - refetchOnWindowFocus: false (RN handles AppState explicitly)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Initialize AdMob (banners + interstitial preload) and notifications.
    initAds();
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
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <MainNavigator />
            <Toast />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
};

export default App;
