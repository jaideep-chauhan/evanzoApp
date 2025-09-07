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
} from 'react-native';
import { useTheme } from '../../ThemeContext';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import AuthService from '../../services/authService';
import { forgotPasswordSchema, validateForm } from '../../utils/validationSchemas';
import Icon from 'react-native-vector-icons/Feather';

export default function ForgotPasswordScreen() {
    const navigation = useNavigation();
    const theme = useTheme();
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendOTP = async () => {
        // Validate form using Yup
        const validation = await validateForm(forgotPasswordSchema, { username });
        
        if (!validation.isValid) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Input',
                text2: validation.errors.username || 'Please enter a valid email or phone number',
            });
            return;
        }

        setIsLoading(true);
        try {
            const result = await AuthService.requestPasswordReset(username);
            
            if (result.success) {
                Toast.show({
                    type: 'success',
                    text1: 'OTP Sent',
                    text2: result.message || 'Please check your email/SMS for the OTP',
                });
                navigation.navigate('ResetPassword', { username });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: result.message || 'Failed to send OTP. Please try again.',
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
                <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Forgot Password</Text>
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
                    <View style={styles.iconContainer}>
                        <Icon name="lock" size={60} color={theme.colors.primary} />
                    </View>

                    <Text style={[styles.title, { color: theme.colors.primary }]}>Reset Your Password</Text>
                    <Text style={[styles.subtitle, { color: '#666' }]}>
                        Enter your email address or phone number and we'll send you an OTP to reset your password.
                    </Text>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.primary }]}>Email or Phone Number</Text>
                        <TextInput
                            style={[styles.input, { color: theme.colors.primary }]}
                            placeholder="Enter your email or phone number"
                            placeholderTextColor="#aaa"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            keyboardType="default"
                            editable={!isLoading}
                        />
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
                        onPress={handleSendOTP}
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