# Iyaya - Nanny & Employer Matching App

A React Native app built with Expo that connects nannies with families looking for childcare services.

## Features

### For Parents
- **Job Posting**: Create detailed job listings with date/time requirements
- **Caregiver Search**: Browse and filter available caregivers
- **Booking System**: Schedule childcare services with conflict detection
- **Children Management**: Manage child profiles with date of birth tracking
- **Real-time Messaging**: Chat with caregivers
- **Payment Confirmation**: Upload payment proof and track transactions

### For Caregivers
- **Job Search**: Browse available jobs with advanced filtering
- **Application Management**: Apply to jobs and track application status
- **Availability Management**: Set working hours and time preferences
- **Booking Management**: View and manage confirmed bookings
- **Profile Management**: Complete profile with skills and certifications
- **Real-time Messaging**: Communicate with parents

### Shared Features
- **Authentication System**: Secure login/registration for both user types
- **Profile Management**: Complete user profiles with photo upload
- **Real-time Notifications**: Stay updated on bookings and messages
- **Responsive Design**: Optimized for both iOS and Android

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens with AsyncStorage
- **Real-time**: Socket.IO for messaging
- **UI Components**: 
  - React Native Paper
  - Expo Vector Icons
  - Custom Date/Time Pickers
  - Lucide React Native Icons
- **Navigation**: React Navigation v6
- **State Management**: React Context API
- **Form Handling**: Custom validation utilities
- **Image Handling**: Expo Image Picker with base64 upload

## App Architecture

### Navigation Structure
```
App
├── Welcome Screen
├── Authentication
│   ├── Parent Auth
│   └── Caregiver Auth
├── Parent Dashboard
│   ├── Job Posting
│   ├── Caregiver Search
│   ├── Booking Management
│   ├── Children Management
│   └── Messages
└── Caregiver Dashboard
    ├── Job Search
    ├── Application Management
    ├── Availability Management
    ├── Booking Management
    └── Messages
```

### Key Components
- **CustomDateTimePicker**: Consistent date/time input with iOS modal support
- **TimePicker**: Custom time selection with AM/PM and 24-hour formats
- **LoadingSpinner**: Reusable loading states
- **ErrorBoundary**: Error handling and recovery

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- MongoDB (local or MongoDB Atlas)

### Quick Start

1. **Clone and Install**
```bash
git clone <repository-url>
cd iyayav0CleanStart
npm install
```

2. **Backend Setup**
```bash
cd iyaya-backend
npm install
cp .env.example .env
# Configure your MongoDB connection and JWT secret in .env
```

3. **Start Backend Server**
```bash
# From iyaya-backend directory
node app.js
# Or use the provided batch file from root:
start-backend.bat
```

4. **Start Expo Development Server**
```bash
# From root directory
npx expo start
```

5. **Run on Device/Simulator**
- **Expo Go (Physical Device):** See [EXPO_GO_SETUP.md](./EXPO_GO_SETUP.md) for detailed setup
- **Quick Expo Go Setup:** Run `npm run setup-network` then scan QR code
- **iOS Simulator:** Press 'i' in Expo CLI
- **Android Emulator:** Press 'a' in Expo CLI
- **Network Issues:** Use `npx expo start --tunnel`

## Project Structure

```
iyayav0CleanStart/
├── src/
│   ├── components/
│   │   ├── DateTimePicker/     # Custom date picker component
│   │   ├── TimePicker/         # Custom time picker component
│   │   └── ErrorBoundary/      # Error handling component
│   ├── screens/
│   │   ├── ParentDashboard/    # Parent-specific screens
│   │   ├── profile/            # Profile management screens
│   │   └── styles/             # Screen-specific styles
│   ├── contexts/
│   │   ├── AuthContext.js      # Authentication state
│   │   ├── MessagingContext.js # Real-time messaging
│   │   └── ThemeContext.js     # App theming
│   ├── services/
│   │   ├── jobsService.js      # Job-related API calls
│   │   ├── bookingService.js   # Booking management
│   │   ├── messagingService.js # Messaging API
│   │   └── profileService.js   # Profile management
│   ├── utils/
│   │   ├── auth.js             # Authentication utilities
│   │   ├── validation.js       # Form validation
│   │   ├── errorHandler.js     # Error handling
│   │   └── logger.js           # Logging utilities
│   └── config/
│       ├── api.js              # API configuration
│       └── constants.js        # App constants
├── iyaya-backend/
│   ├── controllers/            # API route handlers
│   ├── models/                 # MongoDB schemas
│   ├── middleware/             # Authentication & validation
│   ├── routes/                 # API routes
│   └── config/                 # Database & environment config
├── assets/                     # Images, fonts, icons
└── docs/                       # Documentation
```
│   ├── ApplicationsScreen.js
│   └── JobDetailsScreen.js
└── components/          # Reusable components (if needed)
\`\`\`

## API Endpoints Reference

### Authentication Routes (`/api/auth`)
- `POST /register` - Register new user (parent/caregiver)
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /refresh-token` - Refresh JWT token
- `POST /reset-password` - Request password reset
- `POST /confirm-reset-password` - Confirm password reset
- `POST /check-email` - Check if email exists
- `GET /verify-email/:token` - Verify email address
- `POST /resend-verification` - Resend verification email
- `POST /firebase-sync` - Sync Firebase user
- `GET /firebase-profile` - Get Firebase profile
- `PUT /firebase-profile` - Update Firebase profile
- `POST /send-custom-verification` - Send custom verification
- `GET /me` - Get current user profile
- `GET /profile` - Get user profile (alias)
- `PUT /profile` - Update user profile
- `PATCH /role` - Update user role
- `POST /profile/image-base64` - Upload profile image
- `PUT /profile/children` - Update children info
- `GET /health-check` - Service health check

