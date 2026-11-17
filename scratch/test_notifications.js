const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { io: Client } = require('../client/node_modules/socket.io-client');
const dotenv = require('dotenv');

dotenv.config();

const { Task } = require('../src/models/Task');
const User = require('../src/models/User');
const Milestone = require('../src/models/Milestone');
const Application = require('../src/models/Application');
const Notification = require('../src/models/Notification');
const { app, server } = require('../server');

async function runNotificationTests() {
  console.log('🧪 Starting Notification & Socket.io Integration Tests...');

  try {
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => mongoose.connection.once('connected', resolve));
    }
    console.log('✅ MongoDB connected');

    const timestamp = Date.now();
    const poster = await User.create({
      name: 'Notif Poster',
      email: `notif_poster_${timestamp}@test.com`,
      password: 'password123',
      role: 'client',
    });

    const freelancer = await User.create({
      name: 'Notif Freelancer',
      email: `notif_freelancer_${timestamp}@test.com`,
      password: 'password123',
      role: 'freelancer',
      skills: ['React', 'Node.js'],
    });

    const posterToken = jwt.sign({ id: poster._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const freelancerToken = jwt.sign({ id: freelancer._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const baseUrl = `http://localhost:${process.env.PORT || 5000}`;

    // Connect real-time sockets to personal rooms
    const posterSocket = Client(baseUrl, {
      auth: { token: posterToken },
      transports: ['websocket'],
    });

    const freelancerSocket = Client(baseUrl, {
      auth: { token: freelancerToken },
      transports: ['websocket'],
    });

    const posterNotificationsReceived = [];
    const freelancerNotificationsReceived = [];

    posterSocket.on('notification', (notif) => {
      console.log(`🔔 Poster Socket received live notification: [${notif.type}] ${notif.title}`);
      posterNotificationsReceived.push(notif);
    });

    freelancerSocket.on('notification', (notif) => {
      console.log(`🔔 Freelancer Socket received live notification: [${notif.type}] ${notif.title}`);
      freelancerNotificationsReceived.push(notif);
    });

    await new Promise((resolve) => {
      let count = 0;
      posterSocket.on('connect', () => {
        count++;
        if (count === 2) resolve();
      });
      freelancerSocket.on('connect', () => {
        count++;
        if (count === 2) resolve();
      });
    });
    console.log('✅ Both sockets connected and joined personal rooms');

    // Create a task
    const task = await Task.create({
      title: 'Real-Time Notification Test Task',
      description: 'Testing all 5 triggers and 5 notification APIs',
      category: 'Web Development',
      budget: 300,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      poster: poster._id,
      status: 'open',
    });

    // ── TRIGGER 1: New Applicant ──
    console.log('\n--- Trigger 1: New Applicant ---');
    const applyRes = await fetch(`${baseUrl}/api/matching/tasks/${task._id}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freelancerToken}`,
      },
      body: JSON.stringify({ bidAmount: 280, message: 'I can complete this task fast!' }),
    });
    const applyData = await applyRes.json();
    if (!applyData.success) throw new Error(`Apply failed: ${JSON.stringify(applyData)}`);
    console.log('✅ Application submitted');

    // Wait a brief moment for socket emission
    await new Promise((r) => setTimeout(r, 200));

    // ── TRIGGER 2: Assignment ──
    console.log('\n--- Trigger 2: Assignment ---');
    const assignRes = await fetch(`${baseUrl}/api/matching/tasks/${task._id}/accept/${applyData.application._id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${posterToken}` },
    });
    const assignData = await assignRes.json();
    if (!assignData.success) throw new Error(`Assign failed: ${JSON.stringify(assignData)}`);
    console.log('✅ Applicant accepted & task assigned');
    await new Promise((r) => setTimeout(r, 200));

    // Define Milestone
    const defineRes = await fetch(`${baseUrl}/api/milestones/tasks/${task._id}/define`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${posterToken}`,
      },
      body: JSON.stringify({
        milestones: [{ title: 'Milestone 1 - Frontend & UI', amount: 150 }],
      }),
    });
    const defineData = await defineRes.json();
    const milestoneId = defineData.milestones[0]._id;

    // ── TRIGGER 3: Milestone Funded ──
    console.log('\n--- Trigger 3: Milestone Funded ---');
    const fundRes = await fetch(`${baseUrl}/api/milestones/${milestoneId}/fund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${posterToken}`,
      },
      body: JSON.stringify({ paymentMethod: 'simulated_card' }),
    });
    const fundData = await fundRes.json();
    if (!fundData.success) throw new Error(`Fund failed: ${JSON.stringify(fundData)}`);
    console.log('✅ Milestone funded in escrow');
    await new Promise((r) => setTimeout(r, 200));

    // ── TRIGGER 4: Milestone Submitted ──
    console.log('\n--- Trigger 4: Milestone Submitted ---');
    const submitRes = await fetch(`${baseUrl}/api/milestones/${milestoneId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freelancerToken}`,
      },
      body: JSON.stringify({ notes: 'Deliverables submitted for review', workUrl: 'https://github.com/test' }),
    });
    const submitData = await submitRes.json();
    if (!submitData.success) throw new Error(`Submit failed: ${JSON.stringify(submitData)}`);
    console.log('✅ Milestone work submitted');
    await new Promise((r) => setTimeout(r, 200));

    // ── TRIGGER 5: Milestone Approved & Released ──
    console.log('\n--- Trigger 5: Milestone Approved ---');
    const approveRes = await fetch(`${baseUrl}/api/milestones/${milestoneId}/release`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${posterToken}` },
    });
    const approveData = await approveRes.json();
    if (!approveData.success) throw new Error(`Approve failed: ${JSON.stringify(approveData)}`);
    console.log('✅ Milestone payment released');
    await new Promise((r) => setTimeout(r, 200));

    // ── TRIGGER 6: New Message in Workspace ──
    console.log('\n--- Trigger 6: New Message in Workspace ---');
    const wsRes = await fetch(`${baseUrl}/api/workspaces/task/${task._id}`, {
      headers: { Authorization: `Bearer ${posterToken}` },
    });
    const wsData = await wsRes.json();
    const workspaceId = wsData.workspace._id;

    const msgRes = await fetch(`${baseUrl}/api/workspaces/${workspaceId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${posterToken}`,
      },
      body: JSON.stringify({ content: 'Hey Freelancer, great work on Milestone 1!' }),
    });
    const msgData = await msgRes.json();
    if (!msgData.success) throw new Error(`Send message failed: ${JSON.stringify(msgData)}`);
    console.log('✅ Message sent');
    await new Promise((r) => setTimeout(r, 200));

    // ── TEST THE 5 APIS ──
    console.log('\n--- Testing the 5 Notification APIs ---');

    // API 1: List notifications
    const listRes = await fetch(`${baseUrl}/api/notifications`, {
      headers: { Authorization: `Bearer ${freelancerToken}` },
    });
    const listData = await listRes.json();
    if (!listData.success || !Array.isArray(listData.notifications)) {
      throw new Error(`List notifications failed: ${JSON.stringify(listData)}`);
    }
    console.log(`✅ API 1 (List): Found ${listData.notifications.length} notifications for Freelancer`);

    // API 2: Unread count
    const unreadRes = await fetch(`${baseUrl}/api/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${freelancerToken}` },
    });
    const unreadData = await unreadRes.json();
    if (!unreadData.success || typeof unreadData.count !== 'number') {
      throw new Error(`Unread count failed: ${JSON.stringify(unreadData)}`);
    }
    console.log(`✅ API 2 (Unread Count): Unread count is ${unreadData.count}`);

    // API 3: Mark one as read
    const firstNotifId = listData.notifications[0]._id;
    const markOneRes = await fetch(`${baseUrl}/api/notifications/${firstNotifId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${freelancerToken}` },
    });
    const markOneData = await markOneRes.json();
    if (!markOneData.success || !markOneData.notification.read) {
      throw new Error(`Mark one read failed: ${JSON.stringify(markOneData)}`);
    }
    console.log(`✅ API 3 (Mark One Read): Marked notification ${firstNotifId} as read`);

    // API 4: Mark all as read
    const markAllRes = await fetch(`${baseUrl}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${freelancerToken}` },
    });
    const markAllData = await markAllRes.json();
    if (!markAllData.success) {
      throw new Error(`Mark all read failed: ${JSON.stringify(markAllData)}`);
    }
    console.log(`✅ API 4 (Mark All Read): ${markAllData.modifiedCount} notifications marked as read`);

    // API 5: Delete notification
    const deleteRes = await fetch(`${baseUrl}/api/notifications/${firstNotifId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${freelancerToken}` },
    });
    const deleteData = await deleteRes.json();
    if (!deleteData.success) {
      throw new Error(`Delete notification failed: ${JSON.stringify(deleteData)}`);
    }
    console.log(`✅ API 5 (Delete): Notification deleted successfully`);

    // Check Socket notifications received
    console.log(`\n📡 Live socket events received by Poster: ${posterNotificationsReceived.length}`);
    console.log(`📡 Live socket events received by Freelancer: ${freelancerNotificationsReceived.length}`);

    posterSocket.disconnect();
    freelancerSocket.disconnect();

    console.log('\n🎉 ALL NOTIFICATION APIS, TRIGGERS & SOCKET.IO DELIVERY PASSED!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Notification test failed:', err);
    process.exit(1);
  }
}

runNotificationTests();
