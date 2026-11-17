import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  Briefcase,
  PlusCircle,
  Users,
  DollarSign,
  Clock,
  Sparkles,
  MessageSquare,
  Scale,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Search,
} from 'lucide-react';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

const PosterDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchClientData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/tasks/my-tasks');
      if (res.data?.success) {
        setTasks(res.data.tasks || []);
      }
    } catch (err) {
      console.error('Error fetching client tasks:', err);
      setError(err.response?.data?.message || 'Failed to load your client projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, []);

  if (loading) {
    return <LoadingState message="Loading your client workspace & tasks..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchClientData} />;
  }

  // Calculate stats
  const totalTasks = tasks.length;
  const openTasks = tasks.filter((t) => t.status === 'open');
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress' || t.status === 'assigned');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const totalBudgetSpent = completedTasks.reduce((acc, t) => acc + (t.budget || 0), 0);
  const totalEscrowLocked = inProgressTasks.reduce((acc, t) => acc + (t.budget || 0), 0);
  const totalApplicants = tasks.reduce((acc, t) => acc + (t.applicants?.length || 0), 0);

  return (
    <div className="main-content" style={{ maxWidth: '1280px' }}>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-role" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
              Client Workspace
            </span>
          </div>
          <h1 style={{ fontSize: '2.2rem', margin: 0 }}>Welcome back, {user?.name}</h1>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Manage your posted micro-tasks, review incoming applicants, and approve milestone deliverables.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/post-task" className="btn btn-primary" id="btn-dashboard-post-task">
            <PlusCircle size={18} />
            <span>Post New Task</span>
          </Link>
          <Link to="/search" className="btn btn-secondary">
            <Search size={18} />
            <span>Find Freelancers</span>
          </Link>
        </div>
      </div>

      {/* 4 Poster Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem',
        }}
      >
        {/* Card 1: Active Tasks */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Active Projects
              </span>
              <h2 style={{ fontSize: '2rem', margin: '0.35rem 0 0.2rem', color: '#fff' }}>
                {inProgressTasks.length}
              </h2>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Briefcase size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            <span>{openTasks.length} open for applications</span>
          </div>
        </div>

        {/* Card 2: Applicants */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Proposals
              </span>
              <h2 style={{ fontSize: '2rem', margin: '0.35rem 0 0.2rem', color: '#38bdf8' }}>
                {totalApplicants}
              </h2>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.2)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            <span>Across all your posted tasks</span>
          </div>
        </div>

        {/* Card 3: Funds in Escrow */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Active Escrow Vault
              </span>
              <h2 style={{ fontSize: '2rem', margin: '0.35rem 0 0.2rem', color: '#10b981' }}>
                ${totalEscrowLocked}
              </h2>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            <span>Protected until delivery sign-off</span>
          </div>
        </div>

        {/* Card 4: Delivered Projects */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Completed Deliveries
              </span>
              <h2 style={{ fontSize: '2rem', margin: '0.35rem 0 0.2rem', color: '#ec4899' }}>
                {completedTasks.length}
              </h2>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(236, 72, 153, 0.2)',
                color: '#f472b6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            <span>${totalBudgetSpent} total payout volume</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Projects in Flight + Quick Actions */}
      <div className="grid-3" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.75rem' }}>
        {/* Column 1: Active Projects List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={20} color="#818cf8" />
                <span>My Tasks & Contracts</span>
              </h3>
              <Link to="/my-tasks" className="btn btn-outline btn-sm" style={{ fontSize: '0.8rem' }}>
                View All ({tasks.length})
              </Link>
            </div>

            {tasks.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No tasks posted yet"
                description="Get started by posting your first task to attract verified developers."
                actionLabel="Post a Task"
                actionLink="/post-task"
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {tasks.slice(0, 6).map((task) => (
                  <div
                    key={task._id}
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.85rem',
                    }}
                  >
                    <div>
                      <Link
                        to={`/tasks/${task._id}`}
                        style={{
                          fontWeight: 600,
                          color: '#fff',
                          textDecoration: 'none',
                          fontSize: '0.95rem',
                          display: 'block',
                          marginBottom: '0.25rem',
                        }}
                      >
                        {task.title}
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                        <span className="badge badge-role" style={{ fontSize: '0.68rem' }}>
                          {task.category}
                        </span>
                        <span className={`badge badge-${task.status}`} style={{ fontSize: '0.68rem', textTransform: 'capitalize' }}>
                          {task.status}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
                          ${task.budget}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {task.status === 'open' && (
                        <Link
                          to={`/tasks/${task._id}/applications`}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.78rem' }}
                        >
                          <Users size={14} />
                          <span>Proposals ({task.applicants?.length || 0})</span>
                        </Link>
                      )}

                      {(task.status === 'assigned' || task.status === 'in-progress' || task.status === 'completed') && (
                        <Link
                          to={`/tasks/${task._id}/workspace`}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.78rem' }}
                        >
                          <MessageSquare size={14} />
                          <span>Workspace</span>
                        </Link>
                      )}

                      <Link
                        to={`/tasks/${task._id}`}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem' }}
                        title="View details & milestones"
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Quick Links & Escrow Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Actions Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#fff' }}>Quick Management</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <Link to="/post-task" className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
                <PlusCircle size={16} />
                <span>Create New Task</span>
              </Link>
              <Link to="/my-tasks" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                <Briefcase size={16} />
                <span>All Posted Tasks</span>
              </Link>
              <Link to="/my-disputes" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                <Scale size={16} />
                <span>Dispute Resolution</span>
              </Link>
              <Link to="/search" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                <Search size={16} />
                <span>Talent Search</span>
              </Link>
            </div>
          </div>

          {/* Security Guarantee Card */}
          <div
            className="card"
            style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(99, 102, 241, 0.08))',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <ShieldCheck size={24} color="#10b981" />
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>100% Escrow Protection</h4>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              All client deposits remain in cryptographic milestone escrow until you verify and sign off on submitted deliverables.
              If terms are not met, dispute arbitration is available with one click.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PosterDashboard;
