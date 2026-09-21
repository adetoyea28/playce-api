import { Venue, User, Booking } from '../models/index.js';

export const createVenue = async ({
  manager_id,
  venue_name,
  venue_description,
  time_open,
  time_closed,
  days_closed,
}) => {
  const newVenue = await Venue.create({
    manager_id,
    venue_name,
    venue_description,
    time_open,
    time_closed,
    days_closed: days_closed || [],
  });

  return newVenue;
};

export const updateVenue = async (venueId, userId, userRole, updateData) => {
  const venue = await Venue.findByPk(venueId);
  if (!venue) {
    const error = new Error('Venue not found.');
    error.statusCode = 404;
    throw error;
  }

  // Only the manager who owns the venue or an admin can update it
  if (venue.manager_id !== userId && userRole !== 'admin') {
    const error = new Error('Access denied. You can only update venues that you manage.');
    error.statusCode = 403;
    throw error;
  }

  const allowedUpdates = ['venue_name', 'venue_description', 'time_open', 'time_closed', 'days_closed'];
  for (const field of allowedUpdates) {
    if (updateData[field] !== undefined) {
      venue[field] = updateData[field];
    }
  }

  await venue.save();
  return venue;
};

export const deleteVenue = async (venueId, userId, userRole) => {
  const venue = await Venue.findByPk(venueId);
  if (!venue) {
    const error = new Error('Venue not found.');
    error.statusCode = 404;
    throw error;
  }

  if (venue.manager_id !== userId && userRole !== 'admin') {
    const error = new Error('Access denied. You can only delete venues that you manage.');
    error.statusCode = 403;
    throw error;
  }

  // Deleting venue cascades to all associated bookings
  await venue.destroy();
  return true;
};

export const getAllVenues = async () => {
  const venues = await Venue.findAll({
    include: [
      {
        model: User,
        as: 'manager',
        attributes: ['id', 'username', 'email'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
  return venues;
};

export const getVenueById = async (venueId) => {
  const venue = await Venue.findByPk(venueId, {
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

  return venue;
};
