const mongoose = require('mongoose');

const TASK_CATEGORIES = [
  'Web Development',
  'Mobile Apps',
  'UI/UX Design',
  'Writing & Content',
  'AI & Machine Learning',
  'Data Science & Analytics',
  'Graphic & Visual Design',
  'Video & Animation',
  'DevOps & Cloud',
  'Digital Marketing',
];

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
      maxlength: [120, 'Task title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a detailed task description'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please select a task category'],
      enum: {
        values: TASK_CATEGORIES,
        message: '{VALUE} is not a supported category',
      },
    },
    skills: {
      type: [String],
      default: [],
    },
    budget: {
      type: Number,
      required: [true, 'Please specify a budget in USD'],
      min: [5, 'Budget must be at least $5'],
    },
    deadline: {
      type: Date,
      required: [true, 'Please provide a completion deadline'],
    },
    status: {
      type: String,
      enum: {
        values: ['open', 'assigned', 'in-progress', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid task status',
      },
      default: 'open',
    },
    poster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A task must belong to a poster'],
    },
    assignedFreelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for fast searching and filtering
taskSchema.index({ poster: 1, createdAt: -1 });
taskSchema.index({ status: 1, category: 1 });
taskSchema.index(
  { title: 'text', description: 'text', skills: 'text' },
  { weights: { title: 10, skills: 5, description: 1 }, name: 'TaskTextIndex' }
);

/**
 * Post-save hook: when a task transitions to 'completed', increment
 * the assigned freelancer's completedTaskCount.
 */
taskSchema.post('save', async function (doc) {
  if (doc.status === 'completed' && doc.assignedFreelancer) {
    try {
      const User = require('mongoose').model('User');
      await User.findByIdAndUpdate(doc.assignedFreelancer, {
        $inc: { completedTaskCount: 1 },
      });
    } catch (_) {
      // Non-critical — swallow silently
    }
  }
});

module.exports = {
  Task: mongoose.model('Task', taskSchema),
  TASK_CATEGORIES,
};
