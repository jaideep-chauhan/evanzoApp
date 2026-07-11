import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Video from 'react-native-video';
import logo from '../assets/images/ELogo_2.mp4';

// The splash plays the EVNZO logo animation (navy circle logo on a WHITE
// background). Two things kept it from looking clean on Android:
//   1. react-native-video briefly stretches its surface sideways during init,
//      before it knows the clip's aspect ratio.
//   2. a plain flash showed before the first frame rendered.
// Fix: match the video's white background on the container, and keep the video
// hidden (opacity 0) until onLoad fires — so the stretched pre-load frame is
// never visible. The user only ever sees white (the clip's own background) and
// then the correctly-sized logo animation.
const SplashScreen = () => {
    const [ready, setReady] = useState(false);

    return (
        <View style={styles.bg}>
            <Video
                source={logo}
                style={[StyleSheet.absoluteFill, { opacity: ready ? 1 : 0 }]}
                resizeMode="contain"
                onLoad={() => setReady(true)}
                repeat={false}
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
        // Match the video's own white background so there's no coloured flash
        // and the contain-mode letterbox bars are invisible.
        backgroundColor: '#ffffff',
    },
});
