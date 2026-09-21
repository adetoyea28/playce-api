import { sendError } from '../utils/responseHandler.js';

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required.');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access denied. Role '${req.user.role}' is not authorized to access this resource. Required role(s): ${roles.join(', ')}`
      );
    }

    next();
  };
};
