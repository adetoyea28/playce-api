import { DataTypes } from 'sequelize';
import sequelize from '../config/dbconfig.js';

export const Venue = sequelize.define('Venue', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  manager_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  venue_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  venue_description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  time_open: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  time_closed: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  days_closed: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: [],
  },
}, {
  tableName: 'venues',
  timestamps: true,
});

export default Venue;
