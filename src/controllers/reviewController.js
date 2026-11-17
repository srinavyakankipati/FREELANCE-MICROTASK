const Review = require('../models/Review');
const { Task } = require('../models/Task');
const User = require('../models/User');

/**
 * @desc    4. Submit a review (only after task completion, one review per task)
 * @route   POST /api/reviews
 * @access  Private (Authenticated)
 */
const submitReview = async (req, res, next) => {
  try {
    const { taskId, rating, comment } = req.body;

    if (!taskId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide taskId, rating (1-5), and a review comment.',
      });
    }

    const numericRating = Number(rating);
    if (numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.',
      });
    }

    // 1. Fetch task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    // 2. Check task is completed
    if (task.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be submitted for completed tasks.',
      });
    }

    // 3. Determine reviewer & reviewee roles
    const currentUserId = req.user._id.toString();
    const posterId = task.poster ? task.poster.toString() : '';
    const freelancerId = task.assignedFreelancer
      ? task.assignedFreelancer.toString()
      : '';

    let revieweeId = null;

    if (currentUserId === posterId) {
      // Client is reviewing the assigned freelancer
      if (!freelancerId) {
        return res.status(400).json({
          success: false,
          message: 'No freelancer was assigned to this task.',
        });
      }
      revieweeId = freelancerId;
    } else if (currentUserId === freelancerId) {
      // Freelancer is reviewing the client
      revieweeId = posterId;
    } else {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this task. Only the client or assigned freelancer can leave a review.',
      });
    }

    // 4. Check if reviewer already reviewed this task (one per task constraint)
    const existingReview = await Review.findOne({
      task: taskId,
      reviewer: req.user._id,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this task.',
      });
    }

    // 5. Create Review
    const review = await Review.create({
      task: taskId,
      reviewer: req.user._id,
      reviewee: revieweeId,
      rating: numericRating,
      comment: comment.trim(),
    });

    // 6. Recalculate average rating on every new review
    const allReviews = await Review.find({ reviewee: revieweeId });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const newAverage = Number((totalRating / allReviews.length).toFixed(1));

    await User.findByIdAndUpdate(revieweeId, {
      rating: newAverage,
      reviewCount: allReviews.length,
    });

    await review.populate('reviewer', 'name role rating badges');
    await review.populate('task', 'title category budget');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      review,
      updatedRating: newAverage,
      totalReviews: allReviews.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    5. Get all reviews for a user
 * @route   GET /api/reviews/user/:userId
 * @access  Public
 */
const getUserReviews = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({ reviewee: userId })
      .populate('reviewer', 'name role rating badges')
      .populate('task', 'title category budget')
      .sort({ createdAt: -1 });

    const total = reviews.length;
    const averageRating =
      total > 0
        ? Number(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
          )
        : 5.0;

    // Rating breakdown distribution: 5 star, 4 star, 3 star, 2 star, 1 star
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.round(r.rating);
      if (breakdown[star] !== undefined) {
        breakdown[star]++;
      }
    });

    res.status(200).json({
      success: true,
      count: total,
      averageRating,
      breakdown,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitReview,
  getUserReviews,
};
