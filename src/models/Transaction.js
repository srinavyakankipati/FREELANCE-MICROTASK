const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    escrow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Escrow',
      required: [true, 'Transaction must belong to an escrow account'],
      index: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Transaction must be tied to a task'],
      index: true,
    },
    milestone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Milestone',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['funding', 'release', 'refund', 'fee'],
        message: '{VALUE} is not a valid transaction type',
      },
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    paymentMethod: {
      type: String,
      default: 'simulated_escrow',
    },
    paymentReference: {
      type: String,
      default: () => 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

transactionSchema.index({ task: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
