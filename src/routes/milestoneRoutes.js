const express = require('express');
const router = express.Router();
const {
  defineMilestones,
  fundMilestone,
  submitMilestoneWork,
  approveAndReleaseMilestone,
  requestMilestoneRevision,
  refundMilestone,
  getEscrowAndTransactions,
  getTaskMilestones,
  getMilestoneById,
} = require('../controllers/milestoneController');
const { protect } = require('../middleware/auth');

// All milestone and escrow routes require authentication
router.use(protect);

// 1. Define milestones for a task
router.post('/tasks/:taskId/define', defineMilestones);
router.post('/tasks/:taskId', defineMilestones); // convenience alias

// 2. Fund a milestone (simulated payment / test mode)
router.post('/:milestoneId/fund', fundMilestone);

// 3. Freelancer submits milestone work
router.post('/:milestoneId/submit', submitMilestoneWork);

// 4. Poster approves and releases payment
router.post('/:milestoneId/release', approveAndReleaseMilestone);
router.post('/:milestoneId/approve', approveAndReleaseMilestone); // alias

// 5. Poster requests revision
router.post('/:milestoneId/request-revision', requestMilestoneRevision);

// 6. Refund a milestone (admin or on dispute resolution)
router.post('/:milestoneId/refund', refundMilestone);

// 7. Get escrow status and transaction history
router.get('/tasks/:taskId/escrow', getEscrowAndTransactions);

// Additional helpers
router.get('/tasks/:taskId', getTaskMilestones);
router.get('/:milestoneId', getMilestoneById);

module.exports = router;
