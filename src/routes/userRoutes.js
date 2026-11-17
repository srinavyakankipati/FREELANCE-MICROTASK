const express = require('express');
const router = express.Router();
const {
  getPublicProfile,
  updateMyProfile,
  addPortfolioItem,
  deletePortfolioItem,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// 1. Get freelancer public profile
router.get('/profile/:id', getPublicProfile);

// 2. Update my profile (authenticated)
router.put('/profile', protect, updateMyProfile);

// 3. Add portfolio item (authenticated)
router.post('/portfolio', protect, addPortfolioItem);

// Delete portfolio item (authenticated)
router.delete('/portfolio/:itemId', protect, deletePortfolioItem);

module.exports = router;
