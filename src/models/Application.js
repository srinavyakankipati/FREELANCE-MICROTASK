const mongoose = require('mongoose');

/**
 * Application / Bid model
 * A freelancer applies to or is invited to a task.
 * Status flow: pending -> accepted | rejected
 *              invited -> accepted | rejected (freelancer can also reject an invite)
 */
const applicationSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Application must be linked to a task'],
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Application must have a freelancer'],
    },
    /** How this record was created */
    type: {
      type: String,
      enum: ['application', 'invitation'],
      default: 'application',
    },
    /** Bid amount proposed by the freelancer (optional for invitations) */
    bidAmount: {
      type: Number,
      min: [0, 'Bid amount cannot be negative'],
      default: null,
    },
    /** Cover letter / pitch message from freelancer */
    message: {
      type: String,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'invited', 'accepted', 'rejected'],
      default: 'pending',
    },
    /** Pre-computed match score snapshot at the time of application */
    matchScore: {
      type: Number,
      default: null,
    },
    matchExplanation: {
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

// One application per freelancer per task (unique constraint)
applicationSchema.index({ task: 1, freelancer: 1 }, { unique: true });
applicationSchema.index({ task: 1, status: 1 });
applicationSchema.index({ freelancer: 1, createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
