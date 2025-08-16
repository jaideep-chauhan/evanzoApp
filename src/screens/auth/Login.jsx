import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    ImageBackground,
} from 'react-native';
import logo from '../../assets/images/evanzoLogo.png';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../ThemeContext';
import appple from '../../assets/images/apple.png';
import google from '../../assets/images/google.png';
import facebook from '../../assets/images/fb.png';

const { height } = Dimensions.get('window');
export default function LoginScreen() {
    const navigation = useNavigation();
    const theme = useTheme();

    return (
        <ImageBackground source={theme.images.background} style={styles.bg} resizeMode="cover">
            <View style={styles.container}>
                <SafeAreaView style={styles.safe} edges={['top']}>
                    <View style={styles.topSection}>
                        <Image source={logo} style={styles.logo} resizeMode="contain" />
                    </View>
                </SafeAreaView>
                <KeyboardAvoidingView
                    style={styles.keyboardView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    <View style={styles.bottomSectionWrapper}>
                        <View style={styles.bottomSectionShadow} />
                        <View style={styles.bottomSection}>
                            <ScrollView
                                contentContainerStyle={styles.scrollContainer}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                <Text style={[styles.loginTitle, { color: theme.colors.primary }]}>Login</Text>
                                <Text style={[styles.subtitle, { color: theme.colors.primary }]}>Welcome back, you've been missed!</Text>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.colors.primary }]}>Phone Number or Email</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter phone number or email"
                                        placeholderTextColor="#aaa"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.colors.primary }]}>Password</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter password"
                                        placeholderTextColor="#aaa"
                                        secureTextEntry
                                    />
                                </View>
                                <TouchableOpacity style={styles.forgotWrapper}>
                                    <Text style={[styles.forgotText, { color: theme.colors.primary }]} onPress={() => navigation.navigate('OTPVerify')}>Forgot your password?</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.signInBtn, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]} onPress={() => navigation.navigate('Main')}>
                                    <Text style={styles.signInText}>Sign In</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.createAccountBtn, { borderColor: theme.colors.primary }]} onPress={() => navigation.navigate('Register')}>
                                    <Text style={[styles.createAccountText, { color: theme.colors.primary }]}>Create New Account</Text>
                                </TouchableOpacity>
                                <View style={styles.dividerRow}>
                                    <View style={styles.divider} />
                                    <Text style={[styles.orText, { color: theme.colors.primary }]}>Or continue with</Text>
                                    <View style={styles.divider} />
                                </View>
                                <View style={styles.socialRow}>
                                    <TouchableOpacity style={styles.socialIconButton}>
                                        <Image source={google} style={styles.socialIconImage} resizeMode="contain" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.socialIconButton}>
                                        <Image source={facebook} style={styles.socialIconImage} resizeMode="contain" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.socialIconButton}>
                                        <Image source={appple} style={styles.socialIconImage} resizeMode="contain" />
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    safe: {
        backgroundColor: 'transparent',
        zIndex: 2,
    },
    keyboardView: {
        flex: 1,
    },
    topSection: {
        alignItems: 'center',
        marginTop: 32,
        height: 90,
    },
    logo: {
        height: 60,
        width: 200,
    },
    bottomSectionWrapper: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    bottomSectionShadow: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 40,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        backgroundColor: 'rgba(0,0,0,0.08)',
        zIndex: 0,
    },
    bottomSection: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingVertical: 24,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 8,
        minHeight: '60%',
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        zIndex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        paddingBottom: 16,
    },
    inputGroup: {
        marginBottom: 8,
    },
    loginTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 18,
    },
    label: {
        fontSize: 15,
        marginBottom: 6,
        marginTop: 16,
        fontWeight: '500',
    },
    input: {
        height: 48,
        backgroundColor: '#F4F6FA',
        borderRadius: 10,
        paddingHorizontal: 16,
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#E5EAF2',
    },
    forgotWrapper: {
        alignItems: 'flex-end',
        marginTop: 8,
        marginBottom: 24,
    },
    forgotText: {
        fontSize: 13,
        fontWeight: '500',
    },
    signInBtn: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 18,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    signInText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    createAccountBtn: {
        borderWidth: 1.5,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 24,
    },
    createAccountText: {
        fontWeight: '700',
        fontSize: 16,
        letterSpacing: 0.3,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
    },
    divider: {
        flex: 1,
        height: 1.5,
        backgroundColor: '#E5EAF2',
        marginHorizontal: 8,
        borderRadius: 1,
    },
    orText: {
        textAlign: 'center',
        fontSize: 16,
        marginBottom: 0,
        fontWeight: '500',
    },
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 12,
        gap: 16,
    },
    socialIcon: {
        borderRadius: 14,
        width: 54,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 3,
        elevation: 1,
    },
    iconText: {
        color: '#fff',
        fontSize: 30,
        fontWeight: '700',
    },
    socialIconButton: {
        borderRadius: 14,
        width: 54,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    socialIconImage: {
        width: 28,
        height: 28,
    },
});