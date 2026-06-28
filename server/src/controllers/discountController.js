// NexORA — Discount Controller
const Discount = require('../models/Discount');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

// @desc   Get all discounts
// @route  GET /api/discounts
// @access Admin
const getAllDiscounts = asyncHandler(async (req, res) => {
  const discounts = await Discount.find().sort({ createdAt: -1 });
  sendResponse(res, 200, 'Discounts retrieved', discounts);
});

// @desc   Create discount
// @route  POST /api/discounts
// @access Admin
const createDiscount = asyncHandler(async (req, res) => {
  // Sanitize: coerce numeric strings
  const body = { ...req.body };
  if (body.discountValue) {body.discountValue = Number(body.discountValue);}
  if (body.minOrderAmount) {body.minOrderAmount = Number(body.minOrderAmount);}
  if (body.maxDiscountAmount) {body.maxDiscountAmount = Number(body.maxDiscountAmount);}
  if (body.usageLimit) {body.usageLimit = Number(body.usageLimit);}
  else {delete body.usageLimit;}
  if (!body.expiryDate) {delete body.expiryDate;}
  if (!body.maxDiscountAmount) {delete body.maxDiscountAmount;}

  // Validate percentage cap
  if (body.discountType === 'percentage' && body.discountValue > 100) {
    throw ApiError.badRequest('Percentage discount cannot exceed 100%');
  }

  const discount = await Discount.create(body);
  sendResponse(res, 201, 'Discount created', discount);
});

// @desc   Update discount
// @route  PUT /api/discounts/:id
// @access Admin
const updateDiscount = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.discountValue !== undefined) {body.discountValue = Number(body.discountValue);}
  if (body.minOrderAmount !== undefined) {body.minOrderAmount = Number(body.minOrderAmount);}
  if (body.maxDiscountAmount !== undefined && body.maxDiscountAmount !== '') {body.maxDiscountAmount = Number(body.maxDiscountAmount);}
  if (body.usageLimit !== undefined && body.usageLimit !== '') {body.usageLimit = Number(body.usageLimit);}

  const discount = await Discount.findByIdAndUpdate(req.params.id, body, {
    new: true,
    runValidators: true,
  });
  if (!discount) {throw ApiError.notFound('Discount not found');}
  sendResponse(res, 200, 'Discount updated', discount);
});

// @desc   Delete discount
// @route  DELETE /api/discounts/:id
// @access Admin
const deleteDiscount = asyncHandler(async (req, res) => {
  const discount = await Discount.findByIdAndDelete(req.params.id);
  if (!discount) {throw ApiError.notFound('Discount not found');}
  sendResponse(res, 200, 'Discount deleted');
});

// ─── Shared validation helper ──────────────────────────────────────────────
function computeDiscount(discount, orderAmount) {
  let amount = 0;
  if (discount.discountType === 'percentage') {
    amount = (orderAmount * discount.discountValue) / 100;
    if (discount.maxDiscountAmount) {amount = Math.min(amount, discount.maxDiscountAmount);}
  } else {
    amount = discount.discountValue;
  }
  if (amount > orderAmount) {amount = orderAmount;}
  return Math.round(amount * 100) / 100;
}

// @desc   Validate discount (public — customer use, no auth needed)
// @route  POST /api/discounts/validate
// @access Public
const validateDiscount = asyncHandler(async (req, res) => {
  const { code, orderAmount } = req.body;
  if (!code) {throw ApiError.badRequest('Discount code is required');}
  if (!orderAmount || orderAmount <= 0) {throw ApiError.badRequest('Invalid order amount');}

  const discount = await Discount.findOne({ code: code.trim().toUpperCase() });
  if (!discount) {throw ApiError.notFound('Invalid discount code');}
  if (!discount.isActive) {throw ApiError.badRequest('This discount code is disabled');}

  // Inline expiry check (virtuals not reliable on lean docs)
  if (discount.expiryDate && new Date() > new Date(discount.expiryDate)) {
    throw ApiError.badRequest('This discount code has expired');
  }

  // Inline exhaustion check
  if (discount.usageLimit && discount.timesUsed >= discount.usageLimit) {
    throw ApiError.badRequest('This discount code has reached its usage limit');
  }

  // Minimum order check
  if (orderAmount < discount.minOrderAmount) {
    throw ApiError.badRequest(
      `Minimum order amount of ₹${discount.minOrderAmount.toLocaleString('en-IN')} required for this code`,
    );
  }

  // Per-user check (if authenticated)
  const userId = req.user?._id;
  if (userId && discount.usedByUsers?.some(id => id.toString() === userId.toString())) {
    throw ApiError.badRequest('You have already used this discount code');
  }

  const discountAmount = computeDiscount(discount, orderAmount);

  sendResponse(res, 200, 'Discount applied', {
    code: discount.code,
    discountType: discount.discountType,
    discountValue: discount.discountValue,
    discountAmount,
    finalAmount: Math.round((orderAmount - discountAmount) * 100) / 100,
    description: discount.description,
  });
});

module.exports = {
  getAllDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  validateDiscount,
  computeDiscount,
};
