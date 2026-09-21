import { verifyAccessToken, verifyPasswordResetToken } from '../utils/tokens/tokenService.js';
import { sendError } from '../utils/responseHandler.js';
import { User } from '../models/index.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return sendError(res, 401, 'Access denied. No authentication token provided.');
    }

    const decoded = verifyAccessToken(token);
    
    // Check if user still exists
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return sendError(res, 401, 'User associated with this token no longer exists.');
    }

    if (user.acctStatus !== 'approved') {
      return sendError(res, 403, 'Your account is pending verification. Please verify your email first.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Authentication token has expired. Please refresh or log in again.');
    }
    return sendError(res, 401, 'Invalid authentication token.');
  }
};

export const authenticateResetToken = async (req, res, next) => {
  try {
    let token = req.cookies?.resetToken;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return sendError(res, 401, 'Password reset token is missing or expired. Please re-verify your OTP.');
    }

    const decoded = verifyPasswordResetToken(token);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return sendError(res, 404, 'User not found.');
    }

    req.resetUser = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Password reset token has expired. Please initiate password reset again.');
    }
    return sendError(res, 401, 'Invalid password reset token.');
  }
};
