const path = require('path');
const fs = require('fs');
const Workspace = require('../models/Workspace');
const Message = require('../models/Message');
const File = require('../models/File');
const { Task } = require('../models/Task');
const { uploadFile, deleteFile: removeStorageFile } = require('../config/cloudinary');
const { createNotification } = require('../services/notificationService');

/**
 * Helper: Check if user is authorized participant of task / workspace
 */
const checkWorkspaceAccess = (workspace, task, userId, userRole) => {
  if (userRole === 'admin') return true;
  const uId = userId.toString();
  const posterId = (task?.poster?._id || task?.poster || workspace?.poster?._id || workspace?.poster)?.toString();
  const freelancerId = (
    task
      ? task.assignedFreelancer?._id || task.assignedFreelancer
      : workspace?.freelancer?._id || workspace?.freelancer
  )?.toString();

  return posterId === uId || freelancerId === uId;
};

/**
 * 1. GET / CREATE Workspace for a task
 * GET/POST /api/workspaces/task/:taskId
 */
const getOrCreateWorkspace = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate('poster', 'name email role avatar')
      .populate('assignedFreelancer', 'name email role avatar');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Authorization: User must be poster, assigned freelancer, or admin
    const userId = req.user._id.toString();
    const isPoster = task.poster?._id.toString() === userId;
    const isFreelancer = task.assignedFreelancer && task.assignedFreelancer._id.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isPoster && !isFreelancer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only the task poster and assigned freelancer can access this workspace.',
      });
    }

    // Find existing workspace or create one
    let workspace = await Workspace.findOne({ task: taskId });

    if (!workspace) {
      try {
        workspace = await Workspace.create({
          task: taskId,
          poster: task.poster._id,
          freelancer: task.assignedFreelancer ? task.assignedFreelancer._id : null,
          status: task.status === 'completed' ? 'completed' : 'active',
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
        workspace = await Workspace.findOne({ task: taskId });
        if (!workspace) throw error;
      }
    } else {
      const assignedFreelancerId = task.assignedFreelancer?._id || task.assignedFreelancer || null;
      const workspaceFreelancerId = workspace.freelancer?._id || workspace.freelancer || null;
      if (workspaceFreelancerId?.toString() !== assignedFreelancerId?.toString()) {
        workspace.freelancer = assignedFreelancerId;
        await workspace.save();
      }
    }

    // Populate references
    workspace = await Workspace.findById(workspace._id)
      .populate('task', 'title description budget status deadline category poster assignedFreelancer')
      .populate('poster', 'name email role avatar')
      .populate('freelancer', 'name email role avatar')
      .populate('lastMessage');

    return res.status(200).json({
      success: true,
      workspace,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Send Message
 * POST /api/workspaces/:workspaceId/messages
 */
const sendMessage = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { content, attachmentId } = req.body;

    const trimmedContent = typeof content === 'string' ? content.trim() : '';
    if (!trimmedContent && !attachmentId) {
      return res.status(400).json({
        success: false,
        message: 'Message content or an attachment is required.',
      });
    }

    const workspace = await Workspace.findById(workspaceId).populate('task');
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    // Access check
    if (!checkWorkspaceAccess(workspace, workspace.task, req.user._id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You are not a participant in this workspace.',
      });
    }

    if (attachmentId) {
      const attachment = await File.findOne({ _id: attachmentId, workspace: workspace._id });
      if (!attachment) {
        return res.status(400).json({
          success: false,
          message: 'The attachment must be a file uploaded to this workspace.',
        });
      }
    }

    const attachments = attachmentId ? [attachmentId] : [];

    const message = await Message.create({
      workspace: workspace._id,
      task: workspace.task._id,
      sender: req.user._id,
      content: trimmedContent,
      attachments,
      readBy: [{ user: req.user._id, readAt: new Date() }],
    });

    // Update workspace last message and last activity
    workspace.lastMessage = message._id;
    workspace.lastActivity = new Date();
    await workspace.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email role avatar')
      .populate('attachments');

    // Emit Socket.io event if available
    const io = req.app.get('io');
    if (io) {
      io.to(`task_${workspace.task._id}`).emit('new-message', {
        message: populatedMessage,
        workspaceId: workspace._id,
      });
    }

    // Trigger Notification: New message to other participant
    const posterIdStr = (workspace.poster?._id || workspace.poster)?.toString();
    const freelancerIdStr = (workspace.freelancer?._id || workspace.freelancer)?.toString();
    const currentUserIdStr = req.user._id.toString();

    const otherParticipantId =
      currentUserIdStr === posterIdStr ? freelancerIdStr : posterIdStr;

    if (otherParticipantId) {
      const previewText = trimmedContent
        ? trimmedContent.length > 70
          ? trimmedContent.substring(0, 70) + '...'
          : trimmedContent
        : 'Sent a file attachment';

      try {
        await createNotification({
          recipient: otherParticipantId,
          sender: req.user._id,
          type: 'new_message',
          title: `New message from ${req.user.name}`,
          message: previewText,
          link: `/tasks/${workspace.task._id || workspace.task}/workspace`,
          data: {
            taskId: workspace.task._id || workspace.task,
            workspaceId: workspace._id,
            messageId: message._id,
          },
        });
      } catch (notificationError) {
        console.error('Failed to create notification for workspace message:', notificationError);
      }
    }

    return res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Get Chat History (Paginated)
 * GET /api/workspaces/:workspaceId/messages
 */
const getChatHistory = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));

    const workspace = await Workspace.findById(workspaceId).populate('task');
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    if (!checkWorkspaceAccess(workspace, workspace.task, req.user._id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not have access to this workspace chat.',
      });
    }

    const totalMessages = await Message.countDocuments({ workspace: workspaceId });
    const totalPages = Math.ceil(totalMessages / limit) || 1;

    // Fetch messages paginated in reverse chronological order
    const rawMessages = await Message.find({ workspace: workspaceId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'name email role avatar')
      .populate('attachments');

    // Return in chronological order for easy chat rendering
    const messages = rawMessages.reverse();

    return res.status(200).json({
      success: true,
      messages,
      page,
      limit,
      totalPages,
      totalMessages,
      hasMore: page < totalPages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Upload File (Multer + Cloudinary)
 * POST /api/workspaces/:workspaceId/files
 */
const uploadWorkspaceFile = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a file to upload.',
      });
    }

    const workspace = await Workspace.findById(workspaceId).populate('task');
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    if (!checkWorkspaceAccess(workspace, workspace.task, req.user._id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You cannot upload files to this workspace.',
      });
    }

    // Upload using Cloudinary helper
    const uploadResult = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);

    const fileDoc = await File.create({
      workspace: workspace._id,
      task: workspace.task._id,
      uploader: req.user._id,
      originalName: req.file.originalname,
      fileUrl: uploadResult.fileUrl,
      publicId: uploadResult.publicId,
      storageType: uploadResult.storageType,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    const populatedFile = await File.findById(fileDoc._id).populate('uploader', 'name email role avatar');

    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.to(`task_${workspace.task._id}`).emit('file-uploaded', {
        file: populatedFile,
        uploadedBy: {
          _id: req.user._id,
          name: req.user.name,
        },
        workspaceId: workspace._id,
      });
    }

    return res.status(201).json({
      success: true,
      file: populatedFile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. List Files
 * GET /api/workspaces/:workspaceId/files
 */
const listFiles = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId).populate('task');
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    if (!checkWorkspaceAccess(workspace, workspace.task, req.user._id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Access to workspace files denied.',
      });
    }

    const files = await File.find({ workspace: workspaceId })
      .sort({ createdAt: -1 })
      .populate('uploader', 'name email role avatar');

    return res.status(200).json({
      success: true,
      files,
      count: files.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6a. Download File
 * GET /api/workspaces/files/:fileId/download
 */
const downloadWorkspaceFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId).populate('workspace');
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    const workspace = file.workspace?._id
      ? await Workspace.findById(file.workspace._id).populate('task')
      : null;
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }
    if (!checkWorkspaceAccess(workspace, workspace.task, req.user._id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You cannot download this file.',
      });
    }

    if (file.storageType === 'local') {
      const localFilePath = path.join(__dirname, '../../uploads/workspaces', path.basename(file.publicId));
      if (!fs.existsSync(localFilePath)) {
        return res.status(404).json({
          success: false,
          message: 'The stored file is no longer available.',
        });
      }
      return res.download(localFilePath, file.originalName);
    }

    // For Cloudinary or accessible URL, redirect or send download attachment URL
    return res.redirect(file.fileUrl);
  } catch (error) {
    next(error);
  }
};

