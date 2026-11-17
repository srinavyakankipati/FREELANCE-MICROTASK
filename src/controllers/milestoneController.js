const mongoose = require('mongoose');
const Milestone = require('../models/Milestone');
const Escrow = require('../models/Escrow');
const Transaction = require('../models/Transaction');
const { Task } = require('../models/Task');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');

let transactionsSupported = null;

/**
 * Transaction helper that uses Mongoose sessions/transactions when supported,
 * falling back gracefully if MongoDB is running standalone without replica sets.
 */
const runInSession = async (workFn) => {
  if (transactionsSupported === false) {
    return await workFn(null);
  }

  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await workFn(session);
    await session.commitTransaction();
    transactionsSupported = true;
    return result;
  } catch (error) {
    if (session) {
      if (session.inTransaction()) {
        try {
          await session.abortTransaction();
        } catch (_) {}
      }
    }
    // If error is due to MongoDB standalone not supporting replica sets / retryable writes
    const isTxUnsupported =
      error.message &&
      (error.message.includes('replica set') ||
        error.message.includes('retryable writes') ||
        error.message.includes('Transaction numbers') ||
        error.message.includes('Transactions are not supported'));

    if (isTxUnsupported) {
      transactionsSupported = false;
      return await workFn(null);
    }
    throw error;
  } finally {
    if (session) {
      try {
        session.endSession();
      } catch (_) {}
    }
  }
};

/**
 * Helper to ensure or fetch Escrow document for a task
 */
const getOrCreateEscrow = async (task, session = null) => {
  let escrow = await Escrow.findOne({ task: task._id }).session(session || undefined);
  if (!escrow) {
    escrow = new Escrow({
      task: task._id,
      poster: task.poster,
      freelancer: task.assignedFreelancer || null,
      totalBudget: task.budget,
      fundedBalance: 0,
      releasedAmount: 0,
      refundedAmount: 0,
      status: 'pending',
    });
    await escrow.save({ session: session || undefined });
  } else if (!escrow.freelancer && task.assignedFreelancer) {
    escrow.freelancer = task.assignedFreelancer;
    await escrow.save({ session: session || undefined });
  }
  return escrow;
};

/* ─────────────────────────────────────────────────────────────────
   1. DEFINE MILESTONES FOR A TASK
   POST /api/milestones/tasks/:taskId/define
   ───────────────────────────────────────────────────────────────── */
const defineMilestones = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Only poster or admin
    if (task.poster.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the task poster can define milestones for this task.',
      });
    }

    let items = req.body.milestones;
    // Support single milestone or array of milestones
    if (!items && req.body.title && req.body.amount) {
      items = [req.body];
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one milestone with title and amount.',
      });
    }

    // Validate milestone items
    for (const item of items) {
      if (!item.title || !item.title.trim()) {
        return res.status(400).json({ success: false, message: 'Every milestone must have a title.' });
      }
      const amt = Number(item.amount);
      if (isNaN(amt) || amt <= 0) {
        return res.status(400).json({ success: false, message: 'Every milestone amount must be a positive number.' });
      }
    }

    const createdMilestones = await runInSession(async (session) => {
      // Find current count for ordering
      const existingCount = await Milestone.countDocuments({ task: task._id }).session(session || undefined);
      
      const toInsert = items.map((m, index) => ({
        task: task._id,
        title: m.title.trim(),
        description: m.description ? m.description.trim() : '',
        amount: Number(m.amount),
        dueDate: m.dueDate ? new Date(m.dueDate) : null,
        order: m.order || existingCount + index + 1,
        status: 'pending',
      }));

      const inserted = await Milestone.insertMany(toInsert, { session: session || undefined });

      // Update or create Escrow account
      const escrow = await getOrCreateEscrow(task, session);
      // Re-sum total milestone amounts
      const allMilestones = await Milestone.find({ task: task._id }).session(session || undefined);
      const totalAmount = allMilestones.reduce((acc, curr) => acc + curr.amount, 0);
      escrow.totalBudget = totalAmount > task.budget ? totalAmount : task.budget;
      await escrow.save({ session: session || undefined });

      return inserted;
    });

    const all = await Milestone.find({ task: task._id }).sort({ order: 1 });
    const escrow = await Escrow.findOne({ task: task._id });

    res.status(201).json({
      success: true,
      message: `Successfully defined ${createdMilestones.length} milestone(s).`,
      count: all.length,
      milestones: all,
      escrow,
    });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────────
   2. FUND A MILESTONE (Simulated payment / test mode)
   POST /api/milestones/:milestoneId/fund
   State machine: pending -> funded
   ───────────────────────────────────────────────────────────────── */
