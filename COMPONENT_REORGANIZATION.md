# Component Reorganization Plan

## Current Structure Issues:
- Mixed UI and business logic components
- Inconsistent naming conventions
- Scattered related functionality
- Duplicate components (chat/messaging)

## Proposed Structure:

```
src/components/
├── ui/                           # Pure UI components
│   ├── buttons/
│   ├── inputs/
│   │   ├── DateTimePicker/
│   │   ├── TimePicker/
│   │   └── ValidatedInput.js
│   ├── cards/
│   │   ├── CaregiverCard/
│   │   └── JobCard.js
│   ├── modals/
│   │   ├── BookingDetailsModal.js
│   │   ├── RequestInfoModal.js
│   │   └── SettingsModal.js
│   ├── feedback/
│   │   ├── LoadingSpinner.js
│   │   ├── Toast.js
│   │   └── PlaceholderImage.js
│   └── layout/
│       ├── KeyboardAvoidingWrapper.js
│       └── ErrorBoundary/
├── forms/                        # Form-related components
│   ├── DocumentUpload.js
│   ├── ProfileForm.js
│   └── ReviewForm.js
├── features/                     # Feature-specific components
│   ├── privacy/
│   │   ├── PrivacyManager.js
│   │   ├── ProfileDataManager.js
│   │   ├── InformationRequestModal.js
│   │   ├── PrivacyNotificationModal.js
│   │   └── PrivacySettingsModal.js
│   ├── messaging/
│   │   ├── ChatInterface.js
│   │   ├── SimpleChat.js
│   │   └── MessagesTab.js
│   ├── profile/
│   │   ├── ReviewList.js
│   │   └── ProfileSettings.js
│   └── settings/
│       ├── NotificationSettings.js
│       ├── PaymentSettings.js
│       └── PrivacySettings.js
├── business/                     # Business logic components
│   ├── DataManagement.js
│   ├── InformationRequests.js
│   └── GlobalErrorHandler.js
└── navigation/
    └── DeepLinkHandler.js
```

## Benefits:
1. **Clear separation of concerns**
2. **Consistent naming (camelCase for files, PascalCase for components)**
3. **Related components grouped together**
4. **Easier to find and maintain components**
5. **Better scalability**

## Migration Steps:
1. Create new folder structure
2. Move components to appropriate locations
3. Update all import statements
4. Remove duplicate components
5. Standardize naming conventions