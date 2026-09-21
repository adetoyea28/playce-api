import { Op } from 'sequelize';
import { Booking, Venue, User, sequelize } from '../models/index.js';
import { uploadToCloudinary } from '../config/cloudinaryConfig.js';
import { sendEmail } from '../utils/emails/resendClient.js';
import {
  newBookingNotificationTemplate,
  bookingStatusUpdateTemplate,
} from '../utils/emails/emailTemplates.js';

// Helper: Normalize time string to HH:MM:SS
const normalizeTime = (timeStr) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
  }
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
};

// Helper: Get Day of Week in English from Date string (YYYY-MM-DD)
const getDayOfWeek = (dateStr) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return days[date.getDay()];
};

/**
 * Schedule Check: Retrieves operating hours and booked intervals for a venue on a given date.
 */
export const checkSchedule = async ({ venue_id, event_date }) => {
  const venue = await Venue.findByPk(venue_id);
  if (!venue) {
    const error = new Error('Venue not found.');
    error.statusCode = 404;
    throw error;
  }

  const dayOfWeek = getDayOfWeek(event_date);
  const isVenueClosed = venue.days_closed && venue.days_closed.includes(dayOfWeek);

  // Fetch all pending and approved bookings for this venue on this date
  const bookings = await Booking.findAll({
    where: {
      venue_id,
      event_date,
      status: {
        [Op.in]: ['pending', 'approved'],
      },
    },
    attributes: ['id', 'event_name', 'start_time', 'end_time', 'status'],
    order: [['start_time', 'ASC']],
  });

  return {
    venue: {
      id: venue.id,
      venue_name: venue.venue_name,
      time_open: venue.time_open,
      time_closed: venue.time_closed,
      days_closed: venue.days_closed,
      isClosedOnDate: isVenueClosed,
      dayOfWeek,
    },
    event_date,
    bookedIntervals: bookings.map((b) => ({
      booking_id: b.id,
      event_name: b.event_name,
      start_time: b.start_time,
      end_time: b.end_time,
      status: b.status,
    })),
  };
};

/**
 * Core Time Clash Prevention Algorithm & Booking Creation
 */
