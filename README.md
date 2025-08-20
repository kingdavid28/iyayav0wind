# Iyaya - Nanny & Employer Matching App

A React Native app built with Expo that connects nannies with families looking for childcare services.

## Features

### For Nannies:
- Browse available job postings
- Filter jobs by location, salary, and requirements
- Apply to jobs with one tap
- Track application status
- Chat with potential employers
- Manage profile and availability

### For Employers:
- Post job listings
- Browse available nannies
- Filter nannies by experience and skills
- Send messages and invitations
- Manage applications and hiring process
- Track job posting performance

## Tech Stack

- **Frontend**: React Native with Expo
- **Authentication**: Firebase Auth
- **Database**: MongoDB (local setup)
- **Navigation**: React Navigation
- **UI Components**: React Native Paper
- **Chat**: React Native Gifted Chat
- **Icons**: Expo Vector Icons

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- MongoDB (local installation)
- Firebase project setup

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd iyaya-app
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Configure Firebase:
   - Create a Firebase project
   - Enable Authentication (Email/Password)
   - Update `src/config/firebase.js` with your Firebase config

4. Set up MongoDB:
   - Install MongoDB locally
   - Create a database named `iyaya`
   - Set up collections: `users`, `jobs`, `applications`, `messages`

5. Start the development server:
\`\`\`bash
npm start
\`\`\`

6. Run on device:
   - Install Expo Go app on your phone
   - Scan the QR code from the terminal

## Project Structure

\`\`\`
src/
├── config/
│   ├── firebase.js      # Firebase configuration
│   └── api.js          # API endpoints and axios setup
├── screens/
│   ├── SplashScreen.js
│   ├── LoginScreen.js
│   ├── RegisterScreen.js
│   ├── RoleSelectionScreen.js
│   ├── NannyHomeScreen.js
│   ├── EmployerHomeScreen.js
│   ├── CreateJobScreen.js
│   ├── NannyListScreen.js
│   ├── ProfileScreen.js
│   ├── ChatScreen.js
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