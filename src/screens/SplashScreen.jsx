import React from 'react';
import { View, StyleSheet } from 'react-native';
import Video from 'react-native-video';
import logo from '../assets/images/splashBG.mp4';

const SplashScreen = () => {
    return (
        <View style={styles.bg}>
            <Video
                source={logo}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                repeat
                muted
                controls={false}
                paused={false}
                ignoreSilentSwitch="obey"
                playInBackground={false}
                playWhenInactive={false}
                disableFocus={true}
                disableTouch={true}
                disableFullscreen={true}
                disableSeek={true}
                disableVolume={true}
                disableBack={true}
                disablePlayPause={true}
            />
        </View>
    );
};

export default SplashScreen;

const styles = StyleSheet.create({
    bg: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
});
