const mongoose = require('mongoose');

const aiRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional for unauthenticated requests
    },
    endpoint: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
    },
    promptTokens: {
      type: Number,
      default: 0,
    },
    completionTokens: {
      type: Number,
      default: 0,
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
    latency: {
      type: Number, // In milliseconds
      default: 0,
    },
    httpStatus: {
      type: Number,
      default: 200,
    },
    geminiErrorCode: {
      type: String,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    finalOutcome: {
      type: String,
      enum: ['SUCCESS', 'FAILOVER_SUCCESS', 'ERROR_TIMEOUT', 'ERROR_RATE_LIMIT', 'ERROR_MODEL_NOT_FOUND', 'ERROR_NETWORK', 'ERROR_UNKNOWN', 'ERROR', 'FAILOVER_ERROR'],
      default: 'SUCCESS'
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AIRequest', aiRequestSchema);
