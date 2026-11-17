const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Workspace must be associated with a task'],
      unique: true,
      index: true,
    },
    poster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Workspace must have a poster'],
      index: true,
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'completed'],
      default: 'active',
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

workspaceSchema.index({ poster: 1, freelancer: 1 });

module.exports = mongoose.model('Workspace', workspaceSchema);