const fundMilestone = async (req, res, next) => {
  try {
    const milestone = await Milestone.findById(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const task = await Task.findById(milestone.task);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Associated task not found' });
    }

    // Only poster or admin
    if (task.poster.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the task poster can fund this milestone.',
      });
    }

    // STATE MACHINE VALIDATION
    if (milestone.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition: Cannot fund a milestone with status "${milestone.status}". Only "pending" milestones can be funded.`,
      });
    }

    const paymentMethod = req.body.paymentMethod || 'simulated_card';
    const paymentReference =
      req.body.paymentReference ||
      'PAY_' + Math.random().toString(36).substring(2, 9).toUpperCase();

    const result = await runInSession(async (session) => {
      // 1. Update milestone to 'funded'
      milestone.status = 'funded';
      milestone.fundedAt = new Date();
      await milestone.save({ session: session || undefined });

      // 2. Update escrow account
      const escrow = await getOrCreateEscrow(task, session);
      escrow.fundedBalance += milestone.amount;
      escrow.status = 'active';
      await escrow.save({ session: session || undefined });

      // 3. Create transaction record
      const transaction = new Transaction({
        escrow: escrow._id,
        task: task._id,
        milestone: milestone._id,
        type: 'funding',
        amount: milestone.amount,
        fromUser: req.user._id,
        toUser: null, // Held by escrow
        paymentMethod,
        paymentReference,
        status: 'completed',
        description: `Funded milestone "${milestone.title}" ($${milestone.amount})`,
      });
      await transaction.save({ session: session || undefined });

      // 4. Update task status to in-progress if it was assigned
      if (task.status === 'assigned') {
        task.status = 'in-progress';
        await task.save({ session: session || undefined });
      }

      return { milestone, escrow, transaction };
    });

    // Trigger Notification: Milestone Funded
    if (task.assignedFreelancer) {
      await createNotification({
        recipient: task.assignedFreelancer,
        sender: req.user._id,
        type: 'milestone_funded',
        title: 'Milestone Funded in Escrow',
        message: `Milestone "${milestone.title}" ($${milestone.amount}) has been funded in escrow for "${task.title}". You can begin work!`,
        link: `/tasks/${task._id}`,
        data: { taskId: task._id, milestoneId: milestone._id },
      });
    }

    res.status(200).json({
      success: true,
      message: `Milestone "${milestone.title}" funded successfully! $${milestone.amount} is securely held in escrow.`,
      milestone: result.milestone,
      escrow: result.escrow,
      transaction: result.transaction,
    });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────────
   3. FREELANCER SUBMITS MILESTONE WORK
   POST /api/milestones/:milestoneId/submit
   State machine: funded -> submitted
   ───────────────────────────────────────────────────────────────── */
const submitMilestoneWork = async (req, res, next) => {
  try {
    const milestone = await Milestone.findById(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const task = await Task.findById(milestone.task);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Associated task not found' });
    }

    // Check authorization: must be the assigned freelancer or admin
    const isAssigned =
      task.assignedFreelancer &&
      task.assignedFreelancer.toString() === req.user._id.toString();

    if (!isAssigned && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned freelancer can submit work for this milestone.',
      });
    }

    // STATE MACHINE VALIDATION
    if (milestone.status === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Invalid state transition: Milestone must be funded by the poster before work can be submitted.',
      });
    }
    if (milestone.status === 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Work for this milestone has already been submitted and is awaiting poster review.',
      });
    }
    if (milestone.status === 'approved' || milestone.status === 'released') {
      return res.status(400).json({
        success: false,
        message: 'Invalid state transition: This milestone is already approved/released.',
      });
    }
    if (milestone.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'Invalid state transition: This milestone has been refunded and cannot accept submissions.',
      });
    }
    if (milestone.status !== 'funded') {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition: Cannot submit work when milestone status is "${milestone.status}".`,
      });
    }

    const notes = req.body.notes || req.body.deliverableNotes;
    const workUrl = req.body.workUrl || req.body.deliverableLink;
    if (!notes && !workUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide submission notes or a work URL detailing your deliverables.',
      });
    }

    milestone.status = 'submitted';
    milestone.submittedAt = new Date();
    milestone.submission = {
      workUrl: workUrl ? workUrl.trim() : '',
      notes: notes ? notes.trim() : '',
      submittedAt: new Date(),
    };

    await milestone.save();

    // Trigger Notification: Milestone Deliverable Submitted
    await createNotification({
      recipient: task.poster,
      sender: req.user._id,
      type: 'milestone_submitted',
      title: 'Milestone Deliverable Submitted',
      message: `${req.user.name} submitted work for milestone "${milestone.title}" on "${task.title}". Please review it.`,
      link: `/tasks/${task._id}`,
      data: { taskId: task._id, milestoneId: milestone._id },
    });

    res.status(200).json({
      success: true,
      message: `Work for "${milestone.title}" submitted successfully! The poster has been notified to review.`,
      milestone,
    });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────────
   4. POSTER APPROVES AND RELEASES PAYMENT
   POST /api/milestones/:milestoneId/release
   State machine: submitted -> approved / released
   ───────────────────────────────────────────────────────────────── */
