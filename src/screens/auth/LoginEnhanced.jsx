import React, { useState, useEffect } from 'react';
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
import logo from '../../assets/images/evanzoLogo.png';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../ThemeContext';
import appple from '../../assets/images/apple.png';
import google from '../../assets/images/google.png';
import facebook from '../../assets/images/fb.png';
import Toast from 'react-native-toast-message';
import AuthService from '../../services/authService';
import { loginSchema } from '../../utils/validationSchemas';
import { useFormValidation } from '../../hooks/useFormValidation';
import Icon from 'react-native-vector-icons/Feather';

export default function LoginEnhancedScreen() {
    const navigation = useNavigation();
    const theme = useTheme();
    const [imageLoaded, setImageLoaded] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Use form validation hook
    const {
        values,
        errors,
        touched,
        setFieldValue,
        handleBlur,
        validateAllFields,
        getFieldError,
    } = useFormValidation(loginSchema, {
        username: '',
        password: '',
    });

    // Add timeout for image loading to prevent infinite loader
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (!imageLoaded) {
                console.log('Force showing login screen after timeout');
                setImageLoaded(true);
            }
        }, 3000); // 3 seconds timeout

        return () => clearTimeout(timeout);
    }, [imageLoaded]);

    const handleLogin = async () => {
        // Validate all fields
        const isValid = await validateAllFields();

        if (!isValid) {
            // Show the first error
            const firstError = Object.values(errors)[0];
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: firstError,
            });
            return;
        }

        setIsLoading(true);
        try {
            const result = await AuthService.login(values.username, values.password);

            if (result.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Login Successful',
                    text2: 'Welcome back!',
                });
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Main' }],
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Login Failed',
                    text2: result.message || 'Invalid credentials',
                });
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Something went wrong. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const renderFieldError = (field) => {
        const error = getFieldError(field);
        if (error) {
            return <Text style={styles.fieldError}>{error}</Text>;
        }
        return null;
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
                                            style={[
                                                styles.input,
                                                {
                                                    color: theme.colors.primary,
                                                    borderColor: getFieldError('username') ? '#ff6b6b' : '#E5EAF2'
                                                }
                                            ]}
                                            placeholder="Enter phone number or email"
                                            placeholderTextColor="#aaa"
                                            value={values.username}
                                            onChangeText={(text) => setFieldValue('username', text)}
                                            onBlur={() => handleBlur('username')}
                                            autoCapitalize="none"
                                            keyboardType="default"
                                            editable={!isLoading}
                                        />
                                        {renderFieldError('username')}
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.label, { color: theme.colors.primary }]}>Password</Text>
                                        <View style={[
                                            styles.passwordContainer,
                                            { borderColor: getFieldError('password') ? '#ff6b6b' : '#E5EAF2' }
                                        ]}>
                                            <TextInput
                                                style={[styles.passwordInput, { color: theme.colors.primary }]}
                                                placeholder="Enter password"
                                                placeholderTextColor="#aaa"
                                                secureTextEntry={!showPassword}
                                                value={values.password}
                                                onChangeText={(text) => setFieldValue('password', text)}
                                                onBlur={() => handleBlur('password')}
                                                editable={!isLoading}
                                            />
                                            <TouchableOpacity
                                                style={styles.eyeButton}
                                                onPress={() => setShowPassword(!showPassword)}
                                                disabled={isLoading}
                                            >
                                                <Icon name={showPassword ? "eye-off" : "eye"} size={20} color="#666" />
                                            </TouchableOpacity>
                                        </View>
                                        {renderFieldError('password')}
                                    </View>

                                    <TouchableOpacity
                                        style={styles.forgotWrapper}
                                        onPress={() => navigation.navigate('ForgotPassword')}
                                        disabled={isLoading}
                                    >
                                        <Text style={[styles.forgotText, { color: theme.colors.primary }]}>Forgot your password?</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.signInBtn,
                                            {
                                                backgroundColor: theme.colors.primary,
                                                shadowColor: theme.colors.primary,
                                                opacity: isLoading ? 0.7 : 1
                                            }
                                        ]}
                                        onPress={handleLogin}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <Text style={styles.signInText}>Sign In</Text>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.createAccountBtn,
                                            {
                                                borderColor: theme.colors.primary,
                                                opacity: isLoading ? 0.7 : 1
                                            }
                                        ]}
                                        onPress={() => navigation.navigate('Register')}
                                        disabled={isLoading}
                                    >
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
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4F6FA',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5EAF2',
    },
    passwordInput: {
        flex: 1,
        height: 48,
        paddingHorizontal: 16,
        fontSize: 15,
    },
    eyeButton: {
        padding: 12,
    },
    fieldError: {
        color: '#ff6b6b',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
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