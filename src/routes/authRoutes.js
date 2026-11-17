const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  adminDemo,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (requires valid JWT token)
router.get('/me', protect, getMe);

// Role-protected routes (demonstrates authorize('admin'))
router.get('/admin-demo', protect, authorize('admin'), adminDemo);

// Role-protected route (freelancers or admins)
router.get(
  '/freelancer-demo',
  protect,
  authorize('freelancer', 'admin'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: `Welcome, ${req.user.name}! You have verified access to freelancer projects.`,
      userRole: req.user.role,
    });
  }
);

module.exports = router;