### Caregiver Routes (`/api/caregivers`)
- `GET /` - Search/browse caregivers (public)
- `GET /:id` - Get caregiver details (public)
- `GET /profile` - Get authenticated caregiver profile
- `PUT /profile` - Update caregiver profile
- `POST /documents` - Upload documents/certifications
- `POST /refresh-token` - Refresh auth token
- `POST /background-check` - Request background check

### Job Routes (`/api/jobs`)
- `GET /` - Get all available jobs
- `GET /my` - Get user's posted jobs
- `POST /` - Create new job posting
- `PUT /:id` - Update job
- `GET /:id` - Get job by ID
- `DELETE /:id` - Delete job
- `GET /:id/applications` - Get applications for job

### Application Routes (`/api/applications`)
- `POST /` - Apply to job
- `GET /my-applications` - Get caregiver's applications
- `GET /my` - Get applications (alias)
- `GET /:id` - Get single application
- `PATCH /:id/status` - Update application status
- `DELETE /:id` - Withdraw application
- `GET /job/:jobId` - Get applications for specific job

### Booking Routes (`/api/bookings`)
- `POST /` - Create new booking
- `GET /my` - Get user's bookings
- `GET /:id` - Get booking details
- `PATCH /:id/status` - Update booking status
- `POST /:id/payment-proof` - Upload payment proof
- `DELETE /:id` - Cancel booking

### Message Routes (`/api/messages`)
- `GET /conversations` - Get all conversations
- `GET /conversation/:id` - Get conversation messages
- `GET /conversation/:id/info` - Get conversation info
- `POST /` - Send message
- `POST /conversation/:id/read` - Mark messages as read
- `POST /start` - Start new conversation
- `DELETE /:messageId` - Delete message

### Other Routes
- `/api/profile` - User profile management
- `/api/children` - Child profile management
- `/api/uploads` - File upload handling
- `/api/contracts` - Service contract management
- `/api/privacy` - Privacy settings
- `/api/notifications` - Push notifications
- `/api/payments` - Payment processing
- `/api/data` - Data export/import
- `/api/availability` - Caregiver availability
- `/api/health` - Server health check

**Authentication**: All protected routes require `Authorization: Bearer <token>` header with Firebase or JWT token.

## Features to Implement

### Phase 1 (Current)
- ✅ Authentication with Firebase
- ✅ Role-based navigation
- ✅ Job posting and browsing
- ✅ Basic profile management
- ✅ Application tracking
- ✅ Basic messaging interface

### Phase 2 (Future)
- [ ] Real-time messaging with Socket.IO
- [ ] Push notifications
- [🔄] Image upload for profiles (Backend ✅, Frontend partial)
- [ ] Advanced filtering and search
- [ ] Rating and review system
- [ ] Payment integration
- [ ] Background check verification
- [ ] Calendar integration for scheduling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.


FIREBASE_API_KEY=AIzaSyBH50MntSb5dIQllGoNyCXjx4yHqNFtEPw
FIREBASE_AUTH_DOMAIN=iyayagit.firebaseapp.com
FIREBASE_PROJECT_ID=iyayagit
FIREBASE_STORAGE_BUCKET=iyayagit.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=630487279438
FIREBASE_APP_ID=1:630487279438:web:2b3313ad6f7736c6c2201f
FIREBASE_MEASUREMENT_ID=G-P38FM8WXD2

MONGODB_API_URL=mongodb+srv://rerecentnoswu:knoockk28a@cluster0.emfxnqn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGODB_API_KEY=mongodb+srv://rerecentnoswu:knoockk28a@cluster0.emfxnqn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DATABASE_NAME=iyaya
MONGODB_URI=mongodb://localhost:27017

