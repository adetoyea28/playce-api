import bcrypt from 'bcryptjs';
import { User, RefreshToken } from '../models/index.js';
import { getRedisClient } from '../config/redisConfig.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generatePasswordResetToken,
  verifyRefreshToken
} from '../utils/tokens/tokenService.js';
import { sendEmail } from '../utils/emails/resendClient.js';
import { signupOtpTemplate, resetOtpTemplate } from '../utils/emails/emailTemplates.js';

const OTP_EXPIRY_SECONDS = 600; // 10 minutes

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const signup = async ({ username, email, password, role }) => {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    const error = new Error('A user with this email address already exists.');
    error.statusCode = 409;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    username,
    email,
    password: hashedPassword,
    role: role || 'event-planner',
    acctStatus: 'pending',
  });

  // Generate and store OTP in Redis
  const otp = generateOtp();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const redis = getRedisClient();
  await redis.set(`otp:${email}`, hashedOtp, { EX: OTP_EXPIRY_SECONDS });

  // Send OTP email
  const template = signupOtpTemplate(otp);
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return {
    userId: newUser.id,
    username: newUser.username,
    email: newUser.email,
    role: newUser.role,
    acctStatus: newUser.acctStatus,
  };
};

export const verifyOtp = async ({ email, otp }) => {
  const redis = getRedisClient();
  const redisKey = `otp:${email}`;

  const storedHashedOtp = await redis.get(redisKey);
  // Delete immediately to prevent replay attacks
  await redis.del(redisKey);

  if (!storedHashedOtp) {
    const error = new Error('OTP has expired or does not exist. Please request a new one.');
    error.statusCode = 400;
    throw error;
  }

  const isMatch = await bcrypt.compare(otp, storedHashedOtp);
  if (!isMatch) {
    const error = new Error('Invalid OTP code provided.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  user.acctStatus = 'approved';
  await user.save();

  return {
    userId: user.id,
    email: user.email,
    acctStatus: user.acctStatus,
  };
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  if (user.acctStatus !== 'approved') {
    const error = new Error('Your email has not been verified. Please verify your OTP to continue.');
    error.statusCode = 403;
    throw error;
  }

  const tokenPayload = {
    id: user.id,
    role: user.role,
    acctStatus: user.acctStatus,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Store refresh token in database
  await RefreshToken.create({
    user_id: user.id,
    token_string: refreshToken,
    token_status: 'active',
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      acctStatus: user.acctStatus,
    },
  };
};

export const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    // For security reasons, don't leak user existence
    return { emailSent: true };
  }

  const otp = generateOtp();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const redis = getRedisClient();
  await redis.set(`reset_otp:${email}`, hashedOtp, { EX: OTP_EXPIRY_SECONDS });

  const template = resetOtpTemplate(otp);
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return { emailSent: true };
};

export const verifyResetOtp = async ({ email, otp }) => {
  const redis = getRedisClient();
  const redisKey = `reset_otp:${email}`;

  const storedHashedOtp = await redis.get(redisKey);
  // Delete immediately to prevent reuse
  await redis.del(redisKey);

  if (!storedHashedOtp) {
    const error = new Error('Password reset OTP has expired or was not found. Please try again.');
    error.statusCode = 400;
    throw error;
  }

  const isMatch = await bcrypt.compare(otp, storedHashedOtp);
  if (!isMatch) {
    const error = new Error('Invalid OTP code provided.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  // Generate password reset token
  const resetToken = generatePasswordResetToken(user.id);
  return { resetToken, userId: user.id };
};

export const resetPassword = async (userId, newPassword) => {
  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  // Expire all active refresh tokens for this user
  await RefreshToken.update(
    { token_status: 'expired' },
    { where: { user_id: userId, token_status: 'active' } }
  );

  return true;
};

export const refreshAccessToken = async (tokenString) => {
  if (!tokenString) {
    const error = new Error('Refresh token is required.');
    error.statusCode = 401;
    throw error;
  }

  const decoded = verifyRefreshToken(tokenString);

  const storedToken = await RefreshToken.findOne({
    where: {
      token_string: tokenString,
      token_status: 'active',
      user_id: decoded.id,
    },
  });

  if (!storedToken) {
    const error = new Error('Refresh token has expired or is invalid.');
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findByPk(decoded.id);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 401;
    throw error;
  }

  const newAccessToken = generateAccessToken({
    id: user.id,
    role: user.role,
    acctStatus: user.acctStatus,
  });

  return { accessToken: newAccessToken };
};

export const logout = async (tokenString) => {
  if (tokenString) {
    await RefreshToken.update(
      { token_status: 'expired' },
      { where: { token_string: tokenString } }
    );
  }
  return true;
};
