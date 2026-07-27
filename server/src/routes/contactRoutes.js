// NexORA — Contact Routes

const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { submitContactForm } = require('../controllers/contactController');
const { authLimiter } = require('../middleware/rateLimiter');
const ApiError = require('../utils/ApiError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw ApiError.badRequest(errors.array()[0].msg);
  }
  next();
};

// Public, but rate-limited the same as auth endpoints — an unauthenticated
// form that triggers an outbound email per submission is an easy spam target.
router.post(
  '/',
  authLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('email').trim().isEmail().withMessage('Please provide a valid email'),
    body('subject').optional({ checkFalsy: true }).trim().isLength({ max: 150 }).withMessage('Subject must be under 150 characters'),
    body('message').trim().isLength({ min: 10, max: 5000 }).withMessage('Message must be between 10 and 5000 characters'),
    validate,
  ],
  submitContactForm,
);

module.exports = router;