# this is iYayaGit
# // Import the functions you need from the SDKs you need
# import { initializeApp } from "firebase/app";
# import { getAnalytics } from "firebase/analytics";
# // TODO: Add SDKs for Firebase products that you want to use
# // https://firebase.google.com/docs/web/setup#available-libraries

# // Your web app's Firebase configuration
# // For Firebase JS SDK v7.20.0 and later, measurementId is optional
# const firebaseConfig = {
#   apiKey: "AIzaSyBH50MntSb5dIQllGoNyCXjx4yHqNFtEPw",
#   authDomain: "iyayagit.firebaseapp.com",
#   projectId: "iyayagit",
#   storageBucket: "iyayagit.firebasestorage.app",
#   messagingSenderId: "630487279438",
#   appId: "1:630487279438:web:2b3313ad6f7736c6c2201f",
#   measurementId: "G-P38FM8WXD2"
# };

# // Initialize Firebase
# const app = initializeApp(firebaseConfig);
# const analytics = getAnalytics(app);




# # MongoDB Configuration
# MONGODB_URI=mongodb://localhost:27017/iyaya

# # Firebase Configuration
# FIREBASE_PROJECT_ID=iyayav0
# FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDXrGOt1VvYk+Jp\nk7dSXTd23jW2A04r0Jnbxr7hSPAZpQt3zlIIQRa9kcSpmqsxTJUotp5T6izZHjFL\nkX7v7PgBQeFulY6U7mnl57iDHPmKEgGMj72sER8SR0Y2tJWd6E8rT63GI85sWOp+\n4U0E3GYAkny/Pn2MwB5NJmzIErqGqQCsGRif8E7ovFTK617V0A953O5N7l8dLT1J\npg+QE9vNvH5n3/wcmMrzf9JG9ur/Lvu+YwJcGX9jw77LvxB8o3q8ZMmPY+xcNiXd\n9rjqqK8BGs53ornr+fxq+rBL6zArzcKSQSI9BowyZKdNgBgEvQFFa48KTj48UY8b\n5O/Nn6ybAgMBAAECggEARTNG+GvRAHjS2NVQqNjIBxfdW/1Lg7t24pGuhVKF13Sh\nbVuB7qwTw9eVpmW+MB9GbL3Lp1kn8rJBVuHkPM9n899Tmcva5+ZnjCEBjvApESgd\n3x/v19nWgmLkIIFo0DXN0TPLqhurDBCrjPJ1Z+3fvKdD54kBd7vc/RwrIzb/Kl1Q\nvz49UYnonz8T6aWQ6LTsxhRILjb+t31TXV6T8hJ/7EoU4Q2XLbi7Upaddka7pG9j\neLvEolk5yGRiu/06Ktqg54HO1Y1BsTkQmaKnczCaAh1gsMycdo0LMpnlbS2q3Gaj\naVhbFyajR55grdlN/6bCOpPev1qflodMN+S47w3x4QKBgQDy2Ro9nv99KaGdZKDH\ndbYIZvooy9WoqOzZRB2t7D1sbUhnFSx21IOGPvrrhfQCwZi0vaMqn/lud0+SeOaq\nSg9Hg7i7umFLGj3bJl3HQVdwEmLjCeb5kiLDNbk9itya0FeHDuc6mfoWZwjrUWGk\nX5/zJgrmGWX6zSNigzN8jmLzvwKBgQDjWogTpBXBB4U6F+uA8nZjRO73icz6Qj09\nRlMjvPv0xcR5wAtqdTnsq1csn43dcKIcopQlFq3SR5aQV7cpX8KQAwYQ9NtjrK4a\nq0lDNNVlE+4uwAP0IEM2SmB3x/ujy4tFl/PtlX1oU5egwq5aaIZ2Ewgc2Wsse+di\nUa54N4IOJQKBgQCRRGMZB1pnYZbmksJGblh0kD0GWGA3os0Dbmaemlln2btcxmKx\nto/ypwvsBVYgq/QP8fx/y/AmL0KvKJk6tlCLg/TmfygiB9GGnV2tip2mUalLjKnZ\nEpyuzx0+/ijWhthE1xpkiKT776h7M1RIQldo2JHecMT7EOkgzcDnujjg+wKBgEna\necOvlKV8tOl3JbhgitaaaOoeaGiPJeeGtbExTcNojvdhzBOL+wIHcqz7M5FQakjV\nAzy9Dj/1o1JGPCiDg+dWJB1T/QR27qOZKpZbTkqkW8Xx+BbQeCTlqkqeuv6tOxOj\nVcjCu9cs+F9vfkW+GJe4fPUqJ2du5G4KzJsepO/FAoGBAKlvPznhA4ixv2zXi/U5\nScjrLn6zUuYrXNpi/r7RL6GrfB4ivQd7UdxU1ChksAzsXNzU2zoBVKH9K6PeT3Tt\nDjHR9EuClClW3GUC3FXRyJypl+oNqb8pn1UACC+rff8rk7nv5XVxOk5CKSZTkPMx\nNDvAzgNE3m9mNiEHpXu4X0lj\n-----END PRIVATE KEY-----\n
# FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@iyayav0.iam.gserviceaccount.com

