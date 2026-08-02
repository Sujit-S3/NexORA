// NexORA — User Controller
const User = require('../models/User');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const uploadService = require('../middleware/upload');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Auth
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  sendResponse(res, 200, 'Profile retrieved', user);
});

const EDITABLE_PROFILE_FIELDS = ['name', 'mobile', 'countryCode', 'currency'];
const VALID_CURRENCIES = ['INR', 'USD', 'GBP', 'EUR', 'AED'];

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Auth
const updateProfile = asyncHandler(async (req, res) => {
  const updates = {};

  for (const field of EDITABLE_PROFILE_FIELDS) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (updates.name !== undefined) {
    const trimmed = String(updates.name).trim();
    if (trimmed.length < 2 || trimmed.length > 50) {
      throw ApiError.badRequest('Name must be between 2 and 50 characters');
    }
    updates.name = trimmed;
  }

  if (updates.currency !== undefined && !VALID_CURRENCIES.includes(updates.currency)) {
    throw ApiError.badRequest(`Currency must be one of: ${VALID_CURRENCIES.join(', ')}`);
  }

  if (Object.keys(updates).length === 0) {
    throw ApiError.badRequest('No valid profile fields provided');
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  sendResponse(res, 200, 'Profile updated', user);
});

// @desc    Upload/replace the current user's avatar
// @route   POST /api/users/avatar
// @access  Auth
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('No image file provided');
  }

  const user = await User.findById(req.user._id);
  const previousPublicId = user.avatar?.publicId;

  const result = await uploadService.uploadToCloudinary(req.file.buffer, 'nexora/avatars');
  user.avatar = { url: result.secure_url, publicId: result.public_id };
  await user.save();

  // Best-effort cleanup — a failure here shouldn't fail the request, the
  // user's new avatar is already saved and correct.
  if (previousPublicId) {
    uploadService.deleteFromCloudinary(previousPublicId).catch(() => {});
  }

  sendResponse(res, 200, 'Avatar updated', user);
});

const REQUIRED_ADDRESS_FIELDS = ['street', 'city', 'state', 'zip'];

const validateAddressBody = (body) => {
  for (const field of REQUIRED_ADDRESS_FIELDS) {
    if (!body[field] || !String(body[field]).trim()) {
      throw ApiError.badRequest(`${field} is required`);
    }
  }
};

// @desc    List the current user's saved addresses
// @route   GET /api/users/addresses
// @access  Auth
const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  sendResponse(res, 200, 'Addresses retrieved', user.addresses);
});

// @desc    Add a new saved address
// @route   POST /api/users/addresses
// @access  Auth
const addAddress = asyncHandler(async (req, res) => {
  validateAddressBody(req.body);

  const user = await User.findById(req.user._id);
  const { label, street, city, state, zip, country, isDefault } = req.body;

  // The first saved address is always the default, regardless of what was
  // sent — otherwise a user's very first address wouldn't be selectable
  // as a default anywhere that only shows "the default address".
  const shouldBeDefault = isDefault === true || user.addresses.length === 0;
  if (shouldBeDefault) {
    user.addresses.forEach((addr) => { addr.isDefault = false; });
  }

  user.addresses.push({ label, street, city, state, zip, country, isDefault: shouldBeDefault });
  await user.save();

  sendResponse(res, 201, 'Address added', user.addresses);
});

// @desc    Update a saved address
// @route   PUT /api/users/addresses/:addressId
// @access  Auth
const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) {
    throw ApiError.notFound('Address not found');
  }

  const { label, street, city, state, zip, country, isDefault } = req.body;
  if (label !== undefined) {address.label = label;}
  if (street !== undefined) {address.street = street;}
  if (city !== undefined) {address.city = city;}
  if (state !== undefined) {address.state = state;}
  if (zip !== undefined) {address.zip = zip;}
  if (country !== undefined) {address.country = country;}

  if (isDefault === true) {
    user.addresses.forEach((addr) => { addr.isDefault = addr._id.equals(address._id); });
  }

  await user.save();
  sendResponse(res, 200, 'Address updated', user.addresses);
});

// @desc    Delete a saved address
// @route   DELETE /api/users/addresses/:addressId
// @access  Auth
const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) {
    throw ApiError.notFound('Address not found');
  }

  const wasDefault = address.isDefault;
  user.addresses.pull(req.params.addressId);

  // Promote another address to default so there's always one, as long as
  // any remain — otherwise "use my default address" silently has nothing.
  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  sendResponse(res, 200, 'Address deleted', user.addresses);
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

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
};
