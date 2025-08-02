// src/ThemeContext.js
import React, { createContext, useContext } from 'react';
import theme from './theme';

const ThemeContext = createContext(theme);

export const ThemeProvider = ({ children }) => (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