# # JWT Configuration
# JWT_SECRET=ecb938a178861cc6f6b209ef96d76118765f123c406852efe8b27ddfc492ae32
# JWT_EXPIRE=30d


# # Server Configuration
# PORT=3000
# NODE_ENV=development
# FRONTEND_URL=http://localhost:8081

# # File Upload Configuration
# MAX_FILE_SIZE=10485760
# UPLOAD_PATH=./uploads

# {
#   "type": "service_account",
#   "project_id": "iyayav0",
#   "private_key_id": "458f08be77c6152e96d987d868612c515d2d1f75",
#   "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDXrGOt1VvYk+Jp\nk7dSXTd23jW2A04r0Jnbxr7hSPAZpQt3zlIIQRa9kcSpmqsxTJUotp5T6izZHjFL\nkX7v7PgBQeFulY6U7mnl57iDHPmKEgGMj72sER8SR0Y2tJWd6E8rT63GI85sWOp+\n4U0E3GYAkny/Pn2MwB5NJmzIErqGqQCsGRif8E7ovFTK617V0A953O5N7l8dLT1J\npg+QE9vNvH5n3/wcmMrzf9JG9ur/Lvu+YwJcGX9jw77LvxB8o3q8ZMmPY+xcNiXd\n9rjqqK8BGs53ornr+fxq+rBL6zArzcKSQSI9BowyZKdNgBgEvQFFa48KTj48UY8b\n5O/Nn6ybAgMBAAECggEARTNG+GvRAHjS2NVQqNjIBxfdW/1Lg7t24pGuhVKF13Sh\nbVuB7qwTw9eVpmW+MB9GbL3Lp1kn8rJBVuHkPM9n899Tmcva5+ZnjCEBjvApESgd\n3x/v19nWgmLkIIFo0DXN0TPLqhurDBCrjPJ1Z+3fvKdD54kBd7vc/RwrIzb/Kl1Q\nvz49UYnonz8T6aWQ6LTsxhRILjb+t31TXV6T8hJ/7EoU4Q2XLbi7Upaddka7pG9j\neLvEolk5yGRiu/06Ktqg54HO1Y1BsTkQmaKnczCaAh1gsMycdo0LMpnlbS2q3Gaj\naVhbFyajR55grdlN/6bCOpPev1qflodMN+S47w3x4QKBgQDy2Ro9nv99KaGdZKDH\ndbYIZvooy9WoqOzZRB2t7D1sbUhnFSx21IOGPvrrhfQCwZi0vaMqn/lud0+SeOaq\nSg9Hg7i7umFLGj3bJl3HQVdwEmLjCeb5kiLDNbk9itya0FeHDuc6mfoWZwjrUWGk\nX5/zJgrmGWX6zSNigzN8jmLzvwKBgQDjWogTpBXBB4U6F+uA8nZjRO73icz6Qj09\nRlMjvPv0xcR5wAtqdTnsq1csn43dcKIcopQlFq3SR5aQV7cpX8KQAwYQ9NtjrK4a\nq0lDNNVlE+4uwAP0IEM2SmB3x/ujy4tFl/PtlX1oU5egwq5aaIZ2Ewgc2Wsse+di\nUa54N4IOJQKBgQCRRGMZB1pnYZbmksJGblh0kD0GWGA3os0Dbmaemlln2btcxmKx\nto/ypwvsBVYgq/QP8fx/y/AmL0KvKJk6tlCLg/TmfygiB9GGnV2tip2mUalLjKnZ\nEpyuzx0+/ijWhthE1xpkiKT776h7M1RIQldo2JHecMT7EOkgzcDnujjg+wKBgEna\necOvlKV8tOl3JbhgitaaaOoeaGiPJeeGtbExTcNojvdhzBOL+wIHcqz7M5FQakjV\nAzy9Dj/1o1JGPCiDg+dWJB1T/QR27qOZKpZbTkqkW8Xx+BbQeCTlqkqeuv6tOxOj\nVcjCu9cs+F9vfkW+GJe4fPUqJ2du5G4KzJsepO/FAoGBAKlvPznhA4ixv2zXi/U5\nScjrLn6zUuYrXNpi/r7RL6GrfB4ivQd7UdxU1ChksAzsXNzU2zoBVKH9K6PeT3Tt\nDjHR9EuClClW3GUC3FXRyJypl+oNqb8pn1UACC+rff8rk7nv5XVxOk5CKSZTkPMx\nNDvAzgNE3m9mNiEHpXu4X0lj\n-----END PRIVATE KEY-----\n",
#   "client_email": "firebase-adminsdk-fbsvc@iyayav0.iam.gserviceaccount.com",
#   "client_id": "109118665986407966380",
#   "auth_uri": "https://accounts.google.com/o/oauth2/auth",
#   "token_uri": "https://oauth2.googleapis.com/token",
#   "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
#   "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40iyayav0.iam.gserviceaccount.com",
#   "universe_domain": "googleapis.com"
# }
# // Import the functions you need from the SDKs you need
# import { initializeApp } from "firebase/app";
# import { getAnalytics } from "firebase/analytics";
# // TODO: Add SDKs for Firebase products that you want to use
# // https://firebase.google.com/docs/web/setup#available-libraries

