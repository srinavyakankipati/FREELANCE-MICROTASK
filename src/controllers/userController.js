const User = require('../models/User');
const Review = require('../models/Review');

/**
 * @desc    1. Get freelancer public profile
 * @route   GET /api/users/profile/:id
 * @access  Public
 */
const getPublicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      '-password -__v'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found',
      });
    }

    // Fetch recent reviews for this user
    const reviews = await Review.find({ reviewee: user._id })
      .populate('reviewer', 'name role rating badges')
      .populate('task', 'title category budget')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        role: user.role,
        professionalTitle: user.professionalTitle || (user.role === 'freelancer' ? 'Professional Freelancer' : 'Project Client'),
        bio: user.bio,
        skills: user.skills,
        badges: user.badges,
        rating: user.rating,
        reviewCount: user.reviewCount || reviews.length,
        hourlyRate: user.hourlyRate,
        location: user.location,
        portfolio: user.portfolio || [],
        createdAt: user.createdAt,
      },
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    2. Update my profile
 * @route   PUT /api/users/profile
 * @access  Private (Authenticated)
 */
const updateMyProfile = async (req, res, next) => {
  try {
    const { name, professionalTitle, bio, skills, hourlyRate, location } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (name) user.name = name.trim();
    if (professionalTitle !== undefined) user.professionalTitle = professionalTitle.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (location !== undefined) user.location = location.trim();
    if (hourlyRate !== undefined) user.hourlyRate = Number(hourlyRate);

    if (skills !== undefined) {
      if (Array.isArray(skills)) {
        user.skills = skills.map((s) => s.trim()).filter(Boolean);
      } else if (typeof skills === 'string') {
        user.skills = skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    3. Add portfolio item
 * @route   POST /api/users/portfolio
 * @access  Private (Authenticated)
 */
const addPortfolioItem = async (req, res, next) => {
  try {
    const { title, description, projectUrl, imageUrl, tags } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a project title',
      });
    }

    let processedTags = [];
    if (Array.isArray(tags)) {
      processedTags = tags.map((t) => t.trim()).filter(Boolean);
    } else if (typeof tags === 'string') {
      processedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }

    const user = await User.findById(req.user._id);

    const newItem = {
      title: title.trim(),
      description: description ? description.trim() : '',
      projectUrl: projectUrl ? projectUrl.trim() : '',
      imageUrl: imageUrl ? imageUrl.trim() : '',
      tags: processedTags,
      createdAt: new Date(),
    };

    user.portfolio.unshift(newItem);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Portfolio project added successfully!',
      portfolioItem: user.portfolio[0],
      portfolio: user.portfolio,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete portfolio item
 * @route   DELETE /api/users/portfolio/:itemId
 * @access  Private (Authenticated)
 */
const deletePortfolioItem = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.portfolio = user.portfolio.filter(
      (item) => item._id.toString() !== req.params.itemId
    );
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Portfolio project removed successfully!',
      portfolio: user.portfolio,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicProfile,
  updateMyProfile,
  addPortfolioItem,
  deletePortfolioItem,
};
