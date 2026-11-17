const User = require('../models/User');
const { Task, TASK_CATEGORIES } = require('../models/Task');
const Milestone = require('../models/Milestone');
const Escrow = require('../models/Escrow');
const Dispute = require('../models/Dispute');
const Transaction = require('../models/Transaction');
const Application = require('../models/Application');
const Workspace = require('../models/Workspace');
const initSocket = require('../socket');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * 1. LIST AND FILTER USERS
 * GET /api/admin/users
 */
const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const { role, status, search } = req.query;

    const filter = {};

    if (role && role !== 'all') {
      if (!['freelancer', 'client', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid user role filter.' });
      }
      filter.role = role;
    }

    if (status === 'blocked') {
      filter.isBlocked = true;
    } else if (status === 'active') {
      filter.isBlocked = false;
    } else if (status && status !== 'all') {
      return res.status(400).json({ success: false, message: 'Invalid user status filter.' });
    }

    if (search && search.trim()) {
      const q = escapeRegex(search.trim());
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / limit) || 1;

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      users,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. BLOCK / UNBLOCK A USER
 * PATCH /api/admin/users/:id/block
 */
const toggleBlockUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent admin from blocking themselves
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'Security protection: You cannot block your own administrative account.',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Determine target block state
    if (req.body.isBlocked !== undefined && typeof req.body.isBlocked !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isBlocked must be a boolean.',
      });
    }
    const newBlockedState = req.body.isBlocked !== undefined ? req.body.isBlocked : !user.isBlocked;

    user.isBlocked = newBlockedState;
    await user.save();
    if (newBlockedState) {
      const io = initSocket.getIo();
      if (io) io.in(`user_${user._id}`).disconnectSockets(true);
    }

    return res.status(200).json({
      success: true,
      message: `User ${user.name} has been ${user.isBlocked ? 'blocked' : 'unblocked'} successfully.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. LIST ALL TASKS FOR MODERATION
 * GET /api/admin/tasks
 */
const listTasks = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const { status, category, search } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      if (!['open', 'assigned', 'in-progress', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid task status filter.' });
      }
      filter.status = status;
    }
    if (category && category !== 'all') {
      if (!TASK_CATEGORIES.includes(category)) {
        return res.status(400).json({ success: false, message: 'Invalid task category filter.' });
      }
      filter.category = category;
    }
    if (search && search.trim()) {
      const q = escapeRegex(search.trim());
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    const total = await Task.countDocuments(filter);
    const totalPages = Math.ceil(total / limit) || 1;

    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('poster', 'name email role')
      .populate('assignedFreelancer', 'name email role');

    return res.status(200).json({
      success: true,
      tasks,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3a. MODERATE A TASK
 * PATCH /api/admin/tasks/:id/moderate
 */
const moderateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, title, description, category, budget } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (status) task.status = status;
    if (title) task.title = title.trim();
    if (description) task.description = description.trim();
    if (category) task.category = category;
    if (budget !== undefined) task.budget = Number(budget);

    await task.save();
    await task.populate('poster', 'name email role');
    await task.populate('assignedFreelancer', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Task moderated successfully',
      task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3b. REMOVE A TASK
 * DELETE /api/admin/tasks/:id
 */
const removeTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const [
      hasFinancialHistory,
      hasEscrow,
      hasDisputes,
      hasApplications,
      hasMilestones,
      hasWorkspace,
    ] = await Promise.all([
        Transaction.exists({ task: task._id }),
        Escrow.exists({ task: task._id }),
        Dispute.exists({ task: task._id }),
        Application.exists({ task: task._id }),
        Milestone.exists({ task: task._id }),
        Workspace.exists({ task: task._id }),
      ]);
    if (
      hasFinancialHistory ||
      hasEscrow ||
      hasDisputes ||
      hasApplications ||
      hasMilestones ||
      hasWorkspace
    ) {
      return res.status(409).json({
        success: false,
        message:
          'This task has related applications, milestones, workspace, dispute, or escrow/financial records and cannot be permanently removed. Moderate it to cancelled instead.',
      });
    }

    // Remove task
    await Task.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Task "${task.title}" has been permanently removed by admin.`,
      taskId: id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. LIST ALL DISPUTES
 * GET /api/admin/disputes
 */
const listAllDisputes = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const { status } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      if (!['open', 'under-review', 'resolved'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid dispute status filter.' });
      }
      filter.status = status;
    }

    const total = await Dispute.countDocuments(filter);
    const totalPages = Math.ceil(total / limit) || 1;

    const disputes = await Dispute.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('task', 'title budget status poster assignedFreelancer category')
      .populate('milestone', 'title amount status')
      .populate('raisedBy', 'name email role avatar')
      .populate('adminDecision.resolvedBy', 'name email role');

    return res.status(200).json({
      success: true,
      disputes,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. PLATFORM STATS
 * GET /api/admin/stats
 */
const getPlatformStats = async (req, res, next) => {
  try {
    // 1. Users metrics
    const [totalUsers, freelancersCount, clientsCount, adminsCount, blockedCount] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'freelancer' }),
        User.countDocuments({ role: 'client' }),
        User.countDocuments({ role: 'admin' }),
        User.countDocuments({ isBlocked: true }),
      ]);

    // 2. Tasks metrics
    const [totalTasks, openTasks, assignedTasks, inProgressTasks, completedTasks, cancelledTasks] =
      await Promise.all([
        Task.countDocuments(),
        Task.countDocuments({ status: 'open' }),
        Task.countDocuments({ status: 'assigned' }),
        Task.countDocuments({ status: 'in-progress' }),
        Task.countDocuments({ status: 'completed' }),
        Task.countDocuments({ status: 'cancelled' }),
      ]);

    // 3. Escrow volume metrics
    const escrowAggregate = await Escrow.aggregate([
      {
        $group: {
          _id: null,
          totalFundedBalance: { $sum: '$fundedBalance' },
          totalReleasedAmount: { $sum: '$releasedAmount' },
          totalRefundedAmount: { $sum: '$refundedAmount' },
          totalBudget: { $sum: '$totalBudget' },
        },
      },
    ]);

    const escrowStats = escrowAggregate[0] || {
      totalFundedBalance: 0,
      totalReleasedAmount: 0,
      totalRefundedAmount: 0,
      totalBudget: 0,
    };

    // 4. Disputes metrics
    const [totalDisputes, openDisputes, underReviewDisputes, resolvedDisputes] =
      await Promise.all([
        Dispute.countDocuments(),
        Dispute.countDocuments({ status: 'open' }),
        Dispute.countDocuments({ status: 'under-review' }),
        Dispute.countDocuments({ status: 'resolved' }),
      ]);

    // 5. Completion rate
    const nonCancelledTasks = totalTasks - cancelledTasks;
    const completionRate =
      nonCancelledTasks > 0
        ? parseFloat(((completedTasks / nonCancelledTasks) * 100).toFixed(1))
        : 0;

    // Recent 5 tasks & disputes
    const recentTasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('poster', 'name email');

    const recentDisputes = await Dispute.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('task', 'title')
      .populate('raisedBy', 'name');

    return res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          freelancers: freelancersCount,
          clients: clientsCount,
          admins: adminsCount,
          blocked: blockedCount,
        },
        tasks: {
          total: totalTasks,
          open: openTasks,
          assigned: assignedTasks,
          inProgress: inProgressTasks,
          completed: completedTasks,
          cancelled: cancelledTasks,
          completionRate,
        },
        escrow: {
          fundedBalance: escrowStats.totalFundedBalance,
          releasedAmount: escrowStats.totalReleasedAmount,
          refundedAmount: escrowStats.totalRefundedAmount,
          totalBudget: escrowStats.totalBudget,
          totalVolume:
            escrowStats.totalReleasedAmount +
            escrowStats.totalRefundedAmount +
            escrowStats.totalFundedBalance,
        },
        disputes: {
          total: totalDisputes,
          open: openDisputes,
          underReview: underReviewDisputes,
          resolved: resolvedDisputes,
        },
        recentTasks,
        recentDisputes,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listUsers,
  toggleBlockUser,
  listTasks,
  moderateTask,
  removeTask,
  listAllDisputes,
  getPlatformStats,
};
