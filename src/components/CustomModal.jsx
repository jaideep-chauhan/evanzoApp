import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../ThemeContext';

const { width, height } = Dimensions.get('window');

export const CustomModal = ({ 
    visible, 
    title, 
    message, 
    type = 'success',
    primaryButtonText = 'OK',
    onPrimaryPress,
    secondaryButtonText,
    onSecondaryPress,
    onClose,
}) => {
    const theme = useTheme();
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 20,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

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
                return { icon: 'information-circle', color: theme.colors.primary };
        }
    };

    const { icon, color } = getIconAndColor();

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
        >
            <Animated.View 
                style={[
                    styles.overlay,
                    { opacity: fadeAnim }
                ]}
            >
                <TouchableOpacity 
                    style={StyleSheet.absoluteFillObject}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <Animated.View
                    style={[
                        styles.modalContainer,
                        {
                            transform: [{ scale: scaleAnim }],
                            opacity: fadeAnim,
                        },
                    ]}
                >
                    <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
                        <Icon name={icon} size={48} color={color} />
                    </View>
                    
                    <Text style={[styles.title, { color: theme.colors.primary }]}>{title}</Text>
                    <Text style={[styles.message, { color: '#666' }]}>{message}</Text>
                    
                    <View style={styles.buttonContainer}>
                        {secondaryButtonText && (
                            <TouchableOpacity
                                style={[styles.button, styles.secondaryButton]}
                                onPress={onSecondaryPress}
                            >
                                <Text style={[styles.buttonText, { color: '#666' }]}>
                                    {secondaryButtonText}
                                </Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[
                                styles.button, 
                                styles.primaryButton,
                                { backgroundColor: theme.colors.primary },
                                !secondaryButtonText && styles.fullWidthButton
                            ]}
                            onPress={onPrimaryPress}
                        >
                            <Text style={[styles.buttonText, styles.primaryButtonText]}>
                                {primaryButtonText}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: width * 0.85,
        maxWidth: 340,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    fullWidthButton: {
        flex: 1,
        width: '100%',
    },
    primaryButton: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    secondaryButton: {
        backgroundColor: '#F5F5F5',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    primaryButtonText: {
        color: '#fff',
    },
});

export default CustomModal;