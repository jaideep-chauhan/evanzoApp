export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePhone = (phone) => {
    const phoneRegex = /^\+?[\d\s-()]+$/;
    const cleanedPhone = phone.replace(/\D/g, '');
    return cleanedPhone.length >= 10 && cleanedPhone.length <= 15;
};

export const validatePassword = (password) => {
    if (password.length < 8) {
        return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one number' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one special character' };
    }
    return { isValid: true };
};

export const validateName = (name) => {
    return name.trim().length >= 2;
};

export const validateOTP = (otp) => {
    return /^\d{6}$/.test(otp);
};

export const validateUsername = (username) => {
    if (validateEmail(username)) {
        return { isValid: true, type: 'email' };
    }
    if (validatePhone(username)) {
        return { isValid: true, type: 'phone' };
    }
    return { isValid: false, message: 'Please enter a valid email or phone number' };
};