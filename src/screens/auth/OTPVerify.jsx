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
} from 'react-native';
import { useTheme } from '../../ThemeContext';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function OTPVerify() {
    const navigation = useNavigation();
    const theme = useTheme();
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [resendDisabled, setResendDisabled] = useState(false);
    const [timer, setTimer] = useState(30);
    const timerRef = useRef();

    // Simulate mobile number
    const mobileMasked = '********123';

    // Ref for inputs
    const inputsRef = Array(6).fill(null).map(() => React.createRef());

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

    const handleVerify = () => {
        const otp = otpDigits.join('');
        if (otp.length === 6) {
            setError('');
            navigation.navigate('Home'); // Change to your home/main screen
        } else {
            setError('Please enter a valid 6-digit OTP');
        }
    };

    const handleResend = () => {
        setResendDisabled(true);
        setTimer(30);
        // Simulate resend logic
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
                        <Text style={[styles.header, { color: theme.colors.primary }]}>Verify Account</Text>
                        <Text style={[styles.subtitle, { color: theme.colors.primary }]}>Please enter the 6 digit code sent to your mobile number <Text style={styles.mobile}>{mobileMasked}</Text> for verification</Text>
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
                                />
                            ))}
                        </View>
                        {error ? <Text style={styles.error}>{error}</Text> : null}
                        <TouchableOpacity style={[styles.verifyBtn, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]} onPress={handleVerify}>
                            <Text style={styles.verifyText}>Verify</Text>
                        </TouchableOpacity>
                        <View style={styles.resendSection}>
                            <View style={styles.resendRow}>
                                <Text style={styles.resendLabel}>Didn’t receive any code?</Text>
                                <TouchableOpacity
                                    style={styles.resendBtn}
                                    onPress={handleResend}
                                    disabled={resendDisabled}
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
