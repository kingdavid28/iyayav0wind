// Example usage of FirebaseRealtimeService for messaging:

import { firebaseRealtimeService } from '../services/firebaseRealtimeService';

// Initialize Firebase real-time auth (separate from JWT auth)
await firebaseRealtimeService.initializeRealtimeAuth();

// Send a message
const messageId = await firebaseRealtimeService.sendMessage('chat123', {
  text: 'Hello, how are you?',
  type: 'text'
});

// Listen to messages in a chat
const unsubscribe = firebaseRealtimeService.listenToMessages('chat123', (messages) => {
  console.log('New messages:', messages);
  // Update your UI with new messages
});
// Stop listening when component unmounts
// unsubscribe();

// Update user status
firebaseRealtimeService.updateUserStatus({
## Error handling

When a request fails due to authentication errors (e.g., expired tokens), the system should prompt the user to log in again and retry the action once re-authenticated.

### Service maintenance

Realtime API endpoints may return `503 Service Unavailable` together with a JSON payload that includes a `serviceStatus` field.

```json
{
  "message": "Notifications are under maintenance",
  "serviceStatus": "maintenance"
}
```

Frontend clients should treat either the 503 status or an explicit `serviceStatus: "maintenance"` value as a maintenance state. In this mode:

- Continue to present cached data if available.
- Render `DashboardDataState`/fallback UI with maintenance messaging and optional retry actions.
- Do not show hard errors/toasts that imply the user can fix the issue; clearly communicate the temporary nature of the outage.

This pattern applies to messaging, reviews, notifications, and any future dashboard surfaces that rely on realtime data.
listenToUserStatus('user456', (status) => {
  console.log('User status:', status);
});

// Clean up when app closes
// firebaseRealtimeService.cleanup();