export const createBooking = async ({
  planner_id,
  venue_id,
  event_name,
  event_description,
  event_date,
  start_time,
  end_time,
  planner_note,
  file,
}) => {
  const normStart = normalizeTime(start_time);
  const normEnd = normalizeTime(end_time);

  if (normStart >= normEnd) {
    const error = new Error('Start time must be strictly before end time.');
    error.statusCode = 400;
    throw error;
  }

  // 1. Fetch venue details including manager
  const venue = await Venue.findByPk(venue_id, {
    include: [
      {
        model: User,
        as: 'manager',
        attributes: ['id', 'username', 'email'],
      },
    ],
  });

  if (!venue) {
    const error = new Error('Venue not found.');
    error.statusCode = 404;
    throw error;
  }

  // 2. Check if the venue is closed on this day of the week
  const dayOfWeek = getDayOfWeek(event_date);
  if (venue.days_closed && venue.days_closed.includes(dayOfWeek)) {
    const error = new Error(
      `The venue is closed on ${dayOfWeek}s. Please select a day when the venue is open.`
    );
    error.statusCode = 400;
    throw error;
  }

  // 3. Check venue operating hours
  const venueOpen = normalizeTime(venue.time_open);
  const venueClosed = normalizeTime(venue.time_closed);

  if (normStart < venueOpen || normEnd > venueClosed) {
    const error = new Error(
      `Booking time must be within venue operating hours: ${venue.time_open} to ${venue.time_closed}.`
    );
    error.statusCode = 400;
    throw error;
  }

  // 4. Core Time Clash Prevention: Query existing overlapping bookings
  // Two intervals [S1, E1) and [S2, E2) overlap if and only if S1 < E2 AND E1 > S2
  const conflictingBookings = await Booking.findAll({
    where: {
      venue_id,
      event_date,
      status: {
        [Op.in]: ['pending', 'approved'],
      },
      [Op.and]: [
        {
          start_time: {
            [Op.lt]: normEnd,
          },
        },
        {
          end_time: {
            [Op.gt]: normStart,
          },
        },
      ],
    },
  });

  if (conflictingBookings.length > 0) {
    const conflict = conflictingBookings[0];
    const error = new Error(
      `Time clash detected: This slot conflicts with an existing ${conflict.status} booking "${conflict.event_name}" (${conflict.start_time} - ${conflict.end_time}). Please choose another time.`
    );
    error.statusCode = 409;
    error.conflictingBooking = {
      id: conflict.id,
      event_name: conflict.event_name,
      start_time: conflict.start_time,
      end_time: conflict.end_time,
      status: conflict.status,
    };
    throw error;
  }

  // 5. Upload document / official letter to Cloudinary if provided
  let documentUrl = null;
  if (file && file.buffer) {
    const uploadResult = await uploadToCloudinary(file.buffer, file.originalname);
    documentUrl = uploadResult.secure_url;
  }

  // 6. Create the booking record
  const newBooking = await Booking.create({
    planner_id,
    venue_id,
    event_name,
    event_description,
    event_date,
    start_time: normStart,
    end_time: normEnd,
    planner_note: planner_note || null,
    document_url: documentUrl,
    status: 'pending',
    manager_id: venue.manager_id,
  });

  // 7. Notify Venue Manager via Email
  const planner = await User.findByPk(planner_id, {
    attributes: ['id', 'username', 'email'],
  });

  if (venue.manager?.email) {
    const template = newBookingNotificationTemplate(newBooking, venue, planner);
    await sendEmail({
      to: venue.manager.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  return newBooking;
};

/**
 * Booking Approval / Rejection by Manager
 */
export const updateBookingStatus = async (bookingId, managerId, userRole, { status, remark }) => {
  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: Venue,
        as: 'venue',
        attributes: ['id', 'venue_name', 'manager_id'],
      },
      {
        model: User,
        as: 'planner',
        attributes: ['id', 'username', 'email'],
      },
    ],
  });

  if (!booking) {
    const error = new Error('Booking not found.');
    error.statusCode = 404;
    throw error;
  }

  // Only the manager of the venue or an admin can approve/reject
  if (booking.venue.manager_id !== managerId && userRole !== 'admin') {
    const error = new Error('Access denied. You can only manage bookings for venues you oversee.');
    error.statusCode = 403;
    throw error;
  }

  booking.status = status;
  booking.remark = remark || null;
  booking.manager_id = managerId;
  await booking.save();

  // Send status email to event planner
  if (booking.planner?.email) {
    const template = bookingStatusUpdateTemplate(booking, booking.venue, status, remark);
    await sendEmail({
      to: booking.planner.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  return booking;
};

/**
 * Delete Booking by Planner or Admin
 */
export const deleteBooking = async (bookingId, userId, userRole) => {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    const error = new Error('Booking not found.');
    error.statusCode = 404;
    throw error;
  }

  // Planner who scheduled it or an admin can delete
  if (booking.planner_id !== userId && userRole !== 'admin') {
    const error = new Error('Access denied. You can only delete your own bookings.');
    error.statusCode = 403;
    throw error;
  }

  await booking.destroy();
  return true;
};

/**
 * List bookings based on role and filters
 */
export const getBookings = async (userId, userRole, filters = {}) => {
  const where = {};

  if (filters.event_date) {
    where.event_date = filters.event_date;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.venue_id) {
    where.venue_id = filters.venue_id;
  }

  // Role based filtering:
  // Planners only see their own bookings
  if (userRole === 'event-planner') {
    where.planner_id = userId;
  } else if (userRole === 'manager') {
    // Managers see bookings for venues they manage
    const managedVenues = await Venue.findAll({
      where: { manager_id: userId },
      attributes: ['id'],
    });
    const venueIds = managedVenues.map((v) => v.id);
    where.venue_id = { [Op.in]: venueIds };
  }
  // Admins see all bookings according to filters

  const bookings = await Booking.findAll({
    where,
    include: [
      {
        model: Venue,
        as: 'venue',
        attributes: ['id', 'venue_name', 'time_open', 'time_closed'],
      },
      {
        model: User,
        as: 'planner',
        attributes: ['id', 'username', 'email'],
      },
      {
        model: User,
        as: 'approver',
        attributes: ['id', 'username', 'email'],
      },
    ],
    order: [
      ['event_date', 'ASC'],
      ['start_time', 'ASC'],
    ],
  });

  return bookings;
};

/**
 * Get single booking by ID
 */
export const getBookingById = async (bookingId, userId, userRole) => {
  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: Venue,
        as: 'venue',
        attributes: ['id', 'venue_name', 'time_open', 'time_closed', 'manager_id'],
      },
      {
        model: User,
        as: 'planner',
        attributes: ['id', 'username', 'email'],
      },
      {
        model: User,
        as: 'approver',
        attributes: ['id', 'username', 'email'],
      },
    ],
  });

  if (!booking) {
    const error = new Error('Booking not found.');
    error.statusCode = 404;
    throw error;
  }

  // Authorization check: must be planner, venue manager, or admin
  const isOwner = booking.planner_id === userId;
  const isVenueManager = booking.venue?.manager_id === userId;
  const isAdmin = userRole === 'admin';

  if (!isOwner && !isVenueManager && !isAdmin) {
    const error = new Error('Access denied. You do not have permission to view this booking.');
    error.statusCode = 403;
    throw error;
  }

  return booking;
};
