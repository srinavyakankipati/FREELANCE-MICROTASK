const mongoose = require('mongoose');

const escrowSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Escrow must be associated with a task'],
      unique: true,
      index: true,
    },
    poster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Escrow must have a poster'],
      index: true,
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    totalBudget: {
      type: Number,
      default: 0,
      min: 0,
    },
    fundedBalance: {
      type: Number,
      default: 0,
      min: 0, // Currently held securely in escrow
    },
    releasedAmount: {
      type: Number,
      default: 0,
      min: 0, // Paid out to freelancer
    },
    refundedAmount: {
      type: Number,
      default: 0,
      min: 0, // Returned to poster
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'active', 'completed', 'disputed', 'refunded'],
        message: '{VALUE} is not a valid escrow status',
      },
      default: 'pending',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

module.exports = mongoose.model('Escrow', escrowSchema);
