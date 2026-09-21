import { DataTypes } from 'sequelize';
import sequelize from '../config/dbconfig.js';

export const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  planner_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  venue_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'venues',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  event_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  event_description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  event_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  planner_note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  document_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  manager_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'bookings',
  timestamps: true,
});

export default Booking;
