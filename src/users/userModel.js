import { DataTypes } from 'sequelize';
import sequelize from '../config/dbconfig.js';

export const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('event-planner', 'manager', 'admin'),
    allowNull: false,
    defaultValue: 'event-planner',
  },
  acctStatus: {
    type: DataTypes.ENUM('pending', 'approved'),
    allowNull: false,
    defaultValue: 'pending',
  },
}, {
  tableName: 'users',
  timestamps: true,
});

export default User;
