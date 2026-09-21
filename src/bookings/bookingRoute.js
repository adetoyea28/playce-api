import express from 'express';
import * as bookingController from './bookingController.js';
import {
  scheduleCheckValidator,
  createBookingValidator,
  updateBookingStatusValidator,
  bookingIdParamValidator,
} from './bookingValidator.js';
import { validate } from '../middleware/validateMiddleware.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { uploadSingleDocument } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Schedule check (check existing bookings and availability for a venue on a date)
router.get(
  '/schedule-check',
  authenticate,
  authorizeRoles('event-planner', 'manager', 'admin'),
  scheduleCheckValidator,
  validate,
  bookingController.scheduleCheck
);

// Create a new booking with optional official letter upload & planner note (event planner only)
router.post(
  '/',
  authenticate,
  authorizeRoles('event-planner', 'admin'),
  uploadSingleDocument('document'),
  createBookingValidator,
  validate,
  bookingController.createBooking
);

// Manager approve / reject a booking
router.patch(
  '/:id/status',
  authenticate,
  authorizeRoles('manager', 'admin'),
  updateBookingStatusValidator,
  validate,
  bookingController.updateBookingStatus
);

// Delete booking (event planner or admin)
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('event-planner', 'admin'),
  bookingIdParamValidator,
  validate,
  bookingController.deleteBooking
);

// List bookings (role-based)
router.get('/', authenticate, bookingController.getBookings);

// Get single booking by ID
router.get('/:id', authenticate, bookingIdParamValidator, validate, bookingController.getBookingById);

export default router;
