// src/components/BackgroundWrapper.jsx
import React from 'react';
import { ImageBackground, View, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeContext';

const BackgroundWrapper = ({ children, style, overlayOpacity }) => {
    const theme = useTheme();

    return (
        <ImageBackground source={theme.images.background} style={[styles.background, style]} resizeMode="cover">
            <View style={[
                styles.overlay,
                {
                    backgroundColor: theme.colors.overlay,
                    opacity: overlayOpacity || theme.colors.overlayOpacity
                }
            ]} />
            {children}
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
    },
});

export default BackgroundWrapper;
