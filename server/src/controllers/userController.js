// NexORA — User Controller
const User = require('../models/User');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Auth
const getProfile = asyncHandler(async (req, res) => {
  sendResponse(res, 501, 'Users: getProfile — not yet implemented');
});

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Auth
const updateProfile = asyncHandler(async (req, res) => {
  sendResponse(res, 501, 'Users: updateProfile — not yet implemented');
});

// @desc    Upload user avatar
// @route   POST /api/users/avatar
// @access  Auth
const uploadAvatar = asyncHandler(async (req, res) => {
  sendResponse(res, 501, 'Users: uploadAvatar — not yet implemented');
});

// @desc    Get all users (admin)
// @route   GET /api/users
// @access  Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const total = await User.countDocuments();
  const users = await User.find()
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  sendResponse(res, 200, 'All users retrieved', {
    users,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// @desc    Get user by ID (admin)
// @route   GET /api/users/:id
// @access  Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {throw ApiError.notFound('User not found');}
  sendResponse(res, 200, 'User retrieved', user);
});

// @desc    Update user role (admin)
// @route   PUT /api/users/:id/role
// @access  Admin
const VALID_ROLES = ['user', 'admin'];

const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!VALID_ROLES.includes(role)) {
    throw ApiError.badRequest(`Role must be one of: ${VALID_ROLES.join(', ')}`);
  }

  const user = await User.findById(req.params.id);
  if (!user) {throw ApiError.notFound('User not found');}

  if (role !== 'admin' && user.role === 'admin') {
    if (user._id.toString() === req.user._id.toString()) {
      throw ApiError.badRequest('You cannot demote your own account');
    }
    const otherAdmins = await User.countDocuments({ role: 'admin', _id: { $ne: user._id } });
    if (otherAdmins === 0) {
      throw ApiError.badRequest('Cannot demote the last remaining admin');
    }
  }

  user.role = role;
  await user.save();

  sendResponse(res, 200, 'User role updated', {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});

// @desc    Delete user (admin)
// @route   DELETE /api/users/:id
// @access  Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {throw ApiError.notFound('User not found');}
  
  if (user.role === 'admin') {
    throw ApiError.badRequest('Cannot delete an admin user');
  }

  await user.deleteOne();
  sendResponse(res, 200, 'User deleted successfully');
});

module.exports = { getProfile, updateProfile, uploadAvatar, getAllUsers, getUserById, updateUserRole, deleteUser };
