import express from 'express';
import * as userController from './userController.js';
import {
  signupValidator,
  verifyOtpValidator,
  loginValidator,
  forgotPasswordValidator,
  verifyResetOtpValidator,
  resetPasswordValidator,
} from './userValidator.js';
import { validate } from '../middleware/validateMiddleware.js';
import { authenticate, authenticateResetToken } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Authentication flows
router.post('/signup', authLimiter, signupValidator, validate, userController.signup);
router.post('/verify-otp', authLimiter, verifyOtpValidator, validate, userController.verifyOtp);
router.post('/login', authLimiter, loginValidator, validate, userController.login);

// Forgot Password flows
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validate, userController.forgotPassword);
router.post('/verify-reset-otp', authLimiter, verifyResetOtpValidator, validate, userController.verifyResetOtp);
router.post('/reset-password', authLimiter, authenticateResetToken, resetPasswordValidator, validate, userController.resetPassword);

// Token management & session
router.post('/refresh-token', userController.refresh);
router.post('/logout', authenticate, userController.logout);

// User profile
router.get('/me', authenticate, userController.getProfile);

export default router;
