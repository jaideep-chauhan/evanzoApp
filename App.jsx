import React, { useEffect } from 'react';
import MainNavigator from './src/navigation/MainNavigator';
import Toast from 'react-native-toast-message';
import { ThemeProvider } from './src/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import notificationService from './src/services/notificationService';

const App = () => {
  useEffect(() => {
    // Initialize notification service
    notificationService.initialize();

    // Cleanup on unmount
    return () => {
      notificationService.cleanup();
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
