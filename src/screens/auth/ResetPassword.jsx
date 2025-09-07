import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useTheme } from '../../ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import AuthService from '../../services/authService';
import { resetPasswordSchema, validateForm } from '../../utils/validationSchemas';
import Icon from 'react-native-vector-icons/Feather';

export default function ResetPasswordScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const theme = useTheme();
    
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [timer, setTimer] = useState(120); // 2 minutes timer
    const [canResend, setCanResend] = useState(false);
    
    const username = route.params?.username;

    useEffect(() => {
        if (!username) {
            navigation.navigate('ForgotPassword');
        }
    }, [username, navigation]);

    useEffect(() => {
        let interval = null;
        if (timer > 0 && !canResend) {
            interval = setInterval(() => {
                setTimer((prevTimer) => {
                    if (prevTimer <= 1) {
                        setCanResend(true);
                        return 0;
                    }
                    return prevTimer - 1;
                });
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [timer, canResend]);

    const formatTimer = () => {
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleResendOTP = async () => {
        if (!canResend) return;
        
        setIsLoading(true);
        try {
            const result = await AuthService.requestPasswordReset(username);
            
            if (result.success) {
                Toast.show({
                    type: 'success',
                    text1: 'OTP Resent',
                    text2: 'Please check your email/SMS for the new OTP',
                });
                setTimer(120);
                setCanResend(false);
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: result.message || 'Failed to resend OTP',
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

    const handleResetPassword = async () => {
        // Validate form using Yup
        const formData = {
            otp,
            newPassword,
            confirmPassword
        };
        
        const validation = await validateForm(resetPasswordSchema, formData);
        
        if (!validation.isValid) {
            // Get the first error to display
            const firstErrorField = Object.keys(validation.errors)[0];
            const firstError = validation.errors[firstErrorField];
            
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: firstError,
            });
            return;
        }

        setIsLoading(true);
        try {
            const result = await AuthService.verifyPasswordResetOTP(username, otp, newPassword);
            
            if (result.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Password Reset Successful',
                    text2: 'Please login with your new password',
                });
                navigation.navigate('Login');
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: result.message || 'Failed to reset password',
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

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: '#fff' }]} edges={['left', 'right', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                    disabled={isLoading}
                >
                    <Icon name="arrow-left" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Reset Password</Text>
                <View style={styles.backButton} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={[styles.title, { color: theme.colors.primary }]}>Create New Password</Text>
                    <Text style={[styles.subtitle, { color: '#666' }]}>
                        Enter the OTP sent to {username} and create your new password
                    </Text>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.primary }]}>OTP Code</Text>
                        <TextInput
                            style={[styles.input, { color: theme.colors.primary }]}
                            placeholder="Enter 6-digit OTP"
                            placeholderTextColor="#aaa"
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType="numeric"
                            maxLength={6}
                            editable={!isLoading}
                        />
                    </View>

                    <View style={styles.timerContainer}>
                        {canResend ? (
                            <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
                                <Text style={[styles.resendText, { color: theme.colors.primary }]}>
                                    Resend OTP
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.timerText}>
                                Resend OTP in {formatTimer()}
                            </Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.primary }]}>New Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={[styles.passwordInput, { color: theme.colors.primary }]}
                                placeholder="Enter new password"
                                placeholderTextColor="#aaa"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showPassword}
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Icon name={showPassword ? "eye-off" : "eye"} size={20} color="#666" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.primary }]}>Confirm Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={[styles.passwordInput, { color: theme.colors.primary }]}
                                placeholder="Re-enter new password"
                                placeholderTextColor="#aaa"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                <Icon name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#666" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.passwordRequirements}>
                        <Text style={styles.requirementsTitle}>Password must contain:</Text>
                        <Text style={styles.requirement}>• At least 8 characters</Text>
                        <Text style={styles.requirement}>• One uppercase letter</Text>
                        <Text style={styles.requirement}>• One lowercase letter</Text>
                        <Text style={styles.requirement}>• One number</Text>
                        <Text style={styles.requirement}>• One special character</Text>
                    </View>

                    <TouchableOpacity 
                        style={[
                            styles.resetBtn, 
                            { 
                                backgroundColor: theme.colors.primary,
                                shadowColor: theme.colors.primary,
                                opacity: isLoading ? 0.7 : 1
                            }
                        ]} 
                        onPress={handleResetPassword}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.resetText}>Reset Password</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
        marginTop: 20,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 32,
        paddingHorizontal: 20,
        lineHeight: 22,
    },
    inputGroup: {
        marginBottom: 20,
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
    timerContainer: {
        alignItems: 'center',
        marginBottom: 20,
        marginTop: -10,
    },
    timerText: {
        fontSize: 14,
        color: '#666',
    },
    resendText: {
        fontSize: 15,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    passwordRequirements: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 10,
        marginBottom: 24,
    },
    requirementsTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    requirement: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
        lineHeight: 20,
    },
    resetBtn: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    resetText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});