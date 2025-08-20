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
const { authenticate, authorize } = require('./middleware/auth');
const config = require('./config/env');

const app = express();

// ============================================
// Security Middleware
// ============================================
// Fixed rate limiter configuration (previous values were too large)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes (was 1500*6000*100000)
  max: 100, // limit each IP to 100 requests per windowMs (was 1000000)
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.user?.role === 'admin'
});

app.use('/api', limiter);

// CORS Configuration
const allowedHeaders = [
  'Content-Type',
  'Authorization',
  'X-Device-ID',
  'x-client-time',
  'app-version',
  'X-Request-ID',
  'X-Refresh-Token',
  'X-Requested-With',
  'Accept',
  'Origin',
  'User-Agent',
  'x-app-instance',
  'platform'
];

// Enhanced CORS configuration with better error handling
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or wildcard is present
    if (config.cors.origin.includes('*') || config.cors.origin.includes(origin)) {
      return callback(null, true);
    }
    
    // Format the error message consistently
    const error = new Error(`Origin ${origin} not allowed by CORS`);
    error.status = 403;
    callback(error);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders,
  exposedHeaders: ['Authorization', 'X-Refresh-Token', 'X-Request-ID'],
  credentials: true,
  optionsSuccessStatus: 204,
  maxAge: 86400
};
console.log('Allowed CORS origins:', config.cors.origin);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Security Middleware - Added recommended Helmet configurations
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", ...config.cors.origin]
    }
  },
  crossOriginResourcePolicy: { policy: "same-site" }
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
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// Routes
// ============================================
const mountRoutes = () => {
  const apiRouter = express.Router();

  // Public Routes
  apiRouter.use('/auth', require('./routes/authRoutes'));

  // Protected Routes
  apiRouter.use('/providers', authenticate, require('./routes/providerRoutes'));
  apiRouter.use('/contracts', authenticate, require('./routes/contractRoutes'));
  apiRouter.use('/bookings', authenticate, require('./routes/bookingRoutes'));
  apiRouter.use('/jobs', authenticate, require('./routes/jobsRoutes'));
  apiRouter.use('/applications', authenticate, require('./routes/applicationsRoutes'));

  // Admin Routes
  apiRouter.use('/admin',
    authenticate,
    authorize(['admin']),
    require('./routes/adminRoutes')
  );
  
  // Use /api exclusively as the base path
  app.use('/api', apiRouter);
};

mountRoutes();

// ============================================
// Health Check
// ============================================
const authController = require('./controllers/auth');

const firebaseAuth = require('./middleware/firebaseAuth');
app.get('/api/auth/profile', firebaseAuth, (req, res) => {
  res.json({ user: req.user });
});

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