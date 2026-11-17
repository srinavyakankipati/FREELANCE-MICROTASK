import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase,
  PlusCircle,
  Calendar,
  DollarSign,
  Edit3,
  Trash2,
  Clock,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
  Layers,
  Sparkles,
  Star,
  MessageSquare,
} from 'lucide-react';
import ReviewModal from '../components/ReviewModal';

const MyTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [reviewTask, setReviewTask] = useState(null);

  // Filtering & search state
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Modal State
  const [editingTask, setEditingTask] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    budget: '',
    status: 'open',
    deadline: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Dialog State
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMyTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks/my-tasks');
      setTasks(res.data.tasks || []);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching my tasks:', err);
      setError('Failed to load your tasks. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  // Filter tasks based on status and search query
  const filteredTasks = tasks.filter((t) => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.skills?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Open Edit Modal
  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setEditFormData({
      title: task.title,
      description: task.description,
      budget: task.budget,
      status: task.status,
      deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
    });
  };

  // Submit Task Update
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingTask) return;
    setIsUpdating(true);
    setError('');

    try {
      const res = await api.put(`/tasks/${editingTask._id}`, editFormData);
      setSuccessMsg('Task updated successfully!');
      setEditingTask(null);
      // Refresh local list
      setTasks((prev) =>
        prev.map((item) => (item._id === editingTask._id ? res.data.task : item))
      );
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update task.';
      setError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async () => {
    if (!deletingTaskId) return;
    setIsDeleting(true);
    setError('');

    try {
      await api.delete(`/tasks/${deletingTaskId}`);
      setSuccessMsg('Task deleted successfully!');
      setTasks((prev) => prev.filter((item) => item._id !== deletingTaskId));
      setDeletingTaskId(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete task.';
      setError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <span className="badge badge-open">Open</span>;
      case 'assigned':
        return <span className="badge badge-assigned">Assigned</span>;
      case 'in-progress':
        return <span className="badge badge-in-progress">In Progress</span>;
      case 'completed':
        return <span className="badge badge-completed">Completed</span>;
      case 'cancelled':
        return <span className="badge badge-cancelled">Cancelled</span>;
      default:
        return <span className="badge badge-open">{status}</span>;
    }
  };

  return (
    <div className="main-content">
      {/* Header & Stats Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.3rem' }}>
            <h1 style={{ fontSize: '2rem' }}>My Tasks & Projects</h1>
            <span className="badge badge-role">{user?.role}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Manage the tasks you have posted, track assignments, and edit statuses
          </p>
        </div>

        {user?.role !== 'freelancer' && (
          <Link to="/post-task" className="btn btn-primary" id="btn-create-task-cta">
            <PlusCircle size={18} />
            <span>Post New Task</span>
          </Link>
        )}
      </div>

      {/* Stats Summary Cards */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '0.85rem', borderRadius: '12px' }}>
            <Layers size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Tasks</span>
            <h3 style={{ fontSize: '1.75rem', lineHeight: 1.2 }}>{tasks.length}</h3>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.85rem', borderRadius: '12px' }}>
            <Sparkles size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Open & Accepting</span>
            <h3 style={{ fontSize: '1.75rem', lineHeight: 1.2 }}>
              {tasks.filter((t) => t.status === 'open').length}
            </h3>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '0.85rem', borderRadius: '12px' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>In Progress</span>
            <h3 style={{ fontSize: '1.75rem', lineHeight: 1.2 }}>
              {tasks.filter((t) => t.status === 'in-progress' || t.status === 'assigned').length}
            </h3>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <X size={18} style={{ cursor: 'pointer' }} onClick={() => setError('')} />
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
          <X size={18} style={{ cursor: 'pointer' }} onClick={() => setSuccessMsg('')} />
        </div>
      )}

      {/* Controls Bar: Filters & Search */}
      <div
        className="card"
        style={{
          padding: '1rem 1.5rem',
          marginBottom: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['all', 'open', 'assigned', 'in-progress', 'completed'].map((status) => (
            <button
              key={status}
              type="button"
              className={`btn btn-sm ${statusFilter === status ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(status)}
              id={`tab-filter-${status}`}
              style={{ textTransform: 'capitalize' }}
            >
              {status === 'all' ? 'All Tasks' : status.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="input-wrapper" style={{ width: '280px' }}>
          <span className="input-icon">
            <Search size={16} />
          </span>
          <input
            type="text"
            className="form-input has-icon"
            placeholder="Search by title or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '0.5rem 1rem 0.5rem 2.4rem', fontSize: '0.88rem' }}
          />
        </div>
      </div>

      {/* Task List Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="spinner" style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading your tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
              marginBottom: '1.25rem',
            }}
          >
            <Briefcase size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No tasks found</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', maxWidth: '420px', margin: '0 auto 1.75rem' }}>
            {tasks.length === 0
              ? "You haven't posted any micro-tasks yet. Create your first task to start receiving proposals!"
              : 'No tasks match your selected filter criteria.'}
          </p>
          {user?.role !== 'freelancer' && (
            <Link to="/post-task" className="btn btn-primary" id="btn-empty-state-post">
              <PlusCircle size={18} />
              <span>Post Your First Task</span>
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredTasks.map((task) => {
            const isPoster =
              (task.poster?._id || task.poster)?.toString() === user?._id?.toString() ||
              user?.role === 'admin';

            return (
              <div key={task._id} className="card card-hover" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-role" style={{ fontSize: '0.75rem' }}>
                        {task.category}
                      </span>
                      {getStatusBadge(task.status)}
                    </div>
                    <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>{task.title}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                      {task.description}
                    </p>

                    {/* Skills pills */}
                    {task.skills?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                        {task.skills.map((skill) => (
                          <span key={skill} className="badge badge-skill">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Metadata Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-dim)', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', fontWeight: '700', fontSize: '1rem' }}>
                        <DollarSign size={16} />
                        <span>${task.budget} USD</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={15} />
                        <span>Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      {task.assignedFreelancer && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#60a5fa' }}>
                          <span>Assigned to: {task.assignedFreelancer.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions for Poster & Reviewer */}
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <Link
                      to={`/tasks/${task._id}/workspace`}
                      className="btn btn-secondary btn-sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        textDecoration: 'none',
                        background: 'rgba(99, 102, 241, 0.15)',
                        borderColor: 'rgba(99, 102, 241, 0.4)',
                        color: '#818cf8',
                      }}
                      title="Open Task Workspace & Chat"
                    >
                      <MessageSquare size={14} />
                      <span>Workspace</span>
                    </Link>

                    {task.status === 'completed' && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: '#fff',
                          boxShadow: '0 2px 10px rgba(245, 158, 11, 0.3)',
                        }}
                        onClick={() => setReviewTask(task)}
                        id={`btn-review-${task._id}`}
                      >
                        <Star size={14} fill="#fff" />
                        <span>Leave Review</span>
                      </button>
                    )}

                    {isPoster && (
                      <>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(task)}
                          title="Edit Task"
                          id={`btn-edit-${task._id}`}
                        >
                          <Edit3 size={15} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeletingTaskId(task._id)}
                          title="Delete Task"
                          id={`btn-delete-${task._id}`}
                        >
                          <Trash2 size={15} />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          EDIT TASK MODAL
          ========================================================================= */}
      {editingTask && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem' }}>Edit Task Details</h2>
              <button
                type="button"
                className="input-action-btn"
                onClick={() => setEditingTask(null)}
                style={{ position: 'static' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit}>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Budget (USD)</label>
                  <input
                    type="number"
                    min="5"
                    required
                    className="form-input"
                    value={editFormData.budget}
                    onChange={(e) => setEditFormData({ ...editFormData, budget: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  >
                    <option value="open">Open</option>
                    <option value="assigned">Assigned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Deadline</label>
                <input
                  type="date"
                  className="form-input"
                  value={editFormData.deadline}
                  onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows={4}
                  required
                  className="form-textarea"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingTask(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  id="btn-save-edit-task"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE CONFIRMATION MODAL
          ========================================================================= */}
      {deletingTaskId && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '440px', textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Trash2 size={28} />
            </div>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>Delete Task?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setDeletingTaskId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                id="btn-confirm-delete"
                onClick={handleDeleteTask}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Submission Modal */}
      <ReviewModal
        task={reviewTask}
        isOpen={!!reviewTask}
        onClose={() => setReviewTask(null)}
        onReviewSubmitted={() => {
          fetchMyTasks();
          setSuccessMsg('Review recorded and average rating updated!');
          setTimeout(() => setSuccessMsg(''), 3000);
        }}
      />
    </div>
  );
};

export default MyTasks;
