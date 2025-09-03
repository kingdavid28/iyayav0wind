import { VALIDATION } from './constants';

/**
 * Validation utility functions
 */

export const validators = {
  // Email validation
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return null;
  },

  // Password validation
  password: (password) => {
    if (!password) return 'Password is required';
    if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      return `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`;
    }
    if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number';
    return null;
  },

  // Name validation
  name: (name) => {
    if (!name) return 'Name is required';
    if (name.length < VALIDATION.NAME_MIN_LENGTH) {
      return `Name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters`;
    }
    if (name.length > VALIDATION.NAME_MAX_LENGTH) {
      return `Name cannot exceed ${VALIDATION.NAME_MAX_LENGTH} characters`;
    }
    return null;
  },

  // Phone validation
  phone: (phone) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phone) return 'Phone number is required';
    if (!phoneRegex.test(phone)) return 'Please enter a valid phone number';
    return null;
  },

  // Required field validation
  required: (value, fieldName = 'This field') => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} is required`;
    }
    return null;
  },

  // Hourly rate validation
  hourlyRate: (rate) => {
    if (!rate) return 'Hourly rate is required';
    const numRate = parseFloat(rate);
    if (isNaN(numRate)) return 'Please enter a valid hourly rate';
    if (numRate < VALIDATION.HOURLY_RATE_MIN) {
      return `Hourly rate must be at least ₱${VALIDATION.HOURLY_RATE_MIN}`;
    }
    if (numRate > VALIDATION.HOURLY_RATE_MAX) {
      return `Hourly rate cannot exceed ₱${VALIDATION.HOURLY_RATE_MAX}`;
    }
    return null;
  },

  // Bio validation
  bio: (bio) => {
    if (bio && bio.length > VALIDATION.BIO_MAX_LENGTH) {
      return `Bio cannot exceed ${VALIDATION.BIO_MAX_LENGTH} characters`;
    }
    return null;
  },

  // Age validation
  age: (age) => {
    if (!age) return 'Age is required';
    const numAge = parseInt(age);
    if (isNaN(numAge)) return 'Please enter a valid age';
    if (numAge < 18) return 'You must be at least 18 years old';
    if (numAge > 100) return 'Please enter a valid age';
    return null;
  },
};

/**
 * Validate multiple fields at once
 * @param {Object} data - Object with field values
 * @param {Object} rules - Object with validation rules for each field
 * @returns {Object} - Object with errors for each field
 */
export const validateForm = (data, rules) => {
  const errors = {};

  Object.keys(rules).forEach(field => {
    const value = data[field];
    const fieldRules = Array.isArray(rules[field]) ? rules[field] : [rules[field]];

    for (const rule of fieldRules) {
      const error = rule(value);
      if (error) {
        errors[field] = error;
        break; // Stop at first error for this field
      }
    }
  });

  return errors;
};

/**
 * Check if form has any errors
 * @param {Object} errors - Errors object from validateForm
 * @returns {boolean} - True if form is valid (no errors)
 */
export const isFormValid = (errors) => {
  return Object.keys(errors).length === 0;
};

/**
 * Common validation rule sets
 */
export const validationRules = {
  // User registration
  userRegistration: {
    name: validators.name,
    email: validators.email,
    password: validators.password,
    phone: validators.phone,
  },

  // User login
  userLogin: {
    email: validators.email,
    password: (value) => validators.required(value, 'Password'),
  },

  // Caregiver profile
  caregiverProfile: {
    name: validators.name,
    email: validators.email,
    phone: validators.phone,
    age: validators.age,
    hourlyRate: validators.hourlyRate,
    bio: validators.bio,
  },

  // Parent profile
  parentProfile: {
    name: validators.name,
    email: validators.email,
    phone: validators.phone,
  },
};
