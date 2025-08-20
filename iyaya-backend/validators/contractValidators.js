// validators/contractValidators.js
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

// Contract creation validation
const createContractValidator = validate([
  body('clientId')
    .optional() // Will be set from auth middleware
    .custom((value) => {
      if (value && !isValidObjectId(value)) {
        throw new Error('Invalid client ID format');
      }
      return true;
    }),
  
  body('providerId')
    .trim()
    .notEmpty().withMessage('Provider ID is required')
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error('Invalid provider ID format');
      }
      return true;
    }),
  
  body('serviceId')
    .trim()
    .notEmpty().withMessage('Service ID is required')
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error('Invalid service ID format');
      }
      return true;
    }),
  
  body('terms')
    .trim()
    .notEmpty().withMessage('Terms are required')
    .isLength({ max: 1000 }).withMessage('Terms must be less than 1000 characters'),
  
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  
  body('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format (use ISO8601)'),
  
  body('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format (use ISO8601)'),
  
  body('status')
    .optional()
    .isIn(['pending', 'active', 'completed', 'cancelled']).withMessage('Invalid initial status')
]);

// Client ID validation
const clientIdValidator = validate([
  param('clientId')
    .trim()
    .notEmpty().withMessage('Client ID is required')
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error('Invalid client ID format');
      }
      return true;
    }),
  
  query('status')
    .optional()
    .isIn(['pending', 'active', 'completed', 'cancelled']).withMessage('Invalid status filter')
]);

// Contract ID validation
const contractIdValidator = validate([
  param('id')
    .trim()
    .notEmpty().withMessage('Contract ID is required')
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error('Invalid contract ID format');
      }
      return true;
    })
]);

// Contract status update validation
const statusUpdateValidator = validate([
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .isIn(['approved', 'rejected', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status update value')
]);

module.exports = {
  createContractValidator,
  clientIdValidator,
  contractIdValidator,
  statusUpdateValidator
};