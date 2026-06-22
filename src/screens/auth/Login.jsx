import React, { useState } from 'react';
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
    ImageBackground,
    ActivityIndicator,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import logo from '../../assets/images/evanzoLogo.png';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../ThemeContext';
import { useAuth } from '../../context/AuthContext';
import appple from '../../assets/images/apple.png';
import google from '../../assets/images/google.png';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

// Validation schema
const loginSchema = Yup.object().shape({
    emailOrPhone: Yup.string()
        .required('Email or phone number is required')
        .test('email-or-phone', 'Enter a valid email or phone number', function(value) {
            if (!value) return false;
            // Check if it's an email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            // Check if it's a phone number (10+ digits)
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            const cleanPhone = value.replace(/[\s\-\(\)\+]/g, '');
            
            return emailRegex.test(value) || (phoneRegex.test(value) && cleanPhone.length >= 10);
        }),
    password: Yup.string()
        .required('Password is required')
        .min(6, 'Password must be at least 6 characters'),
});

export default function LoginScreen() {
    const navigation = useNavigation();
    const theme = useTheme();
    const { login, googleLogin, appleLogin } = useAuth();
    const [imageLoaded, setImageLoaded] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [appleLoading, setAppleLoading] = useState(false);

    // Add timeout for image loading to prevent infinite loader
    React.useEffect(() => {
        const timeout = setTimeout(() => {
            if (!imageLoaded) {
                console.log('Force showing login screen after timeout');
                setImageLoaded(true);
            }
        }, 3000); // 3 seconds timeout

        return () => clearTimeout(timeout);
    }, [imageLoaded]);

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        try {
            const result = await googleLogin();

            if (result.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Google Login Successful',
                    text2: 'Welcome to Evanzo!',
                });

                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Main' }],
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Google Login Failed',
                    text2: result.error || 'Unable to login with Google',
                });
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Something went wrong with Google login',
            });
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        setAppleLoading(true);
        try {
            const result = await appleLogin();

            if (result.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Apple Login Successful',
                    text2: 'Welcome to Evanzo!',
                });

                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Main' }],
                });
            } else {
                // Show specific error message
                Toast.show({
                    type: 'info',
                    text1: 'Apple Sign-In Setup Required',
                    text2: result.error || 'Unable to login with Apple',
                    visibilityTime: 5000,
                });
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Something went wrong with Apple login',
            });
        } finally {
            setAppleLoading(false);
        }
    };

    return (
        <View style={styles.wrapper}>
            {!imageLoaded && (
                <View style={[styles.loadingContainer, { backgroundColor: theme.colors.primary }]}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            )}
            <ImageBackground 
                source={theme.images.background} 
                style={styles.bg} 
                resizeMode="cover"
                fadeDuration={0}
                onLoadEnd={() => setImageLoaded(true)}
                onLoad={() => setImageLoaded(true)}
            >
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
                            <Formik
                                initialValues={{ emailOrPhone: '', password: '' }}
                                validationSchema={loginSchema}
                                onSubmit={async (values, { setSubmitting }) => {
                                    console.log('🔵 Form values:', values);

                                    setIsLoading(true);
                                    setSubmitting(true);

                                    try {
                                        // Pass emailOrPhone directly to login function
                                        console.log('🔵 Calling login with:', values.emailOrPhone, 'and password');

                                        const result = await login(values.emailOrPhone, values.password);

                                        if (result.success) {
                                            Toast.show({
                                                type: 'success',
                                                text1: 'Login Successful',
                                                text2: 'Welcome back!',
                                            });
                                            // Navigate to main screen on successful login
                                            navigation.reset({
                                                index: 0,
                                                routes: [{ name: 'Main' }],
                                            });
                                        } else {
                                            // Show error message via toast
                                            const errorMsg = result.error || 'Invalid credentials. Please try again.';
                                            console.log('❌ Login failed:', errorMsg);

                                            // Show toast immediately
                                            Toast.show({
                                                type: 'error',
                                                text1: 'Login Failed',
                                                text2: errorMsg,
                                            });

                                            // Reset loading state after a brief moment
                                            requestAnimationFrame(() => {
                                                setIsLoading(false);
                                                setSubmitting(false);
                                            });
                                        }
                                    } catch (error) {
                                        console.error('❌ Login error:', error);

                                        // Show toast immediately
                                        Toast.show({
                                            type: 'error',
                                            text1: 'Error',
                                            text2: 'Something went wrong. Please try again later.',
                                        });

                                        // Reset loading state after a brief moment
                                        requestAnimationFrame(() => {
                                            setIsLoading(false);
                                            setSubmitting(false);
                                        });
                                    }
                                }}
                            >
                                {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
                                    <ScrollView
                                        contentContainerStyle={styles.scrollContainer}
                                        keyboardShouldPersistTaps="handled"
                                        showsVerticalScrollIndicator={false}
                                    >
                                        <Text style={[styles.loginTitle, { color: theme.colors.primary }]}>Login</Text>
                                        <Text style={[styles.subtitle, { color: theme.colors.primary }]}>Welcome back, you've been missed!</Text>

                                        <View style={styles.inputGroup}>
                                            <Text style={[styles.label, { color: theme.colors.primary }]}>Phone Number or Email</Text>
                                            <View style={styles.inputWrapper}>
                                                <TextInput
                                                    style={[
                                                        styles.input,
                                                        touched.emailOrPhone && errors.emailOrPhone && styles.inputError
                                                    ]}
                                                    placeholder="Enter phone number or email"
                                                    placeholderTextColor="#aaa"
                                                    onChangeText={handleChange('emailOrPhone')}
                                                    onBlur={handleBlur('emailOrPhone')}
                                                    value={values.emailOrPhone}
                                                    autoCapitalize="none"
                                                    keyboardType="email-address"
                                                />
                                            </View>
                                            {touched.emailOrPhone && errors.emailOrPhone && (
                                                <Text style={styles.errorText}>{errors.emailOrPhone}</Text>
                                            )}
                                        </View>
                                        
                                        <View style={styles.inputGroup}>
                                            <Text style={[styles.label, { color: theme.colors.primary }]}>Password</Text>
                                            <View style={styles.inputWrapper}>
                                                <TextInput
                                                    style={[
                                                        styles.input,
                                                        styles.passwordInput,
                                                        touched.password && errors.password && styles.inputError
                                                    ]}
                                                    placeholder="Enter password"
                                                    placeholderTextColor="#aaa"
                                                    onChangeText={handleChange('password')}
                                                    onBlur={handleBlur('password')}
                                                    value={values.password}
                                                    secureTextEntry={!showPassword}
                                                    autoCapitalize="none"
                                                />
                                                <TouchableOpacity
                                                    style={styles.eyeIcon}
                                                    onPress={() => setShowPassword(!showPassword)}
                                                >
                                                    <Icon 
                                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                                                        size={20} 
                                                        color="#666" 
                                                    />
                                                </TouchableOpacity>
                                            </View>
                                            {touched.password && errors.password && (
                                                <Text style={styles.errorText}>{errors.password}</Text>
                                            )}
                                        </View>
                                        
                                        <TouchableOpacity 
                                            style={styles.forgotWrapper}
                                            onPress={() => navigation.navigate('ForgotPassword')}
                                        >
                                            <Text style={[styles.forgotText, { color: theme.colors.primary }]}>Forgot your password?</Text>
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity 
                                            style={[
                                                styles.signInBtn, 
                                                { 
                                                    backgroundColor: theme.colors.primary, 
                                                    shadowColor: theme.colors.primary,
                                                    opacity: isLoading || isSubmitting ? 0.7 : 1 
                                                }
                                            ]} 
                                            onPress={handleSubmit}
                                            disabled={isLoading || isSubmitting}
                                        >
                                            {isLoading || isSubmitting ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Text style={styles.signInText}>Sign In</Text>
                                            )}
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.createAccountBtn, { borderColor: theme.colors.primary }]} 
                                            onPress={() => navigation.navigate('Register')}
                                        >
                                            <Text style={[styles.createAccountText, { color: theme.colors.primary }]}>Create New Account</Text>
                                        </TouchableOpacity>
                                        
                                        <View style={styles.dividerRow}>
                                            <View style={styles.divider} />
                                            <Text style={[styles.orText, { color: theme.colors.primary }]}>Or continue with</Text>
                                            <View style={styles.divider} />
                                        </View>
                                        
                                        <View style={styles.socialRow}>
                                            <TouchableOpacity
                                                style={styles.socialIconButton}
                                                onPress={handleGoogleLogin}
                                                disabled={googleLoading || appleLoading || isLoading}
                                            >
                                                {googleLoading ? (
                                                    <ActivityIndicator size="small" color={theme.colors.primary} />
                                                ) : (
                                                    <Image source={google} style={styles.socialIconImage} resizeMode="contain" />
                                                )}
                                            </TouchableOpacity>
                                            {/* Apple Sign-In is iOS-only — the native
                                                Apple Authentication API doesn't exist on
                                                Android, so the button is hidden there. */}
                                            {Platform.OS === 'ios' && (
                                                <TouchableOpacity
                                                    style={styles.socialIconButton}
                                                    onPress={handleAppleLogin}
                                                    disabled={googleLoading || appleLoading || isLoading}
                                                >
                                                    {appleLoading ? (
                                                        <ActivityIndicator size="small" color={theme.colors.primary} />
                                                    ) : (
                                                        <Image source={appple} style={styles.socialIconImage} resizeMode="contain" />
                                                    )}
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </ScrollView>
                                )}
                            </Formik>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: '#2C3D5B',
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
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
    inputWrapper: {
        position: 'relative',
    },
    passwordInput: {
        paddingRight: 50,
    },
    eyeIcon: {
        position: 'absolute',
        right: 15,
        top: '50%',
        transform: [{ translateY: -10 }],
    },
    inputError: {
        borderColor: '#ff4444',
        borderWidth: 1,
    },
    errorText: {
        color: '#ff4444',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
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