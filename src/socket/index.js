const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Task } = require('../models/Task');
const Workspace = require('../models/Workspace');
const Message = require('../models/Message');
const File = require('../models/File');

let ioInstance = null;

const initSocket = (httpServer) => {
  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ];

  const io = new Server(httpServer, {
    cors: {
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
          return callback(null, true);
        }
        return callback(new Error('CORS not allowed for Socket.io'));
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
  });

  ioInstance = io;

  // 1. Authenticate sockets with JWT
  io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.headers?.authorization;
      const token =
        socket.handshake.auth?.token ||
        (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

      if (!token) {
        return next(new Error('Authentication failed: Missing JWT token'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication failed: User no longer exists'));
      }

      if (user.isBlocked) {
        return next(new Error('Authentication failed: Account blocked'));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error(`Authentication failed: ${err.message}`));
    }
  });

  // Connection Handler
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.user.name} (${socket.user._id}) [id: ${socket.id}]`);

    // Automatically join personal user room for targeted notifications
    const personalRoom = `user_${socket.user._id}`;
    socket.join(personalRoom);
    console.log(`👤 User ${socket.user.name} joined personal room: ${personalRoom}`);
    const { getUnreadCount } = require('../services/notificationService');
    getUnreadCount(socket.user._id)
      .then((count) => socket.emit('unread-count', { count }))
      .catch((error) => console.error('Failed to load socket unread count:', error));
    const isTaskParticipant = (task, userId) =>
      task &&
      (task.poster.toString() === userId ||
        (task.assignedFreelancer && task.assignedFreelancer.toString() === userId));
    const isInTaskRoom = (taskId) => socket.rooms.has(`task_${taskId}`);

    // 2. Join a room per taskId (ONLY poster and assigned freelancer)
    socket.on('join-task', async ({ taskId } = {}, callback) => {
      try {
        if (!taskId) {
          if (callback) callback({ success: false, message: 'TaskId is required' });
          return;
        }

        const task = await Task.findById(taskId);
        if (!task) {
          if (callback) callback({ success: false, message: 'Task not found' });
          return;
        }

        const userId = socket.user._id.toString();
        if (!isTaskParticipant(task, userId)) {
          console.warn(`⛔ Access denied for user ${userId} to room task_${taskId}`);
          if (callback) {
            callback({
              success: false,
              message: 'Unauthorized: Only the poster and assigned freelancer can join this task room.',
            });
          }
          return;
        }

        const roomName = `task_${taskId}`;
        socket.join(roomName);
        console.log(`👥 ${socket.user.name} joined room: ${roomName}`);

        // Notify others in the room
        socket.to(roomName).emit('user-joined', {
          userId: socket.user._id,
          userName: socket.user.name,
          role: socket.user.role,
        });

        if (callback) {
          callback({
            success: true,
            room: roomName,
            user: { _id: socket.user._id, name: socket.user.name, role: socket.user.role },
          });
        }
      } catch (err) {
        console.error('Error in join-task:', err);
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Leave task room
    socket.on('leave-task', ({ taskId } = {}) => {
      if (taskId && isInTaskRoom(taskId)) {
        const roomName = `task_${taskId}`;
        socket.leave(roomName);
        socket.to(roomName).emit('user-left', {
          userId: socket.user._id,
          userName: socket.user.name,
        });
        console.log(`👋 ${socket.user.name} left room: ${roomName}`);
      }
    });

    // 3. Handle 'typing' event
    socket.on('typing', ({ taskId, isTyping } = {}) => {
      if (taskId && isInTaskRoom(taskId)) {
        socket.to(`task_${taskId}`).emit('typing', {
          userId: socket.user._id,
          userName: socket.user.name,
          isTyping: Boolean(isTyping),
        });
      }
    });

    // 4. Handle 'new-message' via socket directly (in addition to REST API)
    socket.on('send-message', async ({ taskId, workspaceId, content, attachmentId } = {}, callback) => {
      try {
        if (!content && !attachmentId) {
          if (callback) callback({ success: false, message: 'Content or attachment required' });
          return;
        }

        let workspace = null;
        if (workspaceId) {
          workspace = await Workspace.findById(workspaceId);
        } else if (taskId) {
          workspace = await Workspace.findOne({ task: taskId });
        }

        if (!workspace) {
          if (callback) callback({ success: false, message: 'Workspace not found' });
          return;
        }

        const task = await Task.findById(workspace.task);
        if (!task) {
          if (callback) callback({ success: false, message: 'Task not found' });
          return;
        }
        const userId = socket.user._id.toString();
        if (!isTaskParticipant(task, userId) || !isInTaskRoom(task._id.toString())) {
          if (callback) callback({ success: false, message: 'Unauthorized' });
          return;
        }

        const trimmedContent = typeof content === 'string' ? content.trim() : '';
        if (!trimmedContent && !attachmentId) {
          if (callback) callback({ success: false, message: 'Content or attachment required' });
          return;
        }
        if (attachmentId) {
          const attachment = await File.findOne({ _id: attachmentId, workspace: workspace._id });
          if (!attachment) {
            if (callback) callback({ success: false, message: 'Attachment is not in this workspace' });
            return;
          }
        }

        const attachments = attachmentId ? [attachmentId] : [];
        const message = await Message.create({
          workspace: workspace._id,
          task: task._id,
          sender: socket.user._id,
          content: trimmedContent,
          attachments,
          readBy: [{ user: socket.user._id, readAt: new Date() }],
        });

        workspace.lastMessage = message._id;
        workspace.lastActivity = new Date();
        await workspace.save();

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'name email role avatar')
          .populate('attachments');

        // Broadcast to everyone in the task room (including sender)
        io.to(`task_${task._id}`).emit('new-message', {
          message: populatedMessage,
          workspaceId: workspace._id,
        });

        // Emit notification to other participant's personal room
        const posterIdStr = task.poster.toString();
        const freelancerIdStr = task.assignedFreelancer?.toString();
        const otherParticipantId = userId === posterIdStr ? freelancerIdStr : posterIdStr;

        if (otherParticipantId) {
          const { createNotification } = require('../services/notificationService');
          const previewText = trimmedContent
            ? trimmedContent.length > 70
              ? trimmedContent.substring(0, 70) + '...'
              : trimmedContent
            : 'Sent a file attachment';

          await createNotification({
            recipient: otherParticipantId,
            sender: socket.user._id,
            type: 'new_message',
            title: `New message from ${socket.user.name}`,
            message: previewText,
            link: `/tasks/${task._id}/workspace`,
            data: { taskId: task._id, workspaceId: workspace._id, messageId: message._id },
          });
        }

        if (callback) callback({ success: true, message: populatedMessage });
      } catch (err) {
        console.error('Error in send-message socket event:', err);
        if (callback) callback({ success: false, message: err.message });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.user?.name || socket.id} (${reason})`);
    });
  });

  return io;
};

initSocket.getIo = () => ioInstance;

module.exports = initSocket;
