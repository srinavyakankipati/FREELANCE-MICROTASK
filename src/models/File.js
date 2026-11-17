const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'File must belong to a workspace'],
      index: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'File must reference a task'],
      index: true,
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'File must have an uploader'],
      index: true,
    },
    originalName: {
      type: String,
      required: [true, 'Original filename is required'],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    publicId: {
      type: String,
      required: [true, 'Storage Public ID is required'],
    },
    storageType: {
      type: String,
      enum: ['cloudinary', 'local'],
      default: 'cloudinary',
    },
    mimeType: {
      type: String,
      default: 'application/octet-stream',
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

fileSchema.index({ workspace: 1, createdAt: -1 });

module.exports = mongoose.model('File', fileSchema);
