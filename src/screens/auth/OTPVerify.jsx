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
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomToast from '../../components/CustomToast';
import CustomModal from '../../components/CustomModal';

export default function OTPVerify() {
    const navigation = useNavigation();
    const route = useRoute();
    const theme = useTheme();
    const { verifyOTPAndRegister, resendOTP } = useAuth();
    
    const { email, phone, fromScreen } = route.params || {};
    
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [resendDisabled, setResendDisabled] = useState(false);
    const [timer, setTimer] = useState(30);
    const [isLoading, setIsLoading] = useState(false);
    const timerRef = useRef();
    
    // Toast states
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    
    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({});

    // Mask the email for display
    const maskedEmail = email ? 
        email.substring(0, 3) + '****@' + email.split('@')[1] : 
        'your email';

    // Ref for inputs
    const inputsRef = Array(6).fill(null).map(() => React.createRef());
    
    const showToast = (message, type = 'info') => {
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
    };

    useEffect(() => {
        if (resendDisabled) {
            timerRef.current = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setResendDisabled(false);
                        return 30;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [resendDisabled]);

    const handleChange = (text, idx) => {
        // Handle paste of complete OTP
        if (text.length > 1) {
            // User pasted multiple characters
            const pastedOtp = text.replace(/\D/g, '').slice(0, 6); // Get only digits, max 6
            if (pastedOtp.length > 0) {
                const newDigits = pastedOtp.split('').concat(Array(6).fill('')).slice(0, 6);
                setOtpDigits(newDigits);
                
                // Focus last filled input or last input if all filled
                const lastFilledIndex = Math.min(pastedOtp.length - 1, 5);
                if (inputsRef[lastFilledIndex].current) {
                    inputsRef[lastFilledIndex].current.focus();
                    setActiveIndex(lastFilledIndex);
                }
                
                // Auto-submit if 6 digits were pasted
                if (pastedOtp.length === 6) {
                    setTimeout(() => handleVerify(), 100);
                }
            }
        } else if (/^\d?$/.test(text)) {
            // Single digit input
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
            
            // Check if all 6 digits are filled for auto-submit
            if (idx === 5 && text) {
                const fullOtp = [...newDigits];
                fullOtp[5] = text;
                if (fullOtp.every(digit => digit !== '')) {
                    setTimeout(() => handleVerify(), 100);
                }
            }
        }
    };

    const handleVerify = async () => {
        const otp = otpDigits.join('');
        if (otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }
        
        setIsLoading(true);
        setError('');
        
        try {
            const result = await verifyOTPAndRegister(otp);
            
            if (result.success) {
                // Show success toast then navigate
                showToast('Registration successful! Welcome to Evanzo!', 'success');
                
                // Navigate to Main (TabNavigator) after a short delay
                setTimeout(() => {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Main' }],
                    });
                }, 1500);
            } else {
                setError('');
                showToast(result.error || 'Invalid OTP. Please try again.', 'error');
                // Clear OTP fields on error
                setOtpDigits(['', '', '', '', '', '']);
                inputsRef[0].current?.focus();
            }
        } catch (error) {
            setError('');
            showToast('Something went wrong. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendDisabled) return;
        
        setIsLoading(true);
        try {
            const result = await resendOTP();
            
            if (result.success) {
                showToast(result.message || 'A new OTP has been sent to your email.', 'success');
                setResendDisabled(true);
                setTimer(30);
                // Clear OTP fields
                setOtpDigits(['', '', '', '', '', '']);
                inputsRef[0].current?.focus();
            } else {
                showToast(result.error || 'Could not resend OTP. Please try again.', 'error');
            }
        } catch (error) {
            showToast('Something went wrong. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safe]} edges={['left', 'right', 'bottom']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={styles.container}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Register')}>
                        <Icon name="arrow-back" size={28} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <View style={styles.contentWrap}>
                        <Text style={[styles.header, { color: theme.colors.primary }]}>Verify Your Email</Text>
                        <Text style={[styles.subtitle, { color: theme.colors.primary }]}>Please enter the 6 digit code sent to <Text style={styles.mobile}>{maskedEmail}</Text> for verification</Text>
                        <View style={styles.otpRow}>
                            {otpDigits.map((digit, idx) => (
                                <TextInput
                                    key={idx}
                                    ref={inputsRef[idx]}
                                    style={[
                                        styles.otpInput,
                                        activeIndex === idx ? { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '10' } : { borderColor: '#E5EAF2', backgroundColor: '#F4F6FA' },
                                        { color: theme.colors.text }
                                    ]}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    value={digit}
                                    onChangeText={text => handleChange(text, idx)}
                                    onFocus={() => setActiveIndex(idx)}
                                    placeholder=""
                                    placeholderTextColor="#aaa"
                                    returnKeyType={idx === 5 ? 'done' : 'next'}
                                    selectTextOnFocus
                                    autoComplete="one-time-code"
                                    textContentType="oneTimeCode"
                                />
                            ))}
                        </View>
                        {error ? <Text style={styles.error}>{error}</Text> : null}
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
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.verifyText}>Verify</Text>
                            )}
                        </TouchableOpacity>
                        <View style={styles.resendSection}>
                            <View style={styles.resendRow}>
                                <Text style={styles.resendLabel}>Didn’t receive any code?</Text>
                                <TouchableOpacity
                                    style={styles.resendBtn}
                                    onPress={handleResend}
                                    disabled={resendDisabled || isLoading}
                                >
                                    <Text style={[styles.resendText, resendDisabled ? styles.resendTextDisabled : { color: theme.colors.primary }]}>
                                        Resend Again
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            {resendDisabled && (
                                <Text style={[styles.timerText, { color: theme.colors.primary }]}>Request new code in 00:{timer < 10 ? `0${timer}` : timer}s</Text>
                            )}
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
            
            <CustomToast
                visible={toastVisible}
                message={toastMessage}
                type={toastType}
                onHide={() => setToastVisible(false)}
            />
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
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
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
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#B0B8C1',
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 22,
    },
    mobile: {
        fontWeight: 'bold',
        fontSize: 15,
    },
    otpRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
        gap: 10,
    },
    otpInput: {
        width: 44,
        height: 54,
        borderRadius: 10,
        fontSize: 22,
        color: '#222',
        textAlign: 'center',
        marginHorizontal: 4,
        borderWidth: 2,
        backgroundColor: '#F4F6FA',
    },
    error: {
        color: '#ff6b6b',
        marginBottom: 8,
        fontSize: 14,
        textAlign: 'center',
    },
    verifyBtn: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 18,
        width: '100%',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 4,
        elevation: 2,
    },
    verifyText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
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
        gap: 12,
    },
    resendLabel: {
        color: '#B0B8C1',
        fontSize: 15,
        marginBottom: 0,
        textAlign: 'center',
    },
    resendBtn: {
        paddingVertical: 0,
        paddingHorizontal: 0,
        borderRadius: 0,
        alignSelf: 'center',
        marginTop: 0,
    },
    resendText: {
        fontSize: 15,
        fontWeight: '600',
        textDecorationLine: 'underline',
        textAlign: 'center',
    },
    resendTextDisabled: {
        color: '#B0B8C1',
    },
    timerText: {
        marginTop: 8,
        fontSize: 15,
        textAlign: 'center',
    },
});
