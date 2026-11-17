const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const { Task } = require('../src/models/Task');
const User = require('../src/models/User');
const Milestone = require('../src/models/Milestone');
const Escrow = require('../src/models/Escrow');
const Dispute = require('../src/models/Dispute');
const { app, server } = require('../server');

async function runAdminTests() {
  console.log('🧪 Starting Admin Governance & API Integration Tests...\n');

  try {
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => mongoose.connection.once('connected', resolve));
    }
    console.log('✅ MongoDB connected');

    const timestamp = Date.now();

    // Create test admin
    const admin = await User.create({
      name: 'System Admin',
      email: `admin_${timestamp}@taskforge.io`,
      password: 'password123',
      role: 'admin',
    });

    // Create regular client
    const client = await User.create({
      name: 'Test Client',
      email: `client_${timestamp}@taskforge.io`,
      password: 'password123',
      role: 'client',
    });

    // Create regular freelancer
    const freelancer = await User.create({
      name: 'Test Freelancer',
      email: `freelancer_${timestamp}@taskforge.io`,
      password: 'password123',
      role: 'freelancer',
    });

    const adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const clientToken = jwt.sign({ id: client._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const freelancerToken = jwt.sign({ id: freelancer._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const baseUrl = `http://localhost:${process.env.PORT || 5000}`;

    // Helper fetch wrapper
    async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
      });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    }

    // 1. Role Authorization Check: Non-Admin should get 403
    console.log('--- TEST 1: Role Security Verification ---');
    const nonAdminRes = await apiRequest('/api/admin/stats', 'GET', null, freelancerToken);
    if (nonAdminRes.status === 403) {
      console.log('✅ Freelancer properly rejected from /api/admin/stats with 403 Forbidden');
    } else {
      console.error(`❌ Expected 403 for non-admin, got ${nonAdminRes.status}`);
      process.exit(1);
    }

    const clientRes = await apiRequest('/api/admin/users', 'GET', null, clientToken);
    if (clientRes.status === 403) {
      console.log('✅ Client properly rejected from /api/admin/users with 403 Forbidden');
    } else {
      console.error(`❌ Expected 403 for client, got ${clientRes.status}`);
      process.exit(1);
    }

    // 2. Platform Stats API
    console.log('\n--- TEST 2: Platform Stats API ---');
    const statsRes = await apiRequest('/api/admin/stats', 'GET', null, adminToken);
    if (statsRes.status === 200 && statsRes.data.success) {
      const stats = statsRes.data.stats;
      console.log('✅ Admin received platform stats successfully:');
      console.log(`   - Users: ${stats.users.total} (Freelancers: ${stats.users.freelancers}, Clients: ${stats.users.clients}, Admins: ${stats.users.admins})`);
      console.log(`   - Tasks: ${stats.tasks.total} (Completion Rate: ${stats.tasks.completionRate}%)`);
      console.log(`   - Escrow Volume: $${stats.escrow.totalVolume} (Funded: $${stats.escrow.fundedBalance})`);
      console.log(`   - Disputes: ${stats.disputes.total} (Open: ${stats.disputes.open})`);
    } else {
      console.error('❌ Failed to get platform stats:', statsRes);
      process.exit(1);
    }

    // 3. User Listing & Filtering
    console.log('\n--- TEST 3: User Listing & Filtering API ---');
    const usersListRes = await apiRequest('/api/admin/users?role=freelancer&limit=5', 'GET', null, adminToken);
    if (usersListRes.status === 200 && usersListRes.data.success) {
      console.log(`✅ Listed users successfully. Found ${usersListRes.data.total} total freelancers.`);
      const containsFl = usersListRes.data.users.some((u) => u._id.toString() === freelancer._id.toString());
      if (containsFl) {
        console.log('✅ Found newly created freelancer in filtered results');
      }
    } else {
      console.error('❌ Failed to list users:', usersListRes);
      process.exit(1);
    }

    // Test Search filter
    const searchRes = await apiRequest(`/api/admin/users?search=${freelancer.name}`, 'GET', null, adminToken);
    if (searchRes.status === 200 && searchRes.data.users.length > 0) {
      console.log(`✅ Search by user name found ${searchRes.data.users.length} match(es)`);
    }

    // 4. Block / Unblock User
    console.log('\n--- TEST 4: User Blocking & Self-Protection ---');
    // 4a. Try self-block
    const selfBlockRes = await apiRequest(`/api/admin/users/${admin._id}/block`, 'PATCH', {}, adminToken);
    if (selfBlockRes.status === 400 && !selfBlockRes.data.success) {
      console.log('✅ Self-block prevention active:', selfBlockRes.data.message);
    } else {
      console.error('❌ Self-block should be disallowed with 400, got:', selfBlockRes);
      process.exit(1);
    }

    // 4b. Block freelancer
    const blockRes = await apiRequest(`/api/admin/users/${freelancer._id}/block`, 'PATCH', { isBlocked: true }, adminToken);
    if (blockRes.status === 200 && blockRes.data.user.isBlocked === true) {
      console.log('✅ Successfully blocked freelancer account');
    } else {
      console.error('❌ Failed to block user:', blockRes);
      process.exit(1);
    }

    // 4c. Verify blocked user cannot access protected endpoints
    const blockedAccessRes = await apiRequest('/api/auth/me', 'GET', null, freelancerToken);
    if (blockedAccessRes.status === 403) {
      console.log('✅ Blocked user successfully denied access with 403 Forbidden');
    } else {
      console.error('❌ Blocked user should have received 403, got:', blockedAccessRes);
      process.exit(1);
    }

    // 4d. Unblock freelancer
    const unblockRes = await apiRequest(`/api/admin/users/${freelancer._id}/block`, 'PATCH', { isBlocked: false }, adminToken);
    if (unblockRes.status === 200 && unblockRes.data.user.isBlocked === false) {
      console.log('✅ Successfully unblocked freelancer account');
    }

    // 5. Tasks Moderation & Removal
    console.log('\n--- TEST 5: Task Moderation & Removal ---');
    const task = await Task.create({
      title: 'Flagged Content Review Task',
      description: 'Potentially problematic task for moderation testing',
      category: 'Digital Marketing',
      budget: 80,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      poster: client._id,
      status: 'open',
    });

    // 5a. List tasks via admin API
    const adminTasksRes = await apiRequest('/api/admin/tasks?status=open', 'GET', null, adminToken);
    if (adminTasksRes.status === 200 && adminTasksRes.data.tasks.length > 0) {
      console.log(`✅ Admin task listing returned ${adminTasksRes.data.tasks.length} open tasks`);
    }

    // 5b. Moderate task status and content
    const modRes = await apiRequest(
      `/api/admin/tasks/${task._id}/moderate`,
      'PATCH',
      {
        title: '[MODERATED] Content Reviewed Task',
        status: 'cancelled',
        budget: 95,
      },
      adminToken
    );
    if (modRes.status === 200 && modRes.data.task.status === 'cancelled') {
      console.log('✅ Admin moderated task status to "cancelled" and updated title');
    } else {
      console.error('❌ Failed to moderate task:', modRes);
      process.exit(1);
    }

    // 5c. Permanently remove task
    const delRes = await apiRequest(`/api/admin/tasks/${task._id}`, 'DELETE', null, adminToken);
    if (delRes.status === 200 && delRes.data.success) {
      console.log('✅ Task permanently removed by admin');
    } else {
      console.error('❌ Failed to remove task:', delRes);
      process.exit(1);
    }

    // Verify task is gone
    const checkTask = await Task.findById(task._id);
    if (!checkTask) {
      console.log('✅ Verified task was purged from DB');
    }

    // 6. Disputes Listing
    console.log('\n--- TEST 6: Admin Disputes Listing ---');
    const disputesRes = await apiRequest('/api/admin/disputes?status=all', 'GET', null, adminToken);
    if (disputesRes.status === 200 && Array.isArray(disputesRes.data.disputes)) {
      console.log(`✅ Admin disputes API returned ${disputesRes.data.total} total disputes`);
    } else {
      console.error('❌ Failed to fetch admin disputes:', disputesRes);
      process.exit(1);
    }

    console.log('\n🎉 ALL ADMIN API & GOVERNANCE TESTS PASSED SUCCESSFULLY! 🚀\n');

    // Cleanup test artifacts
    await User.deleteMany({ _id: { $in: [admin._id, client._id, freelancer._id] } });

    server.close();
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Integration test failed with exception:', err);
    process.exit(1);
  }
}

runAdminTests();
