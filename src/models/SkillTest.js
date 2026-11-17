const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Please provide the question text'],
    trim: true,
  },
  options: {
    type: [String],
    required: [true, 'Please provide at least 2 options'],
    validate: {
      validator: function (v) {
        return Array.isArray(v) && v.length >= 2;
      },
      message: 'Questions must have at least 2 options',
    },
  },
  correctIndex: {
    type: Number,
    required: [true, 'Please provide the zero-based index of the correct option'],
    min: 0,
  },
});

const skillTestSchema = new mongoose.Schema(
  {
    skill: {
      type: String,
      required: [true, 'Please provide the skill name'],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'General',
    },
    description: {
      type: String,
      default: 'Demonstrate your proficiency to earn an official verified badge on your profile.',
    },
    durationMinutes: {
      type: Number,
      default: 5,
      min: [1, 'Test duration must be at least 1 minute'],
    },
    passingScore: {
      type: Number,
      default: 70, // Passing percentage
      min: [1, 'Passing score must be at least 1%'],
      max: [100, 'Passing score cannot exceed 100%'],
    },
    questions: {
      type: [questionSchema],
      required: true,
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length >= 1;
        },
        message: 'A skill test must have at least 1 question',
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SkillTest', skillTestSchema);
