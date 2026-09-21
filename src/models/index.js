import sequelize from '../config/dbconfig.js';
import User from '../users/userModel.js';
import Venue from '../venues/venuesModel.js';
import Booking from '../bookings/bookingModel.js';
import RefreshToken from '../users/refreshTokenModel.js';

// User <-> Venue (Manager relationship)
User.hasMany(Venue, { foreignKey: 'manager_id', as: 'managedVenues', onDelete: 'CASCADE' });
Venue.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });

// User <-> Booking (Planner relationship)
User.hasMany(Booking, { foreignKey: 'planner_id', as: 'bookings', onDelete: 'CASCADE' });
Booking.belongsTo(User, { foreignKey: 'planner_id', as: 'planner' });

// Venue <-> Booking
Venue.hasMany(Booking, { foreignKey: 'venue_id', as: 'bookings', onDelete: 'CASCADE' });
Booking.belongsTo(Venue, { foreignKey: 'venue_id', as: 'venue' });

// User <-> Booking (Approving / Rejecting Manager)
User.hasMany(Booking, { foreignKey: 'manager_id', as: 'reviewedBookings' });
Booking.belongsTo(User, { foreignKey: 'manager_id', as: 'approver' });

// User <-> RefreshToken
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export {
  sequelize,
  User,
  Venue,
  Booking,
  RefreshToken,
};

export default {
  sequelize,
  User,
  Venue,
  Booking,
  RefreshToken,
};
