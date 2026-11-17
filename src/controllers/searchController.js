const { Task, TASK_CATEGORIES } = require('../models/Task');
const User = require('../models/User');

/**
 * @desc    Search tasks with MongoDB text search / regex, filters, sorting & pagination
 * @route   GET /api/search/tasks
 * @access  Public
 */
const searchTasks = async (req, res, next) => {
  try {
    const {
      keyword,
      category,
      minBudget,
      maxBudget,
      skills,
      sort,
      status,
      page = 1,
      limit = 6,
    } = req.query;

    const query = {};

    // Status filter (defaults to 'open' if not provided)
    if (status && status !== 'all') {
      query.status = status;
    } else if (!status) {
      query.status = 'open';
    }

    // Keyword Search using MongoDB $text or regex matching
    if (keyword && keyword.trim()) {
      const trimmed = keyword.trim();
      if (req.query.useText === 'true') {
        query.$text = { $search: trimmed };
      } else {
        query.$or = [
          { title: { $regex: trimmed, $options: 'i' } },
          { description: { $regex: trimmed, $options: 'i' } },
          { skills: { $in: [new RegExp(trimmed, 'i')] } },
        ];
      }
    }

    // Category filter
    if (category && category !== 'All') {
      if (Array.isArray(category)) {
        query.category = { $in: category };
      } else {
        query.category = category;
      }
    }

    // Budget range
    if (minBudget || maxBudget) {
      query.budget = {};
      if (minBudget) query.budget.$gte = Number(minBudget);
      if (maxBudget) query.budget.$lte = Number(maxBudget);
    }

    // Skills filter (comma-separated or array)
    if (skills) {
      const skillsArr = Array.isArray(skills)
        ? skills
        : skills.split(',').map((s) => s.trim()).filter(Boolean);
      if (skillsArr.length > 0) {
        query.skills = { $in: skillsArr.map((s) => new RegExp(`^${s}$`, 'i')) };
      }
    }

    // Sorting
    let sortOption = { createdAt: -1 }; // default newest
    switch (sort) {
      case 'budget-high':
        sortOption = { budget: -1 };
        break;
      case 'budget-low':
        sortOption = { budget: 1 };
        break;
      case 'deadline':
        sortOption = { deadline: 1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('poster', 'name email rating badges role')
      .populate('assignedFreelancer', 'name email rating badges')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      page: pageNum,
      totalPages,
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search freelancers (skills, min rating, verified only, keyword) with pagination
 * @route   GET /api/search/freelancers
 * @access  Public
 */
const searchFreelancers = async (req, res, next) => {
  try {
    const {
      keyword,
      skills,
      minRating,
      verifiedOnly,
      location,
      minHourlyRate,
      maxHourlyRate,
      sort,
      page = 1,
      limit = 6,
    } = req.query;

    const query = {
      role: 'freelancer',
      isBlocked: false,
    };

    // Keyword search
    if (keyword && keyword.trim()) {
      const trimmed = keyword.trim();
      query.$or = [
        { name: { $regex: trimmed, $options: 'i' } },
        { professionalTitle: { $regex: trimmed, $options: 'i' } },
        { bio: { $regex: trimmed, $options: 'i' } },
        { skills: { $in: [new RegExp(trimmed, 'i')] } },
      ];
    }

    // Location filter
    if (location && location.trim()) {
      query.location = { $regex: location.trim(), $options: 'i' };
    }

    // Hourly Rate Range filter
    if (minHourlyRate || maxHourlyRate) {
      query.hourlyRate = {};
      if (minHourlyRate) query.hourlyRate.$gte = Number(minHourlyRate);
      if (maxHourlyRate) query.hourlyRate.$lte = Number(maxHourlyRate);
    }

    // Skills filter
    if (skills) {
      const skillsArr = Array.isArray(skills)
        ? skills
        : skills.split(',').map((s) => s.trim()).filter(Boolean);
      if (skillsArr.length > 0) {
        query.skills = { $in: skillsArr.map((s) => new RegExp(`^${s}$`, 'i')) };
      }
    }

    // Minimum rating
    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }

    // Verified badges only
    if (verifiedOnly === 'true' || verifiedOnly === true) {
      query.badges = { $regex: /^Verified/ };
    }

    // Sorting
    let sortOption = { rating: -1, reviewCount: -1 };
    switch (sort) {
      case 'hourly-low':
        sortOption = { hourlyRate: 1 };
        break;
      case 'hourly-high':
        sortOption = { hourlyRate: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'rating-high':
      default:
        sortOption = { rating: -1, reviewCount: -1 };
        break;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const freelancers = await User.find(query)
      .select('-password -__v')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      count: freelancers.length,
      total,
      page: pageNum,
      totalPages,
      freelancers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Skill autocomplete suggestions
 * @route   GET /api/search/skills
 * @access  Public
 */
const getSkillSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;

    const baseSkills = [
      'React',
      'Node.js',
      'MongoDB',
      'Express',
      'Python',
      'TypeScript',
      'JavaScript',
      'UI/UX Design',
      'Figma',
      'TailwindCSS',
      'Docker',
      'AWS',
      'GraphQL',
      'Next.js',
      'Vue.js',
      'Angular',
      'PostgreSQL',
      'Solidity',
      'Machine Learning',
      'SEO',
    ];

    // Combine distinct skills from Task and User collections
    const [userSkills, taskSkills] = await Promise.all([
      User.distinct('skills'),
      Task.distinct('skills'),
    ]);

    // Case-insensitively deduplicate skills from baseline, tasks, and users
    const uniqueMap = new Map();
    [...baseSkills, ...userSkills, ...taskSkills].forEach((skill) => {
      if (skill && typeof skill === 'string') {
        const trimmed = skill.trim();
        const lower = trimmed.toLowerCase();
        if (!uniqueMap.has(lower) && trimmed.length > 0) {
          // Normalize capitalization (e.g. React over react)
          uniqueMap.set(lower, trimmed.charAt(0).toUpperCase() + trimmed.slice(1));
        }
      }
    });

    const allSkills = Array.from(uniqueMap.values());

    let matchedSkills = allSkills;
    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      matchedSkills = allSkills.filter((s) => s.toLowerCase().includes(term));
    }

    res.status(200).json({
      success: true,
      skills: matchedSkills.slice(0, 10),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Trending categories aggregated with task volume & average budget
 * @route   GET /api/search/trending-categories
 * @access  Public
 */
const getTrendingCategories = async (req, res, next) => {
  try {
    const aggregation = await Task.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$category',
          taskCount: { $sum: 1 },
          avgBudget: { $avg: '$budget' },
          totalBudget: { $sum: '$budget' },
        },
      },
      { $sort: { taskCount: -1, avgBudget: -1 } },
    ]);

    const countMap = {};
    aggregation.forEach((item) => {
      countMap[item._id] = {
        category: item._id,
        taskCount: item.taskCount,
        avgBudget: Math.round(item.avgBudget),
        totalBudget: Math.round(item.totalBudget),
      };
    });

    const trending = TASK_CATEGORIES.map((cat) => {
      return (
        countMap[cat] || {
          category: cat,
          taskCount: 0,
          avgBudget: 0,
          totalBudget: 0,
        }
      );
    }).sort((a, b) => b.taskCount - a.taskCount);

    res.status(200).json({
      success: true,
      categories: trending,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Recommended tasks based on user skills (or highest rated/budget)
 * @route   GET /api/search/recommended-tasks
 * @access  Public / Authenticated
 */
const getRecommendedTasks = async (req, res, next) => {
  try {
    let query = { status: 'open' };
    let basedOnSkills = [];

    // If user is authenticated and has skills
    if (req.user && req.user.skills && req.user.skills.length > 0) {
      basedOnSkills = req.user.skills;
      query.skills = { $in: req.user.skills.map((s) => new RegExp(`^${s}$`, 'i')) };
    }

    let tasks = await Task.find(query)
      .populate('poster', 'name email rating badges role')
      .sort({ budget: -1, createdAt: -1 })
      .limit(6);

    // If no matching tasks found for user's skills, fallback to general top open tasks
    if (tasks.length === 0) {
      tasks = await Task.find({ status: 'open' })
        .populate('poster', 'name email rating badges role')
        .sort({ budget: -1, createdAt: -1 })
        .limit(6);
    }

    res.status(200).json({
      success: true,
      basedOnSkills,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchTasks,
  searchFreelancers,
  getSkillSuggestions,
  getTrendingCategories,
  getRecommendedTasks,
};
