import jwt from 'jsonwebtoken';
import { ENV } from '../../config/env.js';

export const generateAccessToken = (payload) => {
  return jwt.sign(
    {
      id: payload.id,
      role: payload.role,
      acctStatus: payload.acctStatus,
    },
    ENV.JWT.ACCESS_SECRET,
    { expiresIn: ENV.JWT.ACCESS_EXPIRY }
  );
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(
    {
      id: payload.id,
      role: payload.role,
      acctStatus: payload.acctStatus,
    },
    ENV.JWT.REFRESH_SECRET,
    { expiresIn: ENV.JWT.REFRESH_EXPIRY }
  );
};

export const generatePasswordResetToken = (userId) => {
  return jwt.sign(
    {
      id: userId,
    },
    ENV.JWT.RESET_SECRET,
    { expiresIn: ENV.JWT.RESET_EXPIRY }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, ENV.JWT.ACCESS_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, ENV.JWT.REFRESH_SECRET);
};

export const verifyPasswordResetToken = (token) => {
  return jwt.verify(token, ENV.JWT.RESET_SECRET);
};
