const { Task }             = require('../models/Task');
const User                 = require('../models/User');
const Application          = require('../models/Application');
const { computeMatchScore } = require('../services/matchingService');
const { createNotification } = require('../services/notificationService');

/* ─────────────────────────────────────────────────────────────────
   HELPER — fetch freelancers for scoring (reused by multiple APIs)
   ───────────────────────────────────────────────────────────────── */
const fetchScoredFreelancers = async (task, limit = 10) => {
  const freelancers = await User.find({
    role: 'freelancer',
    isBlocked: false,
  }).select('name email skills badges rating reviewCount completedTaskCount professionalTitle location bio');

  return freelancers
    .map((fl) => {
      const { score, breakdown, explanation } = computeMatchScore(task, fl);
      return { freelancer: fl, score, breakdown, explanation };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

/* ─────────────────────────────────────────────────────────────────
   1. GET TOP MATCHED FREELANCERS FOR A TASK  (Poster / Admin only)
   GET /api/matching/tasks/:taskId/matches
   ───────────────────────────────────────────────────────────────── */
const getTopMatchesForTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Only the poster (or admin) may see matches
    if (
      task.poster.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only the task poster can view freelancer matches.',
      });
    }

    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const results = await fetchScoredFreelancers(task, limit);

    // Fetch existing applications for this task so we can annotate
    const applications = await Application.find({ task: task._id }).select(
      'freelancer status type'
    );
    const appMap = {};
    applications.forEach((a) => {
      appMap[a.freelancer.toString()] = { status: a.status, type: a.type };
    });

    const matches = results.map(({ freelancer, score, breakdown, explanation }) => ({
      freelancer: {
        _id:               freelancer._id,
        name:              freelancer.name,
        email:             freelancer.email,
        skills:            freelancer.skills,
        badges:            freelancer.badges,
        rating:            freelancer.rating,
        reviewCount:       freelancer.reviewCount,
        completedTaskCount: freelancer.completedTaskCount,
        professionalTitle: freelancer.professionalTitle,
        location:          freelancer.location,
      },
      matchScore:   score,
      breakdown,
      explanation,
      applicationStatus: appMap[freelancer._id.toString()] || null,
    }));

    res.status(200).json({
      success: true,
      task: { _id: task._id, title: task.title, skills: task.skills },
      count: matches.length,
      matches,
    });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────────
   2. GET RECOMMENDED TASKS FOR A FREELANCER
   GET /api/matching/recommended-tasks
   ───────────────────────────────────────────────────────────────── */
const getRecommendedTasks = async (req, res, next) => {
  try {
    const freelancer = req.user;
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    // Only open tasks that the freelancer hasn't applied to yet
    const myApplications = await Application.find({
      freelancer: freelancer._id,
    }).select('task');
    const appliedTaskIds = myApplications.map((a) => a.task.toString());

    const openTasks = await Task.find({
      status: 'open',
      poster: { $ne: freelancer._id }, // exclude own tasks
      _id: { $nin: appliedTaskIds },
    })
      .populate('poster', 'name rating badges')
      .limit(200) // fetch a large pool to score
      .lean();

    const scored = openTasks
      .map((task) => {
        const { score, explanation } = computeMatchScore(task, freelancer);
        return { task, score, explanation };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    res.status(200).json({
      success: true,
      count: scored.length,
      recommendations: scored.map(({ task, score, explanation }) => ({
        task,
        matchScore: score,
        explanation,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────────
   3. FREELANCER APPLIES / BIDS ON A TASK
   POST /api/matching/tasks/:taskId/apply
   ───────────────────────────────────────────────────────────────── */
const applyToTask = async (req, res, next) => {
  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({
        success: false,
        message: 'Only freelancers can apply to tasks.',
      });
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    if (task.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: `Cannot apply to a task that is "${task.status}". Only open tasks accept applications.`,
      });
    }
    if (task.poster.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot apply to your own task.',
      });
    }

    const { bidAmount, message } = req.body;

    // Compute match score at time of application
    const { score, explanation } = computeMatchScore(task, req.user);

    const application = await Application.create({
      task:        task._id,
      freelancer:  req.user._id,
      type:        'application',
      bidAmount:   bidAmount ? Number(bidAmount) : null,
      message:     message || '',
      status:      'pending',
      matchScore:  score,
      matchExplanation: explanation,
    });

    await application.populate('task', 'title category budget');
    await application.populate('freelancer', 'name email skills badges rating');

    // Trigger Notification to task poster
    await createNotification({
      recipient: task.poster,
      sender: req.user._id,
      type: 'new_applicant',
      title: 'New Applicant for Your Task',
      message: `${req.user.name} applied to "${task.title}" with a bid of $${application.bidAmount || task.budget}.`,
      link: `/tasks/${task._id}/applications`,
      data: { taskId: task._id, applicationId: application._id },
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      application,
      matchScore: score,
      explanation,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied to this task.',
      });
    }
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────────
   4. POSTER INVITES A FREELANCER
   POST /api/matching/tasks/:taskId/invite/:freelancerId
   ───────────────────────────────────────────────────────────────── */
const inviteFreelancer = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (
      task.poster.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Only the task poster can send invitations.',
      });
    }
    if (task.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Can only invite freelancers for open tasks.',
      });
    }

    const freelancer = await User.findOne({
      _id: req.params.freelancerId,
      role: 'freelancer',
      isBlocked: false,
    });
    if (!freelancer) {
      return res.status(404).json({ success: false, message: 'Freelancer not found.' });
    }

    const { message } = req.body;
    const { score, explanation } = computeMatchScore(task, freelancer);

    // Upsert: if freelancer already applied, upgrade to invited status
    const application = await Application.findOneAndUpdate(
      { task: task._id, freelancer: freelancer._id },
      {
        $setOnInsert: {
          task:     task._id,
          freelancer: freelancer._id,
          bidAmount: null,
        },
        $set: {
          type:             'invitation',
          status:           'invited',
          message:          message || '',
          matchScore:       score,
          matchExplanation: explanation,
        },
      },
      { upsert: true, new: true }
    );

    await application.populate('task', 'title category budget');
    await application.populate('freelancer', 'name email skills badges rating');

    res.status(200).json({
      success: true,
      message: `Invitation sent to ${freelancer.name}!`,
      application,
      matchScore: score,
      explanation,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An invitation/application already exists for this freelancer and task.',
      });
    }
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────────
   5. POSTER ACCEPTS AN APPLICANT → TASK STATUS BECOMES "assigned"
   PATCH /api/matching/tasks/:taskId/accept/:applicationId
   ───────────────────────────────────────────────────────────────── */
const acceptApplicant = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    if (
      task.poster.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Only the task poster can accept applicants.',
      });
    }
    if (task.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: `Task is already "${task.status}" and cannot accept new assignments.`,
      });
    }

    const application = await Application.findOne({
      _id:  req.params.applicationId,
      task: task._id,
    });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }
    if (application.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Cannot accept an already rejected application.',
      });
    }

    // Accept this application
    application.status = 'accepted';
    await application.save();

    // Reject all other pending/invited applications for this task
    await Application.updateMany(
      {
        task:   task._id,
        _id:    { $ne: application._id },
        status: { $in: ['pending', 'invited'] },
      },
      { $set: { status: 'rejected' } }
    );

    // Update the task
    task.status             = 'assigned';
    task.assignedFreelancer = application.freelancer;
    await task.save();

    await application.populate('freelancer', 'name email skills badges rating completedTaskCount');
    await task.populate('poster', 'name email');

    // Trigger Notification to the assigned freelancer
    await createNotification({
      recipient: application.freelancer,
      sender: req.user._id,
      type: 'assignment',
      title: 'Congratulations! You were assigned a task',
      message: `You were selected and assigned to "${task.title}". Open your task workspace to start collaborating!`,
      link: `/tasks/${task._id}/workspace`,
      data: { taskId: task._id, applicationId: application._id },
    });

    res.status(200).json({
      success: true,
      message: 'Applicant accepted! Task is now assigned.',
      task,
      application,
    });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────────
   BONUS — GET APPLICATIONS FOR A TASK (Poster view)
   GET /api/matching/tasks/:taskId/applications
   ───────────────────────────────────────────────────────────────── */
const getTaskApplications = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    if (
      task.poster.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Only the task poster can view applications.',
      });
    }

    const applications = await Application.find({ task: task._id })
      .populate('freelancer', 'name email skills badges rating reviewCount completedTaskCount professionalTitle location')
      .sort({ matchScore: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      task: { _id: task._id, title: task.title, status: task.status },
      applications,
    });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────────
   BONUS — GET MY APPLICATIONS (Freelancer view)
   GET /api/matching/my-applications
   ───────────────────────────────────────────────────────────────── */
const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ freelancer: req.user._id })
      .populate('task', 'title category budget deadline status poster skills')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTopMatchesForTask,
  getRecommendedTasks,
  applyToTask,
  inviteFreelancer,
  acceptApplicant,
  getTaskApplications,
  getMyApplications,
};