const approveAndReleaseMilestone = async (req, res, next) => {
  try {
    const milestone = await Milestone.findById(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const task = await Task.findById(milestone.task);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Associated task not found' });
    }

    // Only poster or admin
    if (task.poster.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the task poster can approve and release payment.',
      });
    }

    // STATE MACHINE VALIDATION
    if (milestone.status === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Invalid state transition: Cannot release payment for an unfunded milestone.',
      });
    }
    if (milestone.status === 'funded') {
      return res.status(400).json({
        success: false,
        message: 'Invalid state transition: Freelancer has not submitted work for this milestone yet.',
      });
    }
    if (milestone.status === 'released') {
      return res.status(400).json({
        success: false,
        message: 'Milestone payment has already been released.',
      });
    }
    if (milestone.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'Invalid state transition: This milestone was refunded.',
      });
    }
    if (milestone.status !== 'submitted' && milestone.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition: Cannot release milestone with status "${milestone.status}".`,
      });
    }

    const freelancerId = task.assignedFreelancer;

    const result = await runInSession(async (session) => {
      // 1. Verify Escrow has funds
      const escrow = await getOrCreateEscrow(task, session);
      if (escrow.fundedBalance < milestone.amount) {
        throw new Error(
          `Insufficient escrow balance: Escrow has $${escrow.fundedBalance}, but milestone requires $${milestone.amount}.`
        );
      }

      // 2. Transition milestone to released
      milestone.status = 'released';
      milestone.approvedAt = milestone.approvedAt || new Date();
      milestone.releasedAt = new Date();
      await milestone.save({ session: session || undefined });

      // 3. Move funds in Escrow
      escrow.fundedBalance -= milestone.amount;
      escrow.releasedAmount += milestone.amount;

      // 4. Record Transaction
      const transaction = new Transaction({
        escrow: escrow._id,
        task: task._id,
        milestone: milestone._id,
        type: 'release',
        amount: milestone.amount,
        fromUser: task.poster,
        toUser: freelancerId || null,
        paymentMethod: 'escrow_release',
        paymentReference: 'REL_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        status: 'completed',
        description: `Released $${milestone.amount} to freelancer for milestone "${milestone.title}"`,
      });
      await transaction.save({ session: session || undefined });

      // 5. Check if all milestones are released -> task & escrow completed
      const allMilestones = await Milestone.find({ task: task._id }).session(session || undefined);
      const allReleasedOrRefunded = allMilestones.every(
        (m) => m.status === 'released' || m.status === 'refunded'
      );
      const hasReleased = allMilestones.some((m) => m.status === 'released');

      if (allReleasedOrRefunded && hasReleased) {
        escrow.status = 'completed';
        task.status = 'completed';
        await task.save({ session: session || undefined });

        // Increment freelancer's completedTaskCount
        if (freelancerId) {
          await User.findByIdAndUpdate(
            freelancerId,
            { $inc: { completedTaskCount: 1 } },
            { session: session || undefined }
          );
        }
      }
      await escrow.save({ session: session || undefined });

      return { milestone, escrow, transaction, task };
    });

    // Trigger Notification: Milestone Approved & Payment Released
    if (freelancerId) {
      await createNotification({
        recipient: freelancerId,
        sender: req.user._id,
        type: 'milestone_approved',
        title: 'Milestone Approved & Released!',
        message: `Payment of $${milestone.amount} for "${milestone.title}" was approved and released to your account!`,
        link: `/tasks/${task._id}`,
        data: { taskId: task._id, milestoneId: milestone._id },
      });
    }

    res.status(200).json({
      success: true,
      message: `Payment of $${milestone.amount} approved and released to the freelancer!`,
      milestone: result.milestone,
      escrow: result.escrow,
      transaction: result.transaction,
      taskStatus: result.task.status,
    });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────────
   5. POSTER REQUESTS REVISION
   POST /api/milestones/:milestoneId/request-revision
   State machine: submitted -> funded (with revision request)
   ───────────────────────────────────────────────────────────────── */
const requestMilestoneRevision = async (req, res, next) => {
  try {
    const milestone = await Milestone.findById(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const task = await Task.findById(milestone.task);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Associated task not found' });
    }

    // Only poster or admin
    if (task.poster.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the task poster can request revisions.',
      });
    }

    // STATE MACHINE VALIDATION
    if (milestone.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition: Cannot request revisions when milestone is "${milestone.status}". Revisions can only be requested on "submitted" work.`,
      });
    }

    const { notes } = req.body;
    if (!notes || !notes.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide revision feedback/notes explaining what needs changes.',
      });
    }

    // Revert status to 'funded' so freelancer can update & re-submit
    milestone.status = 'funded';
    milestone.revisions.push({
      notes: notes.trim(),
      requestedAt: new Date(),
      requestedBy: req.user._id,
    });

    await milestone.save();

    // Trigger Notification: Milestone Revision Requested
    if (task.assignedFreelancer) {
      await createNotification({
        recipient: task.assignedFreelancer,
        sender: req.user._id,
        type: 'dispute_update',
        title: 'Milestone Revision Requested',
        message: `Client requested revisions for "${milestone.title}": "${notes.trim()}".`,
        link: `/tasks/${task._id}`,
        data: { taskId: task._id, milestoneId: milestone._id },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Revision requested. Milestone status returned to funded for rework.',
      milestone,
    });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────────
   6. REFUND A MILESTONE (Admin or on dispute resolution)
   POST /api/milestones/:milestoneId/refund
   State machine: funded / submitted -> refunded
   ───────────────────────────────────────────────────────────────── */
const refundMilestone = async (req, res, next) => {
  try {
    const milestone = await Milestone.findById(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const task = await Task.findById(milestone.task);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Associated task not found' });
    }

    // Allowed for Admin, or Poster on cancellation/dispute
    const isPoster = task.poster.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPoster && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators or the task poster can issue a milestone refund.',
      });
    }

    // STATE MACHINE VALIDATION
    if (milestone.status === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Invalid state transition: Cannot refund a pending milestone that was never funded.',
      });
    }
    if (milestone.status === 'released') {
      return res.status(400).json({
        success: false,
        message: 'Invalid state transition: Funds have already been released to the freelancer and cannot be refunded.',
      });
    }
    if (milestone.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'Milestone has already been refunded.',
      });
    }

    const reason = req.body.reason || 'Milestone payment refunded on dispute resolution';

    const result = await runInSession(async (session) => {
      const escrow = await getOrCreateEscrow(task, session);
      if (escrow.fundedBalance < milestone.amount) {
        throw new Error('Insufficient funded balance in escrow to process refund.');
      }

      // 1. Update milestone
      milestone.status = 'refunded';
      milestone.refundedAt = new Date();
      await milestone.save({ session: session || undefined });

      // 2. Update escrow balance
      escrow.fundedBalance -= milestone.amount;
      escrow.refundedAmount += milestone.amount;

      // 3. Create refund transaction
      const transaction = new Transaction({
        escrow: escrow._id,
        task: task._id,
        milestone: milestone._id,
        type: 'refund',
        amount: milestone.amount,
        fromUser: null, // Escrow
        toUser: task.poster,
        paymentMethod: 'escrow_refund',
        paymentReference: 'REF_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        status: 'completed',
        description: `Refunded $${milestone.amount} to poster for milestone "${milestone.title}". Reason: ${reason}`,
      });
      await transaction.save({ session: session || undefined });

      // 4. Update escrow status if all balance is exhausted
      if (escrow.fundedBalance === 0) {
        const allMilestones = await Milestone.find({ task: task._id }).session(session || undefined);
        const allRefunded = allMilestones.every((m) => m.status === 'refunded');
        if (allRefunded) {
          escrow.status = 'refunded';
          if (task.status !== 'completed') {
            task.status = 'cancelled';
            await task.save({ session: session || undefined });
          }
        }
      }
      await escrow.save({ session: session || undefined });

      return { milestone, escrow, transaction };
    });

    // Trigger Notification: Milestone Refund / Dispute Update
    const refundRecipient =
      req.user._id.toString() === task.poster.toString()
        ? task.assignedFreelancer
        : task.poster;

    if (refundRecipient) {
      await createNotification({
        recipient: refundRecipient,
        sender: req.user._id,
        type: 'dispute_update',
        title: 'Dispute / Milestone Refund Update',
        message: `Milestone "${milestone.title}" ($${milestone.amount}) has been refunded. Reason: ${reason}`,
        link: `/tasks/${task._id}`,
        data: { taskId: task._id, milestoneId: milestone._id },
      });
    }

    res.status(200).json({
      success: true,
      message: `Milestone "${milestone.title}" ($${milestone.amount}) has been refunded to the poster.`,
      milestone: result.milestone,
      escrow: result.escrow,
      transaction: result.transaction,
    });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────────
   7. GET ESCROW STATUS AND TRANSACTION HISTORY
   GET /api/milestones/tasks/:taskId/escrow
   ───────────────────────────────────────────────────────────────── */
