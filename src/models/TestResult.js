const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    skillTest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SkillTest',
      required: true,
    },
    skillName: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true, // Percentage score
    },
    correctCount: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    badgeAwarded: {
      type: Boolean,
      default: false,
    },
    answers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        selectedIndex: Number,
        isCorrect: Boolean,
      },
    ],
    timeTakenSeconds: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

testResultSchema.index({ user: 1, skillTest: 1 });

module.exports = mongoose.model('TestResult', testResultSchema);
