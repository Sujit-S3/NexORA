// NexORA — Setting Controller (Singleton)
const Setting = require('../models/Setting');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/ApiResponse');

// @desc   Get store settings
// @route  GET /api/settings
// @access Public
const getSettings = asyncHandler(async (req, res) => {
  let setting = await Setting.findOne();
  if (!setting) {setting = await Setting.create({});}
  sendResponse(res, 200, 'Settings retrieved', setting);
});

// @desc   Update store settings
// @route  PUT /api/settings
// @access Admin
const updateSettings = asyncHandler(async (req, res) => {
  let setting = await Setting.findOne();
  if (!setting) {
    setting = await Setting.create(req.body);
  } else {
    Object.assign(setting, req.body);
    await setting.save();
  }
  sendResponse(res, 200, 'Settings updated', setting);
});

module.exports = { getSettings, updateSettings };
