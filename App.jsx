import React from 'react';
import MainNavigator from './src/navigation/MainNavigator';
import Toast from 'react-native-toast-message';
import { ThemeProvider } from './src/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <MainNavigator />
      <Toast />
    </AuthProvider>
  </ThemeProvider>
);

export default App;
