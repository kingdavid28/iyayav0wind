/**
 * Review and rating data contracts shared across the app.
 * These typedefs align frontend expectations with the backend rating routes.
 *
 * @typedef {Object} ReviewAuthor
 * @property {string} id - MongoDB ObjectId of the author (parent or caregiver).
 * @property {"parent"|"caregiver"} role - Role of the author.
 * @property {string} displayName - Friendly name for UI.
 * @property {string=} avatarUrl - Optional avatar URL.
 *
 * @typedef {Object} ReviewTarget
 * @property {string} id - MongoDB ObjectId of the review recipient.
 * @property {"parent"|"caregiver"} role - Role of the recipient.
 *
 * @typedef {Object} Review
 * @property {string} id - Review identifier (MongoDB ObjectId).
 * @property {string} bookingId - Booking that the review references.
 * @property {ReviewAuthor} author - Author metadata.
 * @property {ReviewTarget} target - Recipient metadata.
 * @property {number} rating - Star rating (1-5).
 * @property {string=} comment - Optional text feedback.
 * @property {number} createdAt - Unix epoch milliseconds.
 * @property {number=} updatedAt - Unix epoch milliseconds when edited.
 * @property {boolean=} flagged - Whether review is under moderation.
 * @property {Object=} metadata - Additional structured data (attachments, tags).
 *
 * @typedef {Object} ReviewSummary
 * @property {string} targetId - The caregiver/parent receiving reviews.
 * @property {number} averageRating - Average rating value.
 * @property {number} totalReviews - Count of reviews.
 * @property {number[]} distribution - Array of counts by star value (index 0 => 1 star).
 *
 * @typedef {Object} ReviewPagination
 * @property {number} page
 * @property {number} limit
 * @property {number} total
 * @property {number} pages
 */

export const REVIEW_MAX_RATING = 5;
export const REVIEW_MIN_RATING = 1;

export const isValidReview = (payload) =>
  payload && typeof payload.rating === 'number' && payload.rating >= REVIEW_MIN_RATING && payload.rating <= REVIEW_MAX_RATING && typeof payload.bookingId === 'string';
