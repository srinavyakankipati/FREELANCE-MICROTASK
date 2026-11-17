const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const {
  searchTasks,
  searchFreelancers,
  getSkillSuggestions,
  getTrendingCategories,
  getRecommendedTasks,
} = require('../controllers/searchController');

// Optional auth middleware so recommended tasks personalizes for logged-in user
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
      // Ignore token failure for optional endpoints
    }
  }
  next();
};

// 1. Search tasks
router.get('/tasks', searchTasks);

// 2. Search freelancers
router.get('/freelancers', searchFreelancers);

// 3. Skill autocomplete suggestions
router.get('/skills', getSkillSuggestions);

// 4. Trending categories
router.get('/trending-categories', getTrendingCategories);

// 5. Recommended tasks (optional auth for personalization)
router.get('/recommended-tasks', optionalAuth, getRecommendedTasks);

module.exports = router;
