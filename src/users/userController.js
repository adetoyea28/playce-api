import * as userService from './userService.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { ENV } from '../config/env.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: ENV.NODE_ENV === 'production',
  sameSite: 'lax',
};

export const signup = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;
    const result = await userService.signup({ username, email, password, role });
    return sendSuccess(
      res,
      201,
      'Account created successfully. A verification OTP has been sent to your email.',
      result
    );
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await userService.verifyOtp({ email, otp });
    return sendSuccess(
      res,
      200,
      'Email address verified successfully. Your account is now active.',
      result
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await userService.login({ email, password });

    res.cookie('accessToken', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 30 * 60 * 1000, // 30 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 4 * 60 * 60 * 1000, // 4 hours
    });

    return sendSuccess(res, 200, 'Login successful.', {
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await userService.forgotPassword({ email });
    return sendSuccess(
      res,
      200,
      'If an account exists with this email, a password reset OTP has been sent.'
    );
  } catch (error) {
    next(error);
  }
};

export const verifyResetOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const { resetToken, userId } = await userService.verifyResetOtp({ email, otp });

    res.cookie('resetToken', resetToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    return sendSuccess(res, 200, 'OTP verified successfully. You may now reset your password.', {
      resetToken,
      userId,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const userId = req.resetUser.id;

    await userService.resetPassword(userId, password);
    res.clearCookie('resetToken', COOKIE_OPTIONS);

    return sendSuccess(res, 200, 'Password updated successfully. You can now log in with your new password.');
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const { accessToken } = await userService.refreshAccessToken(token);

    res.cookie('accessToken', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 30 * 60 * 1000,
    });

    return sendSuccess(res, 200, 'Access token refreshed successfully.', { accessToken });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    await userService.logout(refreshToken);

    res.clearCookie('accessToken', COOKIE_OPTIONS);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);

    return sendSuccess(res, 200, 'Logged out successfully.');
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, 'Profile retrieved successfully.', {
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        acctStatus: req.user.acctStatus,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
