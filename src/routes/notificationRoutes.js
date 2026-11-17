const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  listNotifications,
  getUnreadCount,
  markOneRead,
  markAllRead,
  deleteNotification,
} = require('../controllers/notificationController');

// All notification routes are protected
router.use(protect);

// 1. List notifications
router.get('/', listNotifications);

// 2. Get unread count
router.get('/unread-count', getUnreadCount);

// 3. Mark all as read
router.patch('/read-all', markAllRead);

// 4. Mark one as read
router.patch('/:id/read', markOneRead);

// 5. Delete notification
router.delete('/:id', deleteNotification);

module.exports = router;
