# Onboarding Feature

## Overview
A 5-page onboarding flow that introduces new users to the Iyaya app features. Shows only on first app install and never again.

## Features
- **5 Focused Pages**: Welcome, Parent Features (2 pages), Caregiver Features (2 pages)
- **Role-Specific Content**: Dedicated pages for parent and caregiver functions
- **Smooth Navigation**: Swipe or tap to navigate between pages
- **Skip Option**: Users can skip onboarding at any time
- **One-time Display**: Uses AsyncStorage to track completion
- **Responsive Design**: Works on all screen sizes
- **Accessibility**: Full accessibility support with proper labels

## Implementation

### Files Created
- `src/screens/OnboardingScreen.js` - Main onboarding component
- `src/utils/onboarding.js` - AsyncStorage utilities

### Key Features
1. **AsyncStorage Tracking**: Prevents showing onboarding multiple times
2. **Progressive Navigation**: Previous/Next buttons with visual feedback
3. **Page Indicators**: Dots showing current page progress
4. **Role-Based Content**: Separate sections for parents and caregivers
5. **Themed Colors**: Parent and caregiver pages use their respective dashboard colors
6. **Icon Integration**: Uses Expo Vector Icons for visual appeal

### Usage
The onboarding automatically shows when:
- App is launched for the first time
- User hasn't seen onboarding before (checked via AsyncStorage)

### Development Testing
- To test onboarding again, uninstall and reinstall the app
- This clears AsyncStorage and triggers onboarding on first launch

### Navigation Flow
```
App Launch → Check AsyncStorage → Show Onboarding (if first time) → Welcome Screen
```

### Best Practices Implemented
1. **Progressive Disclosure**: Information revealed gradually across 4 pages
2. **Clear Value Proposition**: Each page highlights key app benefits
3. **Easy Exit**: Skip button always available
4. **Visual Hierarchy**: Clear typography and spacing
5. **Consistent Branding**: Matches app's color scheme and design
6. **Performance**: Lightweight with minimal dependencies

### Page Structure
1. **Page 1**: Welcome with Iyaya logo
2. **Page 2**: Parent Functions - Job posting, caregiver search, booking
3. **Page 3**: Parent Features - Children management, payments, reviews
4. **Page 4**: Caregiver Functions - Job browsing, applications, scheduling
5. **Page 5**: Caregiver Features - Profile building, certifications, communication

### Customization
To modify onboarding content, edit the `onboardingData` array in `OnboardingScreen.js`:
- Change titles, subtitles, descriptions
- Update icons (use Ionicons names)
- Modify colors and backgrounds
- Add or remove pages

### AsyncStorage Keys
- `hasSeenOnboarding`: Boolean flag tracking completion status

This implementation follows mobile app onboarding best practices and provides a smooth introduction to the Iyaya platform.