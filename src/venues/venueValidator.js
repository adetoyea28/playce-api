import { body, param } from 'express-validator';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;
const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const createVenueValidator = [
  body('venue_name')
    .trim()
    .notEmpty().withMessage('Venue name is required.'),
  body('venue_description')
    .trim()
    .notEmpty().withMessage('Venue description is required (include capacity, location, etc.).'),
  body('time_open')
    .notEmpty().withMessage('Opening time (time_open) is required.')
    .matches(timeRegex).withMessage('Opening time must be in HH:MM or HH:MM:SS format (e.g. 08:00).'),
  body('time_closed')
    .notEmpty().withMessage('Closing time (time_closed) is required.')
    .matches(timeRegex).withMessage('Closing time must be in HH:MM or HH:MM:SS format (e.g. 22:00)')
    .custom((value, { req }) => {
      if (req.body.time_open && value <= req.body.time_open) {
        throw new Error('Closing time must be strictly after opening time.');
      }
      return true;
    }),
  body('days_closed')
    .optional()
    .isArray().withMessage('days_closed must be an array of day names (e.g. ["Sunday"]).')
    .custom((days) => {
      for (const day of days) {
        if (!validDays.includes(day)) {
          throw new Error(`Invalid day in days_closed: ${day}. Must be one of: ${validDays.join(', ')}`);
        }
      }
      return true;
    }),
];

export const updateVenueValidator = [
  param('id')
    .isUUID(4).withMessage('Valid venue ID (UUID) is required in url parameter.'),
  body('venue_name')
    .optional()
    .trim()
    .notEmpty().withMessage('Venue name cannot be empty.'),
  body('venue_description')
    .optional()
    .trim()
    .notEmpty().withMessage('Venue description cannot be empty.'),
  body('time_open')
    .optional()
    .matches(timeRegex).withMessage('Opening time must be in HH:MM or HH:MM:SS format.'),
  body('time_closed')
    .optional()
    .matches(timeRegex).withMessage('Closing time must be in HH:MM or HH:MM:SS format.')
    .custom((value, { req }) => {
      if (req.body.time_open && value <= req.body.time_open) {
        throw new Error('Closing time must be strictly after opening time.');
      }
      return true;
    }),
  body('days_closed')
    .optional()
    .isArray().withMessage('days_closed must be an array of day names.')
    .custom((days) => {
      for (const day of days) {
        if (!validDays.includes(day)) {
          throw new Error(`Invalid day in days_closed: ${day}. Must be one of: ${validDays.join(', ')}`);
        }
      }
      return true;
    }),
];

export const venueIdParamValidator = [
  param('id')
    .isUUID(4).withMessage('Valid venue ID (UUID) is required in url parameter.'),
];
