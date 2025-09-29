# Phase 1 Foundation Audit

## Firebase Messaging Infrastructure
- **Sources reviewed**: `src/config/firebase.js`, `src/services/firebaseMessagingService.js`, `FIREBASE_MESSAGING_UNIFIED.md`
- **Findings**:
  - `firebaseMessagingService` already centralizes realtime messaging with helper wrappers (`safeDatabaseOperation`, `createRef`).
  - Recent guard additions (`ensureDatabaseGuard`) prevent `_checkNotDeleted` crashes; confirm all consumers import from `src/config/firebase.js`.
  - Offline queue (`components/messaging/OfflineMessageQueue`) still relies on legacy fallbacks; needs verification once notifications integrate.
- **Opportunities**:
  - Extract connection/test utilities into a lightweight `messagingConnectionService` to reduce duplication.
  - Replace direct console logging with shared logger once available.

## Notification Stack Assessment
- **Backend**: `iyaya-backend/controllers/notificationController.js`, `iyaya-backend/routes/notificationRoutes.js`, `iyaya-backend/models/Notification.js`
- **Findings**:
  - Controller expects `Notification` fields `recipient`, `sender`, `relatedBooking`, but schema currently exposes `userId`, `title`, `message` only. Requires reconciliation before UI work.
  - Routes mounted but frontend lacks dedicated service/context; current components limited to privacy-related notifications.
- **Action Items**:
  - Align schema with controller contract (add `recipient`, `sender`, `relatedBooking`, `readAt`).
  - Implement REST client in `src/services/notificationService.js` (pending Phase 2).

## Reviews Data Flow
- **Sources reviewed**: `src/screens/CaregiverReviewsScreen.js`, `src/components/messaging/ReviewItemLocal.js`, `src/components/forms/ReviewForm.js`, backend `ratingRoutes.js`
- **Findings**:
  - Frontend pulls reviews via legacy local mock (`ReviewItemLocal`) and direct props; lacks shared service layer.
  - Backend `ratingRoutes.js` exposes review submission endpoints but response shape undocumented; requires contract definition.
- **Opportunities**:
  - Establish shared review DTO for both dashboards.
  - Add missing pagination/filtering parameters on backend.

## Shared Observations
- **Type Safety**: No consolidated type definitions for notifications, messages, reviews; necessitated creation of new shared contracts.
- **Documentation**: Messaging architecture documented in `FIREBASE_MESSAGING_UNIFIED.md`; no equivalent for notifications/reviews yet (to be added in later phases).

## Backend Route Assessment
- **Notifications**: `iyaya-backend/controllers/notificationController.js` expects fields (`recipient`, `sender`, `relatedBooking`) absent from current `Notification` schema (`Notification.js`). Need schema update plus unit tests to confirm consistency.
- **Notification Routes**: `iyaya-backend/routes/notificationRoutes.js` wires list/read endpoints but is missing mark-all-read doc updates and pagination validation.
- **Reviews/Ratings**: `iyaya-backend/routes/ratingRoutes.js` exposes caregiver/parent rating submission and summary endpoints, but controller responses aren't documented; ensure they match planned `Review` DTO before frontend consumption.
- **Action**: Schedule backend alignment PR to reconcile schema mismatches and add OpenAPI/README snippets for new endpoints prior to UI work.

## Next Steps
1. Finalize shared data contracts (`src/shared/types/messaging.js`, `notifications.js`, `reviews.js`).
2. Draft backend alignment checklist (schema updates, missing controllers) ahead of Phase 2 implementation.
3. Present findings to guide feature rollout order.
