// Stub for Nodemailer. In real prod, configure with env variables.
import nodemailer from 'nodemailer';

export const EmailService = {
  send: async ({ to, subject, html }) => {
    try {
      if (!process.env.SMTP_HOST) {
        console.log(`[EMAIL STUB] To: ${to} | Subject: ${subject}`);
        console.log(`[EMAIL HTML]: ${html}`);
        return true;
      }

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"HPMS" <${process.env.SMTP_USER || 'no-reply@hpms.college'}>`,
        to,
        subject,
        html,
      });

      return true;
    } catch (err) {
      console.error('[EMAIL ERROR]', err);
      throw err;
    }
  }
};
