import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

const LoginPrompt = ({ message = "Sign in to access this feature", showBackButton = false }) => {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.container}>
                {showBackButton && (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Icon name="arrow-back" size={24} color="#2C3D5B" />
                    </TouchableOpacity>
                )}

                <View style={styles.content}>
                    {/* Logo Section */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../assets/images/evanzoLogo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Simple Icon */}
                    <View style={styles.iconContainer}>
                        <View style={styles.iconCircle}>
                            <Icon name="lock-closed-outline" size={40} color="#2C3D5B" />
                        </View>
                    </View>

                    {/* Main Content */}
                    <View style={styles.messageContainer}>
                        <Text style={styles.title}>Sign in Required</Text>
                        <Text style={styles.message}>{message}</Text>
                    </View>

                    {/* CTA Buttons */}
                    <View style={styles.buttonGroup}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => navigation.navigate('Login')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.primaryButtonText}>Sign In</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => navigation.navigate('Register')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.secondaryButtonText}>Create Account</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Continue Browsing - Navigate to public content (Vendors tab) */}
                    <TouchableOpacity
                        style={styles.browseLinkContainer}
                        onPress={() => {
                            // Navigate to Vendors tab (public content) instead of goBack()
                            // goBack() doesn't work when LoginPrompt is shown in a tab context
                            navigation.navigate('Main', { screen: 'Vendors' });
                        }}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.browseLink}>Continue browsing</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        position: 'absolute',
        top: 16,
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    content: {
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logo: {
        width: 140,
        height: 40,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F5F7FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageContainer: {
        alignItems: 'center',
        marginBottom: 40,
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        color: '#2C3D5B',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
    },
    buttonGroup: {
        width: '100%',
        marginBottom: 24,
    },
    primaryButton: {
        width: '100%',
        paddingVertical: 16,
        backgroundColor: '#2C3D5B',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: '#2C3D5B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        width: '100%',
        paddingVertical: 16,
        backgroundColor: 'transparent',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        color: '#2C3D5B',
        fontSize: 16,
        fontWeight: '600',
    },
    browseLinkContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    browseLink: {
        fontSize: 15,
        color: '#9CA3AF',
        fontWeight: '500',
    },
});

export default LoginPrompt;
