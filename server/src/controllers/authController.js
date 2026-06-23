// NexORA — Auth Controller
// Full implementation of Authentication endpoints.

const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { sendTokenResponse } = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw ApiError.badRequest('User already exists with this email');
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  const token = sendTokenResponse(res, user);

  sendResponse(res, 201, 'User registered successfully', {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Check if user exists (and select password field since it is select: false)
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // 2. Check if password matches
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // 3. Check if active
  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated');
  }

  const token = sendTokenResponse(res, user);

  sendResponse(res, 200, 'Login successful', {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Auth
const logout = asyncHandler(async (req, res) => {
  res.cookie('nexora_token', 'loggedout', {
    httpOnly: true,
    expires: new Date(Date.now() + 10 * 1000), // expires in 10 seconds
  });
  
  sendResponse(res, 200, 'Logout successful');
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Auth
const getMe = asyncHandler(async (req, res) => {
  // req.user is set by the `protect` middleware
  const user = await User.findById(req.user._id);

  sendResponse(res, 200, 'User profile retrieved', user);
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Auth
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Find user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.unauthorized('Incorrect current password');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Send new token
  const token = sendTokenResponse(res, user);

  sendResponse(res, 200, 'Password changed successfully', { token });
});

module.exports = { register, login, logout, getMe, changePassword };
