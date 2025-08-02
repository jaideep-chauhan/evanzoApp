import React from 'react';
import MainNavigator from './src/navigation/MainNavigator';
import Toast from 'react-native-toast-message';
import { ThemeProvider } from './src/ThemeContext';

const App = () => (
  <ThemeProvider>
    <MainNavigator />
    <Toast />
  </ThemeProvider>
);

export default App;
