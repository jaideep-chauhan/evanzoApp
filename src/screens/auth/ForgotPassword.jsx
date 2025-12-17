import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

// Validation schema for email or phone
const forgotPasswordSchema = Yup.object().shape({
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
});

export default function ForgotPasswordScreen() {
    const navigation = useNavigation();
    const theme = useTheme();
    const { forgotPassword } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleSendOTP = async (values) => {
        setIsLoading(true);
        try {
            // Determine if it's email or phone
            const isEmail = values.emailOrPhone.includes('@');
            const identifier = values.emailOrPhone;
            
            const result = await forgotPassword(isEmail ? identifier : identifier);
            
            if (result.success) {
                Alert.alert(
                    'OTP Sent',
                    result.message || 'Please check your email/SMS for the OTP',
                    [{
                        text: 'OK',
                        onPress: () => navigation.navigate('ResetPassword', {
                            username: values.emailOrPhone
                        })
                    }]
                );
            } else {
                Alert.alert(
                    'Error',
                    result.error || 'Failed to send OTP. Please try again.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            Alert.alert(
                'Error',
                'Something went wrong. Please try again later.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: '#fff' }]} edges={['left', 'right', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                    disabled={isLoading}
                >
                    <Icon name="arrow-back" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Forgot Password</Text>
                <View style={styles.backButton} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <Formik
                    initialValues={{ emailOrPhone: '' }}
                    validationSchema={forgotPasswordSchema}
                    onSubmit={handleSendOTP}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                        <ScrollView
                            contentContainerStyle={styles.scroll}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.iconContainer}>
                                <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '20' }]}>
                                    <Icon name="lock-closed-outline" size={50} color={theme.colors.primary} />
                                </View>
                            </View>

                            <Text style={[styles.title, { color: theme.colors.primary }]}>Reset Your Password</Text>
                            <Text style={[styles.subtitle, { color: '#666' }]}>
                                Enter your email address or phone number and we'll send you an OTP to reset your password.
                            </Text>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.colors.primary }]}>Email or Phone Number</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        { color: theme.colors.primary },
                                        touched.emailOrPhone && errors.emailOrPhone && styles.inputError
                                    ]}
                                    placeholder="Enter your email or phone number"
                                    placeholderTextColor="#aaa"
                                    value={values.emailOrPhone}
                                    onChangeText={handleChange('emailOrPhone')}
                                    onBlur={handleBlur('emailOrPhone')}
                                    autoCapitalize="none"
                                    keyboardType="default"
                                    editable={!isLoading}
                                />
                                {touched.emailOrPhone && errors.emailOrPhone && (
                                    <Text style={styles.errorText}>{errors.emailOrPhone}</Text>
                                )}
                            </View>

                            <TouchableOpacity 
                                style={[
                                    styles.sendBtn, 
                                    { 
                                        backgroundColor: theme.colors.primary,
                                        shadowColor: theme.colors.primary,
                                        opacity: isLoading ? 0.7 : 1
                                    }
                                ]} 
                                onPress={handleSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.sendText}>Send OTP</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.backToLogin}
                                onPress={() => navigation.navigate('Login')}
                                disabled={isLoading}
                            >
                                <Text style={[styles.backToLoginText, { color: theme.colors.primary }]}>
                                    Back to Login
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    )}
                </Formik>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    scroll: {
        flexGrow: 1,
        padding: 24,
        paddingBottom: 40,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 40,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 32,
        paddingHorizontal: 20,
        lineHeight: 22,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 8,
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
    sendBtn: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 20,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    sendText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    backToLogin: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    backToLoginText: {
        fontSize: 15,
        fontWeight: '600',
    },
});