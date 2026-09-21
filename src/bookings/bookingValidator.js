import { body, param, query } from 'express-validator';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

export const scheduleCheckValidator = [
  query('venue_id')
    .notEmpty().withMessage('venue_id is required.')
    .isUUID(4).withMessage('venue_id must be a valid UUID.'),
  query('event_date')
    .notEmpty().withMessage('event_date is required.')
    .isISO8601({ strict: true }).withMessage('event_date must be a valid date in YYYY-MM-DD format.'),
];

export const createBookingValidator = [
  body('venue_id')
    .notEmpty().withMessage('venue_id is required.')
    .isUUID(4).withMessage('venue_id must be a valid UUID.'),
  body('event_name')
    .trim()
    .notEmpty().withMessage('event_name is required.')
    .isLength({ min: 3 }).withMessage('event_name must be at least 3 characters long.'),
  body('event_description')
    .trim()
    .notEmpty().withMessage('event_description is required.'),
  body('event_date')
    .notEmpty().withMessage('event_date is required in YYYY-MM-DD format.')
    .isISO8601({ strict: true }).withMessage('event_date must be a valid date in YYYY-MM-DD format.')
    .custom((dateStr) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetDate = new Date(dateStr);
      if (targetDate < today) {
        throw new Error('event_date cannot be in the past.');
      }
      return true;
    }),
  body('start_time')
    .notEmpty().withMessage('start_time is required.')
    .matches(timeRegex).withMessage('start_time must be in HH:MM or HH:MM:SS format (e.g. 10:00).'),
  body('end_time')
    .notEmpty().withMessage('end_time is required.')
    .matches(timeRegex).withMessage('end_time must be in HH:MM or HH:MM:SS format (e.g. 12:00).')
    .custom((value, { req }) => {
      if (req.body.start_time && value <= req.body.start_time) {
        throw new Error('end_time must be strictly after start_time.');
      }
      return true;
    }),
  body('planner_note')
    .optional()
    .trim(),
];

export const updateBookingStatusValidator = [
  param('id')
    .isUUID(4).withMessage('Valid booking ID (UUID) is required in url parameter.'),
  body('status')
    .notEmpty().withMessage('status is required.')
    .isIn(['approved', 'rejected']).withMessage("status must be either 'approved' or 'rejected'."),
  body('remark')
    .optional()
    .trim(),
];

export const bookingIdParamValidator = [
  param('id')
    .isUUID(4).withMessage('Valid booking ID (UUID) is required in url parameter.'),
];
