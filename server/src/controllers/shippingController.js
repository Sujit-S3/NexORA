// NexORA — Shipping Controller
const ShippingZone = require('../models/ShippingZone');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

// @desc   Get all shipping zones
// @route  GET /api/shipping
// @access Public
const getShippingZones = asyncHandler(async (req, res) => {
  const zones = await ShippingZone.find().sort({ createdAt: -1 });
  sendResponse(res, 200, 'Shipping zones retrieved', zones);
});

// @desc   Create shipping zone
// @route  POST /api/shipping
// @access Admin
const createShippingZone = asyncHandler(async (req, res) => {
  const zone = await ShippingZone.create(req.body);
  sendResponse(res, 201, 'Shipping zone created', zone);
});

// @desc   Update shipping zone
// @route  PUT /api/shipping/:id
// @access Admin
const updateShippingZone = asyncHandler(async (req, res) => {
  const zone = await ShippingZone.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!zone) {throw ApiError.notFound('Shipping zone not found');}
  sendResponse(res, 200, 'Shipping zone updated', zone);
});

// @desc   Delete shipping zone
// @route  DELETE /api/shipping/:id
// @access Admin
const deleteShippingZone = asyncHandler(async (req, res) => {
  const zone = await ShippingZone.findByIdAndDelete(req.params.id);
  if (!zone) {throw ApiError.notFound('Shipping zone not found');}
  sendResponse(res, 200, 'Shipping zone deleted');
});

module.exports = { getShippingZones, createShippingZone, updateShippingZone, deleteShippingZone };
