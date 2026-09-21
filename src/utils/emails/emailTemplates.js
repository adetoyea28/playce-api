export const signupOtpTemplate = (otp) => {
  return {
    subject: 'Playce - Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #1e3a8a; text-align: center;">Welcome to Playce!</h2>
        <p>Thank you for signing up for Playce, the University of Ibadan event venue booking platform.</p>
        <p>Your one-time verification code (OTP) is:</p>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #1e40af; border-radius: 6px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes. Please do not share this OTP with anyone.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">If you did not request this, please disregard this email.</p>
      </div>
    `,
    text: `Welcome to Playce! Your email verification OTP is: ${otp}. This code expires in 10 minutes.`
  };
};

export const resetOtpTemplate = (otp) => {
  return {
    subject: 'Playce - Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #b91c1c; text-align: center;">Password Reset Request</h2>
        <p>We received a request to reset your password for your Playce account.</p>
        <p>Your verification OTP code is:</p>
        <div style="background-color: #fef2f2; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #b91c1c; border-radius: 6px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes. If you did not initiate this request, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Playce - University of Ibadan Campus Venue Booking System</p>
      </div>
    `,
    text: `Your Playce password reset OTP is: ${otp}. This code expires in 10 minutes.`
  };
};

export const newBookingNotificationTemplate = (booking, venue, planner) => {
  const documentSection = booking.document_url
    ? `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #f0f0f0;"><strong>Official Letter / Document:</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">
          <a href="${booking.document_url}" target="_blank" style="display: inline-block; padding: 6px 14px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px;">
            📄 View Official Letter
          </a>
          <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
            <a href="${booking.document_url}" target="_blank" style="color: #2563eb;">${booking.document_url}</a>
          </div>
        </td>
      </tr>
    `
    : '';

  const noteSection = booking.planner_note
    ? `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #f0f0f0;"><strong>Planner's Note:</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; background-color: #f9fafb; font-style: italic;">
          "${booking.planner_note}"
        </td>
      </tr>
    `
    : '';

  return {
    subject: `New Event Booking Request: ${booking.event_name} at ${venue.venue_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #1e3a8a;">New Booking Pending Approval</h2>
        <p>An event planner has requested to book <strong>${venue.venue_name}</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;"><strong>Event Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${booking.event_name}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;"><strong>Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${booking.event_date}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;"><strong>Time Interval:</strong></td><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${booking.start_time} - ${booking.end_time}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;"><strong>Planner:</strong></td><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${planner.username} (${planner.email})</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;"><strong>Description:</strong></td><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${booking.event_description}</td></tr>
          ${noteSection}
          ${documentSection}
        </table>
        <p>Please log in to your Playce Manager Dashboard to review the official documents and approve or reject this booking.</p>
      </div>
    `,
    text: `New Booking Request: ${booking.event_name} at ${venue.venue_name} on ${booking.event_date} from ${booking.start_time} to ${booking.end_time}. Planner: ${planner.username} (${planner.email}). ${booking.planner_note ? `Planner Note: ${booking.planner_note}. ` : ''}${booking.document_url ? `Official Letter: ${booking.document_url}` : ''}`
  };
};

export const bookingStatusUpdateTemplate = (booking, venue, status, remark) => {
  const isApproved = status === 'approved';
  const color = isApproved ? '#15803d' : '#b91c1c';

  return {
    subject: `Booking ${isApproved ? 'Approved' : 'Rejected'}: ${booking.event_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: ${color};">Booking Request ${status.toUpperCase()}</h2>
        <p>Your booking request for <strong>${venue.venue_name}</strong> has been updated by the venue manager.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;"><strong>Event:</strong></td><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${booking.event_name}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;"><strong>Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${booking.event_date}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;"><strong>Time:</strong></td><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${booking.start_time} - ${booking.end_time}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;"><strong>Status:</strong></td><td style="padding: 8px; border-bottom: 1px solid #f0f0f0; color: ${color}; font-weight: bold;">${status.toUpperCase()}</td></tr>
          ${remark ? `<tr><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;"><strong>Manager's Remark:</strong></td><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${remark}</td></tr>` : ''}
        </table>
        <p>Thank you for using Playce!</p>
      </div>
    `,
    text: `Your booking for ${booking.event_name} at ${venue.venue_name} on ${booking.event_date} has been ${status}. ${remark ? `Remark: ${remark}` : ''}`
  };
};
