const Notification = require('../models/Notification');
const initSocket = require('../socket');

/**
 * 1. List notifications for current user
 * GET /api/notifications
 */
const listNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const unreadOnly = req.query.unread === 'true';

    const filter = { recipient: req.user._id };
    if (unreadOnly) {
      filter.read = false;
    }

    const total = await Notification.countDocuments(filter);
    const totalPages = Math.ceil(total / limit) || 1;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'name email role avatar');

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    return res.status(200).json({
      success: true,
      notifications,
      total,
      page,
      totalPages,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Get unread notifications count
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Mark one notification as read
 * PATCH /api/notifications/:id/read
 */
const markOneRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { $set: { read: true } },
      { new: true }
    ).populate('sender', 'name email role avatar');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or access denied',
      });
    }

    // Emit updated unread count to user's socket room
    const io = initSocket.getIo();
    if (io) {
      const unreadCount = await Notification.countDocuments({
        recipient: req.user._id,
        read: false,
      });
      const room = io.to(`user_${req.user._id}`);
      room.emit('notification-updated', notification);
      room.emit('unread-count', { count: unreadCount });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
const markAllRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true } }
    );

    // Emit updated unread count (0)
    const io = initSocket.getIo();
    if (io) {
      const room = io.to(`user_${req.user._id}`);
      room.emit('notifications-read');
      room.emit('unread-count', { count: 0 });
    }

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Delete a notification
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or access denied',
      });
    }

    // Emit updated unread count
    const io = initSocket.getIo();
    if (io) {
      const unreadCount = await Notification.countDocuments({
        recipient: req.user._id,
        read: false,
      });
      const room = io.to(`user_${req.user._id}`);
      room.emit('notification-deleted', { id: req.params.id });
      room.emit('unread-count', { count: unreadCount });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      id: req.params.id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listNotifications,
  getUnreadCount,
  markOneRead,
  markAllRead,
  deleteNotification,
};
