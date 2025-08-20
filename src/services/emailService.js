import { db } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

export const sendPaymentConfirmationEmail = async (bookingData) => {
  try {
    const sendEmail = httpsCallable(functions, 'sendPaymentConfirmationEmail');
    const result = await sendEmail(bookingData);
    return result.data;
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    throw error;
  }
};

export const sendPaymentVerifiedEmail = async (bookingData) => {
  try {
    const sendEmail = httpsCallable(functions, 'sendPaymentVerifiedEmail');
    const result = await sendEmail(bookingData);
    return result.data;
  } catch (error) {
    console.error('Error sending payment verified email:', error);
    throw error;
  }
};
