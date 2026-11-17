const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  listUsers,
  toggleBlockUser,
  listTasks,
  moderateTask,
  removeTask,
  listAllDisputes,
  getPlatformStats,
} = require('../controllers/adminController');

// All routes in this router are ADMIN-ONLY
router.use(protect, authorize('admin'));

// 1. Platform Statistics
router.get('/stats', getPlatformStats);

// 2. User Management
router.get('/users', listUsers);
router.patch('/users/:id/block', toggleBlockUser);

// 3. Task Moderation & Removal
router.get('/tasks', listTasks);
router.patch('/tasks/:id/moderate', moderateTask);
router.delete('/tasks/:id', removeTask);

// 4. Disputes Management
router.get('/disputes', listAllDisputes);

module.exports = router;
