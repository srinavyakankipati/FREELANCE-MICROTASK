import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Users,
  Briefcase,
  DollarSign,
  Scale,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  UserX,
  Trash2,
  Edit3,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Check,
} from 'lucide-react';

const AdminDashboard = () => {
  const { user: currentUser } = useAuth();

  // Active view tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'tasks' | 'disputes'

  // Global loading & errors
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState(null);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userFilters, setUserFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
    page: 1,
    limit: 10,
  });
  const [userPagination, setUserPagination] = useState({ total: 0, totalPages: 1 });

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskFilters, setTaskFilters] = useState({
    search: '',
    category: 'all',
    status: 'all',
    page: 1,
    limit: 10,
  });
  const [taskPagination, setTaskPagination] = useState({ total: 0, totalPages: 1 });

  // Task Moderation Modal state
  const [editingTask, setEditingTask] = useState(null);
  const [moderationForm, setModerationForm] = useState({
    title: '',
    description: '',
    category: '',
    budget: '',
    status: '',
  });
  const [submittingModeration, setSubmittingModeration] = useState(false);

  // Disputes state
  const [disputes, setDisputes] = useState([]);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [disputeFilters, setDisputeFilters] = useState({
    status: 'all',
    page: 1,
    limit: 10,
  });
  const [disputePagination, setDisputePagination] = useState({ total: 0, totalPages: 1 });

  // 1. Fetch Platform Stats
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await api.get('/admin/stats');
      if (res.data?.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching admin platform stats:', err);
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to fetch platform analytics.',
      });
    } finally {
      setLoadingStats(false);
    }
  };

  // 2. Fetch Users
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const params = new URLSearchParams();
      if (userFilters.search) params.append('search', userFilters.search);
      if (userFilters.role !== 'all') params.append('role', userFilters.role);
      if (userFilters.status !== 'all') params.append('status', userFilters.status);
      params.append('page', userFilters.page);
      params.append('limit', userFilters.limit);

      const res = await api.get(`/admin/users?${params.toString()}`);
      if (res.data?.success) {
        setUsers(res.data.users || []);
        setUserPagination({
          total: res.data.total || 0,
          totalPages: res.data.totalPages || 1,
        });
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to load users.',
      });
    } finally {
      setUsersLoading(false);
    }
  };

  // 3. Fetch Tasks
  const fetchTasks = async () => {
    try {
      setTasksLoading(true);
      const params = new URLSearchParams();
      if (taskFilters.search) params.append('search', taskFilters.search);
      if (taskFilters.category !== 'all') params.append('category', taskFilters.category);
      if (taskFilters.status !== 'all') params.append('status', taskFilters.status);
      params.append('page', taskFilters.page);
      params.append('limit', taskFilters.limit);

      const res = await api.get(`/admin/tasks?${params.toString()}`);
      if (res.data?.success) {
        setTasks(res.data.tasks || []);
        setTaskPagination({
          total: res.data.total || 0,
          totalPages: res.data.totalPages || 1,
        });
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to load tasks.',
      });
    } finally {
      setTasksLoading(false);
    }
  };

  // 4. Fetch Disputes
  const fetchDisputes = async () => {
    try {
      setDisputesLoading(true);
      const params = new URLSearchParams();
      if (disputeFilters.status !== 'all') params.append('status', disputeFilters.status);
      params.append('page', disputeFilters.page);
      params.append('limit', disputeFilters.limit);

      const res = await api.get(`/admin/disputes?${params.toString()}`);
      if (res.data?.success) {
        setDisputes(res.data.disputes || []);
        setDisputePagination({
          total: res.data.total || 0,
          totalPages: res.data.totalPages || 1,
        });
      }
    } catch (err) {
      console.error('Error fetching disputes:', err);
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to load disputes.',
      });
    } finally {
      setDisputesLoading(false);
    }
  };

  // Load stats initially
  useEffect(() => {
    fetchStats();
  }, []);

  // Trigger data load based on tab or filter change
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'tasks') {
      fetchTasks();
    } else if (activeTab === 'disputes') {
      fetchDisputes();
    }
  }, [activeTab, userFilters, taskFilters, disputeFilters]);

  // Handler: Toggle Block User
  const handleToggleBlockUser = async (targetUser) => {
    if (currentUser?._id === targetUser._id) {
      setActionMessage({
        type: 'error',
        text: 'Self-protection: You cannot block your own administrative account.',
      });
      return;
    }

    const confirmAction = window.confirm(
      `Are you sure you want to ${targetUser.isBlocked ? 'unblock' : 'block'} user "${targetUser.name}"?`
    );
    if (!confirmAction) return;

    try {
      const res = await api.patch(`/admin/users/${targetUser._id}/block`);
      if (res.data?.success) {
        setActionMessage({
          type: 'success',
          text: res.data.message || 'User status updated successfully.',
        });
        // Update user state optimistically
        setUsers((prev) =>
          prev.map((u) =>
            u._id === res.data.user._id ? { ...u, isBlocked: res.data.user.isBlocked } : u
          )
        );
        fetchStats(); // Update counters
      }
    } catch (err) {
      console.error('Error toggling block state:', err);
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update user block state.',
      });
    }
  };

  // Handler: Open Task Moderation Modal
  const openModerateTaskModal = (task) => {
    setEditingTask(task);
    setModerationForm({
      title: task.title || '',
      description: task.description || '',
      category: task.category || '',
      budget: task.budget || '',
      status: task.status || 'open',
    });
  };

  // Handler: Submit Task Moderation
  const handleSaveTaskModeration = async (e) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      setSubmittingModeration(true);
      const res = await api.patch(`/admin/tasks/${editingTask._id}/moderate`, moderationForm);
      if (res.data?.success) {
        setActionMessage({
          type: 'success',
          text: `Task "${res.data.task.title}" updated successfully.`,
        });
        setEditingTask(null);
        fetchTasks();
        fetchStats();
      }
    } catch (err) {
      console.error('Error moderating task:', err);
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update task.',
      });
    } finally {
      setSubmittingModeration(false);
    }
  };

  // Handler: Remove Task
  const handleRemoveTask = async (taskId, taskTitle) => {
    const confirmDelete = window.confirm(
      `Permanently delete task "${taskTitle}"? Tasks with applications, workspace, milestones, disputes, or escrow/financial history must be cancelled instead.`
    );
    if (!confirmDelete) return;

    try {
      const res = await api.delete(`/admin/tasks/${taskId}`);
      if (res.data?.success) {
        setActionMessage({
          type: 'success',
          text: res.data.message || 'Task removed permanently.',
        });
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
        fetchStats();
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete task.',
      });
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: '1360px', paddingBottom: '4rem' }}>
      {/* Admin Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <span
              className="badge"
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(236, 72, 153, 0.2))',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
              }}
            >
              Admin Security Clearance
            </span>
          </div>
          <h1
            style={{
              fontSize: '2.2rem',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              letterSpacing: '-0.02em',
            }}
          >
            <ShieldAlert size={34} color="#ec4899" />
            <span>Platform Governance & Analytics</span>
          </h1>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Oversee user accounts, enforce marketplace safety policies, moderate posted tasks, and review escrow disputes.
          </p>
        </div>

        {/* Global Refresh Button */}
        <button
          onClick={() => {
            fetchStats();
            if (activeTab === 'users') fetchUsers();
            if (activeTab === 'tasks') fetchTasks();
            if (activeTab === 'disputes') fetchDisputes();
          }}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          id="btn-admin-refresh"
        >
          <RefreshCw size={16} className={loadingStats ? 'spinner' : ''} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Global Action Banner */}
      {actionMessage.text && (
        <div
          className={`alert ${actionMessage.type === 'error' ? 'alert-error' : 'alert-success'}`}
          style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {actionMessage.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage({ type: '', text: '' })}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 5 High-Impact Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {/* Card 1: Users */}
        <div className="card" style={{ padding: '1.35rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Users
              </span>
              <h2 style={{ fontSize: '2rem', margin: '0.35rem 0 0.2rem', color: '#fff' }}>
                {loadingStats ? '...' : stats?.users?.total || 0}
              </h2>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.25))',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
              }}
            >
              <Users size={22} />
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              marginTop: '0.85rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
            }}
          >
            <span>
              <strong style={{ color: '#a5b4fc' }}>{stats?.users?.freelancers || 0}</strong> Freelancers
            </span>
            <span>•</span>
            <span>
              <strong style={{ color: '#67e8f9' }}>{stats?.users?.clients || 0}</strong> Clients
            </span>
            {stats?.users?.blocked > 0 && (
              <>
                <span>•</span>
                <span style={{ color: '#f87171', fontWeight: 600 }}>
                  {stats.users.blocked} Blocked
                </span>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Tasks */}
        <div className="card" style={{ padding: '1.35rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Tasks
              </span>
              <h2 style={{ fontSize: '2rem', margin: '0.35rem 0 0.2rem', color: '#fff' }}>
                {loadingStats ? '...' : stats?.tasks?.total || 0}
              </h2>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.25))',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <Briefcase size={22} />
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              marginTop: '0.85rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
            }}
          >
            <span>
              <strong style={{ color: '#38bdf8' }}>{stats?.tasks?.open || 0}</strong> Open
            </span>
            <span>•</span>
            <span>
              <strong style={{ color: '#fbbf24' }}>{stats?.tasks?.inProgress || 0}</strong> In Progress
            </span>
            <span>•</span>
            <span>
              <strong style={{ color: '#34d399' }}>{stats?.tasks?.completed || 0}</strong> Done
            </span>
          </div>
        </div>

        {/* Card 3: Escrow Volume */}
        <div className="card" style={{ padding: '1.35rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Escrow Volume
              </span>
              <h2 style={{ fontSize: '2rem', margin: '0.35rem 0 0.2rem', color: '#10b981' }}>
                ${loadingStats ? '...' : (stats?.escrow?.totalVolume || 0).toLocaleString()}
              </h2>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.25))',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
              }}
            >
              <DollarSign size={22} />
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              marginTop: '0.85rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
            }}
          >
            <span>
              In Escrow: <strong style={{ color: '#6ee7b7' }}>${stats?.escrow?.fundedBalance || 0}</strong>
            </span>
            <span>•</span>
            <span>
              Paid Out: <strong style={{ color: '#a7f3d0' }}>${stats?.escrow?.releasedAmount || 0}</strong>
            </span>
          </div>
        </div>

        {/* Card 4: Disputes */}
        <div className="card" style={{ padding: '1.35rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Disputes
              </span>
              <h2 style={{ fontSize: '2rem', margin: '0.35rem 0 0.2rem', color: '#fbbf24' }}>
                {loadingStats ? '...' : stats?.disputes?.total || 0}
              </h2>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.25))',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fbbf24',
              }}
            >
              <Scale size={22} />
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              marginTop: '0.85rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
            }}
          >
            <span>
              <strong style={{ color: '#f59e0b' }}>{stats?.disputes?.open || 0}</strong> Open
            </span>
            <span>•</span>
            <span>
              <strong style={{ color: '#38bdf8' }}>{stats?.disputes?.underReview || 0}</strong> In Review
            </span>
            <span>•</span>
            <span>
              <strong style={{ color: '#34d399' }}>{stats?.disputes?.resolved || 0}</strong> Resolved
            </span>
          </div>
        </div>

        {/* Card 5: Completion Rate */}
        <div className="card" style={{ padding: '1.35rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Completion Rate
              </span>
              <h2 style={{ fontSize: '2rem', margin: '0.35rem 0 0.2rem', color: '#a855f7' }}>
                {loadingStats ? '...' : `${stats?.tasks?.completionRate || 0}%`}
              </h2>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(147, 51, 234, 0.25))',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c084fc',
              }}
            >
              <TrendingUp size={22} />
            </div>
          </div>
          <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div
              style={{
                width: '100%',
                height: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, stats?.tasks?.completionRate || 0))}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #a855f7, #6366f1)',
                  borderRadius: '999px',
                  transition: 'width 0.8s ease',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '1.75rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
        }}
      >
        <button
          onClick={() => setActiveTab('overview')}
          className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          id="tab-admin-overview"
        >
          <Layers size={16} />
          <span>Platform Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`btn btn-sm ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          id="tab-admin-users"
        >
          <Users size={16} />
          <span>User Management</span>
          {stats?.users?.total ? (
            <span
              style={{
                fontSize: '0.72rem',
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
              }}
            >
              {stats.users.total}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`btn btn-sm ${activeTab === 'tasks' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          id="tab-admin-tasks"
        >
          <Briefcase size={16} />
          <span>Task Moderation</span>
          {stats?.tasks?.total ? (
            <span
              style={{
                fontSize: '0.72rem',
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
              }}
            >
              {stats.tasks.total}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab('disputes')}
          className={`btn btn-sm ${activeTab === 'disputes' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          id="tab-admin-disputes"
        >
          <Scale size={16} />
          <span>Disputes & Rulings</span>
          {stats?.disputes?.open > 0 ? (
            <span
              style={{
                fontSize: '0.72rem',
                background: '#f59e0b',
                color: '#000',
                fontWeight: 700,
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
              }}
            >
              {stats.disputes.open} open
            </span>
          ) : null}
        </button>
      </div>

      {/* =========================================================================
          TAB 1: PLATFORM OVERVIEW (RECENT ACTIVITY SUMMARY)
          ========================================================================= */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="grid-2">
            {/* Recent Tasks Card */}
            <div className="card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Briefcase size={18} color="#38bdf8" />
                  <span>Recently Posted Tasks</span>
                </h3>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}
                >
                  Manage All
                </button>
              </div>

              {stats?.recentTasks?.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No recent tasks.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {stats?.recentTasks?.map((t) => (
                    <div
                      key={t._id}
                      style={{
                        padding: '0.85rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <Link
                          to={`/tasks/${t._id}`}
                          style={{
                            fontWeight: 600,
                            color: '#fff',
                            textDecoration: 'none',
                            display: 'block',
                            marginBottom: '0.2rem',
                          }}
                        >
                          {t.title}
                        </Link>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Poster: {t.poster?.name || 'Unknown'} • ${t.budget}
                        </span>
                      </div>
                      <span className={`badge badge-${t.status}`} style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Disputes Card */}
            <div className="card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Scale size={18} color="#fbbf24" />
                  <span>Pending Escrow Disputes</span>
                </h3>
                <button
                  onClick={() => setActiveTab('disputes')}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}
                >
                  View All
                </button>
              </div>

              {stats?.recentDisputes?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>All milestones running smoothly. Zero active disputes!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {stats?.recentDisputes?.map((d) => (
                    <div
                      key={d._id}
                      style={{
                        padding: '0.85rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <Link
                          to={`/disputes/${d._id}`}
                          style={{
                            fontWeight: 600,
                            color: '#fff',
                            textDecoration: 'none',
                            display: 'block',
                            marginBottom: '0.2rem',
                          }}
                        >
                          {d.task?.title || 'Dispute Case'}
                        </Link>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Filed by: {d.raisedBy?.name || 'User'}
                        </span>
                      </div>
                      <Link
                        to={`/disputes/${d._id}`}
                        className="btn btn-sm btn-outline"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                      >
                        Inspect
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: USERS MANAGEMENT TABLE (FILTER & BLOCK/UNBLOCK)
          ========================================================================= */}
      {activeTab === 'users' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          {/* Controls & Filters Bar */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              marginBottom: '1.5rem',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={userFilters.search}
                onChange={(e) =>
                  setUserFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
                }
                className="form-control"
                style={{
                  paddingLeft: '2.4rem',
                  width: '100%',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  color: '#fff',
                  height: '40px',
                }}
                id="input-admin-search-users"
              />
            </div>

            {/* Role Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Role:</span>
              <select
                value={userFilters.role}
                onChange={(e) =>
                  setUserFilters((prev) => ({ ...prev, role: e.target.value, page: 1 }))
                }
                style={{
                  background: 'var(--bg-card-solid)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.85rem',
                }}
                id="select-admin-role-filter"
              >
                <option value="all">All Roles</option>
                <option value="freelancer">Freelancer</option>
                <option value="client">Client</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status:</span>
              <select
                value={userFilters.status}
                onChange={(e) =>
                  setUserFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))
                }
                style={{
                  background: 'var(--bg-card-solid)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.85rem',
                }}
                id="select-admin-status-filter"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="blocked">Blocked / Suspended</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>User Profile</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Role</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Account Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Rating & Badges</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Joined</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Security Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                      <div className="spinner" style={{ margin: '0 auto 0.75rem' }} />
                      <span style={{ color: 'var(--text-muted)' }}>Loading platform accounts...</span>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No users match the search filters.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = currentUser?._id === u._id;
                    return (
                      <tr
                        key={u._id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          transition: 'background 0.2s',
                        }}
                      >
                        {/* Name & Email */}
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: u.isBlocked
                                  ? 'rgba(239, 68, 68, 0.25)'
                                  : 'linear-gradient(135deg, #6366f1, #ec4899)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                color: '#fff',
                              }}
                            >
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                <Link to={`/profile/${u._id}`} style={{ textDecoration: 'none', color: '#fff' }}>
                                  {u.name}
                                </Link>
                                {isSelf && (
                                  <span
                                    className="badge"
                                    style={{
                                      fontSize: '0.62rem',
                                      background: 'rgba(99, 102, 241, 0.2)',
                                      color: '#a5b4fc',
                                      padding: '0.1rem 0.35rem',
                                    }}
                                  >
                                    You
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td style={{ padding: '1rem' }}>
                          <span className="badge badge-role" style={{ textTransform: 'capitalize' }}>
                            {u.role}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '1rem' }}>
                          {u.isBlocked ? (
                            <span
                              className="badge"
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#fca5a5',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                fontSize: '0.75rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              <UserX size={12} />
                              <span>Blocked</span>
                            </span>
                          ) : (
                            <span
                              className="badge"
                              style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#6ee7b7',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                fontSize: '0.75rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              <UserCheck size={12} />
                              <span>Active</span>
                            </span>
                          )}
                        </td>

                        {/* Rating & Badges */}
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.85rem' }}>
                              ★ {u.rating ? u.rating.toFixed(1) : '5.0'}
                            </span>
                            {u.badges?.length > 0 && (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                ({u.badges.length} badge{u.badges.length > 1 ? 's' : ''})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Joined Date */}
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <button
                            onClick={() => handleToggleBlockUser(u)}
                            disabled={isSelf}
                            className={`btn btn-sm ${u.isBlocked ? 'btn-primary' : 'btn-danger'}`}
                            style={{
                              fontSize: '0.78rem',
                              padding: '0.35rem 0.75rem',
                              opacity: isSelf ? 0.4 : 1,
                              cursor: isSelf ? 'not-allowed' : 'pointer',
                            }}
                            title={isSelf ? 'Cannot block your own administrative account' : ''}
                            id={`btn-toggle-block-${u._id}`}
                          >
                            {u.isBlocked ? (
                              <>
                                <UserCheck size={14} />
                                <span>Unblock User</span>
                              </>
                            ) : (
                              <>
                                <UserX size={14} />
                                <span>Block User</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* User Pagination Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>
              Showing Page <strong>{userFilters.page}</strong> of <strong>{userPagination.totalPages}</strong> (
              {userPagination.total} total users)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={userFilters.page <= 1}
                onClick={() => setUserFilters((p) => ({ ...p, page: p.page - 1 }))}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.35rem 0.65rem', opacity: userFilters.page <= 1 ? 0.4 : 1 }}
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>
              <button
                disabled={userFilters.page >= userPagination.totalPages}
                onClick={() => setUserFilters((p) => ({ ...p, page: p.page + 1 }))}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.35rem 0.65rem', opacity: userFilters.page >= userPagination.totalPages ? 0.4 : 1 }}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: TASK MODERATION TABLE (FILTER, EDIT STATUS & PERMANENT REMOVE)
          ========================================================================= */}
      {activeTab === 'tasks' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          {/* Controls & Filter Bar */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              marginBottom: '1.5rem',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search tasks by title or keywords..."
                value={taskFilters.search}
                onChange={(e) =>
                  setTaskFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
                }
                style={{
                  paddingLeft: '2.4rem',
                  width: '100%',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  color: '#fff',
                  height: '40px',
                }}
                id="input-admin-search-tasks"
              />
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status:</span>
              <select
                value={taskFilters.status}
                onChange={(e) =>
                  setTaskFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))
                }
                style={{
                  background: 'var(--bg-card-solid)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.85rem',
                }}
                id="select-admin-task-status"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in-progress">In-Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Tasks Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Task Details</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Poster</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Budget</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Moderation Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasksLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                      <div className="spinner" style={{ margin: '0 auto 0.75rem' }} />
                      <span style={{ color: 'var(--text-muted)' }}>Loading marketplace tasks...</span>
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No tasks match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  tasks.map((t) => (
                    <tr
                      key={t._id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background 0.2s',
                      }}
                    >
                      {/* Task Info */}
                      <td style={{ padding: '1rem', maxWidth: '320px' }}>
                        <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.2rem' }}>
                          <Link
                            to={`/tasks/${t._id}`}
                            style={{ textDecoration: 'none', color: '#fff' }}
                            title="View public task page"
                          >
                            {t.title}
                          </Link>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.78rem',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {t.description}
                        </p>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '1rem' }}>
                        <span className="badge badge-role" style={{ fontSize: '0.75rem' }}>
                          {t.category}
                        </span>
                      </td>

                      {/* Poster */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.85rem', color: '#fff' }}>{t.poster?.name || 'N/A'}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.poster?.email}</span>
                      </td>

                      {/* Budget */}
                      <td style={{ padding: '1rem', fontWeight: 600, color: '#10b981' }}>
                        ${t.budget}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem' }}>
                        <span className={`badge badge-${t.status}`} style={{ textTransform: 'capitalize' }}>
                          {t.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openModerateTaskModal(t)}
                            className="btn btn-secondary btn-sm"
                            title="Moderate & Edit Status"
                            id={`btn-moderate-task-${t._id}`}
                            style={{ padding: '0.35rem 0.65rem' }}
                          >
                            <Edit3 size={14} />
                            <span>Moderate</span>
                          </button>

                          <button
                            onClick={() => handleRemoveTask(t._id, t.title)}
                            className="btn btn-danger btn-sm"
                            title="Permanently Delete Task"
                            id={`btn-delete-task-${t._id}`}
                            style={{ padding: '0.35rem 0.65rem' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Task Pagination Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>
              Showing Page <strong>{taskFilters.page}</strong> of <strong>{taskPagination.totalPages}</strong> (
              {taskPagination.total} total tasks)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={taskFilters.page <= 1}
                onClick={() => setTaskFilters((p) => ({ ...p, page: p.page - 1 }))}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.35rem 0.65rem', opacity: taskFilters.page <= 1 ? 0.4 : 1 }}
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>
              <button
                disabled={taskFilters.page >= taskPagination.totalPages}
                onClick={() => setTaskFilters((p) => ({ ...p, page: p.page + 1 }))}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.35rem 0.65rem', opacity: taskFilters.page >= taskPagination.totalPages ? 0.4 : 1 }}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: DISPUTES MANAGEMENT TABLE (STATUS FILTER & RESOLVE)
          ========================================================================= */}
      {activeTab === 'disputes' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          {/* Controls & Filter Bar */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Escrow Dispute Arbitration</h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Inspect filed disputes, audit chat logs, and issue binding resolutions.
              </p>
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Filter:</span>
              <select
                value={disputeFilters.status}
                onChange={(e) =>
                  setDisputeFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))
                }
                style={{
                  background: 'var(--bg-card-solid)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.85rem',
                }}
                id="select-admin-dispute-status"
              >
                <option value="all">All Disputes</option>
                <option value="open">Open</option>
                <option value="under-review">Under Review</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Disputes Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Task & Reason</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Frozen Milestone</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Raised By</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Dispute Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Ruling / Decision</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {disputesLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                      <div className="spinner" style={{ margin: '0 auto 0.75rem' }} />
                      <span style={{ color: 'var(--text-muted)' }}>Loading disputes repository...</span>
                    </td>
                  </tr>
                ) : disputes.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No disputes currently match this criteria.
                    </td>
                  </tr>
                ) : (
                  disputes.map((d) => (
                    <tr
                      key={d._id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background 0.2s',
                      }}
                    >
                      {/* Task & Reason */}
                      <td style={{ padding: '1rem', maxWidth: '300px' }}>
                        <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.2rem' }}>
                          <Link to={`/disputes/${d._id}`} style={{ textDecoration: 'none', color: '#fff' }}>
                            {d.task?.title || 'Unknown Task'}
                          </Link>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.78rem',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          "{d.reason}"
                        </p>
                      </td>

                      {/* Milestone Amount */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600, color: '#f59e0b' }}>
                          ${d.milestone?.amount || 0}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {d.milestone?.title || 'Milestone'}
                        </span>
                      </td>

                      {/* Raised By */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.85rem', color: '#fff' }}>{d.raisedBy?.name || 'User'}</div>
                        <span className="badge badge-role" style={{ fontSize: '0.65rem' }}>
                          {d.raisedBy?.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem' }}>
                        {d.status === 'open' && (
                          <span
                            className="badge"
                            style={{
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#fbbf24',
                              border: '1px solid rgba(245, 158, 11, 0.35)',
                              fontSize: '0.75rem',
                            }}
                          >
                            Open
                          </span>
                        )}
                        {d.status === 'under-review' && (
                          <span
                            className="badge"
                            style={{
                              background: 'rgba(6, 182, 212, 0.15)',
                              color: '#67e8f9',
                              border: '1px solid rgba(6, 182, 212, 0.35)',
                              fontSize: '0.75rem',
                            }}
                          >
                            Under Review
                          </span>
                        )}
                        {d.status === 'resolved' && (
                          <span
                            className="badge"
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#6ee7b7',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                              fontSize: '0.75rem',
                            }}
                          >
                            Resolved
                          </span>
                        )}
                      </td>

                      {/* Resolution */}
                      <td style={{ padding: '1rem' }}>
                        {d.adminDecision?.resolution ? (
                          <span
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: '#10b981',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {d.adminDecision.resolution}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pending Arbitration</span>
                        )}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <Link
                          to={`/disputes/${d._id}`}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                          id={`btn-inspect-dispute-${d._id}`}
                        >
                          <Scale size={14} />
                          <span>{d.status === 'resolved' ? 'View Case' : 'Arbitrate'}</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Dispute Pagination */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>
              Showing Page <strong>{disputeFilters.page}</strong> of <strong>{disputePagination.totalPages}</strong> (
              {disputePagination.total} total disputes)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={disputeFilters.page <= 1}
                onClick={() => setDisputeFilters((p) => ({ ...p, page: p.page - 1 }))}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.35rem 0.65rem', opacity: disputeFilters.page <= 1 ? 0.4 : 1 }}
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>
              <button
                disabled={disputeFilters.page >= disputePagination.totalPages}
                onClick={() => setDisputeFilters((p) => ({ ...p, page: p.page + 1 }))}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.35rem 0.65rem', opacity: disputeFilters.page >= disputePagination.totalPages ? 0.4 : 1 }}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TASK MODERATION FORM
          ========================================================================= */}
      {editingTask && (
        <div className="modal-backdrop" onClick={() => setEditingTask(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
              }}
            >
              <h2 style={{ fontSize: '1.35rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={20} color="#ec4899" />
                <span>Moderate Task</span>
              </h2>
              <button
                onClick={() => setEditingTask(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTaskModeration}>
              {/* Task Title */}
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Task Title</label>
                <input
                  type="text"
                  required
                  value={moderationForm.title}
                  onChange={(e) => setModerationForm({ ...moderationForm, title: e.target.value })}
                  style={{
                    background: 'var(--bg-card-solid)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    color: '#fff',
                    fontSize: '0.9rem',
                    width: '100%',
                  }}
                />
              </div>

              {/* Status & Budget row */}
              <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Lifecycle Status</label>
                  <select
                    value={moderationForm.status}
                    onChange={(e) => setModerationForm({ ...moderationForm, status: e.target.value })}
                    style={{
                      background: 'var(--bg-card-solid)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0.65rem 0.85rem',
                      color: '#fff',
                      fontSize: '0.9rem',
                      width: '100%',
                    }}
                  >
                    <option value="open">Open</option>
                    <option value="assigned">Assigned</option>
                    <option value="in-progress">In-Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Budget ($ USD)</label>
                  <input
                    type="number"
                    min="5"
                    value={moderationForm.budget}
                    onChange={(e) => setModerationForm({ ...moderationForm, budget: e.target.value })}
                    style={{
                      background: 'var(--bg-card-solid)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0.65rem 0.85rem',
                      color: '#fff',
                      fontSize: '0.9rem',
                      width: '100%',
                    }}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Description / Content</label>
                <textarea
                  rows={4}
                  value={moderationForm.description}
                  onChange={(e) => setModerationForm({ ...moderationForm, description: e.target.value })}
                  style={{
                    background: 'var(--bg-card-solid)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    color: '#fff',
                    fontSize: '0.9rem',
                    width: '100%',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="btn btn-secondary"
                  disabled={submittingModeration}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingModeration}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Save size={16} />
                  <span>{submittingModeration ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
