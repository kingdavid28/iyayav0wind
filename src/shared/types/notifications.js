/**
 * Notification data contracts shared across dashboards.
 * These shapes align frontend usage with backend controller expectations.
 *
 * @typedef {Object} NotificationActor
 * @property {string} id
 * @property {string} displayName
 * @property {string=} avatarUrl
 *
 * @typedef {Object} NotificationPayload
 * @property {string} id
 * @property {('message'|'booking'|'application'|'review'|'system')} type
 * @property {string} title
 * @property {string} message
 * @property {boolean} read
 * @property {number} createdAt
 * @property {number=} readAt
 * @property {NotificationActor=} actor
 * @property {Record<string, any>=} data
 *
 * @typedef {Object} NotificationPagination
 * @property {number} page
 * @property {number} limit
 * @property {number} total
 * @property {number} pages
 */

export const NOTIFICATION_TYPES = {
  MESSAGE: 'message',
  BOOKING: 'booking',
  APPLICATION: 'application',
  REVIEW: 'review',
  SYSTEM: 'system'
};

export const isNotification = (payload) =>
  payload && typeof payload.id === 'string' && typeof payload.title === 'string';
