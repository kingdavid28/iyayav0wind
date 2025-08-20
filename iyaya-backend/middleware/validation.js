const { body, validationResult } = require('express-validator');

const schemas = {
  register: [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/[0-9]/)
      .withMessage('Password must contain a number'),
    body('name')
      .trim()
      .isLength({ min: 2 })
      .withMessage('Name must be at least 2 characters'),
    body('userType')
      .isIn(['client', 'provider', 'admin'])
      .withMessage('Invalid user type')
  ],
  login: [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required'),
    body('userType')
      .isIn(['client', 'provider', 'admin'])
      .withMessage('Invalid user type')
  ],
  refreshToken: [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required')
      .isJWT()
      .withMessage('Invalid refresh token format')
      .custom((value) => {
        // Additional validation if needed (e.g., prefix check)
        if (!value.startsWith('rt_')) {
          throw new Error('Invalid refresh token prefix');
        }
        return true;
      })
  ]
};

exports.validate = (schema) => {
  if (!schemas[schema]) {
    throw new Error(`Validation schema '${schema}' not found`);
  }

  return [
    ...schemas[schema],
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array().map(err => ({
            param: err.param,
            message: err.msg,
            location: err.location
          }))
        });
      }
      next();
    }
  ];
};

// Debug check
console.log('Validation schemas loaded:', Object.keys(schemas));