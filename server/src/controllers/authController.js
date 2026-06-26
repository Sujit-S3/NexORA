// NexORA — Auth Controller
// Full implementation of Authentication endpoints.

const crypto = require('crypto');
const User = require('../models/User');
const UserPreference = require('../models/UserPreference');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { sendTokenResponse } = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, mobile, countryCode, currency } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw ApiError.badRequest('User already exists with this email');
  }

  const user = await User.create({
    name,
    email,
    password,
    mobile,
    countryCode,
    currency,
  });

  const token = sendTokenResponse(res, user);

  const sessionId = req.headers['x-session-id'] || req.body.sessionId;
  if (sessionId) {
    await mergeSessionPreferences(user._id, sessionId);
  }

  // Send welcome email (fire-and-forget — never block registration on email failure)
  const emailService = require('../services/emailService');
  emailService.sendWelcomeEmail(user.email, user.name).catch(err =>
    console.error('[Auth] Welcome email failed:', err.message)
  );

  // Merge Guest Cart
  if (req.body.guestCart && req.body.guestCart.length > 0) {
    const Cart = require('../models/Cart');
    let cart = await Cart.findOne({ user: user._id });
    if (!cart) {
      cart = await Cart.create({ user: user._id, items: [] });
    }
    for (const guestItem of req.body.guestCart) {
      const existing = cart.items.find(i => i.product.toString() === guestItem.product.toString());
      if (existing) {
        existing.quantity += guestItem.quantity;
      } else {
        cart.items.push({
          product: guestItem.product,
          quantity: guestItem.quantity
        });
      }
    }
    await cart.save();
  }

  // Merge Guest Wishlist
  if (req.body.guestWishlist && req.body.guestWishlist.length > 0) {
    let modified = false;
    for (const item of req.body.guestWishlist) {
      const id = item._id || item;
      if (!user.wishlist.includes(id)) {
        user.wishlist.push(id);
        modified = true;
      }
    }
    if (modified) await user.save();
  }

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

  const sessionId = req.headers['x-session-id'] || req.body.sessionId;
  if (sessionId) {
    await mergeSessionPreferences(user._id, sessionId);
  }

  // Merge Guest Cart
  if (req.body.guestCart && req.body.guestCart.length > 0) {
    const Cart = require('../models/Cart');
    let cart = await Cart.findOne({ user: user._id });
    if (!cart) {
      cart = await Cart.create({ user: user._id, items: [] });
    }
    for (const guestItem of req.body.guestCart) {
      const existing = cart.items.find(i => i.product.toString() === guestItem.product.toString());
      if (existing) {
        existing.quantity += guestItem.quantity;
      } else {
        cart.items.push({
          product: guestItem.product,
          quantity: guestItem.quantity
        });
      }
    }
    await cart.save();
  }

  // Merge Guest Wishlist
  if (req.body.guestWishlist && req.body.guestWishlist.length > 0) {
    let modified = false;
    for (const item of req.body.guestWishlist) {
      if (!user.wishlist.includes(item._id || item)) {
        user.wishlist.push(item._id || item);
        modified = true;
      }
    }
    if (modified) await user.save();
  }

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

// Helper for session merging
const mergeSessionPreferences = async (userId, sessionId) => {
  if (!sessionId) return;
  const guestPref = await UserPreference.findOne({ sessionId, userId: null });
  if (!guestPref) return;

  let userPref = await UserPreference.findOne({ userId });
  if (!userPref) {
    guestPref.userId = userId;
    await guestPref.save();
    return;
  }

  const mergeIds = (a, b) => [...new Set([...(a || []).map(id => id.toString()), ...(b || []).map(id => id.toString())])];
  const mergeVals = (a, b) => [...new Set([...(a || []), ...(b || [])])];

  userPref.categoriesViewed = mergeIds(userPref.categoriesViewed, guestPref.categoriesViewed);
  userPref.productsViewed = mergeIds(userPref.productsViewed, guestPref.productsViewed);
  userPref.productsAddedToCart = mergeIds(userPref.productsAddedToCart, guestPref.productsAddedToCart);
  userPref.wishlisted = mergeIds(userPref.wishlisted, guestPref.wishlisted);
  userPref.checkoutStarted = mergeIds(userPref.checkoutStarted, guestPref.checkoutStarted);
  userPref.purchaseCompleted = mergeIds(userPref.purchaseCompleted, guestPref.purchaseCompleted);
  
  userPref.brandsViewed = mergeVals(userPref.brandsViewed, guestPref.brandsViewed);
  // budgets is now an object (V10.6 migration) — prefer user's value, fall back to guest's
  if (!userPref.budgets?.declared && guestPref.budgets?.declared) {
    userPref.budgets = { ...userPref.budgets, declared: guestPref.budgets.declared };
  }
  userPref.personalities = mergeVals(userPref.personalities, guestPref.personalities);
  userPref.giftRecipients = mergeVals(userPref.giftRecipients, guestPref.giftRecipients);
  userPref.conciergeIntents = mergeVals(userPref.conciergeIntents, guestPref.conciergeIntents);
  
  userPref.giftFinderUsage = (userPref.giftFinderUsage || 0) + (guestPref.giftFinderUsage || 0);
  userPref.lastActivity = Date.now();
  
  await userPref.save();
  await UserPreference.deleteOne({ _id: guestPref._id });
};

// @desc    Forgot password — generate reset token
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw ApiError.badRequest('Email is required');

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  // Always return 200 to prevent email enumeration
  if (!user) {
    return sendResponse(res, 200, 'If an account with that email exists, a reset link has been sent.');
  }

  // Generate raw token + store hashed version
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save({ validateBeforeSave: false });

  // Send reset email via emailService (console.log in dev, real email in production)
  const emailService = require('../services/emailService');
  const resetUrl = `${process.env.CLIENT_ORIGIN}/reset-password/${rawToken}`;

  await emailService.sendPasswordReset(email, resetUrl, user.name);

  // Log in development for quick testing without checking email
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AUTH DEV] Password reset URL for ${email}: ${resetUrl}`);
  }

  sendResponse(res, 200, 'Password reset link sent. Please check your email.', {
    // Only expose token in development to allow frontend testing without email
    ...(process.env.NODE_ENV === 'development' && { resetToken: rawToken, resetUrl })
  });
});

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token)    throw ApiError.badRequest('Reset token is required');
  if (!password || password.length < 6) throw ApiError.badRequest('Password must be at least 6 characters');

  // Hash incoming token and find matching user
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) throw ApiError.badRequest('Reset token is invalid or has expired. Please request a new one.');

  // Set new password and clear reset fields
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Log user in immediately
  const authToken = sendTokenResponse(res, user);

  sendResponse(res, 200, 'Password reset successful. You are now logged in.', {
    token: authToken,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

module.exports = { register, login, logout, getMe, changePassword, forgotPassword, resetPassword };
