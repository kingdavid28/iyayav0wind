/**
 * Notification data contracts shared across dashboards.
 * These shapes align frontend usage with backend controller expectations.
 * 
 * @typedef {Object} NotificationActor
 * @property {string} id
 * @property {string} displayName
 * @property {string} [avatarUrl] Profile image URL
 * @property {'parent'|'caregiver'|'system'} [role] User role for UI differentiation
 *
 * @typedef {Object} BaseNotification
 * @property {string} id
 * @property {NotificationType} type
 * @property {string} title
 * @property {string} message
 * @property {boolean} read
 * @property {number} createdAt Unix timestamp
 * @property {number} [readAt] Unix timestamp
 * @property {NotificationActor} [actor] Who triggered the notification
 * @property {Record<string, any>} [data] Additional context data
 * @property {Record<string, any>} [metadata] System/internal metadata
 *
 * @typedef {BaseNotification} MessageNotification
 * @property {'message'} type
 * @property {string} conversationId
 * @property {string} [preview] Message preview
 *
 * @typedef {BaseNotification} BookingNotification 
 * @property {'booking'} type
 * @property {string} bookingId
 * @property {'pending'|'confirmed'|'completed'|'cancelled'} bookingStatus
 *
 * @typedef {BaseNotification} ReviewNotification
 * @property {'review'} type
 * @property {number} rating 1-5 star rating
 * @property {string} [reviewText] Full review text if available
 *
 * @typedef {BaseNotification} SystemNotification
 * @property {'system'} type
 * @property {'info'|'warning'|'error'} severity
 *
 * @typedef {BaseNotification} ApplicationNotification
 * @property {'application'} type
 * @property {string} jobId
 * @property {'pending'|'accepted'|'rejected'} applicationStatus
 *
 * @typedef {MessageNotification|BookingNotification|ReviewNotification|SystemNotification|ApplicationNotification} Notification
 *
 * @typedef {Object} NotificationPagination
 * @property {number} page Current page (1-indexed)
 * @property {number} limit Items per page
 * @property {number} total Total items available
 * @property {number} pages Total pages available
 */

/**
 * Supported notification types with strict typing
 * @type {Readonly<Record<string, NotificationType>>}
 */
export const NOTIFICATION_TYPES = Object.freeze({
  MESSAGE: 'message',
  BOOKING: 'booking',
  APPLICATION: 'application',
  REVIEW: 'review',
  SYSTEM: 'system'
});

/**
 * Type guard for Notification objects
 * @param {any} payload
 * @returns {payload is Notification}
 */
export const isNotification = (payload) => {
  return (
    payload &&
    typeof payload === 'object' &&
    typeof payload.id === 'string' &&
    Object.values(NOTIFICATION_TYPES).includes(payload.type) &&
    typeof payload.title === 'string' &&
    typeof payload.message === 'string' &&
    typeof payload.read === 'boolean' &&
    (payload.createdAt === undefined || typeof payload.createdAt === 'number')
  );
};