const Notification = require('../models/Notification');
const realtime = require('./realtime');

/**
 * Create notification in database and emit real-time event
 * @param {Object} options - Notification options
 * @param {string} options.recipientId - User ID to receive notification
 * @param {string} options.type - Notification type (message, booking, review, etc.)
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} options.senderId - User ID who triggered notification
 * @param {string} options.relatedBooking - Related booking ID (optional)
 * @param {Object} options.data - Additional notification data (optional)
 * @returns {Promise<Notification>} Created notification
 */
const createNotification = async ({
  recipientId,
  type,
  title,
  message,
  senderId,
  relatedBooking,
  data = {}
}) => {
  try {
    // Create notification in database
    const notification = new Notification({
      recipient: recipientId,
      type,
      title,
      message,
      sender: senderId,
      relatedBooking,
      data
    });

    await notification.save();

    // Emit real-time notification via socket
    const io = realtime.io();
    if (io) {
      io.to(`user_${recipientId}`).emit('notification', {
        id: notification._id,
        type,
        title,
        message,
        read: false,
        createdAt: notification.createdAt.getTime(), // Convert to Unix timestamp
        data
      });
    }

    return notification;
  } catch (error) {
    console.error('Notification creation failed:', error);
    throw error;
  }
};

/**
 * Create booking notification for status changes
 * @param {Object} booking - Booking document
 * @param {string} status - New booking status
 * @param {string} recipientId - User to notify
 * @param {string} senderId - User who made the change
 */
const createBookingNotification = async (booking, status, recipientId, senderId) => {
  const statusMessages = {
    pending: 'Your booking request is pending approval',
    confirmed: 'Your booking has been confirmed',
    completed: 'Your booking has been completed',
    cancelled: 'Your booking has been cancelled'
  };

  const statusTitles = {
    pending: 'Booking Pending',
    confirmed: 'Booking Confirmed',
    completed: 'Booking Completed',
    cancelled: 'Booking Cancelled'
  };

  return createNotification({
    recipientId,
    type: 'booking',
    title: statusTitles[status] || 'Booking Updated',
    message: statusMessages[status] || 'Your booking status has changed',
    senderId,
    relatedBooking: booking._id,
    data: {
      bookingId: booking._id,
      bookingStatus: status,
      previousStatus: booking.status
    }
  });
};

/**
 * Create message notification for new messages
 * @param {Object} message - Message document
 * @param {string} recipientId - User to notify
 * @param {string} senderId - User who sent the message
 */
const createMessageNotification = async (message, recipientId, senderId) => {
  return createNotification({
    recipientId,
    type: 'message',
    title: 'New Message',
    message: `New message from ${message.sender?.name || 'User'}`,
    senderId,
    data: {
      conversationId: message.conversationId,
      messageId: message._id,
      preview: message.content?.substring(0, 100) || 'New message'
    }
  });
};

/**
 * Create review notification when rating is submitted
 * @param {Object} rating - Rating document
 * @param {string} recipientId - User being rated (to notify)
 * @param {string} senderId - User who submitted rating
 */
const createReviewNotification = async (rating, recipientId, senderId) => {
  const isCaregiverReview = rating.type === 'caregiver';

  return createNotification({
    recipientId,
    type: 'review',
    title: `New ${rating.rating}-Star Review`,
    message: `You received a ${rating.rating}-star ${isCaregiverReview ? 'caregiver' : 'parent'} review`,
    senderId,
    relatedBooking: rating.booking,
    data: {
      rating: rating.rating,
      review: rating.review,
      ratingType: rating.type,
      bookingId: rating.booking
    }
  });
};

module.exports = {
  createNotification,
  createBookingNotification,
  createMessageNotification,
  createReviewNotification
};
