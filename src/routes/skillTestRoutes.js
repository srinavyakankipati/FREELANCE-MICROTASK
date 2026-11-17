const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const {
  listSkillTests,
  getTestQuestions,
  submitTestAnswers,
  getMyResultsAndBadges,
  createOrUpdateSkillTest,
} = require('../controllers/skillTestController');

const { protect, authorize } = require('../middleware/auth');

// Optional auth middleware for list endpoint so it personalizes if logged in
const optionalAuth = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch (err) {
      // Ignore token errors for optional auth
    }
  }
  next();
};

// 1. List available tests (public/optional auth)
router.get('/', optionalAuth, listSkillTests);

// 4. Get my results and badges (authenticated) - MUST be before /:id
router.get('/my-results', protect, getMyResultsAndBadges);

// 2. Get test questions without correct answers
router.get('/:id', getTestQuestions);

// 3. Submit answers (auto-score & add verified badge if passed)
router.post('/:id/submit', protect, submitTestAnswers);

// 5. Admin create and update test
router.post('/', protect, authorize('admin'), createOrUpdateSkillTest);
router.put('/:id', protect, authorize('admin'), createOrUpdateSkillTest);

module.exports = router;
