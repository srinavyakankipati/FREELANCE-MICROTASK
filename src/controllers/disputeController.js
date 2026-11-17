const mongoose = require('mongoose');
const Dispute = require('../models/Dispute');
const Milestone = require('../models/Milestone');
const Escrow = require('../models/Escrow');
const Transaction = require('../models/Transaction');
const { Task } = require('../models/Task');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Message = require('../models/Message');
const File = require('../models/File');
const { uploadFile } = require('../config/cloudinary');
const { createNotification } = require('../services/notificationService');
const initSocket = require('../socket');

let transactionsSupported = null;

const runInSession = async (work) => {
  if (transactionsSupported === false) return work(null);

  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await work(session);
    await session.commitTransaction();
    transactionsSupported = true;
    return result;
  } catch (error) {
    if (session?.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error('Failed to abort dispute transaction:', abortError);
      }
    }
    const transactionUnsupported =
      /replica set|retryable writes|Transaction numbers|Transactions are not supported/i.test(
        error.message || ''
      );
    if (!transactionUnsupported) throw error;
    transactionsSupported = false;
    return work(null);
  } finally {
    if (session) {
      try {
        await session.endSession();
      } catch (error) {
        console.error('Failed to end dispute transaction session:', error);
      }
    }
  }
};

/**
 * 1. RAISE A DISPUTE (Freezes the milestone)
 * POST /api/disputes
 */
