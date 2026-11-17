const express = require('express');
const router = express.Router();
const {
  submitReview,
  getUserReviews,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

// 4. Submit review (requires task completion & participation, recalculates rating)
router.post('/', protect, submitReview);

// 5. Get reviews for a user
router.get('/user/:userId', getUserReviews);

module.exports = router;
