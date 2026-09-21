import { Resend } from 'resend';
import { ENV } from '../../config/env.js';

let resend;
if (ENV.RESEND.API_KEY && ENV.RESEND.API_KEY !== 're_your_api_key_here') {
  resend = new Resend(ENV.RESEND.API_KEY);
}

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!resend) {
    console.log('--- [DEV EMAIL SIMULATOR] ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text || html}`);
    console.log('-----------------------------');
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: ENV.RESEND.FROM_EMAIL,
      to,
      subject,
      html,
      text,
    });
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email via Resend:', error.message);
    // In dev or test environments, avoid throwing fatal unhandled rejections for email failures
    return { success: false, error: error.message };
  }
};