/**
 * 6b. Delete File
 * DELETE /api/workspaces/files/:fileId
 */
const deleteWorkspaceFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId).populate('workspace');
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    const workspace = await Workspace.findById(file.workspace?._id).populate('task');
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }
    const userId = req.user._id.toString();
    const isUploader = file.uploader.toString() === userId;
    const isPoster = workspace.poster.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (
      !checkWorkspaceAccess(workspace, workspace.task, req.user._id, req.user.role) ||
      (!isUploader && !isPoster && !isAdmin)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only the file uploader or task poster can delete this file.',
      });
    }

    // Remove from storage
    await removeStorageFile(file.publicId, file.storageType);

    // Remove document
    await File.findByIdAndDelete(fileId);

    // Remove reference in Messages
    await Message.updateMany(
      { workspace: workspace._id, attachments: fileId },
      { $pull: { attachments: fileId } }
    );

    // Notify room
    const io = req.app.get('io');
    if (io) {
      io.to(`task_${workspace.task._id}`).emit('file-deleted', {
        fileId,
        workspaceId: workspace._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      fileId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Mark Messages as Read
 * PATCH /api/workspaces/:workspaceId/messages/read
 */
const markMessagesAsRead = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId).populate('task');
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    if (!checkWorkspaceAccess(workspace, workspace.task, req.user._id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await Message.updateMany(
      {
        workspace: workspaceId,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id },
      },
      {
        $push: {
          readBy: {
            user: req.user._id,
            readAt: new Date(),
          },
        },
      }
    );

    // Notify room of read receipt
    const io = req.app.get('io');
    if (io) {
      io.to(`task_${workspace.task._id}`).emit('messages-read', {
        userId: req.user._id,
        userName: req.user.name,
        workspaceId,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Messages marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrCreateWorkspace,
  sendMessage,
  getChatHistory,
  uploadWorkspaceFile,
  listFiles,
  downloadWorkspaceFile,
  deleteWorkspaceFile,
  markMessagesAsRead,
};
