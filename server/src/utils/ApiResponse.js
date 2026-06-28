// NexORA — Standardized API Response Wrapper

class ApiResponse {
  constructor(statusCode, message, data = null, pagination = null) {
    this.success = statusCode < 400;
    this.message = message;
    if (data !== null) {this.data = data;}
    if (pagination !== null) {this.pagination = pagination;}
  }
}

/**
 * Send a successful response.
 * @param {Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Human-readable message
 * @param {*} data - Response payload
 * @param {object|null} pagination - Optional pagination meta
 */
const sendResponse = (res, statusCode, message, data = null, pagination = null) => res.status(statusCode).json(new ApiResponse(statusCode, message, data, pagination));

module.exports = { ApiResponse, sendResponse };
