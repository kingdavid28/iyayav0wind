# Phase 3 Messaging Enhancements

## Audit Summary
- **Service review**: `src/services/firebaseMessagingService.js` now consumes shared helpers from `src/config/firebase.js` (`createRef`, `safePush`, `safeSet`, `safeGet`, `safeUpdate`) and exposes streamlined logic with improved error handling.
- **Documentation**: `FIREBASE_MESSAGING_UNIFIED.md` outlines current architecture; still accurate but lacks guidance on presence/typing indicators and push notification hooks.
- **Offline queue**: `src/components/messaging/OfflineMessageQueue.js` depends on legacy fallbacks. Verify compatibility once safe helpers are refactored.
- **Connection testing**: `checkFirebaseConnection()` duplicates logic; consider relocating to shared utility.

## Identified Gaps
- Shared messaging context scaffolded at `src/contexts/MessagingContext.js` but still needs to be wired into app providers and consumed by dashboards for unread counts and thread state.
- No typed DTO enforcement; new `src/shared/types/messaging.js` should replace ad-hoc shapes in components.
- Typing indicators and delivery receipts not standardized—some helpers referenced (`getMessageStatusManager`) but not wired into UI.
- Push notification trigger pathway undefined; backend currently lacks listener to emit notifications on new messages.

## Next Actions
1. Integrate `MessagingProvider` at the app root (e.g., `App.js`) and migrate dashboards to consume `useMessaging()` instead of calling `firebaseMessagingService` directly.
2. Implement derived selectors inside `MessagingContext` (or future Redux slice) for unread badges and active thread metadata.
3. Audit offline queue to ensure pending messages retry using the new `safePush` wrapper without duplicating writes.
4. Coordinate with backend team to emit notification events on message creation for push integration.

## State Synchronization Strategy
- **Central store**: Transition the current `MessagingContext` toward a Redux Toolkit slice (`messagingSlice`) persisting conversations, messages, and unread counts; leverage `redux-persist` for offline continuity once requirements expand beyond the context.
- **Selectors**: Provide memoized selectors (`selectUnreadCountByRole`, `selectConversationSummaries`) consumed by `ParentDashboard` and `CaregiverDashboard` headers for badge updates.
- **Realtime updates**: Standardize subscription handlers that dispatch normalized actions (`messages/received`, `messages/read`, `conversations/updated`) whenever `firebaseMessagingService` listeners emit changes.
- **Error handling**: Route service errors through existing `MessagingErrorHandler` while flashing toast notifications via shared UI components.

## Push Notification Prerequisites
- **Expo setup**: Configure `expo-notifications` to request permissions in a dedicated hook (`src/hooks/usePushNotifications.js`) and persist Expo push tokens via backend endpoint.
- **Backend triggers**: Extend messaging controller or Firebase Cloud Function to send push notifications when new messages arrive, ensuring deduplication with in-app notifications.
- **Environment config**: Document required keys (`EXPO_PUBLIC_PUSH_ENDPOINT`, server credentials) in `.env.example` and update `README.md` setup steps.
- **Reliability**: Implement retry/backoff for push delivery failures and log events to monitoring service (e.g., Sentry) for observability.
