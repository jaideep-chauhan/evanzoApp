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
    Image,
    ActivityIndicator,
    Modal,
    FlatList,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useTheme } from '../../ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';
import appple from '../../assets/images/apple.png';
import google from '../../assets/images/google.png';
import CustomModal from '../../components/CustomModal';
import CustomToast from '../../components/CustomToast';

// Validation schema
const registerSchema = Yup.object().shape({
    fullName: Yup.string()
        .required('Full name is required')
        .min(2, 'Name must be at least 2 characters')
        .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
    phone: Yup.string()
        .required('Phone number is required')
        .matches(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
        .test('phone-length', 'Phone number must be at least 10 digits', function (value) {
            if (!value) return false;
            const cleanPhone = value.replace(/[\s\-\(\)\+]/g, '');
            return cleanPhone.length >= 10;
        }),
    email: Yup.string()
        .required('Email is required')
        .email('Please enter a valid email address'),
    password: Yup.string()
        .required('Password is required')
        .min(6, 'Password must be at least 6 characters')
        .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
        .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .matches(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: Yup.string()
        .required('Please confirm your password')
        .oneOf([Yup.ref('password'), null], 'Passwords must match'),
});

export default function Register() {
    const navigation = useNavigation();
    const theme = useTheme();
    const { register } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCountryCode, setSelectedCountryCode] = useState('+1');
    const [showCountryPicker, setShowCountryPicker] = useState(false);

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({});

    // Toast state
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    // Common country codes
    const showToast = (message, type = 'info') => {
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
    };

    const countryCodes = [
        { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
        { code: '+44', country: 'UK', flag: '🇬🇧' },
        { code: '+91', country: 'India', flag: '🇮🇳' },
        { code: '+86', country: 'China', flag: '🇨🇳' },
        { code: '+81', country: 'Japan', flag: '🇯🇵' },
        { code: '+49', country: 'Germany', flag: '🇩🇪' },
        { code: '+33', country: 'France', flag: '🇫🇷' },
        { code: '+61', country: 'Australia', flag: '🇦🇺' },
        { code: '+55', country: 'Brazil', flag: '🇧🇷' },
        { code: '+7', country: 'Russia', flag: '🇷🇺' },
        { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
        { code: '+27', country: 'South Africa', flag: '🇿🇦' },
        { code: '+52', country: 'Mexico', flag: '🇲🇽' },
        { code: '+971', country: 'UAE', flag: '🇦🇪' },
        { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
    ];

    const handleSignUp = async (values) => {
        setIsLoading(true);
        try {
            // Combine country code with phone number
            // Remove any non-digit characters from phone input
            const cleanPhone = values.phone.replace(/\D/g, '');
            const fullPhoneNumber = `${selectedCountryCode}${cleanPhone}`;

            console.log('📱 Registration data:', {
                fullName: values.fullName,
                phone: fullPhoneNumber,
                email: values.email
            });

            const result = await register({
                fullName: values.fullName,
                phone: fullPhoneNumber,
                email: values.email,
                password: values.password,
            });
            console.log("Register-==-=", result);
            if (result.success) {
                setModalConfig({
                    visible: true,
                    type: 'success',
                    title: 'Verification Code Sent',
                    message: `A verification code has been sent to ${values.email}. Please check your inbox.`,
                    primaryButtonText: 'Continue',
                    onPrimaryPress: () => {
                        setModalVisible(false);
                        // Navigate to OTP verification screen
                        navigation.navigate('OTPVerify', {
                            email: values.email,
                            phone: fullPhoneNumber,
                            fromScreen: 'Register'
                        });
                    },
                });
                setModalVisible(true);
            } else {
                showToast(result.error || 'Unable to create account. Please try again.', 'error');
            }
        } catch (error) {
            showToast('Something went wrong. Please try again later.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: '#fff' }]} edges={['left', 'right', 'bottom']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <Formik
                    initialValues={{
                        fullName: '',
                        phone: '',
                        email: '',
                        password: '',
                        confirmPassword: '',
                    }}
                    validationSchema={registerSchema}
                    onSubmit={handleSignUp}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                        <ScrollView
                            contentContainerStyle={styles.scroll}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <Text style={[styles.title, { color: theme.colors.primary }]}>Create Account</Text>
                            <Text style={[styles.subtitle, { color: theme.colors.primary }]}>Create an account so you can explore all the existing jobs</Text>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.colors.primary }]}>Full Name</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        { color: theme.colors.primary },
                                        touched.fullName && errors.fullName && styles.inputError
                                    ]}
                                    placeholder="Enter your full name"
                                    placeholderTextColor="#aaa"
                                    value={values.fullName}
                                    onChangeText={handleChange('fullName')}
                                    onBlur={handleBlur('fullName')}
                                    autoCapitalize="words"
                                />
                                {touched.fullName && errors.fullName && (
                                    <Text style={styles.errorText}>{errors.fullName}</Text>
                                )}
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.colors.primary }]}>Phone Number</Text>
                                <View style={styles.phoneInputContainer}>
                                    <TouchableOpacity
                                        style={[styles.countryCodeButton, touched.phone && errors.phone && styles.inputError]}
                                        onPress={() => setShowCountryPicker(true)}
                                    >
                                        <Text style={styles.countryCodeText}>{selectedCountryCode}</Text>
                                        <Icon name="chevron-down" size={14} color="#666" />
                                    </TouchableOpacity>
                                    <TextInput
                                        style={[
                                            styles.phoneInput,
                                            { color: theme.colors.primary },
                                            touched.phone && errors.phone && styles.inputError
                                        ]}
                                        placeholder="Enter phone number"
                                        placeholderTextColor="#aaa"
                                        keyboardType="phone-pad"
                                        value={values.phone}
                                        onChangeText={handleChange('phone')}
                                        onBlur={handleBlur('phone')}
                                    />
                                </View>
                                {touched.phone && errors.phone && (
                                    <Text style={styles.errorText}>{errors.phone}</Text>
                                )}
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.colors.primary }]}>Email</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        { color: theme.colors.primary },
                                        touched.email && errors.email && styles.inputError
                                    ]}
                                    placeholder="Enter your email"
                                    placeholderTextColor="#aaa"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={values.email}
                                    onChangeText={handleChange('email')}
                                    onBlur={handleBlur('email')}
                                />
                                {touched.email && errors.email && (
                                    <Text style={styles.errorText}>{errors.email}</Text>
                                )}
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.colors.primary }]}>Password</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            styles.passwordInput,
                                            { color: theme.colors.primary },
                                            touched.password && errors.password && styles.inputError
                                        ]}
                                        placeholder="Create your password"
                                        placeholderTextColor="#aaa"
                                        secureTextEntry={!showPassword}
                                        value={values.password}
                                        onChangeText={handleChange('password')}
                                        onBlur={handleBlur('password')}
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

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.colors.primary }]}>Confirm Password</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            styles.passwordInput,
                                            { color: theme.colors.primary },
                                            touched.confirmPassword && errors.confirmPassword && styles.inputError
                                        ]}
                                        placeholder="Re-enter your password"
                                        placeholderTextColor="#aaa"
                                        secureTextEntry={!showConfirmPassword}
                                        value={values.confirmPassword}
                                        onChangeText={handleChange('confirmPassword')}
                                        onBlur={handleBlur('confirmPassword')}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeIcon}
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        <Icon
                                            name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                            size={20}
                                            color="#666"
                                        />
                                    </TouchableOpacity>
                                </View>
                                {touched.confirmPassword && errors.confirmPassword && (
                                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                                )}
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.signUpBtn,
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
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={[styles.signUpText, { color: '#fff' }]}>Sign Up</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.loginBtn, { borderColor: theme.colors.primary }]}
                                onPress={() => navigation.navigate('Login')}
                            >
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
                                {/* Apple Sign-In is iOS-only — hidden on Android. */}
                                {Platform.OS === 'ios' && (
                                    <TouchableOpacity style={styles.socialIconButton}>
                                        <Image source={appple} style={styles.socialIconImage} resizeMode="contain" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </ScrollView>
                    )}
                </Formik>
            </KeyboardAvoidingView>

            {/* Country Code Picker Modal */}
            <Modal
                visible={showCountryPicker}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCountryPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>Select Country Code</Text>
                            <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                                <Icon name="close" size={24} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={countryCodes}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.countryItem,
                                        selectedCountryCode === item.code && styles.selectedCountryItem
                                    ]}
                                    onPress={() => {
                                        setSelectedCountryCode(item.code);
                                        setShowCountryPicker(false);
                                    }}
                                >
                                    <Text style={styles.countryFlag}>{item.flag}</Text>
                                    <Text style={styles.countryName}>{item.country}</Text>
                                    <Text style={[
                                        styles.countryCode,
                                        selectedCountryCode === item.code && styles.selectedCountryCode
                                    ]}>{item.code}</Text>
                                    {selectedCountryCode === item.code && (
                                        <Icon name="checkmark" size={20} color={theme.colors.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </View>
            </Modal>

            <CustomModal
                visible={modalVisible}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                primaryButtonText={modalConfig.primaryButtonText}
                onPrimaryPress={modalConfig.onPrimaryPress}
                onClose={() => setModalVisible(false)}
            />

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
    phoneInputContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    countryCodeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 48,
        minWidth: 90,
        justifyContent: 'space-between',
    },
    countryCodeText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginRight: 4,
    },
    phoneInput: {
        flex: 1,
        height: 48,
        backgroundColor: '#fff',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 16,
        fontSize: 15,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    selectedCountryItem: {
        backgroundColor: '#f0f4ff',
    },
    countryFlag: {
        fontSize: 24,
        marginRight: 12,
    },
    countryName: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    countryCode: {
        fontSize: 16,
        color: '#666',
        marginRight: 10,
    },
    selectedCountryCode: {
        color: '#2C3D5B',
        fontWeight: '600',
    },
});