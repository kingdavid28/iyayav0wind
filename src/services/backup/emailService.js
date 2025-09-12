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
