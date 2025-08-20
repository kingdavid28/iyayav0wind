# Iyaya App Setup Instructions

## Prerequisites

1. **Node.js** (v16 or higher)
2. **MongoDB** (local installation or MongoDB Atlas)
3. **Firebase Project**
4. **Expo CLI** (`npm install -g @expo/cli`)

## Backend Setup

### 1. MongoDB Setup

**Option A: Local MongoDB**
\`\`\`bash
# Install MongoDB locally
# macOS
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Create database
mongosh
use iyaya
\`\`\`

**Option B: MongoDB Atlas (Cloud)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get connection string
4. Update `.env` file with connection string

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project named "iyaya-app"
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password
4. Generate service account key:
   - Go to Project Settings > Service accounts
   - Click "Generate new private key"
   - Download the JSON file
5. Update `.env` file with Firebase credentials

### 3. Backend Installation

\`\`\`bash
# Clone and setup backend
cd backend
npm install

# Copy environment file
cp .env.example .env

# Update .env with your credentials
nano .env

# Start development server
npm run dev

# Seed sample data (optional)
npm run seed
\`\`\`

### 4. Environment Variables

Update `backend/.env`:

\`\`\`env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/iyaya

# Firebase (from service account JSON)
FIREBASE_PROJECT_ID=iyaya-app
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@iyaya-app.iam.gserviceaccount.com

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:19006
\`\`\`

## Frontend Setup

### 1. React Native App Setup

\`\`\`bash
# Install dependencies
npm install

# Install additional packages for Firebase
npm install @react-native-async-storage/async-storage

# Start Expo development server
npm start
\`\`\`

### 2. Firebase Configuration

Update `src/config/firebase.js` with your Firebase config:

\`\`\`javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "iyaya-app.firebaseapp.com",
  projectId: "iyaya-app",
  storageBucket: "iyaya-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "your-app-id"
}
\`\`\`

### 3. API Configuration

Update `src/config/api.js`:
- Set correct backend URL
- Ensure auth interceptors are working

## Testing the Setup

### 1. Backend Health Check

\`\`\`bash
curl http://localhost:3000/api/health
\`\`\`

Should return:
\`\`\`json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.456
}
\`\`\`

### 2. Test Authentication

1. Open the app in Expo Go
2. Register a new account
3. Select role (nanny/employer)
4. Check if user appears in MongoDB

### 3. Test API Endpoints

\`\`\`bash
# Get jobs
curl http://localhost:3000/api/jobs

# Get nannies
curl http://localhost:3000/api/users/nannies
\`\`\`

## Common Issues & Solutions

### MongoDB Connection Issues
- Ensure MongoDB is running: `brew services list | grep mongodb`
- Check connection string in `.env`
- Verify network access (for Atlas)

### Firebase Authentication Issues
- Verify Firebase config in both frontend and backend
- Check service account permissions
- Ensure Authentication is enabled in Firebase Console

### Expo/React Native Issues
- Clear cache: `expo start -c`
- Restart Metro bundler
- Check for version conflicts

### API Connection Issues
- Verify backend is running on correct port
- Check CORS configuration
- Ensure API_BASE_URL is correct in frontend

## Production Deployment

### Backend (Heroku/Railway/Vercel)
1. Set environment variables
2. Update CORS origins
3. Use production MongoDB URI

### Frontend (Expo/App Stores)
1. Update API_BASE_URL for production
2. Build with `expo build`
3. Submit to app stores

## Support

If you encounter issues:
1. Check the logs in terminal
2. Verify all environment variables
3. Test API endpoints individually
4. Check Firebase console for auth issues
Remove-Item -Recurse -Force node_modules, package-lock.json











 Authentication System
Status: Partially Implemented
Files:
src/screens/CaregiverAuth.js
src/screens/ParentAuth.js
src/contexts/AuthContext.js
Issues:
Basic authentication flow exists but lacks proper form validation
No password reset functionality
Missing email verification flow
Social login (Google, Facebook) not implemented
Session persistence needs improvement
2. Parent Dashboard
Status: Partially Implemented
Files:
src/screens/ParentDashboard/
 (multiple versions)
src/screens/ParentDashboard/components/
Issues:
Multiple versions of the same component (
ParentDashboard.new.js
, 
ParentDashboard.fixed.js
, etc.)
Style syntax error in 
ParentDashboard.new.js
 (referenced in memories)
Incomplete implementation of job posting functionality
Missing real-time updates for job applications
Incomplete profile management
3. Caregiver Dashboard
Status: Partially Implemented
Files:
src/screens/CaregiverDashboard.js
src/screens/CaregiverDashboard_clean.js
Issues:
Basic UI exists but lacks functionality
Incomplete job search and filter implementation
Missing application management system
Profile editing not fully implemented
4. Messaging System
Status: Basic Implementation
Files:
src/screens/Messages.js
src/screens/ChatScreen.js
src/services/chatService.js
Issues:
Basic chat interface exists but lacks real-time functionality
No message read receipts
File/image sharing not implemented
No message search functionality
5. Booking System
Status: Partially Implemented
Files:
src/components/BookingModal.js
src/screens/ParentDashboard/components/JobCard.js
Issues:
Basic booking flow exists but lacks payment integration
No calendar view for availability
Missing booking confirmation and reminders
No cancellation policy implementation
6. Profile Management
Status: Basic Implementation
Files:
src/screens/profile/ProfileScreen.js
src/screens/ParentDashboard/components/ProfileModal.js
Issues:
Basic profile viewing implemented
Incomplete profile editing functionality
Missing document upload for verification
No rating/review system
7. Services Layer
Status: Partially Implemented
Files:
src/services/
 (various service files)
Issues:
Basic CRUD operations exist but lack error handling
No retry mechanism for failed requests
Inconsistent error responses
Missing proper API documentation
8. Testing
Status: Largely Missing
Files:
src/test-utils.tsx
 (empty or minimal)
Issues:
No test coverage for components
Missing unit tests for services
No integration tests
No end-to-end tests
9. Documentation
Status: Incomplete
Files:
SETUP_INSTRUCTIONS.md (minimal content)
Issues:
Missing API documentation
No developer onboarding guide
Incomplete code comments
No architecture documentation
10. Error Handling
Status: Basic Implementation
Files:
src/utils/errorHandler.js
src/utils/logger.js
Issues:
Basic error handling exists but is inconsistent
No centralized error logging
Missing error boundaries in React components
Incomplete error messages for users
11. Performance
Status: Not Optimized
Issues:
No code splitting
No image optimization
Missing lazy loading for components
No performance monitoring
12. Accessibility
Status: Partially Implemented
Issues:
Basic ARIA labels exist but are inconsistent
Missing keyboard navigation support
Inadequate color contrast in some components
No screen reader testing
13. Internationalization (i18n)
Status: Missing
Issues:
No support for multiple languages
Hardcoded strings throughout the codebase
No RTL (Right-to-Left) support
14. Security
Status: Basic
Issues:
CORS configuration issues (referenced in memories)
No rate limiting
Input sanitization needed
Missing security headers
15. Deployment
Status: Partially Configured
Issues:
No CI/CD pipeline
Missing environment-specific configurations
No automated deployment process
16. Monitoring and Analytics
Status: Missing
Issues:
No error tracking
No user analytics
No performance monitoring
No usage statistics
17. Code Quality
Status: Needs Improvement
Tools:
ESLint configured (.eslintignore exists)
Prettier configured (.prettierrc.js exists)
Issues:
Inconsistent code style
Unused variables and imports
Missing TypeScript types
No code quality checks in CI
18. State Management
Status: Basic
Issues:
Mix of local state and context
No centralized state management solution
Prop drilling in some components
No state persistence
19. API Integration
Status: Partially Implemented
Issues:
Inconsistent API response handling
No request/response interceptors
Missing API versioning
No API documentation
20. Offline Support
Status: Missing
Issues:
No offline data persistence
No sync mechanism
No offline queue for actions
Recommendations for Next Steps:
Prioritize fixing the CORS issues and style errors mentioned in the memories
Implement proper error handling and logging
Set up testing infrastructure
Complete the authentication flow
Implement the booking and payment system
Add proper documentation
Set up CI/CD pipeline
Implement monitoring and analytics