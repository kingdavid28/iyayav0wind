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

## API Endpoints (MongoDB Backend)

You'll need to create a Node.js/Express backend with the following endpoints:

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create new job
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs/:id/apply` - Apply to job

### Users
- `GET /api/nannies` - Get all nannies
- `GET /api/nannies/:id` - Get nanny by ID
- `PUT /api/nannies/:id` - Update nanny profile
- `GET /api/employers/:id` - Get employer by ID
- `PUT /api/employers/:id` - Update employer profile

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
- [ ] Image upload for profiles
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