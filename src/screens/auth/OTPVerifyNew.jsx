import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import AuthService from '../../services/authService';
import { otpSchema, validateForm } from '../../utils/validationSchemas';

export default function OTPVerifyNew() {
    const navigation = useNavigation();
    const route = useRoute();
    const theme = useTheme();
    
    const { email, userData, isSignup, username } = route.params || {};
    
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [activeIndex, setActiveIndex] = useState(0);
    const [resendDisabled, setResendDisabled] = useState(true);
    const [timer, setTimer] = useState(120);
    const [isLoading, setIsLoading] = useState(false);
    const timerRef = useRef();

    // Ref for inputs
    const inputsRef = Array(6).fill(null).map(() => React.createRef());

    useEffect(() => {
        if (!email && !username) {
            navigation.goBack();
        }
    }, [email, username, navigation]);

    useEffect(() => {
        if (resendDisabled) {
            timerRef.current = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setResendDisabled(false);
                        return 120;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [resendDisabled]);

    const formatTimer = () => {
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleChange = (text, idx) => {
        if (/^\d?$/.test(text)) {
            const newDigits = [...otpDigits];
            newDigits[idx] = text;
            setOtpDigits(newDigits);
            if (text && idx < 5) {
                inputsRef[idx + 1].current.focus();
                setActiveIndex(idx + 1);
            }
            if (!text && idx > 0) {
                setActiveIndex(idx - 1);
            }
        }
    };

    const handleKeyPress = (e, idx) => {
        if (e.nativeEvent.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
            inputsRef[idx - 1].current.focus();
            setActiveIndex(idx - 1);
        }
    };

    const handleVerify = async () => {
        const otp = otpDigits.join('');
        
        // Validate OTP using Yup
        const validation = await validateForm(otpSchema, { otp });
        
        if (!validation.isValid) {
            Toast.show({
                type: 'error',
                text1: 'Invalid OTP',
                text2: validation.errors.otp || 'Please enter a valid 6-digit OTP',
            });
            return;
        }

        setIsLoading(true);
        try {
            if (isSignup) {
                // Signup OTP verification
                const result = await AuthService.verifySignupOTP(email, otp, userData);
                
                if (result.success) {
                    Toast.show({
                        type: 'success',
                        text1: 'Registration Successful',
                        text2: 'Welcome to Evanzo!',
                    });
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                } else {
                    Toast.show({
                        type: 'error',
                        text1: 'Verification Failed',
                        text2: result.message || 'Invalid OTP',
                    });
                }
            } else if (username) {
                // OTP Login verification
                const result = await AuthService.verifyOTPLogin(username, otp);
                
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
                        text2: result.message || 'Invalid OTP',
                    });
                }
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

    const handleResend = async () => {
        setResendDisabled(true);
        setTimer(120);
        setIsLoading(true);
        
        try {
            let result;
            if (isSignup) {
                result = await AuthService.resendSignupOTP(email);
            } else if (username) {
                result = await AuthService.requestOTPLogin(username);
            }
            
            if (result?.success) {
                Toast.show({
                    type: 'success',
                    text1: 'OTP Resent',
                    text2: 'Please check your email/SMS',
                });
                setOtpDigits(['', '', '', '', '', '']);
                inputsRef[0].current?.focus();
                setActiveIndex(0);
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: result?.message || 'Failed to resend OTP',
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

    const maskedIdentifier = email || username || '';
    const displayIdentifier = maskedIdentifier.includes('@') 
        ? maskedIdentifier.replace(/(.{2})(.*)(@.*)/, '$1***$3')
        : maskedIdentifier.replace(/(\d{2})(\d*)(\d{2})/, '$1******$3');

    return (
        <SafeAreaView style={[styles.safe]} edges={['left', 'right', 'bottom']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={styles.container}>
                    <TouchableOpacity 
                        style={styles.backBtn} 
                        onPress={() => navigation.goBack()}
                        disabled={isLoading}
                    >
                        <Icon name="arrow-back" size={28} color={theme.colors.primary} />
                    </TouchableOpacity>
                    
                    <View style={styles.contentWrap}>
                        <View style={styles.iconContainer}>
                            <Icon name="mail-outline" size={60} color={theme.colors.primary} />
                        </View>
                        
                        <Text style={[styles.header, { color: theme.colors.primary }]}>
                            {isSignup ? 'Verify Your Account' : 'Enter OTP'}
                        </Text>
                        
                        <Text style={[styles.subtitle, { color: '#666' }]}>
                            Please enter the 6-digit code sent to {'\n'}
                            <Text style={styles.identifier}>{displayIdentifier}</Text>
                        </Text>
                        
                        <View style={styles.otpRow}>
                            {otpDigits.map((digit, idx) => (
                                <TextInput
                                    key={idx}
                                    ref={inputsRef[idx]}
                                    style={[
                                        styles.otpInput,
                                        activeIndex === idx ? { 
                                            borderColor: theme.colors.primary, 
                                            backgroundColor: theme.colors.primary + '10' 
                                        } : { 
                                            borderColor: '#E5EAF2', 
                                            backgroundColor: '#F4F6FA' 
                                        },
                                        { color: theme.colors.primary }
                                    ]}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    value={digit}
                                    onChangeText={text => handleChange(text, idx)}
                                    onKeyPress={e => handleKeyPress(e, idx)}
                                    onFocus={() => setActiveIndex(idx)}
                                    placeholder=""
                                    placeholderTextColor="#aaa"
                                    returnKeyType={idx === 5 ? 'done' : 'next'}
                                    editable={!isLoading}
                                />
                            ))}
                        </View>
                        
                        <TouchableOpacity 
                            style={[
                                styles.verifyBtn, 
                                { 
                                    backgroundColor: theme.colors.primary, 
                                    shadowColor: theme.colors.primary,
                                    opacity: isLoading ? 0.7 : 1
                                }
                            ]} 
                            onPress={handleVerify}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.verifyText}>Verify</Text>
                            )}
                        </TouchableOpacity>
                        
                        <View style={styles.resendSection}>
                            <View style={styles.resendRow}>
                                <Text style={styles.resendLabel}>Didn't receive the code?</Text>
                                <TouchableOpacity
                                    style={styles.resendBtn}
                                    onPress={handleResend}
                                    disabled={resendDisabled || isLoading}
                                >
                                    <Text style={[
                                        styles.resendText, 
                                        (resendDisabled || isLoading) ? styles.resendTextDisabled : { color: theme.colors.primary }
                                    ]}>
                                        Resend OTP
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            {resendDisabled && (
                                <Text style={[styles.timerText, { color: '#666' }]}>
                                    Request new code in {formatTimer()}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        padding: 0,
        backgroundColor: '#fff',
    },
    contentWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 24,
        backgroundColor: '#fff',
    },
    backBtn: {
        position: 'absolute',
        top: 18,
        left: 18,
        zIndex: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        width: 40,
        height: 40,
        backgroundColor: '#F4F6FA',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 2,
        elevation: 2,
    },
    iconContainer: {
        marginBottom: 24,
        padding: 20,
        borderRadius: 20,
        backgroundColor: '#F4F6FA',
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    identifier: {
        fontWeight: '600',
        fontSize: 15,
        color: '#333',
    },
    otpRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        gap: 10,
    },
    otpInput: {
        width: 44,
        height: 54,
        borderRadius: 10,
        fontSize: 22,
        textAlign: 'center',
        marginHorizontal: 4,
        borderWidth: 2,
        backgroundColor: '#F4F6FA',
        fontWeight: '600',
    },
    verifyBtn: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 24,
        width: '100%',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    verifyText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    resendSection: {
        marginTop: 18,
        alignItems: 'center',
        width: '100%',
    },
    resendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        gap: 8,
    },
    resendLabel: {
        color: '#666',
        fontSize: 15,
    },
    resendBtn: {
        paddingVertical: 0,
        paddingHorizontal: 0,
    },
    resendText: {
        fontSize: 15,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    resendTextDisabled: {
        color: '#B0B8C1',
        textDecorationLine: 'none',
    },
    timerText: {
        marginTop: 12,
        fontSize: 14,
        textAlign: 'center',
    },
});