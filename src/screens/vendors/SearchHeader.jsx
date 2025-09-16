import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    TextInput,
    Image,
    ImageBackground,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../ThemeContext';
import img from '../../assets/images/evanzoLogo.png';
import bg from '../../assets/images/smallHeader.jpg';

export default function SearchHeader() {
    const navigation = useNavigation();
    const theme = useTheme();

    const placeholders = [
        'Search for location',
        // 'Search for date',
        'Search for category',
    ];
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [nextIndex, setNextIndex] = useState(1);
    const anim = useRef(new Animated.Value(0)).current;
    const intervalRef = useRef();

    useEffect(() => {
        let running = true;
        const loop = () => {
            Animated.timing(anim, {
                toValue: 1,
                duration: 400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start(() => {
                if (!running) return;
                // Use requestAnimationFrame to defer state updates
                requestAnimationFrame(() => {
                    if (!running) return;
                    setPlaceholderIndex(nextIndex);
                    setNextIndex((nextIndex + 1) % placeholders.length);
                    anim.setValue(0);
                    intervalRef.current = setTimeout(loop, 1800);
                });
            });
        };
        intervalRef.current = setTimeout(loop, 1800);
        return () => {
            running = false;
            if (intervalRef.current) clearTimeout(intervalRef.current);
        };
    }, [nextIndex, placeholders.length]);

    return (
        <ImageBackground source={bg} style={styles.container} imageStyle={styles.bgImage}>
            <View style={styles.content}>
                {/* Top Row */}
                <View style={styles.topRow}>
                    <TouchableOpacity
                        style={[styles.iconCircle, { backgroundColor: theme.colors.lightBackground + '50' }]}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <Icon name="settings-outline" size={30} color="#fff" />
                    </TouchableOpacity>

                    <Image source={img} style={styles.logo} resizeMode="contain" />

                    <TouchableOpacity
                        style={[styles.iconCircle, { backgroundColor: theme.colors.lightBackground + '50' }]}
                        onPress={() => navigation.navigate('ChatList')}
                    >
                        <Icon name="chatbubble-ellipses-outline" size={30} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={{ width: '100%', paddingHorizontal: 10 }}>
                    <View style={styles.searchBarWrapper}>
                        <View style={[styles.searchBar, { backgroundColor: theme.colors.lightBackground + '50' }]}>
                            <Icon name="search-outline" size={20} color="#fff" style={styles.searchIcon} />
                            <View style={{ flex: 1, height: 40, justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                                <Animated.Text
                                    style={[
                                        styles.animatedPlaceholder,
                                        {
                                            position: 'absolute',
                                            left: 0,
                                            right: 0,
                                            opacity: anim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [1, 0],
                                            }),
                                            transform: [{
                                                translateY: anim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0, -24],
                                                }),
                                            }],
                                        }
                                    ]}
                                    numberOfLines={1}
                                >
                                    {placeholders[placeholderIndex]}
                                </Animated.Text>
                                <Animated.Text
                                    style={[
                                        styles.animatedPlaceholder,
                                        {
                                            position: 'absolute',
                                            left: 0,
                                            right: 0,
                                            opacity: anim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, 1],
                                            }),
                                            transform: [{
                                                translateY: anim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [24, 0],
                                                }),
                                            }],
                                        }
                                    ]}
                                    numberOfLines={1}
                                >
                                    {placeholders[nextIndex]}
                                </Animated.Text>
                                <TextInput
                                    style={[styles.input, { position: 'absolute', left: 0, right: 0, zIndex: 1 }]}
                                    underlineColorAndroid="transparent"
                                    autoCorrect={false}
                                    autoCapitalize="none"
                                    selectionColor={theme.colors.primary}
                                    editable={false}
                                />
                            </View>
                            <TouchableOpacity style={styles.filterIconWrapper}>
                                {/* <Icon name="options-outline" size={20} color="#fff" style={styles.filterIcon} /> */}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
        height: 240,
        paddingTop: 60,
        paddingBottom: 12,
        justifyContent: 'space-between',
        overflow: 'hidden',
        width: '100%',
        alignSelf: 'stretch',
    },
    bgImage: {
        resizeMode: 'cover',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    iconCircle: {
        padding: 7,
        borderRadius: 22,
    },
    logo: {
        width: 130,
        height: 30,
    },
    searchBarWrapper: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 28,
        paddingHorizontal: 10,
        height: 55,
        width: '100%',
    },
    searchIcon: {
        marginLeft: 7,
    },
    input: {
        flex: 1,
        color: 'transparent',
        fontSize: 14,
        backgroundColor: 'transparent',
    },
    animatedPlaceholder: {
        fontSize: 14,
        paddingLeft: 10,
        color: '#eee',
    },
    filterIconWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
    },
    filterIcon: {
        marginRight: 7,
        transform: [{ rotate: '90deg' }],
    },
});
