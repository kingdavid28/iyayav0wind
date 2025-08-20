const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');
const { authenticate } = require('../middleware/auth');
const { checkUserType } = require('../middleware/authorization');
const { 
  searchProvidersValidator,
  providerIdValidator,
  updateProviderValidator 
} = require('../validators/providerValidators');
const rateLimit = require('express-rate-limit');

// Enhanced rate limiting configuration
const providerLimiter = rateLimit({
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
  'searchProviders',
  'getProviderDetails',
  'updateProviderProfile',
  'getProviderProfile',
  'uploadDocuments',
  'refreshToken'
];

console.log('🔍 Verifying provider controller methods...');
requiredMethods.forEach(method => {
  if (typeof providerController[method] !== 'function') {
    const error = new Error(`Provider controller missing method: ${method}`);
    console.error(`❌ Critical error: ${error.message}`);
    throw error;
  }
  console.log(`✅ ${method} exists and is a function`);
});

// Apply rate limiting to all provider routes
router.use(providerLimiter);

/**
 * @swagger
 * tags:
 *   name: Providers
 *   description: Service provider management endpoints
 *   version: 1.0.0
 */

// =====================
// PUBLIC ROUTES
// =====================
router.get(
  '/',
  searchProvidersValidator,
  providerController.searchProviders
);

router.get(
  '/:id',
  providerIdValidator,
  providerController.getProviderDetails
);

// =====================
// AUTHENTICATED ROUTES
// =====================
// Either use '/profile' (more RESTful) or '/providers' (more explicit)
// But not both to avoid duplication

// Recommended approach:
router.get(
  '/profile',
  authenticate,
  checkUserType('provider'),
  providerController.getProviderProfile
);

// Then remove the '/providers' version

router.put(
  '/profile',
  authenticate,
  checkUserType('provider'),
  updateProviderValidator,
  providerController.updateProviderProfile
);

router.post(
  '/documents',
  authenticate,
  checkUserType('provider'),
  providerController.uploadDocuments
);

router.post(
  '/refresh-token',
  authenticate,
  providerController.refreshToken
);

// Health check endpoint
router.get('/health-check', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Provider routes are healthy',
    timestamp: new Date()
  });
});

console.log('\n🚀 Provider Routes Successfully Registered:');
console.log('GET    /              - Search providers');
console.log('GET    /:id           - Get provider details');
console.log('GET    /profile       - Get authenticated provider profile');
console.log('PUT    /profile       - Update provider profile');
console.log('POST   /documents     - Upload documents');
console.log('POST   /refresh-token - Refresh auth token');
console.log('GET    /health-check  - Service health check');

module.exports = router;