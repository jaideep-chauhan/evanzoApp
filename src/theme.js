// src/theme.js

const theme = {
    colors: {
        primary: '#2C3D5B',
        secondary: '#1E2B4F',
        background: '#F4F6FA',
        lightBackground: '#7C8594',
        tabBackground: '#F4F4F4',
        white: '#FFFFFF',
        text: '#1E2B4F',
        textSecondary: '#6B7A99',
        accent: '#FFD700',
        border: '#E5EAF2',
        shadow: '#000000',
        overlay: '#2C3D5B',
        overlayOpacity: 0.7,
        heading: '#49454F',
    },
    images: {
        background: require('./assets/images/newBg.jpg'),
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
    },
    borderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        round: 50,
    },
};

export default theme;
