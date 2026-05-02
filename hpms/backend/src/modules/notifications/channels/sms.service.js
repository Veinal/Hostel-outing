// Stub for SMS API.
import axios from 'axios';

export const SmsService = {
  send: async ({ to, message }) => {
    try {
      if (!process.env.SMS_API_URL || !process.env.SMS_API_KEY) {
        console.log(`[SMS STUB] To: ${to} | Message: ${message}`);
        return true;
      }

      // Example TextBee or generic SMS API integration
      await axios.post(process.env.SMS_API_URL, {
        apiKey: process.env.SMS_API_KEY,
        to,
        message
      });

      return true;
    } catch (err) {
      console.error('[SMS ERROR]', err);
      throw err;
    }
  }
};
