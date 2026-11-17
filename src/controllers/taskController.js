const { Task, TASK_CATEGORIES } = require('../models/Task');
const { createNotification } = require('../services/notificationService');

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Private (Poster / Client / Admin)
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, category, skills, budget, deadline } = req.body;

    // Check role authorization (clients or admins can post tasks)
    if (req.user.role === 'freelancer') {
      return res.status(403).json({
        success: false,
        message: 'Only clients or admins can post new tasks. Please switch or register as a client to post tasks.',
      });
    }

    // Validate skills
    let processedSkills = [];
    if (Array.isArray(skills)) {
      processedSkills = skills.map((s) => s.trim()).filter(Boolean);
    } else if (typeof skills === 'string') {
      processedSkills = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Validate deadline is in the future
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid deadline date.',
      });
    }

    const task = await Task.create({
      title,
      description,
      category,
      skills: processedSkills,
      budget: Number(budget),
      deadline: deadlineDate,
      poster: req.user._id,
      status: 'open',
    });

    // Populate poster details for immediate use
    await task.populate('poster', 'name email rating badges role');

    res.status(201).json({
      success: true,
      message: 'Task created successfully!',
      task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task (Poster-only)
 * @route   PUT /api/tasks/:id
 * @access  Private (Task Poster or Admin)
 */
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check ownership: poster only or admin
    if (
      task.poster.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not the poster of this task.',
      });
    }

    const previousFreelancerId = task.assignedFreelancer?.toString() || null;
    const {
      title,
      description,
      category,
      skills,
      budget,
      deadline,
      status,
      assignedFreelancer,
    } = req.body;

    if (title) task.title = title;
    if (description) task.description = description;
    if (category) task.category = category;
    if (budget) task.budget = Number(budget);
    if (status) task.status = status;
    if (assignedFreelancer !== undefined) task.assignedFreelancer = assignedFreelancer || null;

    if (skills !== undefined) {
      if (Array.isArray(skills)) {
        task.skills = skills.map((s) => s.trim()).filter(Boolean);
      } else if (typeof skills === 'string') {
        task.skills = skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    if (deadline) {
      task.deadline = new Date(deadline);
    }

    const updatedTask = await task.save();
    await updatedTask.populate('poster', 'name email rating badges');
    await updatedTask.populate('assignedFreelancer', 'name email rating skills badges');

    const assignedFreelancerId = updatedTask.assignedFreelancer?._id?.toString() ||
      updatedTask.assignedFreelancer?.toString() ||
      null;
    if (assignedFreelancerId && assignedFreelancerId !== previousFreelancerId) {
      await createNotification({
        recipient: assignedFreelancerId,
        sender: req.user._id,
        type: 'assignment',
        title: 'You were assigned a task',
        message: `You were assigned to "${updatedTask.title}". Open your task workspace to start collaborating.`,
        link: `/tasks/${updatedTask._id}/workspace`,
        data: { taskId: updatedTask._id },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully!',
      task: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete task (Poster-only)
 * @route   DELETE /api/tasks/:id
 * @access  Private (Task Poster or Admin)
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check ownership: poster only or admin
    if (
      task.poster.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not the poster of this task.',
      });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully!',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get task by ID
 * @route   GET /api/tasks/:id
 * @access  Public / Private
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('poster', 'name email rating badges role')
      .populate('assignedFreelancer', 'name email rating skills badges role');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get my tasks (tasks posted by logged-in user or assigned to them)
 * @route   GET /api/tasks/my-tasks
 * @access  Private
 */
const getMyTasks = async (req, res, next) => {
  try {
    const query = {
      $or: [
        { poster: req.user._id },
        { assignedFreelancer: req.user._id },
      ],
    };

    const tasks = await Task.find(query)
      .populate('poster', 'name email rating badges')
      .populate('assignedFreelancer', 'name email rating skills badges')
      .sort({ createdAt: -1 });

    const postedCount = tasks.filter(
      (t) => t.poster && t.poster._id.toString() === req.user._id.toString()
    ).length;

    const assignedCount = tasks.filter(
      (t) =>
        t.assignedFreelancer &&
        t.assignedFreelancer._id.toString() === req.user._id.toString()
    ).length;

    res.status(200).json({
      success: true,
      count: tasks.length,
      stats: {
        total: tasks.length,
        posted: postedCount,
        assigned: assignedCount,
        open: tasks.filter((t) => t.status === 'open').length,
        inProgress: tasks.filter((t) => t.status === 'in-progress').length,
        completed: tasks.filter((t) => t.status === 'completed').length,
      },
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get categories list with task counts
 * @route   GET /api/tasks/categories
 * @access  Public
 */
const getCategories = async (req, res, next) => {
  try {
    // Get aggregate counts of active tasks per category
    const categoryCounts = await Task.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    categoryCounts.forEach((item) => {
      countMap[item._id] = item.count;
    });

    const categoriesWithStats = TASK_CATEGORIES.map((cat) => ({
      name: cat,
      taskCount: countMap[cat] || 0,
    }));

    res.status(200).json({
      success: true,
      categories: TASK_CATEGORIES,
      categoryStats: categoriesWithStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all tasks with optional filters & search
 * @route   GET /api/tasks
 * @access  Public
 */
const getAllTasks = async (req, res, next) => {
  try {
    const { category, status, search, minBudget, maxBudget } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (minBudget || maxBudget) {
      filter.budget = {};
      if (minBudget) filter.budget.$gte = Number(minBudget);
      if (maxBudget) filter.budget.$lte = Number(maxBudget);
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const tasks = await Task.find(filter)
      .populate('poster', 'name email rating badges role')
      .populate('assignedFreelancer', 'name email rating skills badges')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  updateTask,
  deleteTask,
  getTaskById,
  getMyTasks,
  getCategories,
  getAllTasks,
};
