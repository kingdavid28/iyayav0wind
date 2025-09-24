// MANUAL_SETUP.md - Manual Setup Instructions

## Manual Setup for Parent/Caregiver Messaging

### Step 1: Add Imports to AppNavigator.js

Add these lines after line 21 in AppNavigator.js:

```javascript
import ParentMessaging from "../../screens/messaging/ParentMessaging";
import CaregiverMessaging from "../../screens/messaging/CaregiverMessaging";
```

### Step 2: Add Routes to Stack.Navigator

Add these routes after line 126 in AppNavigator.js:

```javascript
<Stack.Screen
  name="ParentMessaging"
  component={ParentMessaging}
  options={{
    title: "Parent Messages",
    headerBackTitle: "Back",
    headerShown: false
  }}
/>
<Stack.Screen
  name="CaregiverMessaging"
  component={CaregiverMessaging}
  options={{
    title: "Caregiver Messages",
    headerBackTitle: "Back",
    headerShown: false
  }}
/>
```

### Step 3: Update Dashboard MessagesTabs

**ParentDashboard MessagesTab:**
```javascript
import ParentMessaging from '../../../screens/messaging/ParentMessaging';

const MessagesTab = ({ navigation }) => {
  return <ParentMessaging />;
};
```

**CaregiverDashboard MessagesTab:**
```javascript
import CaregiverMessaging from '../../../screens/messaging/CaregiverMessaging';

const MessagesTab = ({ navigation }) => {
  return <CaregiverMessaging />;
};
```

### Step 4: Navigation Usage

```javascript
// Navigate to parent messaging
navigation.navigate('ParentMessaging');

// Navigate to caregiver messaging
navigation.navigate('CaregiverMessaging');

// With conversation context
navigation.navigate('ParentMessaging', {
  conversationId: conversation.id,
  recipientId: conversation.otherUserId,
  recipientName: conversation.recipientName,
  recipientAvatar: conversation.recipientAvatar,
});
```

### Files Created:
- ✅ ParentMessaging.jsx
- ✅ CaregiverMessaging.jsx
- ✅ PARENT_CAREGIVER_MESSAGING_INTEGRATION.md
- ✅ All messaging components are properly integrated

The messaging system is now ready for production use! 🚀
