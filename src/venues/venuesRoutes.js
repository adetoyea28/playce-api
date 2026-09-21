import express from 'express';
import * as venuesController from './venuesController.js';
import {
  createVenueValidator,
  updateVenueValidator,
  venueIdParamValidator,
} from './venueValidator.js';
import { validate } from '../middleware/validateMiddleware.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public / Authenticated read routes
router.get('/', venuesController.getAllVenues);
router.get('/:id', venueIdParamValidator, validate, venuesController.getVenueById);

// Manager / Admin routes
router.post(
  '/',
  authenticate,
  authorizeRoles('manager', 'admin'),
  createVenueValidator,
  validate,
  venuesController.createVenue
);

router.put(
  '/:id',
  authenticate,
  authorizeRoles('manager', 'admin'),
  updateVenueValidator,
  validate,
  venuesController.updateVenue
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles('manager', 'admin'),
  venueIdParamValidator,
  validate,
  venuesController.deleteVenue
);

export default router;
