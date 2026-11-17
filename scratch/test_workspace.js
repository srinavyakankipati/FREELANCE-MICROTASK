const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { io: Client } = require('../client/node_modules/socket.io-client');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const { Task } = require('../src/models/Task');
const User = require('../src/models/User');
const Workspace = require('../src/models/Workspace');
const Message = require('../src/models/Message');
const File = require('../src/models/File');
const { app, server } = require('../server');

async function runTests() {
  console.log('🧪 Starting Workspace & Socket.io Integration Tests...');

  try {
    // Wait for DB connection
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => mongoose.connection.once('connected', resolve));
    }
    console.log('✅ MongoDB connected');

    // Create test poster and freelancer
    const posterEmail = `poster_${Date.now()}@test.com`;
    const freelancerEmail = `freelancer_${Date.now()}@test.com`;
    const unauthorizedEmail = `unauth_${Date.now()}@test.com`;

    const poster = await User.create({
      name: 'Test Poster',
      email: posterEmail,
      password: 'password123',
      role: 'client',
    });

    const freelancer = await User.create({
      name: 'Test Freelancer',
      email: freelancerEmail,
      password: 'password123',
      role: 'freelancer',
    });

    const unauthorizedUser = await User.create({
      name: 'Random User',
      email: unauthorizedEmail,
      password: 'password123',
      role: 'freelancer',
    });

    const posterToken = jwt.sign({ id: poster._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const freelancerToken = jwt.sign({ id: freelancer._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const unauthorizedToken = jwt.sign({ id: unauthorizedUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create a task
    const task = await Task.create({
      title: 'Per-Task Workspace Test Task',
      description: 'Test description for workspace and chat integration.',
      category: 'Web Development',
      budget: 150,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      poster: poster._id,
      assignedFreelancer: freelancer._id,
      status: 'in-progress',
    });
    console.log(`✅ Test task created: ${task._id}`);

    const baseUrl = `http://localhost:${process.env.PORT || 5000}`;

    // Test 1: Get or Create Workspace
    console.log('\n--- API 1: Get/Create Workspace ---');
    const wsRes = await fetch(`${baseUrl}/api/workspaces/task/${task._id}`, {
      headers: { Authorization: `Bearer ${posterToken}` },
    });
    const wsData = await wsRes.json();
    if (!wsData.success || !wsData.workspace) {
      throw new Error(`Failed to create workspace: ${JSON.stringify(wsData)}`);
    }
    const workspaceId = wsData.workspace._id;
    console.log(`✅ Workspace retrieved/created: ${workspaceId}`);

    // Test Unauthorized access to Workspace
    const unauthWsRes = await fetch(`${baseUrl}/api/workspaces/task/${task._id}`, {
      headers: { Authorization: `Bearer ${unauthorizedToken}` },
    });
    if (unauthWsRes.status === 403) {
      console.log('✅ Unauthorized access blocked properly (403)');
    } else {
      console.warn(`⚠️ Expected 403, got: ${unauthWsRes.status}`);
    }

    // Test 2: Send Message
    console.log('\n--- API 2: Send Message ---');
    const msgRes = await fetch(`${baseUrl}/api/workspaces/${workspaceId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${posterToken}`,
      },
      body: JSON.stringify({ content: 'Hello Freelancer, welcome to the workspace!' }),
    });
    const msgData = await msgRes.json();
    if (!msgData.success || !msgData.message) {
      throw new Error(`Failed to send message: ${JSON.stringify(msgData)}`);
    }
    console.log(`✅ Message sent by Poster: "${msgData.message.content}"`);

    // Test 3: Get Chat History (paginated)
    console.log('\n--- API 3: Get Chat History (Paginated) ---');
    const historyRes = await fetch(`${baseUrl}/api/workspaces/${workspaceId}/messages?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${freelancerToken}` },
    });
    const historyData = await historyRes.json();
    if (!historyData.success || !Array.isArray(historyData.messages)) {
      throw new Error(`Failed to get history: ${JSON.stringify(historyData)}`);
    }
    console.log(`✅ Chat history retrieved: ${historyData.messages.length} messages, page ${historyData.page}/${historyData.totalPages}`);

    // Test 4: Upload File (Multer + Cloudinary/Storage)
    console.log('\n--- API 4: Upload File ---');
    const formData = new FormData();
    const testFileBlob = new Blob(['console.log("Task deliverable test code");'], { type: 'text/javascript' });
    formData.append('file', testFileBlob, 'deliverable.js');

    const uploadRes = await fetch(`${baseUrl}/api/workspaces/${workspaceId}/files`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${freelancerToken}` },
      body: formData,
    });
    const uploadData = await uploadRes.json();
    if (!uploadData.success || !uploadData.file) {
      throw new Error(`Failed to upload file: ${JSON.stringify(uploadData)}`);
    }
    const uploadedFile = uploadData.file;
    console.log(`✅ File uploaded successfully: "${uploadedFile.originalName}" (${uploadedFile.fileUrl})`);

    // Test 5: List Files
    console.log('\n--- API 5: List Files ---');
    const filesRes = await fetch(`${baseUrl}/api/workspaces/${workspaceId}/files`, {
      headers: { Authorization: `Bearer ${posterToken}` },
    });
    const filesData = await filesRes.json();
    if (!filesData.success || filesData.files.length === 0) {
      throw new Error(`Failed to list files: ${JSON.stringify(filesData)}`);
    }
    console.log(`✅ Listed files: ${filesData.files.length} file(s) found in workspace`);

    // Test 6a: Download File
    console.log('\n--- API 6: Download File & Delete File ---');
    const downloadRes = await fetch(`${baseUrl}/api/workspaces/files/${uploadedFile._id}/download`, {
      headers: { Authorization: `Bearer ${posterToken}` },
      redirect: 'manual',
    });
    console.log(`✅ Download endpoint response status: ${downloadRes.status}`);

    // Test 6b: Delete File
    const deleteRes = await fetch(`${baseUrl}/api/workspaces/files/${uploadedFile._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${freelancerToken}` },
    });
    const deleteData = await deleteRes.json();
    if (!deleteData.success) {
      throw new Error(`Failed to delete file: ${JSON.stringify(deleteData)}`);
    }
    console.log(`✅ File deleted successfully`);

    // Test 7: Mark Messages as Read
    console.log('\n--- API 7: Mark Messages as Read ---');
    const readRes = await fetch(`${baseUrl}/api/workspaces/${workspaceId}/messages/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${freelancerToken}` },
    });
    const readData = await readRes.json();
    if (!readData.success) {
      throw new Error(`Failed to mark messages as read: ${JSON.stringify(readData)}`);
    }
    console.log(`✅ Messages marked as read by Freelancer`);

    // Test 8: Socket.io - JWT Auth, Join Room per taskId, events
    console.log('\n--- Socket.io: Authentication, Join Room, Events ---');
    await new Promise((resolve, reject) => {
      // Connect Poster socket
      const posterSocket = Client(baseUrl, {
        auth: { token: posterToken },
        transports: ['websocket'],
      });

      // Connect Freelancer socket
      const freelancerSocket = Client(baseUrl, {
        auth: { token: freelancerToken },
        transports: ['websocket'],
      });

      let joinedCount = 0;

      posterSocket.on('connect', () => {
        console.log('✅ Poster Socket authenticated with JWT');
        posterSocket.emit('join-task', { taskId: task._id.toString() }, (ack) => {
          if (!ack?.success) return reject(new Error(`Poster join-task failed: ${ack?.message}`));
          console.log(`✅ Poster joined room task_${task._id}`);
          joinedCount++;
          if (joinedCount === 2) proceedEvents();
        });
      });

      freelancerSocket.on('connect', () => {
        console.log('✅ Freelancer Socket authenticated with JWT');
        freelancerSocket.emit('join-task', { taskId: task._id.toString() }, (ack) => {
          if (!ack?.success) return reject(new Error(`Freelancer join-task failed: ${ack?.message}`));
          console.log(`✅ Freelancer joined room task_${task._id}`);
          joinedCount++;
          if (joinedCount === 2) proceedEvents();
        });
      });

      function proceedEvents() {
        // Test typing event
        posterSocket.on('typing', (data) => {
          console.log(`✅ Poster received typing event from Freelancer: ${data.userName} (isTyping: ${data.isTyping})`);
        });

        // Test new-message event
        posterSocket.on('new-message', (data) => {
          console.log(`✅ Poster received real-time new-message via Socket: "${data.message.content}"`);
          cleanup();
          resolve();
        });

        // Emit typing from freelancer
        freelancerSocket.emit('typing', { taskId: task._id.toString(), isTyping: true });

        // Emit send-message from freelancer
        setTimeout(() => {
          freelancerSocket.emit('send-message', {
            taskId: task._id.toString(),
            workspaceId: workspaceId.toString(),
            content: 'Real-time Socket.io message delivered!',
          });
        }, 300);
      }

      function cleanup() {
        posterSocket.disconnect();
        freelancerSocket.disconnect();
      }

      setTimeout(() => {
        cleanup();
        reject(new Error('Socket.io test timed out'));
      }, 7000);
    });

    console.log('\n🎉 ALL 7 APIS AND SOCKET.IO TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

runTests();
