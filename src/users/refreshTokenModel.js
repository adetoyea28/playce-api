import { DataTypes } from 'sequelize';
import sequelize from '../config/dbconfig.js';

export const RefreshToken = sequelize.define('RefreshToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  token_string: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  token_status: {
    type: DataTypes.ENUM('active', 'expired'),
    allowNull: false,
    defaultValue: 'active',
  },
}, {
  tableName: 'refresh_tokens',
  timestamps: true,
});

export default RefreshToken;
