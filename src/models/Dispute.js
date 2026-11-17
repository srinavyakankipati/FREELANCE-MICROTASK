const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileUrl: {
    type: String,
    default: '',
    trim: true,
  },
  fileName: {
    type: String,
    default: '',
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const disputeSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Dispute must reference a task'],
      index: true,
    },
    milestone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Milestone',
      required: [true, 'Dispute must reference a milestone'],
      index: true,
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Dispute must record who raised it'],
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Dispute reason is required'],
      trim: true,
      maxlength: [2000, 'Reason cannot exceed 2000 characters'],
    },
    evidence: [evidenceSchema],
    status: {
      type: String,
      enum: {
        values: ['open', 'under-review', 'resolved'],
        message: '{VALUE} is not a valid dispute status',
      },
      default: 'open',
      index: true,
    },
    adminDecision: {
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      notes: {
        type: String,
        default: '',
        trim: true,
      },
      splitPercentage: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
      },
      freelancerAmount: {
        type: Number,
        default: 0,
      },
      posterAmount: {
        type: Number,
        default: 0,
      },
      resolvedAt: {
        type: Date,
      },
    },
    resolution: {
      type: String,
      enum: ['release', 'refund', 'split'],
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

disputeSchema.index({ task: 1, milestone: 1 });
disputeSchema.index({ raisedBy: 1, status: 1 });

module.exports = mongoose.model('Dispute', disputeSchema);
