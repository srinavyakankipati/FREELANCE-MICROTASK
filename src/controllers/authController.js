const User = require('../models/User');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, skills, badges } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Process skills if sent as comma-separated string or array
    let processedSkills = [];
    if (Array.isArray(skills)) {
      processedSkills = skills.map((s) => s.trim()).filter(Boolean);
    } else if (typeof skills === 'string') {
      processedSkills = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Process badges (give default starter badges based on role)
    const initialBadges = Array.isArray(badges) && badges.length > 0
      ? badges
      : ['Verified Email', role === 'client' ? 'Client' : 'Freelancer Star'];

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'freelancer',
      skills: processedSkills,
      badges: initialBadges,
      rating: 5.0,
      isBlocked: false,
    });

    // Generate token
    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        skills: user.skills,
        badges: user.badges,
        rating: user.rating,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user with email & password
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password presence
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both an email and a password.',
      });
    }

    // Check for user in DB (including password field for verification)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email and password.',
      });
    }

    // Check if account is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked or suspended. Please contact support.',
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email and password.',
      });
    }

    // Generate JWT
    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        skills: user.skills,
        badges: user.badges,
        rating: user.rating,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin only demonstration route
 * @route   GET /api/auth/admin-demo
 * @access  Private / Admin
 */
const adminDemo = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Access granted! You are viewing an Admin-only protected resource.',
      data: {
        totalUsers: 1420,
        activeTasks: 389,
        systemHealth: '100% Operational',
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  adminDemo,
};
