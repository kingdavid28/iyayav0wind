import { useState, useCallback } from 'react';
import { validateForm, validationRules } from '../../../utils/validation';
import { useSecurity } from '../../../hooks/useSecurity';

export const useAuthForm = (mode = 'login', userType = 'parent') => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const { sanitizeInput } = useSecurity();

  const handleChange = useCallback((field, value) => {
    const sanitizedValue = sanitizeInput(value);
    setFormData(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [errors, sanitizeInput]);

  const validateFormData = useCallback(() => {
    let rules = {};
    
    if (mode === 'login') {
      rules = validationRules.userLogin;
    } else if (mode === 'signup') {
      rules = validationRules.userRegistration;
      // Add confirm password validation
      rules.confirmPassword = (value) => {
        if (value !== formData.password) {
          return 'Passwords do not match';
        }
        return null;
      };
    } else if (mode === 'reset') {
      rules = { email: validationRules.userLogin.email };
    }

    const validationErrors = validateForm(formData, rules);
    setErrors(validationErrors);
    
    return Object.keys(validationErrors).length === 0;
  }, [formData, mode]);

  const resetForm = useCallback(() => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      phone: ''
    });
    setErrors({});
  }, []);

  const getFormData = useCallback(() => {
    return { ...formData, userType };
  }, [formData, userType]);

  return {
    formData,
    errors,
    handleChange,
    validateFormData,
    resetForm,
    getFormData,
    isValid: Object.keys(errors).length === 0
  };
};

export default useAuthForm;