const getEscrowAndTransactions = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId).populate('poster', 'name email').populate('assignedFreelancer', 'name email');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Accessible by poster, assigned freelancer, or admin
    const isPoster = task.poster._id.toString() === req.user._id.toString();
    const isFreelancer =
      task.assignedFreelancer &&
      task.assignedFreelancer._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPoster && !isFreelancer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view escrow details for this task.',
      });
    }

    const escrow = await getOrCreateEscrow(task);
    const milestones = await Milestone.find({ task: task._id }).sort({ order: 1 });
    const transactions = await Transaction.find({ task: task._id })
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email')
      .populate('milestone', 'title amount status')
      .sort({ createdAt: -1 });

    // Summary calculations
    const summary = {
      totalMilestones: milestones.length,
      pendingCount: milestones.filter((m) => m.status === 'pending').length,
      fundedCount: milestones.filter((m) => m.status === 'funded').length,
      submittedCount: milestones.filter((m) => m.status === 'submitted').length,
      releasedCount: milestones.filter((m) => m.status === 'released').length,
      refundedCount: milestones.filter((m) => m.status === 'refunded').length,
      totalBudget: escrow.totalBudget || task.budget,
      currentlyInEscrow: escrow.fundedBalance,
      totalReleased: escrow.releasedAmount,
      totalRefunded: escrow.refundedAmount,
    };

    res.status(200).json({
      success: true,
      task: {
        _id: task._id,
        title: task.title,
        budget: task.budget,
        status: task.status,
        poster: task.poster,
        assignedFreelancer: task.assignedFreelancer,
      },
      escrow,
      milestones,
      transactions,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────────
   HELPER GETTERS
   ───────────────────────────────────────────────────────────────── */
const getTaskMilestones = async (req, res, next) => {
  try {
    const milestones = await Milestone.find({ task: req.params.taskId }).sort({ order: 1 });
    res.status(200).json({ success: true, count: milestones.length, milestones });
  } catch (error) {
    next(error);
  }
};

const getMilestoneById = async (req, res, next) => {
  try {
    const milestone = await Milestone.findById(req.params.milestoneId).populate('task', 'title budget status poster assignedFreelancer');
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }
    res.status(200).json({ success: true, milestone });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  defineMilestones,
  fundMilestone,
  submitMilestoneWork,
  approveAndReleaseMilestone,
  requestMilestoneRevision,
  refundMilestone,
  getEscrowAndTransactions,
  getTaskMilestones,
  getMilestoneById,
};
