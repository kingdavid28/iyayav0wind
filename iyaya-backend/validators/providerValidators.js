// validators/providerValidators.js
const { body, param, query, validationResult } = require('express-validator');
const { isValidObjectId } = require('mongoose');

// Reusable validation middleware
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ 
      success: false,
      error: errors.array(),
      statusCode: 400
    });
  };
};

// Search providers validation
const searchProvidersValidator = validate([
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Search term must be less than 100 characters'),
  
  query('location')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Location must be less than 100 characters'),
  
  query('serviceType')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Service type must be less than 50 characters'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt()
]);

// Provider ID validation
const providerIdValidator = validate([
  param('id')
    .trim()
    .notEmpty().withMessage('Provider ID is required')
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error('Invalid provider ID format');
      }
      return true;
    })
]);

// Update provider profile validation
const updateProviderValidator = validate([
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2-50 characters'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .isMobilePhone().withMessage('Invalid phone number'),
  
  body('serviceType')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Service type must be less than 50 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Address must be less than 200 characters'),
  
  body('profilePicture')
    .optional()
    .trim()
    .isURL().withMessage('Profile picture must be a valid URL')
]);

module.exports = {
  searchProvidersValidator,
  providerIdValidator,
  updateProviderValidator
};