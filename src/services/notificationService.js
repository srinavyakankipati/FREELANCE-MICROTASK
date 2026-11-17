const Notification = require('../models/Notification');
const initSocket = require('../socket');

/**
 * Create a notification, store in MongoDB, and emit to recipient's personal socket room
 * @param {Object} options
 * @param {string|ObjectId} options.recipient - Target User ID
 * @param {string|ObjectId} [options.sender] - Initiating User ID
 * @param {string} options.type - 'new_applicant' | 'assignment' | 'milestone_funded' | 'milestone_submitted' | 'milestone_approved' | 'new_message' | 'dispute_update'
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message body
 * @param {string} [options.link] - Target link / route (e.g., '/tasks/123/workspace')
 * @param {Object} [options.data] - Additional contextual payload
 * @returns {Promise<Document>}
 */
const createNotification = async ({
  recipient,
  sender = null,
  type,
  title,
  message,
  link = '',
  data = {},
}) => {
  if (!recipient) {
    throw new Error('A notification recipient is required.');
  }

  const recipientId = recipient._id ? recipient._id.toString() : recipient.toString();
  const senderId = sender && sender._id ? sender._id.toString() : sender ? sender.toString() : null;

  if (senderId && recipientId === senderId) return null;

  const notification = await Notification.create({
    recipient: recipientId,
    sender: senderId || null,
    type,
    title,
    message,
    link,
    data,
    read: false,
  });

  const populatedNotification = await Notification.findById(notification._id)
    .populate('sender', 'name email role avatar');

  const io = initSocket.getIo();
  if (io) {
    const personalRoom = `user_${recipientId}`;
    io.to(personalRoom).emit('notification', populatedNotification);

    const unreadCount = await Notification.countDocuments({
      recipient: recipientId,
      read: false,
    });
    io.to(personalRoom).emit('unread-count', { count: unreadCount });
  }

  return populatedNotification;
};

/**
 * Get count of unread notifications for a user
 * @param {string|ObjectId} userId
 * @returns {Promise<number>}
 */
const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({
    recipient: userId,
    read: false,
  });
};

module.exports = {
  createNotification,
  getUnreadCount,
};
