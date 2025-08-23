import React from 'react';
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
    Image,
} from 'react-native';
import { useTheme } from '../../ThemeContext';
import { useNavigation } from '@react-navigation/native';
import appple from '../../assets/images/apple.png';
import google from '../../assets/images/google.png';
import facebook from '../../assets/images/fb.png';


export default function Register() {
    const navigation = useNavigation();
    const theme = useTheme();

    // Add state for form fields
    const [fullName, setFullName] = React.useState('');
    const [phone, setPhone] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [error, setError] = React.useState('');

    const handleSignUp = () => {
        // Simple validation
        if (!fullName || !phone || !email || !password || !confirmPassword) {
            setError('Please fill all fields');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        // Simulate registration, then redirect to OTPVerify
        setError('');
        navigation.navigate('OTPVerify');
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: '#fff' }]} edges={['left', 'right', 'bottom']}>
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
                    <Text style={[styles.title, { color: theme.colors.primary }]}>Create Account</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.primary }]}>Create an account so you can explore all the existing jobs</Text>
                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.primary }]}>Full Name</Text>
                        <TextInput
                            style={[styles.input, { color: theme.colors.primary }]}
                            placeholder="Enter your full name"
                            placeholderTextColor="#aaa"
                            value={fullName}
                            onChangeText={setFullName}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.primary }]}>Phone Number</Text>
                        <TextInput
                            style={[styles.input, { color: theme.colors.primary }]}
                            placeholder="Enter your phone number"
                            placeholderTextColor="#aaa"
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={setPhone}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.primary }]}>Email</Text>
                        <TextInput
                            style={[styles.input, { color: theme.colors.primary }]}
                            placeholder="Enter your mail"
                            placeholderTextColor="#aaa"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.primary }]}>Password</Text>
                        <TextInput
                            style={[styles.input, { color: theme.colors.primary }]}
                            placeholder="Create your password"
                            placeholderTextColor="#aaa"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.primary }]}>Confirm Password</Text>
                        <TextInput
                            style={[styles.input, { color: theme.colors.primary }]}
                            placeholder="Re-Enter your password"
                            placeholderTextColor="#aaa"
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                    </View>

                    <TouchableOpacity style={[styles.signUpBtn, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]} onPress={handleSignUp}>
                        <Text style={[styles.signUpText, { color: '#fff' }]}>Sign Up</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.loginBtn, { borderColor: theme.colors.primary }]} onPress={() => navigation.navigate('Login')}>
                        <Text style={[styles.loginText, { color: theme.colors.primary }]}>Already have an account</Text>
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
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'flex-start',
        padding: 24,
        paddingBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 28,
    },
    label: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 6,
        marginTop: 14,
    },
    input: {
        height: 48,
        backgroundColor: '#fff',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 16,
        fontSize: 15,
    },
    error: {
        color: '#ff6b6b',
        textAlign: 'center',
        marginBottom: 8,
        fontSize: 14,
    },
    inputGroup: {
        marginBottom: 10,
    },
    signUpBtn: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 12,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 4,
        elevation: 2,
    },
    signUpText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    loginBtn: {
        borderWidth: 1.5,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 18,
    },
    loginText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '700',
    },
    orText: {
        textAlign: 'center',
        fontSize: 16,
        marginBottom: 0,
        fontWeight: '500',
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