# // Your web app's Firebase configuration
# // For Firebase JS SDK v7.20.0 and later, measurementId is optional
# const firebaseConfig = {
#   apiKey: "AIzaSyC7Flwhydbq1qV3tw_QchXr8_5Wg0wOshk",
#   authDomain: "iyayav0.firebaseapp.com",
#   projectId: "iyayav0",
#   storageBucket: "iyayav0.firebasestorage.app",
#   messagingSenderId: "433110030942",
#   appId: "1:433110030942:web:831e0450381ef9b318f2cf",
#   measurementId: "G-N952TEZFY9"
# };
# # mongosh "mongodb+srv://cluster0.emfxnqn.mongodb.net/" --apiVersion 1 --username rerecentnoswu --password knoockk28a
# // Initialize Firebase
# const app = initializeApp(firebaseConfig);
# const analytics = getAnalytics(app);
# mongodb+srv://rerecentnoswu:knoockk28a@cluster0.emfxnqn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

src/
  components/
    BookingDetailsModal.js
    BookingModal.js
  screens/
    CaregiverDashboard.js
    ParentDashboard.js
    WelcomeScreen.js
    ParentAuth.js
    CaregiverAuth.js
  App.js
  config/
    firebaseConfig.js
  context/
    AppContext.js

    CaregiverProfile.js (Parent)
├── BookingModal.js
│   ├── Receives: caregiver data, children data
│   └── Returns: booking data when confirmed
└── BookingDetailsModal.js
    ├── Receives: booking data
    └── Returns: user actions (message, directions, complete, cancel)


    check the recent implementation and create a detailed step by step and little by little plan on how to implement on this app the notification, firebase messaging and reviews. consider this has a parentdashboard and caregiverdashboard and follow best practices.

    # Implementation Plan Overview
