// Caregiver validation middleware
const { body, param, validationResult } = require('express-validator');

const searchCaregiversValidator = [
  // Optional query parameters validation
];

const caregiverIdValidator = [
  param('id').isMongoId().withMessage('Invalid caregiver ID')
];

const updateCaregiverValidator = [
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('bio').optional().isString().trim().isLength({ max: 1000 }),
  body('hourlyRate').optional().isNumeric().isFloat({ min: 0 }),
  body('skills').optional().isArray(),
  body('experience').optional().isObject(),
  body('availability').optional().isObject(),
  
  // Validation result handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  searchCaregiversValidator,
  caregiverIdValidator,
  updateCaregiverValidator
};