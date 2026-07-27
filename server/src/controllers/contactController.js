// NexORA — Contact Form Controller

const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const emailService = require('../services/emailService');

// @desc    Submit the public contact form
// @route   POST /api/contact
// @access  Public
const submitContactForm = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  const result = await emailService.sendContactMessage({
    name: name.trim(),
    email: email.trim(),
    subject: subject?.trim() || '',
    message: message.trim(),
  });

  if (!result.success) {
    throw ApiError.internal("Your message couldn't be sent right now — please try again shortly.");
  }

  sendResponse(res, 200, "Message sent — we'll get back to you soon.");
});

module.exports = { submitContactForm };
