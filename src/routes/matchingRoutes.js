const express = require('express');
const router = express.Router();
const {
  getTopMatchesForTask,
  getRecommendedTasks,
  applyToTask,
  inviteFreelancer,
  acceptApplicant,
  getTaskApplications,
  getMyApplications,
} = require('../controllers/matchingController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// 1. Get top matched freelancers for a task (poster / admin only)
router.get('/tasks/:taskId/matches', getTopMatchesForTask);

// 2. Get recommended tasks for the logged-in freelancer
router.get('/recommended-tasks', getRecommendedTasks);

// 3. Freelancer applies / bids on a task
router.post('/tasks/:taskId/apply', applyToTask);

// 4. Poster invites a specific freelancer
router.post('/tasks/:taskId/invite/:freelancerId', inviteFreelancer);

// 5. Poster accepts an applicant → task becomes "assigned"
router.patch('/tasks/:taskId/accept/:applicationId', acceptApplicant);

// Bonus: Get all applications for a task (poster view)
router.get('/tasks/:taskId/applications', getTaskApplications);

// Bonus: Get my applications (freelancer view)
router.get('/my-applications', getMyApplications);

module.exports = router;
