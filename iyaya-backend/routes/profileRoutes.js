const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');
const profileController = require('../controllers/profileController');

// All routes require authentication
router.use(authenticate);

// Validation middleware
const validateProfileUpdate = [
  body('name').optional().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('phone').optional().custom((value) => {
    if (!value || value.trim() === '') return true; // Allow empty phone
    return /^[\+]?[0-9\s\-\(\)]{7,15}$/.test(value); // Basic phone validation
  }).withMessage('Invalid phone number'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
  body('hourlyRate').optional().isNumeric().withMessage('Hourly rate must be a number'),
  body('experience').optional().isNumeric().withMessage('Experience must be a number'),
];

const validateChildrenUpdate = [
  body('children').isArray().withMessage('Children must be an array'),
  body('children.*.name').notEmpty().withMessage('Child name is required'),
  body('children.*.age').isInt({ min: 0, max: 18 }).withMessage('Child age must be between 0 and 18'),
  body('children.*.gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
];

const validateAvailabilityUpdate = [
  body('availability').isObject().withMessage('Availability must be an object'),
];

// Routes
router.get('/', profileController.getProfile);
router.put('/', validateProfileUpdate, profileController.updateProfile);
router.post('/image', profileController.updateProfileImage);
router.put('/children', validateChildrenUpdate, profileController.updateChildren);
router.get('/availability', profileController.getAvailability);
router.put('/availability', validateAvailabilityUpdate, profileController.updateAvailability);

module.exports = router;
