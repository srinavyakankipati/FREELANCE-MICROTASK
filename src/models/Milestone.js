const mongoose = require('mongoose');

const MILESTONE_STATUSES = [
  'pending',
  'funded',
  'submitted',
  'approved',
  'released',
  'refunded',
  'disputed',
];

const milestoneSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Milestone must be associated with a task'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a milestone title'],
      trim: true,
      maxlength: [120, 'Milestone title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    amount: {
      type: Number,
      required: [true, 'Please specify an amount for this milestone'],
      min: [1, 'Milestone amount must be at least $1'],
    },
    status: {
      type: String,
      enum: {
        values: MILESTONE_STATUSES,
        message: '{VALUE} is not a valid milestone status',
      },
      default: 'pending',
      index: true,
    },
    order: {
      type: Number,
      default: 1,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    submission: {
      workUrl: { type: String, trim: true },
      notes: { type: String, trim: true },
      submittedAt: { type: Date },
    },
    revisions: [
      {
        notes: { type: String, required: true, trim: true },
        requestedAt: { type: Date, default: Date.now },
        requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    fundedAt: { type: Date },
    submittedAt: { type: Date },
    approvedAt: { type: Date },
    releasedAt: { type: Date },
    refundedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

milestoneSchema.index({ task: 1, order: 1 });

module.exports = mongoose.model('Milestone', milestoneSchema);
