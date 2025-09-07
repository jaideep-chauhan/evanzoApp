import * as Yup from 'yup';

// Custom phone validation regex
const phoneRegex = /^(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;

// Login validation schema
export const loginSchema = Yup.object().shape({
    username: Yup.string()
        .required('Email or phone number is required')
        .test('email-or-phone', 'Please enter a valid email or phone number', function(value) {
            if (!value) return false;
            // Check if it's an email
            const emailValid = Yup.string().email().isValidSync(value);
            // Check if it's a phone number
            const phoneValid = phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10;
            return emailValid || phoneValid;
        }),
    password: Yup.string()
        .required('Password is required')
        .min(6, 'Password must be at least 6 characters'),
});

// Signup validation schema
export const signupSchema = Yup.object().shape({
    fullName: Yup.string()
        .required('Full name is required')
        .min(2, 'Name must be at least 2 characters')
        .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
    
    email: Yup.string()
        .required('Email is required')
        .email('Please enter a valid email address'),
    
    phone: Yup.string()
        .required('Phone number is required')
        .test('phone-valid', 'Please enter a valid phone number', function(value) {
            if (!value) return false;
            // Remove all non-digit characters except +
            const cleanedPhone = value.replace(/[^\d+]/g, '');
            // Check if it has country code and valid length (with country code it should be 10-15 digits excluding +)
            const phoneWithoutPlus = cleanedPhone.replace(/^\+/, '');
            return phoneWithoutPlus.length >= 10 && phoneWithoutPlus.length <= 15;
        }),
    
    password: Yup.string()
        .required('Password is required')
        .min(8, 'Password must be at least 8 characters')
        .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
        .matches(/[0-9]/, 'Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
    
    confirmPassword: Yup.string()
        .required('Please confirm your password')
        .oneOf([Yup.ref('password'), null], 'Passwords must match'),
});

// Forgot password validation schema
export const forgotPasswordSchema = Yup.object().shape({
    username: Yup.string()
        .required('Email or phone number is required')
        .test('email-or-phone', 'Please enter a valid email or phone number', function(value) {
            if (!value) return false;
            const emailValid = Yup.string().email().isValidSync(value);
            const phoneValid = phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10;
            return emailValid || phoneValid;
        }),
});

// Reset password validation schema
export const resetPasswordSchema = Yup.object().shape({
    otp: Yup.string()
        .required('OTP is required')
        .matches(/^\d{6}$/, 'OTP must be exactly 6 digits'),
    
    newPassword: Yup.string()
        .required('New password is required')
        .min(8, 'Password must be at least 8 characters')
        .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
        .matches(/[0-9]/, 'Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
    
    confirmPassword: Yup.string()
        .required('Please confirm your password')
        .oneOf([Yup.ref('newPassword'), null], 'Passwords must match'),
});

// OTP validation schema
export const otpSchema = Yup.object().shape({
    otp: Yup.string()
        .required('OTP is required')
        .matches(/^\d{6}$/, 'OTP must be exactly 6 digits'),
});

// Change password validation schema
export const changePasswordSchema = Yup.object().shape({
    currentPassword: Yup.string()
        .required('Current password is required'),
    
    newPassword: Yup.string()
        .required('New password is required')
        .min(8, 'Password must be at least 8 characters')
        .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
        .matches(/[0-9]/, 'Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
        .notOneOf([Yup.ref('currentPassword'), null], 'New password must be different from current password'),
    
    confirmPassword: Yup.string()
        .required('Please confirm your password')
        .oneOf([Yup.ref('newPassword'), null], 'Passwords must match'),
});

// Helper function to validate a single field
export const validateField = async (schema, field, value) => {
    try {
        await schema.validateAt(field, { [field]: value });
        return { isValid: true, error: null };
    } catch (error) {
        return { isValid: false, error: error.message };
    }
};

// Vendor Ad Validation Schema
export const vendorAdSchema = Yup.object().shape({
    category: Yup.string()
        .required('Category is required')
        .min(2, 'Category must be at least 2 characters'),
    companyName: Yup.string()
        .required('Company name is required')
        .min(2, 'Company name must be at least 2 characters')
        .max(50, 'Company name cannot exceed 50 characters'),
    vendorDescription: Yup.string()
        .required('Description is required')
        .min(10, 'Description must be at least 10 characters')
        .max(500, 'Description cannot exceed 500 characters'),
    vendorLocation: Yup.string()
        .required('Location is required')
        .min(3, 'Location must be at least 3 characters'),
    offerAmount: Yup.number()
        .nullable()
        .transform((value, originalValue) => originalValue === '' ? null : value)
        .min(0, 'Offer amount must be positive')
        .max(999999, 'Offer amount is too large'),
    offerPercentage: Yup.number()
        .nullable()
        .transform((value, originalValue) => originalValue === '' ? null : value)
        .min(0, 'Offer percentage must be between 0 and 100')
        .max(100, 'Offer percentage must be between 0 and 100'),
    photos: Yup.array()
        .min(1, 'At least one photo is required')
        .max(10, 'Maximum 10 photos allowed'),
});

// Event Ad Validation Schema
export const eventAdSchema = Yup.object().shape({
    service: Yup.string()
        .required('Service type is required')
        .min(2, 'Service type must be at least 2 characters'),
    eventType: Yup.string()
        .required('Event type is required')
        .min(2, 'Event type must be at least 2 characters'),
    location: Yup.string()
        .required('Location is required')
        .min(3, 'Location must be at least 3 characters'),
    date: Yup.string()
        .required('Event date is required')
        .matches(
            /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/,
            'Date must be in MM/DD/YYYY format'
        )
        .test('future-date', 'Event date must be in the future', function(value) {
            if (!value) return false;
            const [month, day, year] = value.split('/').map(Number);
            const eventDate = new Date(year, month - 1, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return eventDate >= today;
        }),
    duration: Yup.string()
        .required('Duration is required')
        .matches(
            /^(\d+)\s*(hour|hours|hr|hrs|day|days|week|weeks)$/i,
            'Duration must be in format like "4 hours", "2 days", etc.'
        ),
    budget: Yup.number()
        .nullable()
        .transform((value, originalValue) => originalValue === '' ? null : value)
        .min(0, 'Budget must be positive')
        .max(999999, 'Budget amount is too large'),
    description: Yup.string()
        .nullable()
        .max(1000, 'Description cannot exceed 1000 characters'),
});

// Helper function to validate entire form
export const validateForm = async (schema, values) => {
    try {
        await schema.validate(values, { abortEarly: false });
        return { isValid: true, errors: {} };
    } catch (error) {
        const errors = {};
        if (error.inner) {
            error.inner.forEach(err => {
                if (err.path) {
                    errors[err.path] = err.message;
                }
            });
        }
        return { isValid: false, errors };
    }
};