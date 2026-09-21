import { validationResult } from 'express-validator';
import { sendError } from '../utils/responseHandler.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(
      res,
      400,
      'Validation failed',
      errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      }))
    );
  }
  next();
};