const raiseDispute = async (req, res, next) => {
  try {
    const { taskId, milestoneId, reason, description } = req.body;

    if (!taskId || !milestoneId || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task ID, Milestone ID, and a dispute reason are required.',
      });
    }

    const task = await Task.findById(taskId)
      .populate('poster', 'name email role')
      .populate('assignedFreelancer', 'name email role');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check user is poster or assigned freelancer
    const userId = req.user._id.toString();
    const isPoster = task.poster?._id?.toString() === userId;
    const isFreelancer = task.assignedFreelancer && task.assignedFreelancer._id?.toString() === userId;
    if (!isPoster && !isFreelancer) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only the task poster or assigned freelancer can raise a dispute.',
      });
    }

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    if (milestone.task.toString() !== task._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Milestone does not belong to the specified task.',
      });
    }

    if (!['funded', 'submitted'].includes(milestone.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot dispute a milestone with status "${milestone.status}". Only funded or submitted milestones can be disputed.`,
      });
    }

    // Check if an existing open dispute exists
    const existingDispute = await Dispute.findOne({
      milestone: milestone._id,
      status: { $in: ['open', 'under-review'] },
    });

    if (existingDispute) {
      return res.status(400).json({
        success: false,
        message: 'An active dispute is already open for this milestone.',
        disputeId: existingDispute._id,
      });
    }

    const escrow = await Escrow.findOne({ task: task._id });
    if (!escrow || escrow.fundedBalance < milestone.amount) {
      return res.status(400).json({
        success: false,
        message: 'The milestone does not have enough funds in escrow to open a dispute.',
      });
    }

    // Prepare initial evidence if file uploaded
    const initialEvidence = [];
    if (req.file) {
      const uploadResult = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
      initialEvidence.push({
        uploadedBy: req.user._id,
        fileUrl: uploadResult.fileUrl,
        fileName: req.file.originalname,
        description: description || 'Initial evidence submission',
        uploadedAt: new Date(),
      });
    } else if (description) {
      initialEvidence.push({
        uploadedBy: req.user._id,
        fileUrl: '',
        fileName: '',
        description,
        uploadedAt: new Date(),
      });
    }

    const dispute = await runInSession(async (session) => {
      const options = session ? { session } : {};
      const frozenMilestone = await Milestone.findOneAndUpdate(
        { _id: milestone._id, status: milestone.status },
        { $set: { status: 'disputed' } },
        { new: true, ...options }
      );
      if (!frozenMilestone) {
        const conflict = new Error('Milestone status changed before the dispute could be opened.');
        conflict.statusCode = 409;
        throw conflict;
      }

      let createdDispute;
      try {
        [createdDispute] = await Dispute.create(
          [{
            task: task._id,
            milestone: milestone._id,
            raisedBy: req.user._id,
            reason: reason.trim(),
            evidence: initialEvidence,
            status: 'open',
          }],
          options
        );
        const frozenEscrow = await Escrow.findOneAndUpdate(
          { _id: escrow._id, fundedBalance: { $gte: milestone.amount } },
          { $set: { status: 'disputed' } },
          { new: true, ...options }
        );
        if (!frozenEscrow) {
          const insufficientFunds = new Error('Escrow funds changed before the dispute could be opened.');
          insufficientFunds.statusCode = 409;
          throw insufficientFunds;
        }
        return createdDispute;
      } catch (error) {
        if (!session) {
          if (createdDispute) {
            await Dispute.findByIdAndDelete(createdDispute._id);
          }
          await Milestone.findOneAndUpdate(
            { _id: milestone._id, status: 'disputed' },
            { $set: { status: milestone.status } }
          );
        }
        throw error;
      }
    });

    const populatedDispute = await Dispute.findById(dispute._id)
      .populate('task', 'title budget poster assignedFreelancer')
      .populate('milestone', 'title amount status')
      .populate('raisedBy', 'name email role avatar')
      .populate('evidence.uploadedBy', 'name email role avatar');

    const notificationJobs = [];
    // 4. Notify Counterparty
    const counterpartyId = isPoster ? task.assignedFreelancer?._id : task.poster?._id;
    if (counterpartyId) {
      notificationJobs.push(createNotification({
        recipient: counterpartyId,
        sender: req.user._id,
        type: 'dispute_update',
        title: '⚠️ Dispute Raised on Milestone',
        message: `${req.user.name} raised a dispute on "${milestone.title}": "${reason}". Milestone funds are now frozen under review.`,
        link: `/disputes/${dispute._id}`,
        data: { taskId: task._id, milestoneId: milestone._id, disputeId: dispute._id },
      }));
    }

    // Notify Admins
    const admins = await User.find({ role: 'admin' }).select('_id');
    for (const admin of admins) {
      notificationJobs.push(createNotification({
        recipient: admin._id,
        sender: req.user._id,
        type: 'dispute_update',
        title: 'New Dispute Awaiting Admin Review',
        message: `Dispute raised on "${task.title}" (Milestone: "${milestone.title}").`,
        link: `/disputes/${dispute._id}`,
        data: { taskId: task._id, milestoneId: milestone._id, disputeId: dispute._id },
      }));
    }
    const notificationResults = await Promise.allSettled(notificationJobs);
    const notificationFailures = notificationResults.filter((result) => result.status === 'rejected');
    notificationFailures.forEach((result) =>
      console.error('Failed to deliver dispute-raised notification:', result.reason)
    );

    // Emit Socket event to task room
    const io = initSocket.getIo();
    if (io) {
      io.to(`task_${task._id}`).emit('dispute-updated', {
        action: 'raised',
        disputeId: dispute._id,
        milestoneId: milestone._id,
        raisedBy: req.user.name,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Dispute raised successfully. Milestone has been frozen.',
      dispute: populatedDispute,
      ...(notificationFailures.length > 0 && {
        warning: 'The dispute was opened, but one or more notifications could not be delivered.',
      }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. ADD EVIDENCE
 * POST /api/disputes/:id/evidence
 */
const addEvidence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    if ((typeof description !== 'string' || !description.trim()) && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide evidence notes or attach a file.',
      });
    }

    const dispute = await Dispute.findById(id).populate('task');
    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }

    const task = await Task.findById(dispute.task._id || dispute.task);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Associated task not found' });
    }
    const userId = req.user._id.toString();
    const isPoster = task.poster.toString() === userId;
    const isFreelancer = task.assignedFreelancer && task.assignedFreelancer.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isPoster && !isFreelancer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You are not a party to this dispute.',
      });
    }

    if (dispute.status === 'resolved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add evidence to an already resolved dispute.',
      });
    }

    let fileUrl = '';
    let fileName = '';

    if (req.file) {
      const uploadResult = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
      fileUrl = uploadResult.fileUrl;
      fileName = req.file.originalname;
    }

    const evidenceItem = {
      uploadedBy: req.user._id,
      fileUrl,
      fileName,
      description: typeof description === 'string' ? description.trim() : '',
      uploadedAt: new Date(),
    };

    dispute.evidence.push(evidenceItem);
    if (dispute.status === 'open') {
      dispute.status = 'under-review';
    }
    await dispute.save();

    const updatedDispute = await Dispute.findById(dispute._id)
      .populate('evidence.uploadedBy', 'name email role avatar')
      .populate('raisedBy', 'name email role avatar');

    // Notify counterparty of evidence submission
    const counterpartyId = isPoster ? task.assignedFreelancer : task.poster;
    if (counterpartyId) {
      await createNotification({
        recipient: counterpartyId,
        sender: req.user._id,
        type: 'dispute_update',
        title: 'New Evidence Submitted on Dispute',
        message: `${req.user.name} submitted new evidence on the dispute for "${task.title}".`,
        link: `/disputes/${dispute._id}`,
        data: { disputeId: dispute._id, taskId: task._id },
      });
    }
    const io = initSocket.getIo();
    if (io) {
      io.to(`task_${task._id}`).emit('dispute-updated', {
        action: 'evidence-added',
        disputeId: dispute._id,
        evidence: updatedDispute.evidence[updatedDispute.evidence.length - 1],
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Evidence added successfully',
      evidence: updatedDispute.evidence[updatedDispute.evidence.length - 1],
      dispute: updatedDispute,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. GET DISPUTE DETAILS WITH CHAT / FILE HISTORY
 * GET /api/disputes/:id
 */
const getDisputeDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const dispute = await Dispute.findById(id)
      .populate({
        path: 'task',
        populate: [
          { path: 'poster', select: 'name email role rating badges avatar' },
          { path: 'assignedFreelancer', select: 'name email role rating badges avatar' },
        ],
      })
      .populate('milestone')
      .populate('raisedBy', 'name email role avatar')
      .populate('evidence.uploadedBy', 'name email role avatar')
      .populate('adminDecision.resolvedBy', 'name email role');

    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }

    const task = dispute.task;
    if (!task || !dispute.milestone) {
      return res.status(404).json({
        success: false,
        message: 'The dispute task or milestone no longer exists.',
      });
    }
    const userId = req.user._id.toString();
    const isPoster = task.poster?._id?.toString() === userId;
    const isFreelancer = task.assignedFreelancer && task.assignedFreelancer._id?.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isPoster && !isFreelancer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view this dispute.',
      });
    }

    // Fetch escrow details
    const escrow = await Escrow.findOne({ task: task._id });

    // Fetch workspace chat history and file deliverables for this task
    const workspace = await Workspace.findOne({ task: task._id });
    let messages = [];
    let files = [];

    if (workspace) {
      messages = await Message.find({ workspace: workspace._id })
        .sort({ createdAt: 1 })
        .populate('sender', 'name email role avatar')
        .populate('attachments');

      files = await File.find({ workspace: workspace._id })
        .sort({ createdAt: -1 })
        .populate('uploader', 'name email role avatar');
    }

    return res.status(200).json({
      success: true,
      dispute,
      task,
      milestone: dispute.milestone,
      escrow,
      workspace,
      messages,
      files,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. LIST MY DISPUTES
 * GET /api/disputes/my
 */
const listMyDisputes = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    // Admin sees all disputes, regular user sees disputes for their tasks
    if (req.user.role !== 'admin') {
      const userTasks = await Task.find({
        $or: [{ poster: req.user._id }, { assignedFreelancer: req.user._id }],
      }).select('_id');

      const taskIds = userTasks.map((t) => t._id);
      filter.task = { $in: taskIds };
    }

    const disputes = await Dispute.find(filter)
      .sort({ createdAt: -1 })
      .populate('task', 'title budget status poster assignedFreelancer category')
      .populate('milestone', 'title amount status')
      .populate('raisedBy', 'name email role avatar')
      .populate('adminDecision.resolvedBy', 'name email role');

    return res.status(200).json({
      success: true,
      count: disputes.length,
      disputes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. ADMIN RESOLVE A DISPUTE (Release, Refund, or Split Escrow)
 * PATCH /api/disputes/:id/resolve
 */
const resolveDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolution, notes, splitPercentage } = req.body;

    if (!['release', 'refund', 'split'].includes(resolution)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resolution option. Must be "release", "refund", or "split".',
      });
    }

    let resolvedSplitPct = 50;
    if (resolution === 'split') {
      resolvedSplitPct = Number(splitPercentage);
      if (!Number.isFinite(resolvedSplitPct) || resolvedSplitPct < 0 || resolvedSplitPct > 100) {
        return res.status(400).json({
          success: false,
          message: 'Split percentage must be a number between 0 and 100.',
        });
      }
    }
    if (notes !== undefined && typeof notes !== 'string') {
      return res.status(400).json({ success: false, message: 'Resolution notes must be text.' });
    }

    const result = await runInSession(async (session) => {
      const options = session ? { session } : {};
      const existing = await Dispute.findById(id).session(session || undefined);
      if (!existing || existing.status === 'resolved') {
        const error = new Error(
          existing ? 'This dispute has already been resolved.' : 'Dispute not found.'
        );
        error.statusCode = existing ? 400 : 404;
        throw error;
      }

      const task = await Task.findById(existing.task).session(session || undefined);
      const milestone = await Milestone.findById(existing.milestone).session(session || undefined);
      if (!task || !milestone || milestone.task.toString() !== task._id.toString()) {
        const error = new Error('Dispute task or milestone was not found.');
        error.statusCode = 404;
        throw error;
      }
      if (milestone.status !== 'disputed') {
        const error = new Error('The disputed milestone is no longer frozen.');
        error.statusCode = 400;
        throw error;
      }

      const escrow = await Escrow.findOne({ task: task._id }).session(session || undefined);
      if (!escrow) {
        const error = new Error('Escrow account not found for this task.');
        error.statusCode = 404;
        throw error;
      }

      const milestoneAmount = Number(milestone.amount);
      if (escrow.fundedBalance < milestoneAmount) {
        const error = new Error(
          `Insufficient escrow balance: Escrow currently has $${escrow.fundedBalance}, but milestone requires $${milestoneAmount}.`
        );
        error.statusCode = 400;
        throw error;
      }

      const freelancerId = task.assignedFreelancer;
      const posterId = task.poster;
      if (resolution !== 'refund' && !freelancerId) {
        const error = new Error('A freelancer must be assigned before funds can be released.');
        error.statusCode = 400;
        throw error;
      }

      const dispute = await Dispute.findOneAndUpdate(
        { _id: id, status: { $in: ['open', 'under-review'] } },
        { $set: { status: 'resolved' } },
        { new: true, ...options }
      );
      if (!dispute) {
        const error = new Error('This dispute has already been resolved.');
        error.statusCode = 400;
        throw error;
      }

      const freelancerAmount =
        resolution === 'refund'
          ? 0
          : resolution === 'release'
            ? milestoneAmount
            : Number(((milestoneAmount * resolvedSplitPct) / 100).toFixed(2));
      const posterAmount = Number((milestoneAmount - freelancerAmount).toFixed(2));
      const now = new Date();

      if (resolution === 'refund') {
        milestone.status = 'refunded';
        milestone.refundedAt = now;
        escrow.refundedAmount += milestoneAmount;
      } else {
        milestone.status = 'released';
        milestone.approvedAt = milestone.approvedAt || now;
        milestone.releasedAt = now;
        escrow.releasedAmount += freelancerAmount;
        escrow.refundedAmount += posterAmount;
      }
      escrow.fundedBalance -= milestoneAmount;

      const createLedgerEntry = async (entry) => {
        const transaction = new Transaction({
          escrow: escrow._id,
          task: task._id,
          milestone: milestone._id,
          status: 'completed',
          ...entry,
        });
        await transaction.save({ session: session || undefined });
      };

      if (freelancerAmount > 0) {
        await createLedgerEntry({
          type: 'release',
          amount: freelancerAmount,
          fromUser: posterId,
          toUser: freelancerId,
          paymentMethod: resolution === 'split' ? 'escrow_dispute_split' : 'escrow_dispute_resolution',
          paymentReference: `DISP_REL_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          description: `Dispute resolution: $${freelancerAmount} released to freelancer.`,
        });
      }
      if (posterAmount > 0) {
        await createLedgerEntry({
          type: 'refund',
          amount: posterAmount,
          fromUser: null,
          toUser: posterId,
          paymentMethod: resolution === 'split' ? 'escrow_dispute_split' : 'escrow_dispute_resolution',
          paymentReference: `DISP_REF_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          description: `Dispute resolution: $${posterAmount} refunded to task poster.`,
        });
      }

      await milestone.save({ session: session || undefined });
      const allMilestones = await Milestone.find({ task: task._id }).session(session || undefined);
      const allFinished = allMilestones.every((item) =>
        ['released', 'refunded'].includes(item.status)
      );
      const remainingDisputes = await Dispute.countDocuments({
        task: task._id,
        status: { $in: ['open', 'under-review'] },
      }).session(session || undefined);
      escrow.status = remainingDisputes
        ? 'disputed'
        : escrow.fundedBalance === 0 && allFinished
          ? 'completed'
          : 'active';
      await escrow.save({ session: session || undefined });

      dispute.resolution = resolution;
      dispute.adminDecision = {
        resolvedBy: req.user._id,
        notes: notes?.trim() || 'Dispute resolved by platform administrator.',
        splitPercentage: resolvedSplitPct,
        freelancerAmount,
        posterAmount,
        resolvedAt: now,
      };
      await dispute.save({ session: session || undefined });

      return { dispute, task, milestone, escrow, freelancerId, posterId, freelancerAmount, posterAmount };
    });
    const {
      dispute,
      task,
      milestone,
      escrow,
      freelancerId,
      posterId,
      freelancerAmount,
      posterAmount,
    } = result;

    const populatedDispute = await Dispute.findById(dispute._id)
      .populate('task', 'title budget poster assignedFreelancer')
      .populate('milestone', 'title amount status')
      .populate('raisedBy', 'name email role')
      .populate('adminDecision.resolvedBy', 'name email role');

    // Notify BOTH parties
    const resolutionSummary =
      resolution === 'split'
        ? `Split: $${freelancerAmount} to freelancer, $${posterAmount} refunded to client.`
        : resolution === 'release'
        ? `Released $${freelancerAmount} in full to freelancer.`
        : `Refunded $${posterAmount} in full to client.`;

    const resolutionNotifications = [
      createNotification({
        recipient: posterId,
        sender: req.user._id,
        type: 'dispute_update',
        title: `⚖️ Dispute Resolved: ${resolution.toUpperCase()}`,
        message: `Admin resolved dispute on "${milestone.title}". ${resolutionSummary} Notes: ${notes || 'None'}`,
        link: `/disputes/${dispute._id}`,
        data: { disputeId: dispute._id, taskId: task._id },
      }),
    ];
    if (freelancerId) {
      resolutionNotifications.push(
        createNotification({
          recipient: freelancerId,
          sender: req.user._id,
          type: 'dispute_update',
          title: `⚖️ Dispute Resolved: ${resolution.toUpperCase()}`,
          message: `Admin resolved dispute on "${milestone.title}". ${resolutionSummary} Notes: ${notes || 'None'}`,
          link: `/disputes/${dispute._id}`,
          data: { disputeId: dispute._id, taskId: task._id },
        })
      );
    }
    const resolutionNotificationResults = await Promise.allSettled(resolutionNotifications);
    const resolutionNotificationFailures = resolutionNotificationResults.filter(
      (result) => result.status === 'rejected'
    );
    resolutionNotificationFailures.forEach((result) =>
      console.error('Failed to deliver dispute resolution notification:', result.reason)
    );

    // Socket notification
    const io = initSocket.getIo();
    if (io) {
      io.to(`task_${task._id}`).emit('dispute-updated', {
        action: 'resolved',
        disputeId: dispute._id,
        milestoneId: milestone._id,
        resolution,
        adminNotes: notes,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Dispute successfully resolved with ${resolution}.`,
      dispute: populatedDispute,
      milestone,
      escrow,
      ...(resolutionNotificationFailures.length > 0 && {
        warning: 'The dispute was resolved, but one or more party notifications could not be delivered.',
      }),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  raiseDispute,
  addEvidence,
  getDisputeDetails,
  listMyDisputes,
  resolveDispute,
};
