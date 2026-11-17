const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  raiseDispute,
  addEvidence,
  getDisputeDetails,
  listMyDisputes,
  resolveDispute,
} = require('../controllers/disputeController');

// All dispute routes require authentication
router.use(protect);

// 1. Raise a dispute (freezes milestone)
router.post('/', upload.single('file'), raiseDispute);

// 2. Add evidence to an open dispute
router.post('/:id/evidence', upload.single('file'), addEvidence);

// 3. List my disputes (or all disputes for admin)
router.get('/my', listMyDisputes);

// 4. Get dispute details with chat & file history
router.get('/:id', getDisputeDetails);

// 5. Admin resolve dispute (release, refund, or split escrow)
router.patch('/:id/resolve', authorize('admin'), resolveDispute);

module.exports = router;
