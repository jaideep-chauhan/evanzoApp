import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

export const CustomToast = ({ visible, message, type = 'success', onHide, duration = 3000 }) => {
    const slideAnim = useRef(new Animated.Value(-100)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Slide in and fade in
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto hide after duration
            const timer = setTimeout(() => {
                hideToast();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            if (onHide) onHide();
        });
    };

    if (!visible) return null;

    const getIconAndColor = () => {
        switch (type) {
            case 'success':
                return { icon: 'checkmark-circle', color: '#4CAF50' };
            case 'error':
                return { icon: 'close-circle', color: '#F44336' };
            case 'warning':
                return { icon: 'alert-circle', color: '#FF9800' };
            case 'info':
            default:
                return { icon: 'information-circle', color: '#2196F3' };
        }
    };

    const { icon, color } = getIconAndColor();

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY: slideAnim }],
                    opacity: fadeAnim,
                    backgroundColor: color,
                },
            ]}
        >
            <Icon name={icon} size={24} color="#fff" style={styles.icon} />
            <Text style={styles.message} numberOfLines={2}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        zIndex: 9999,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    icon: {
        marginRight: 12,
    },
    message: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        fontWeight: '500',
        lineHeight: 20,
    },
});

export default CustomToast;