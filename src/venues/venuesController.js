import * as venuesService from './venuesService.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

export const createVenue = async (req, res, next) => {
  try {
    const { venue_name, venue_description, time_open, time_closed, days_closed } = req.body;
    const manager_id = req.user.id;

    const newVenue = await venuesService.createVenue({
      manager_id,
      venue_name,
      venue_description,
      time_open,
      time_closed,
      days_closed,
    });

    return sendSuccess(res, 201, 'Venue created successfully.', newVenue);
  } catch (error) {
    next(error);
  }
};

export const updateVenue = async (req, res, next) => {
  try {
    const venueId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const updatedVenue = await venuesService.updateVenue(venueId, userId, userRole, req.body);
    return sendSuccess(res, 200, 'Venue updated successfully.', updatedVenue);
  } catch (error) {
    next(error);
  }
};

export const deleteVenue = async (req, res, next) => {
  try {
    const venueId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    await venuesService.deleteVenue(venueId, userId, userRole);
    return sendSuccess(res, 200, 'Venue and all associated bookings deleted successfully.');
  } catch (error) {
    next(error);
  }
};

export const getAllVenues = async (req, res, next) => {
  try {
    const venues = await venuesService.getAllVenues();
    return sendSuccess(res, 200, 'Venues retrieved successfully.', venues);
  } catch (error) {
    next(error);
  }
};

export const getVenueById = async (req, res, next) => {
  try {
    const venueId = req.params.id;
    const venue = await venuesService.getVenueById(venueId);
    return sendSuccess(res, 200, 'Venue details retrieved successfully.', venue);
  } catch (error) {
    next(error);
  }
};