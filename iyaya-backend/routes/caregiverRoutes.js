const express = require('express');
const router = express.Router();
const caregiverController = require('../controllers/caregiverController');
const { authenticate } = require('../middleware/auth');
const { checkUserType } = require('../middleware/authorization');
const { 
  searchCaregiversValidator,
  caregiverIdValidator,
  updateCaregiverValidator 
} = require('../validators/caregiverValidators');
const rateLimit = require('express-rate-limit');

// Enhanced rate limiting configuration
const caregiverLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for certain endpoints if needed
    return req.path === '/health-check';
  }
});

// Verify controller methods exist with better error handling
const requiredMethods = [
  'searchCaregivers',
  'getCaregiverDetails',
  'updateCaregiverProfile',
  'getCaregiverProfile',
  'uploadDocuments',
  'refreshToken'
];

console.log('🔍 Verifying caregiver controller methods...');
requiredMethods.forEach(method => {
  if (typeof caregiverController[method] !== 'function') {
    const error = new Error(`Caregiver controller missing method: ${method}`);
    console.error(`❌ Critical error: ${error.message}`);
    throw error;
  }
  console.log(`✅ ${method} exists and is a function`);
});

// Apply rate limiting to all caregiver routes
router.use(caregiverLimiter);

/**
 * @swagger
 * tags:
 *   name: Caregivers
 *   description: Service provider management endpoints
 *   version: 1.0.0
 */

// =====================
// AUTHENTICATED ROUTES (placed BEFORE '/:id' to avoid conflicts)
// =====================
router.get(
  '/profile',
  authenticate,
  checkUserType('caregiver'),
  caregiverController.getCaregiverProfile
);

router.post(
  '/profile',
  authenticate,
  checkUserType('caregiver'),
  updateCaregiverValidator,
  caregiverController.updateCaregiverProfile
);

router.put(
  '/profile',
  authenticate,
  checkUserType('caregiver'),
  updateCaregiverValidator,
  caregiverController.updateCaregiverProfile
);

router.post(
  '/documents',
  authenticate,
  checkUserType('caregiver'),
  caregiverController.uploadDocuments
);

router.post(
  '/refresh-token',
  authenticate,
  caregiverController.refreshToken
);

// =====================
// PUBLIC ROUTES
// =====================
// List/search caregivers
router.get('/', caregiverController.searchCaregivers);

// Get caregiver details by id
router.get('/:id', caregiverController.getCaregiverDetails);

// Health check endpoint
router.get('/health-check', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Caregiver routes are healthy',
    timestamp: new Date()
  });
});

console.log('\n🚀 Caregiver Routes Successfully Registered:');
console.log('GET    /              - Search caregivers');
console.log('GET    /:id           - Get caregiver details');
console.log('GET    /profile       - Get authenticated caregiver profile');
console.log('PUT    /profile       - Update caregiver profile');
console.log('POST   /documents     - Upload documents');
console.log('POST   /refresh-token - Refresh auth token');
console.log('GET    /health-check  - Service health check');

module.exports = router;