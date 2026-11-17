import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  Briefcase,
  Award,
  Sparkles,
  ClipboardList,
  MessageSquare,
  DollarSign,
  Star,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

const FreelancerDashboard = () => {
  const { user } = useAuth();
  const [activeTasks, setActiveTasks] = useState([]);
  const [applications, setApplications] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFreelancerData = async () => {
    try {
      setLoading(true);
      setError('');

      const [tasksRes, appsRes, recRes, testsRes] = await Promise.allSettled([
        api.get('/tasks/my-tasks'),
        api.get('/matching/my-applications'),
        api.get('/matching/recommended-tasks'),
        api.get('/skill-tests/my-results'),
      ]);

      if (tasksRes.status === 'fulfilled' && tasksRes.value.data?.success) {
        setActiveTasks(tasksRes.value.data.tasks || []);
      }
      if (appsRes.status === 'fulfilled' && appsRes.value.data?.success) {
        setApplications(appsRes.value.data.applications || []);
      }
      if (recRes.status === 'fulfilled' && recRes.value.data?.success) {
        setRecommended(recRes.value.data.tasks || []);
      }
      if (testsRes.status === 'fulfilled' && testsRes.value.data?.success) {
        setBadges(testsRes.value.data.badges || user?.badges || []);
      }
    } catch (err) {
      console.error('Error fetching freelancer data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreelancerData();
  }, []);

  if (loading) {
    return <LoadingState message="Loading your freelance contracts and recommendations..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchFreelancerData} />;
  }

  // Active contracts where this user is the assigned freelancer
  const inProgressContracts = activeTasks.filter(
    (t) => t.status === 'in-progress' || t.status === 'assigned'
  );
  const completedContracts = activeTasks.filter((t) => t.status === 'completed');
  const pendingProposals = applications.filter((a) => a.status === 'pending');
  const verifiedBadgeList = (badges.length > 0 ? badges : user?.badges || []).filter(
    (b) => b !== 'Newcomer'
  );

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
              Freelancer Console
            </span>
            {user?.rating && (
              <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Star size={14} fill="#f59e0b" />
                <span>{user.rating.toFixed(1)} / 5.0 Rating</span>
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '2.2rem', margin: 0 }}>Welcome back, {user?.name}</h1>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Track your ongoing contracts, review proposal statuses, and earn verified skill badges.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/tasks" className="btn btn-primary" id="btn-freelancer-find-tasks">
            <Briefcase size={18} />
            <span>Find Tasks</span>
          </Link>
          <Link to="/skill-tests" className="btn btn-secondary" id="btn-freelancer-tests">
            <Award size={18} />
            <span>Take Skill Assessment</span>
          </Link>
        </div>
      </div>

      {/* 4 Freelancer Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem',
        }}
      >
        {/* Card 1: Active Contracts */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Active Contracts
              </span>
              <h2 style={{ fontSize: '2rem', margin: '0.35rem 0 0.2rem', color: '#fff' }}>
                {inProgressContracts.length}
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
            <span>Milestones in progress</span>
          </div>
        </div>

        {/* Card 2: Applications */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Pending Proposals
              </span>
              <h2 style={{ fontSize: '2rem', margin: '0.35rem 0 0.2rem', color: '#fbbf24' }}>
                {pendingProposals.length}
              </h2>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ClipboardList size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            <span>{applications.length} total applications submitted</span>
          </div>
        </div>

        {/* Card 3: Verified Badges */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Verified Badges
              </span>
              <h2 style={{ fontSize: '2rem', margin: '0.35rem 0 0.2rem', color: '#34d399' }}>
                {verifiedBadgeList.length}
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
              <Award size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            <span>Improves hiring rate by 3x</span>
          </div>
        </div>

        {/* Card 4: Completed Deliveries */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Completed Deliveries
              </span>
              <h2 style={{ fontSize: '2rem', margin: '0.35rem 0 0.2rem', color: '#a855f7' }}>
                {completedContracts.length}
              </h2>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(168, 85, 247, 0.2)',
                color: '#c084fc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            <span>100% Escrow released</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Contracts & Applications + Recommendations */}
      <div className="grid-3" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.75rem' }}>
        {/* Left Column: Ongoing Contracts + Applications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Active Workspaces Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={20} color="#818cf8" />
                <span>My Active Contracts</span>
              </h3>
              <Link to="/my-tasks" className="btn btn-outline btn-sm" style={{ fontSize: '0.8rem' }}>
                View All
              </Link>
            </div>

            {inProgressContracts.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No active contracts right now"
                description="Browse recommended tasks matching your verified skills and submit proposals."
                actionLabel="Explore Tasks"
                actionLink="/tasks"
                minHeight="220px"
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {inProgressContracts.map((task) => (
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
                          marginBottom: '0.2rem',
                        }}
                      >
                        {task.title}
                      </Link>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Client: {task.poster?.name || 'Client'} • Budget: ${task.budget}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Link
                        to={`/tasks/${task._id}/workspace`}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.78rem' }}
                      >
                        <MessageSquare size={14} />
                        <span>Workspace</span>
                      </Link>
                      <Link
                        to={`/tasks/${task._id}`}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem' }}
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Applications Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClipboardList size={20} color="#fbbf24" />
                <span>Recent Proposals Submitted</span>
              </h3>
              <Link to="/my-applications" className="btn btn-outline btn-sm" style={{ fontSize: '0.8rem' }}>
                View All ({applications.length})
              </Link>
            </div>

            {applications.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No proposals submitted yet"
                description="Apply to open tasks and showcase your verified skill badges."
                actionLabel="Browse Open Tasks"
                actionLink="/tasks"
                minHeight="180px"
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {applications.slice(0, 4).map((app) => (
                  <div
                    key={app._id}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <Link
                        to={`/tasks/${app.task?._id}`}
                        style={{
                          fontWeight: 600,
                          color: '#fff',
                          textDecoration: 'none',
                          fontSize: '0.9rem',
                          display: 'block',
                        }}
                      >
                        {app.task?.title || 'Applied Task'}
                      </Link>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Proposed Rate: ${app.proposedRate}
                      </span>
                    </div>

                    <span
                      className={`badge badge-${app.status === 'accepted' ? 'completed' : app.status === 'rejected' ? 'cancelled' : 'open'}`}
                      style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}
                    >
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Verified Badges & Recommended Tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Verified Badges Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} color="#34d399" />
                <span>Verified Badges</span>
              </h3>
              <Link to="/skill-tests" className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem' }}>
                + Earn More
              </Link>
            </div>

            {verifiedBadgeList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  You haven't earned any verified badges yet. Taking assessments will boost your client visibility!
                </p>
                <Link to="/skill-tests" className="btn btn-primary btn-sm">
                  Take Assessment
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {verifiedBadgeList.map((b) => (
                  <span
                    key={b}
                    className="badge"
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#6ee7b7',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.3rem 0.65rem',
                    }}
                  >
                    <CheckCircle2 size={13} color="#10b981" />
                    <span>{b}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Recommended Tasks Preview Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="#c084fc" />
                <span>Recommended For You</span>
              </h3>
              <Link to="/recommended" className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem' }}>
                View All
              </Link>
            </div>

            {recommended.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                No specific task recommendations right now. Try earning more skill badges to expand your matches!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recommended.slice(0, 3).map((item) => (
                  <div
                    key={item.task?._id || item._id}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <Link
                      to={`/tasks/${item.task?._id || item._id}`}
                      style={{
                        fontWeight: 600,
                        color: '#fff',
                        textDecoration: 'none',
                        fontSize: '0.88rem',
                        display: 'block',
                        marginBottom: '0.2rem',
                      }}
                    >
                      {item.task?.title || item.title}
                    </Link>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                        ${item.task?.budget || item.budget}
                      </span>
                      {item.score && (
                        <span style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 600 }}>
                          {Math.round(item.score * 100)}% match
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreelancerDashboard;
