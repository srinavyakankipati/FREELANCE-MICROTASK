const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const { Task } = require('../src/models/Task');
const User = require('../src/models/User');
const Milestone = require('../src/models/Milestone');
const Escrow = require('../src/models/Escrow');
const Dispute = require('../src/models/Dispute');
const Notification = require('../src/models/Notification');
const Workspace = require('../src/models/Workspace');
const Message = require('../src/models/Message');
const { app, server } = require('../server');

async function runDisputeTests() {
  console.log('🧪 Starting Dispute System Integration Tests...');

  try {
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => mongoose.connection.once('connected', resolve));
    }
    console.log('✅ MongoDB connected');

    const timestamp = Date.now();
    const poster = await User.create({
      name: 'Dispute Poster',
      email: `disp_poster_${timestamp}@test.com`,
      password: 'password123',
      role: 'client',
    });

    const freelancer = await User.create({
      name: 'Dispute Freelancer',
      email: `disp_freelancer_${timestamp}@test.com`,
      password: 'password123',
      role: 'freelancer',
    });

    const admin = await User.create({
      name: 'Platform Admin',
      email: `disp_admin_${timestamp}@test.com`,
      password: 'password123',
      role: 'admin',
    });

    const posterToken = jwt.sign({ id: poster._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const freelancerToken = jwt.sign({ id: freelancer._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const baseUrl = `http://localhost:${process.env.PORT || 5000}`;

    // 1. Setup Task, Escrow, Milestone, and Workspace
    const task = await Task.create({
      title: 'Dispute Resolution Integration Task',
      description: 'Testing dispute raise, evidence, history, and admin resolution',
      category: 'Web Development',
      budget: 500,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      poster: poster._id,
      assignedFreelancer: freelancer._id,
      status: 'in-progress',
    });

    const milestone = await Milestone.create({
      task: task._id,
      title: 'Backend Database Architecture',
      amount: 200,
      status: 'funded',
      fundedAt: new Date(),
    });

    const escrow = await Escrow.create({
      task: task._id,
      poster: poster._id,
      freelancer: freelancer._id,
      totalBudget: 500,
      fundedBalance: 200,
      status: 'active',
    });

    // Create workspace with a message and file
    const workspace = await Workspace.create({
      task: task._id,
      poster: poster._id,
      freelancer: freelancer._id,
    });

    await Message.create({
      workspace: workspace._id,
      task: task._id,
      sender: poster._id,
      content: 'Here are the DB specs agreed upon.',
    });

    console.log(`✅ Test task (${task._id}), milestone (${milestone._id}), and escrow created.`);

    // ── API 1: Raise a dispute ──
    console.log('\n--- API 1: Raise a Dispute ---');
    const raiseFormData = new FormData();
    raiseFormData.append('taskId', task._id.toString());
    raiseFormData.append('milestoneId', milestone._id.toString());
    raiseFormData.append('reason', 'Deliverable quality does not meet agreed specifications');
    raiseFormData.append('description', 'Initial explanation: the database schema lacks relational integrity.');

    const raiseRes = await fetch(`${baseUrl}/api/disputes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${posterToken}` },
      body: raiseFormData,
    });
    const raiseData = await raiseRes.json();
    if (!raiseData.success || !raiseData.dispute) {
      throw new Error(`Raise dispute failed: ${JSON.stringify(raiseData)}`);
    }
    const disputeId = raiseData.dispute._id;
    console.log(`✅ Dispute created: ID ${disputeId}, status: ${raiseData.dispute.status}`);

    // Verify milestone is FROZEN
    const updatedMilestone = await Milestone.findById(milestone._id);
    if (updatedMilestone.status !== 'disputed') {
      throw new Error(`Milestone status was expected to be 'disputed', got '${updatedMilestone.status}'`);
    }
    console.log(`✅ Milestone successfully frozen with status: '${updatedMilestone.status}'`);

    // Verify notification was sent to Freelancer
    const freelancerNotif = await Notification.findOne({
      recipient: freelancer._id,
      type: 'dispute_update',
    });
    if (!freelancerNotif) {
      throw new Error('Freelancer was not notified about dispute.');
    }
    console.log(`✅ Freelancer received notification: "${freelancerNotif.title}"`);

    // ── API 2: Add Evidence ──
    console.log('\n--- API 2: Add Evidence ---');
    const evidenceFormData = new FormData();
    evidenceFormData.append('description', 'Freelancer submission: Here are benchmark logs proving schema performance.');
    const evidenceBlob = new Blob(['benchmark_result: 10000 req/sec passed'], { type: 'text/plain' });
    evidenceFormData.append('file', evidenceBlob, 'benchmark_logs.txt');

    const evidenceRes = await fetch(`${baseUrl}/api/disputes/${disputeId}/evidence`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${freelancerToken}` },
      body: evidenceFormData,
    });
    const evidenceData = await evidenceRes.json();
    if (!evidenceData.success || !evidenceData.evidence) {
      throw new Error(`Add evidence failed: ${JSON.stringify(evidenceData)}`);
    }
    console.log(`✅ Evidence added by Freelancer: "${evidenceData.evidence.fileName}" (${evidenceData.evidence.fileUrl})`);

    // ── API 3: Get Dispute Details with Chat & File History ──
    console.log('\n--- API 3: Get Dispute Details with History ---');
    const detailRes = await fetch(`${baseUrl}/api/disputes/${disputeId}`, {
      headers: { Authorization: `Bearer ${posterToken}` },
    });
    const detailData = await detailRes.json();
    if (!detailData.success || !detailData.dispute || !Array.isArray(detailData.messages)) {
      throw new Error(`Get dispute details failed: ${JSON.stringify(detailData)}`);
    }
    console.log(`✅ Dispute details retrieved. Evidence count: ${detailData.dispute.evidence.length}, Messages audit log: ${detailData.messages.length}`);

    // ── API 4: List My Disputes ──
    console.log('\n--- API 4: List My Disputes ---');
    const listRes = await fetch(`${baseUrl}/api/disputes/my`, {
      headers: { Authorization: `Bearer ${posterToken}` },
    });
    const listData = await listRes.json();
    if (!listData.success || listData.disputes.length === 0) {
      throw new Error(`List disputes failed: ${JSON.stringify(listData)}`);
    }
    console.log(`✅ Listed disputes for Poster: ${listData.disputes.length} case(s) found`);

    // ── API 5: Admin Resolve a Dispute (Split Escrow) ──
    console.log('\n--- API 5: Admin Resolve Dispute (Split) ---');
    const resolveRes = await fetch(`${baseUrl}/api/disputes/${disputeId}/resolve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        resolution: 'split',
        splitPercentage: 60, // 60% ($120) to freelancer, 40% ($80) refund to poster
        notes: 'Partial completion verified; work is usable with minor schema alterations.',
      }),
    });
    const resolveData = await resolveRes.json();
    if (!resolveData.success || resolveData.dispute.status !== 'resolved') {
      throw new Error(`Resolve dispute failed: ${JSON.stringify(resolveData)}`);
    }
    console.log(`✅ Dispute resolved by Admin! Resolution: ${resolveData.dispute.resolution}`);
    console.log(`   Freelancer Amount: $${resolveData.dispute.adminDecision.freelancerAmount}`);
    console.log(`   Poster Refund: $${resolveData.dispute.adminDecision.posterAmount}`);

    // Check escrow balance after resolution
    const finalEscrow = await Escrow.findOne({ task: task._id });
    console.log(`✅ Escrow state after resolution: Funded balance: $${finalEscrow.fundedBalance}, Released: $${finalEscrow.releasedAmount}, Refunded: $${finalEscrow.refundedAmount}`);

    // Check both parties received resolution notifications
    const posterResolutionNotif = await Notification.findOne({
      recipient: poster._id,
      title: { $regex: /Dispute Resolved/i },
    });
    const freelancerResolutionNotif = await Notification.findOne({
      recipient: freelancer._id,
      title: { $regex: /Dispute Resolved/i },
    });

    if (!posterResolutionNotif || !freelancerResolutionNotif) {
      throw new Error('One or both parties failed to receive resolution notifications.');
    }
    console.log(`✅ Both parties received official resolution notifications:`);
    console.log(`   Poster: "${posterResolutionNotif.message}"`);
    console.log(`   Freelancer: "${freelancerResolutionNotif.message}"`);

    console.log('\n🎉 ALL 5 DISPUTE APIS AND LIFECYCLE WORKFLOWS PASSED PERFECTLY!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Dispute test failed:', err);
    process.exit(1);
  }
}

runDisputeTests();