- **[Goal]** Incrementally deliver in-app notifications, real-time Firebase messaging, and review workflows across both `ParentDashboard` and [CaregiverDashboard](cci:1://file:///c:/Users/reycel/iYayaAll2/iyayabackupzip/09172025cleandatabase/09172025cleandatabase/src/screens/CaregiverDashboard.js:272:0-1812:1), aligning with existing architecture (`src/screens/CaregiverDashboard/`, `src/screens/ParentDashboard/`, shared services under `src/services/`).

# Phase 1 · Foundations & Infrastructure
- **[Audit current setup]** Review [src/config/firebase.js](cci:7://file:///c:/Users/reycel/iYayaAll2/iyayabackupzip/09172025cleandatabase/09172025cleandatabase/src/config/firebase.js:0:0-0:0), [src/services/firebaseMessagingService.js](cci:7://file:///c:/Users/reycel/iYayaAll2/iyayabackupzip/09172025cleandatabase/09172025cleandatabase/src/services/firebaseMessagingService.js:0:0-0:0), and messaging components to document existing functionality and gaps.
- **[Define data contracts]** Draft TypeScript-friendly interfaces in `src/shared/types/` for notifications, chat threads, and reviews to ensure consistent data handling.
- **[Backend alignment]** Confirm API endpoints in `iyaya-backend/controllers/` exist for notifications/reviews; create missing routes/controllers (e.g., `notificationsController.js`, `reviewsController.js`) following existing Express patterns.

# Phase 2 · Notifications System
- **[Database schema]** In backend models, add `Notification` schema with fields (userId, actorId, type, payload, readAt) and indexes optimized for querying by user.
- **[API endpoints]** Implement REST endpoints under `iyaya-backend/routes/notificationsRoutes.js` for list, mark-as-read, and subscription toggles. Secure with role-aware middleware (`auth.js`).
- **[Service layer]** Add `src/services/notificationService.js` handling fetch, polling, and status updates; integrate with `tokenManager` for auth headers.
- **[Context & hooks]** Create `src/contexts/NotificationContext.js` with React Query or Redux slice (per existing state management) to centralize notification state and provide hooks `useNotifications()`/`useNotificationActions()`.
- **[UI components]** 
  - Add bell icon badges in `ParentDashboard` header (`src/screens/ParentDashboard/components/Header.js`) and equivalent caregiver header (`src/screens/CaregiverDashboard/components/DashboardHeader.js`).
  - Build `NotificationList` component in `src/components/notifications/` using `FlatList` with grouped sections (new vs earlier) and CTA buttons.
- **[Trigger points]** Wire backend events (booking accepted, message received, review posted) to emit notifications, reusing message queue where available.
- **[Testing]** Write unit tests for service + context, create Cypress or Detox scenario verifying notification indicator increments and resets.

# Phase 3 · Firebase Messaging Enhancements
- **[Refactor service]** Clean [src/services/firebaseMessagingService.js](cci:7://file:///c:/Users/reycel/iYayaAll2/iyayabackupzip/09172025cleandatabase/09172025cleandatabase/src/services/firebaseMessagingService.js:0:0-0:0) to use new guards ([safeDatabaseOperation](cci:1://file:///c:/Users/reycel/iYayaAll2/iyayabackupzip/09172025cleandatabase/09172025cleandatabase/src/config/firebase.js:334:0-347:2), [createRef](cci:1://file:///c:/Users/reycel/iYayaAll2/iyayabackupzip/09172025cleandatabase/09172025cleandatabase/src/config/firebase.js:248:0-266:2)); extract channel management to `messagingChannelService.js`.
- **[State synchronization]** Add Redux slice or context (`src/contexts/MessagingContext.js`) to manage conversation lists, unread counts, and online status for both dashboards.
- **[UI upgrades]** 
  - Parent: ensure `ParentDashboard` message tab loads thread previews with last message/time.
  - Caregiver: enhance `src/screens/CaregiverDashboard/components/MessagesTab.js` with optimistic message sending, typing indicators (via presence refs).
- **[Push notifications]** If Expo push is required, integrate `expo-notifications`:
  - Register device tokens in `src/hooks/usePushNotifications.js`.
  - Store tokens per user in backend (`users` collection) and trigger push on new Firebase message.
- **[Reliability features]** Implement message delivery receipts using Firebase `set`/`update` status fields; ensure offline queue (`OfflineMessageQueue`) flushes with new safe helpers.
- **[QA]** Simulate two users exchanging messages; verify realtime updates, push notifications, and error resilience.

# Phase 4 · Reviews Workflow
- **[Backend endpoints]** In `iyaya-backend/controllers/reviewController.js`, provide CRUD for parent→caregiver reviews and caregiver responses; enforce one review per booking.
- **[Database structure]** Extend `Booking` model to track review status; create `Review` model with rating, comment, visibility, moderation flags.
- **[Frontend service]** Add `src/services/reviewService.js` with methods (`fetchReviews`, `submitReview`, `respondToReview`, `reportReview`).
- **[UI components]**
  - Parent: build modal (`src/components/reviews/ReviewFormModal.js`) triggered after booking completion; include validation and success feedback.
  - Caregiver: enhance `src/screens/CaregiverReviewsScreen.js` to display aggregated ratings, allow responses, and filter.
  - Shared: update profile sections (`CaregiverProfileSection`, `ParentDashboard/Profile`) to show average rating and latest reviews.
- **[Notifications hook-in]** Trigger notification + optional push when a new review or response is posted.
- **[Analytics & moderation]** Log review submissions in backend for audit; optionally integrate abuse reporting UI.

# Phase 5 · Rollout & Best Practices
- **[Feature flagging]** Wrap new features behind config flags (e.g., `FEATURE_FLAGS.notifications`) stored in `.env` or remote config for staged rollout.
- **[Documentation]** Update [README.md](cci:7://file:///c:/Users/reycel/iYayaAll2/iyayabackupzip/09172025cleandatabase/09172025cleandatabase/README.md:0:0-0:0) and `ARCHITECTURE.md` with flows, API contracts, and setup instructions for Firebase keys, push notifications, and review permissions.
- **[Testing & QA]** Create regression suites covering parent/caregiver scenarios; include snapshot tests for new UI components.
- **[Monitoring]** Add logging around notification delivery and Firebase operations; consider Sentry integration for runtime errors.

# Status
- Task completed: Provided a detailed incremental implementation plan for notifications, Firebase messaging, and reviews across both dashboards.

Recommended Actions
Messaging cleanup: Keep only the realtime Firebase implementation. Remove or migrate 
src/components/MessageItem.js
 and the *Local.js messaging artifacts so both dashboards rely exclusively on 
firebaseMessagingService.js
 plus the 
MessagingInterface
 components.
Phase 1 deliverables:
Document existing Firebase messaging behavior and gaps.
Add shared TypeScript-friendly definitions (e.g., ChatConversation, ChatMessage, Notification, Review) under src/shared/types/.
Draft or confirm Express controllers/routes in the backend for notifications and reviews (e.g., notificationsController.js, reviewsController.js).
Phase 2 preparations:
Design MongoDB Notification schema and corresponding REST endpoints.
Implement src/services/notificationService.js and expand NotificationContext to match the plan before wiring UI badges/lists.
Identify event hooks (booking updates, review submissions) that should trigger notifications.
Phase 3+ roadmap:
Refactor 
firebaseMessagingService.js
 to use the safe helpers (
safeDatabaseOperation
, 
createRef
) consistently and extract channel management into a dedicated service per plan.
Add centralized MessagingContext or Redux slice for conversation/unread state.
Schedule UI enhancements (typing indicators, optimistic send) for both dashboards.
Begin outlining MongoDB review services and UI (Review form modal, caregiver response view) once backend endpoints exist.
01JEY5AQN7L WIFI PASSWORD



Step-by-Step Implementation Plan
Phase 0 · Discovery & Alignment
[0.1 Inventory Firebase messaging] Catalogue functions exported by src/services/firebaseMessagingService.js, note usage across src/components/messaging/ and dashboard tabs. Document findings in docs/messaging-audit.md.
[0.2 Review auth & token flow] Confirm push token storage strategy by inspecting src/utils/tokenManager.js and AuthContext to ensure headers are available for new services.
[0.3 Backend capability check] Verify iyaya-backend/ has JWT-protected endpoints for notifications/reviews. If missing, open tickets for controller/route creation.
Phase 1 · Shared Foundations
[1.1 Type definitions] Create src/shared/types/index.ts containing Notification, ChatConversation, ChatMessage, Review, ReviewResponse, and re-export for JS consumers (JSDoc typedefs).
[1.2 API clients] Add notificationService and reviewService stubs in src/services/ returning mocked data to unblock UI work.
[1.3 State scaffolding] Decide on Redux slice vs context. If following Redux Toolkit pattern documented in memories, add notificationSlice.ts and reviewSlice.ts under src/store/.
Phase 2 · Notification System (Parent & Caregiver)
[2.1 Backend schema] In iyaya-backend/models/Notification.js, define schema with userId, actorId, type, entityRef, payload, readAt, timestamps, and indexes.
[2.2 REST endpoints] Implement controller (controllers/notificationController.js) and router (routes/notificationRoutes.js) supporting GET /notifications, PATCH /notifications/:id/read, PATCH /notifications/read-all.
[2.3 Service layer] Flesh out src/services/notificationService.js with fetchNotifications(), markAsRead(), markAllAsRead(), subscribeSocket() (placeholder).
[2.4 Notification context] Create src/contexts/NotificationContext.js exposing useNotifications() and useNotificationActions(); integrate into 
App.js
 provider tree near MessagingProvider.
[2.5 UI entry points]
Parent: augment src/screens/ParentDashboard/components/Header.js with bell badge, connect to context.
Caregiver: update src/screens/CaregiverDashboard/components/DashboardHeader.js similarly.
Build NotificationList component under src/components/notifications/ consumed by modal in both dashboards.
[2.6 Trigger integration] Add backend hooks (e.g., inside booking controller, messaging service) to create notifications. Use existing event bus if available; otherwise add service wrappers.
[2.7 Tests]
Frontend: Jest tests for notification context reducers/services.
Backend: Supertest suite verifying auth protection and pagination.
Phase 3 · Firebase Messaging Enhancements
[3.1 Service refactor] Update src/services/firebaseMessagingService.js to call safeDatabaseOperation() and createRef() from src/config/firebase.js. Extract channel utilities into src/services/messagingChannelService.js.
[3.2 Central messaging state] Implement MessagingContext (or Redux slice) to track conversations, unread counts, current thread. Place provider near NotificationProvider.
[3.3 Parent dashboard messaging] Modify src/screens/ParentDashboard/components/MessagesTab.js (and associated components) to consume messaging state, show conversation previews with last message timestamp.
[3.4 Caregiver messaging enhancements] Do same for src/screens/CaregiverDashboard/components/MessagesTab.js, adding optimistic sending via local queue (src/components/messaging/OfflineMessageQueue.js).
[3.5 Presence & typing indicators] Add Firebase refs storing user presence/typing; display in both dashboards.
[3.6 Push notifications (optional)
Integrate expo-notifications, create src/hooks/usePushNotifications.js.
Store device tokens via backend endpoint (POST /users/device-token).
Fire push notifications on new messages.
[3.7 QA scenarios] End-to-end test with two simulators ensuring real-time updates, offline queue flush, and no infinite renders.
Phase 4 · Review Workflow
[4.1 Backend review model] Introduce Review schema referencing bookingId, authorId, caregiverId, rating, comment, response, status.
[4.2 Routes & policies] Controller controllers/reviewController.js handling POST /bookings/:id/review, GET /caregivers/:id/reviews, POST /reviews/:id/response. Enforce one review per completed booking.
[4.3 Frontend services] Implement src/services/reviewService.js hooking into new endpoints; ensure tokenManager used for auth.
[4.4 Parent UI] Add ReviewFormModal in src/components/reviews/ triggered after booking completes on 
ParentDashboard
.
[4.5 Caregiver UI] Update src/screens/CaregiverDashboard/components/ReviewsTab.js to consume real data, display averages, allow responses.
[4.6 Profile integration] Surface average ratings in 
ParentDashboard
 profile and caregiver profile components.
[4.7 Notifications] Use notification system to alert caregivers about new reviews and parents about responses.
Phase 5 · Quality, Documentation, Rollout
[5.1 Feature flags] Add config keys (e.g., FEATURE_NOTIFICATIONS) in src/config/featureFlags.js and utilize in providers to enable staged rollout.
[5.2 Documentation updates] Refresh 
README.md
, ARCHITECTURE.md, and create NOTIFICATIONS.md detailing setup, schemas, and integration steps.
[5.3 Automated tests] Expand Jest coverage, add Detox or Cypress flows for parent/caregiver running through notifications, messaging, reviews.
[5.4 Monitoring & analytics] Instrument analytics events (
useAnalytics
) for notification open, message send, review submit. Add backend logging and consider Sentry alerts.
Phase 6 · Cleanup & Enhancements
[6.1 Legacy removal] Delete or migrate obsolete messaging components mentioned in README (e.g., src/components/MessageItem.js, legacy Local artifacts).
[6.2 Performance tuning] Memoize heavy dashboard components, ensure contexts use selectors to avoid re-renders.
[6.3 Accessibility & UX polish] Add toasts, skeleton loaders, empty states, and confirm both dashboards meet accessibility guidelines.
Recommended Next Actions
[Immediate] Complete Phase 0 audits, share findings with stakeholders.
[Short-term] Implement Phase 1 artifacts (types, services, state scaffolds) to unblock parallel backend work.
[Clarification] The string “01JEY5AQN7L WIFI PASSWORD” appears unrelated to implementation; confirm if it’s a placeholder or can be ignored.
Once Phase 1 is underway, we can iterate on Phases 2–4 with backend/frontend teams in parallel, enabling gradual feature rollout across Parent and Caregiver dashboards.



Implementation Gaps
Messaging: Need centralized state (Redux slice or enhanced context), service refactor to extract channel helpers, presence/typing indicators, Expo push integration pipeline, and UI polish for both dashboards.
Notifications: Missing NotificationContext, UI components (bell badge, list modal), frontend tests, and backend trigger wiring for booking/message/review events.
Reviews: Need backend controller/routes, REST endpoints, and frontend service + workflow (submit modal, caregiver response, analytics).
Recommended Actions
Messaging:
[Refactor service] Extract channel utilities, ensure all Firebase calls use safeDatabaseOperation and createRef.
[State layer] Build MessagingContext/Redux slice storing conversations and unread counts.
[UI updates] Enhance parent/caregiver message tabs for previews, optimistic sending, typing indicators, offline queue flush.
[Push integration] Finish frontend deviceTokenService + usePushNotifications.js, register tokens in AuthContext, trigger backend push on new messages.
Notifications:
[Frontend infrastructure] Implement NotificationContext, notificationService, UI badge/list in dashboard headers.
[Backend triggers] Add create-notification calls in booking/messaging/review controllers.
[Testing] Jest tests for context reducers; Supertest coverage for notification routes.
Reviews:
[Backend API] Create reviewController.js, routes, and service logic enforcing one review per booking.
[Frontend service] Add reviewService.js with CRUD methods; integrate with ReviewContext.
[UI workflow] Parent review form modal, caregiver review management, profile summaries; trigger notifications when reviews/ responses posted.
Push tokens:
[Frontend implementation] Create src/services/deviceTokenService.js, src/hooks/usePushNotifications.js, update AuthContext to register/deregister tokens, and add logout cleanup.
Status
Backend device-token endpoints are in place; all other messaging/notification/review enhancements remain to be implemented following best practices above.


Notifications
[testing] Add unit tests for NotificationContext reducers and integration tests for notification flows.
[backend coordination] Confirm backend review/booking/message triggers fire notificationEvents payloads expected by front end.
Reviews
[backend] Implement REST controller/routes enforcing single-review-per-booking and returning summaries.
[frontend polish] Wire rating summary refresh + analytics updates (e.g., rating badges, dashboard metrics) after submissions.
Push tokens
[auth integration] Hook 
usePushNotifications()
 into AuthContext lifecycle so tokens register on login and clear on logout.