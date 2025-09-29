# Phase 2 Notification Flow Notes

## Backend Updates
- Aligned `Notification` schema (`iyaya-backend/models/Notification.js`) with controller usage by adding `recipient`, `sender`, `relatedBooking`, `readAt`, and compound index on `(recipient, read, createdAt)`.
- Next step: update controller to populate `sender` fields used by frontend service mapping.

## Frontend Service Stub
- Added `src/services/notificationService.js` exporting `fetchNotifications`, `markNotificationAsRead`, `markAllNotificationsAsRead` using shared type guard `isNotification`.
- Mapping normalizes backend payloads to shared DTO shape (id, type, title, message, read, timestamps, actor, data).

## Pending Tasks
- Implement `NotificationContext` or Redux slice consuming `notificationService`.
- Integrate bell badge components in both dashboards once state layer is ready.
- Extend shared types with review DTO once backend contract confirmed.

## Usage & Testing Notes
- **Provider wiring**: `NotificationProvider` wraps the app in `src/app/App.js`, ensuring `useNotifications()` is available throughout the tree.
- **Badge integration**: `ParentDashboard/components/Header.js` consumes `unreadCount` to render the shield icon badge; `CaregiverProfileSection.js` shows a notification pill for mobile dashboard view.
- **Service coverage**: `notificationService.fetchNotifications()` defaults to page 1/limit 20 and normalizes payloads; mark-as-read endpoints update local state optimistically.
- **Testing**:
  - Unit-test `NotificationContext` hooks with mocked service responses to confirm state updates.
  - Add UI tests to validate badge counts when unread notifications exist versus when all are marked read.
  - Verify error paths surface via context `error` state (e.g., simulate network failure).
