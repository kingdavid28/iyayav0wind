/**
 * Messaging shared data contracts.
 * These typedefs provide a single source of truth for realtime chat shapes
 * consumed across ParentDashboard and CaregiverDashboard.
 *
 * @typedef {Object} MessageParticipant
 * @property {string} id - Unique identifier for the participant (userId or caregiverId).
 * @property {string} displayName - Human readable name shown in UI.
 * @property {string=} avatarUrl - Optional avatar image URL.
 *
 * @typedef {Object} Message
 * @property {string} id - Firebase push key for the message node.
 * @property {string} threadId - Composite key (parentId_caregiverId).
 * @property {string} senderId - ID of the sender.
 * @property {string} recipientId - ID of the recipient.
 * @property {string} text - Message body.
 * @property {number} timestamp - Unix epoch milliseconds.
 * @property {boolean} read - Whether recipient has read the message.
 * @property {('sending'|'sent'|'delivered'|'read')} [deliveryStatus] - UI delivery state.
 *
 * @typedef {Object} ConversationSummary
 * @property {string} id - Firebase connection key (userId_caregiverId).
 * @property {MessageParticipant[]} participants - Two party conversation participants.
 * @property {Message} lastMessage - Most recent message metadata.
 * @property {number} unreadCount - Count of unread messages for current viewer.
 * @property {number} lastActivityAt - Unix epoch milliseconds for ordering.
 */

export const MESSAGE_COLLECTION = 'messages';
export const CONNECTION_COLLECTION = 'connections';

export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read'
};

export const buildThreadId = (parentId, caregiverId) =>
  [parentId, caregiverId].sort().join('_');

export const isValidMessagePayload = (payload) =>
  payload && typeof payload.id === 'string' && typeof payload.text === 'string';
