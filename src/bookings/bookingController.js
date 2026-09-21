import * as bookingService from './bookingService.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

export const scheduleCheck = async (req, res, next) => {
  try {
    const { venue_id, event_date } = req.query;
    const scheduleData = await bookingService.checkSchedule({ venue_id, event_date });
    return sendSuccess(res, 200, 'Schedule retrieved successfully.', scheduleData);
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (req, res, next) => {
  try {
    const { venue_id, event_name, event_description, event_date, start_time, end_time, planner_note } = req.body;
    const planner_id = req.user.id;
    const file = req.file;

    const newBooking = await bookingService.createBooking({
      planner_id,
      venue_id,
      event_name,
      event_description,
      event_date,
      start_time,
      end_time,
      planner_note,
      file,
    });

    return sendSuccess(
      res,
      201,
      'Booking request submitted successfully and is pending manager approval.',
      newBooking
    );
  } catch (error) {
    if (error.statusCode === 409 && error.conflictingBooking) {
      return sendError(res, 409, error.message, { conflictingBooking: error.conflictingBooking });
    }
    next(error);
  }
};

export const updateBookingStatus = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const managerId = req.user.id;
    const userRole = req.user.role;
    const { status, remark } = req.body;

    const updatedBooking = await bookingService.updateBookingStatus(bookingId, managerId, userRole, {
      status,
      remark,
    });

    return sendSuccess(
      res,
      200,
      `Booking has been ${status} successfully.`,
      updatedBooking
    );
  } catch (error) {
    next(error);
  }
};

export const deleteBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    await bookingService.deleteBooking(bookingId, userId, userRole);
    return sendSuccess(res, 200, 'Booking deleted successfully.');
  } catch (error) {
    next(error);
  }
};

export const getBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { event_date, status, venue_id } = req.query;

    const bookings = await bookingService.getBookings(userId, userRole, {
      event_date,
      status,
      venue_id,
    });

    return sendSuccess(res, 200, 'Bookings retrieved successfully.', bookings);
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const booking = await bookingService.getBookingById(bookingId, userId, userRole);
    return sendSuccess(res, 200, 'Booking details retrieved successfully.', booking);
  } catch (error) {
    next(error);
  }
};
