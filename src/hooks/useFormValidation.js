import { useState, useCallback } from 'react';
import { validateField, validateForm } from '../utils/validationSchemas';

/**
 * Custom hook for form validation with Yup schemas
 * @param {Object} schema - Yup validation schema
 * @param {Object} initialValues - Initial form values
 */
export const useFormValidation = (schema, initialValues = {}) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // Update a single field value
    const setFieldValue = useCallback((field, value) => {
        setValues(prev => ({ ...prev, [field]: value }));
        
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    }, [errors]);

    // Mark a field as touched
    const setFieldTouched = useCallback((field, isTouched = true) => {
        setTouched(prev => ({ ...prev, [field]: isTouched }));
    }, []);

    // Validate a single field
    const validateSingleField = useCallback(async (field) => {
        const result = await validateField(schema, field, values[field]);
        
        if (!result.isValid) {
            setErrors(prev => ({ ...prev, [field]: result.error }));
            return false;
        } else {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
            return true;
        }
    }, [schema, values]);

    // Validate all fields
    const validateAllFields = useCallback(async () => {
        const result = await validateForm(schema, values);
        
        if (!result.isValid) {
            setErrors(result.errors);
            // Mark all fields as touched
            const allTouched = {};
            Object.keys(result.errors).forEach(key => {
                allTouched[key] = true;
            });
            setTouched(prev => ({ ...prev, ...allTouched }));
            return false;
        } else {
            setErrors({});
            return true;
        }
    }, [schema, values]);

    // Handle field blur (validate on blur)
    const handleBlur = useCallback(async (field) => {
        setFieldTouched(field, true);
        await validateSingleField(field);
    }, [setFieldTouched, validateSingleField]);

    // Reset form to initial values
    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
    }, [initialValues]);

    // Get error for a specific field (only if touched)
    const getFieldError = useCallback((field) => {
        return touched[field] ? errors[field] : null;
    }, [errors, touched]);

    // Check if form is valid (no errors and all required fields have values)
    const isFormValid = Object.keys(errors).length === 0;

    return {
        values,
        errors,
        touched,
        setFieldValue,
        setFieldTouched,
        validateSingleField,
        validateAllFields,
        handleBlur,
        resetForm,
        getFieldError,
        isFormValid,
        setValues,
    };
};