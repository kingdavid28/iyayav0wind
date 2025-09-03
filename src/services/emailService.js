// Email service migrated away from Firebase Functions. These functions are stubs
// and should call backend email endpoints when available.
// TODO: Replace with real backend API calls, e.g., api.post('/emails/payment-confirmation')
import { logger } from '../utils/logger';

export const sendPaymentConfirmationEmail = async (bookingData) => {
  try {
    logger.warn('sendPaymentConfirmationEmail: backend endpoint not implemented yet', bookingData);
    return { ok: true };
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    throw error;
  }
};

export const sendPaymentVerifiedEmail = async (bookingData) => {
  try {
    logger.warn('sendPaymentVerifiedEmail: backend endpoint not implemented yet', bookingData);
    return { ok: true };
  } catch (error) {
    console.error('Error sending payment verified email:', error);
    throw error;
  }
};
