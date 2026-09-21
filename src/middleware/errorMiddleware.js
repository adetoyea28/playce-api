import { sendError } from '../utils/responseHandler.js';

export const notFoundHandler = (req, res, next) => {
  return sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};

export const globalErrorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err);

  // Sequelize Unique Constraint Error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = err.errors ? err.errors.map((e) => e.path).join(', ') : 'field';
    return sendError(res, 409, `A record with this ${fields} already exists.`);
  }

  // Sequelize Validation Error
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors ? err.errors.map((e) => ({ field: e.path, message: e.message })) : [];
    return sendError(res, 400, 'Database validation failed', errors);
  }

  // Sequelize Database Error (e.g. invalid UUID syntax)
  if (err.name === 'SequelizeDatabaseError') {
    return sendError(res, 400, 'Invalid data format or database constraint violation.');
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'Invalid authentication token.');
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Authentication token has expired.');
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  return sendError(res, statusCode, message);
};
