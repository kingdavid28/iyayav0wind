
require('dotenv').config({ path: './.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const { rateLimit } = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const { authenticate, authorize } = require('./utils/auth');
const config = require('./config/env');

const app = express();

// ============================================
// Security Middleware
// ============================================
// Fixed rate limiter configuration (previous values were too large)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { success: false, error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development' || (req.user?.role === 'admin') || (req.originalUrl?.startsWith('/api/messages')),
  keyGenerator: (req, res) => {
    // Use express-rate-limit's built-in IPv6 handling
    return rateLimit.ipKeyGenerator(req, res);
  }
});

// Dedicated limiter for messages endpoints: higher cap and key per authenticated user
const messagesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000, // allow frequent polling without tripping limits
  message: { success: false, error: 'Too many message requests, please slow down temporarily' },
  standardHeaders: true,
  keyGenerator: (req, res) => {
    // Use user ID if authenticated, otherwise fall back to IP with IPv6 handling
    if (req.user?.id) return req.user.id;
    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
    // Use express-rate-limit's built-in IPv6 handling
    return rateLimit.ipKeyGenerator(req, res);
  },
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development', // Skip rate limiting in development
});

app.use('/api', limiter);

// Parse CORS origins from environment variable
const corsOrigins = process.env.CORS_ORIGIN ? 
  process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : 
  ['http://localhost:19006', 'http://127.0.0.1:19006', 'http://192.168.1.10:19006'];

// CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or wildcard is present
    if (corsOrigins.includes('*') || corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Format the error message consistently
    const error = new Error(`Origin ${origin} not allowed by CORS`);
    error.status = 403;
    console.warn(`CORS blocked: ${origin}`);
    callback(error);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'x-device-id',
    'x-app-version',
    'x-auth-token',
    'platform'
  ],
  exposedHeaders: ['Authorization', 'X-Refresh-Token', 'X-Request-ID'],
  credentials: false, // Changed to false for image requests
  optionsSuccessStatus: 204,
  maxAge: 86400
};

// Apply CORS middleware
console.log('CORS Configuration:', {
  origins: corsOrigins,
  methods: corsOptions.methods,
  allowedHeaders: corsOptions.allowedHeaders
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Security Middleware - Added recommended Helmet configurations
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      // Add any additional CSP directives here
    },
  },
  crossOriginResourcePolicy: { policy: "same-site" },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: { maxAge: 15552000, includeSubDomains: true },
  ieNoOpen: true,
  noSniff: true,
  xssFilter: true
}));

app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Request Processing
// Increase limits to support base64 image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Serve uploaded files with proper headers
app.use('/uploads', (req, res, next) => {
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// ============================================
// Routes
// ============================================
const mountRoutes = () => {
  const apiRouter = express.Router();

  // Public Routes
  apiRouter.use('/auth', require('./routes/authRoutes'));

  // Protected Routes
  // Caregivers: public search/details + authenticated profile endpoints are enforced inside the router
  apiRouter.use('/caregivers', require('./routes/caregiverRoutes'));
  apiRouter.use('/profile', require('./routes/profileRoutes'));
  apiRouter.use('/contracts', authenticate, require('./routes/contractRoutes'));
  apiRouter.use('/bookings', authenticate, require('./routes/bookingRoutes'));
  apiRouter.use('/jobs', require('./routes/jobsRoutes'));
  apiRouter.use('/applications', require('./routes/applicationsRoutes'));
  apiRouter.use('/uploads', authenticate, require('./routes/uploadsRoutes'));
  // Apply authenticate BEFORE messagesLimiter so keyGenerator can use req.user
  apiRouter.use('/messages', authenticate, messagesLimiter, require('./routes/messagesRoutes'));
  apiRouter.use('/privacy', require('./routes/privacy'));

  // Admin Routes removed
  
  // Use /api exclusively as the base path
  app.use('/api', apiRouter);
};

mountRoutes();

// ============================================
// Health Check
// ============================================
const authController = require('./controllers/auth');
// Use the standard authenticate middleware so we resolve Firebase or JWT and
// then delegate to the controller which returns a normalized profile shape
app.get('/api/auth/profile', authenticate, authController.getCurrentUser);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    environment: config.env,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// Error Handler
// ============================================
app.use((err, req, res, next) => {
  // Log the error with more context
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  const statusCode = err.status || err.statusCode || 500;
  const response = {
    status: 'error',
    message: err.message
  };

  // Only include stack trace in development
  if (config.env === 'development') {
    response.stack = err.stack;
    response.details = {
      url: req.originalUrl,
      method: req.method
    };
  }

  res.status(statusCode).json(response);
});

module.exports = app;