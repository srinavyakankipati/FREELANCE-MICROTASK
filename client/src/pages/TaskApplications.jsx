import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import {
  ArrowLeft,
  Briefcase,
  Sparkles,
  Star,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Loader2,
  DollarSign,
  Zap,
  MessageSquare,
} from 'lucide-react';

/* ─── Score bar ─── */
const ScoreBar = ({ score }) => {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#6366f1';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <div style={{
        flex: 1, height: 6, borderRadius: 6,
        background: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${score}%`,
          background: color,
          borderRadius: 6,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <span style={{ fontSize: '0.8rem', fontWeight: 700, color, minWidth: 38 }}>{score}%</span>
    </div>
  );
};

const statusMeta = {
  pending:  { label: '⏳ Pending',  bg: 'rgba(99,102,241,0.15)',  color: '#818cf8' },
  invited:  { label: '✉ Invited',  bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
  accepted: { label: '✓ Accepted', bg: 'rgba(16,185,129,0.15)',  color: '#10b981' },
  rejected: { label: '✗ Rejected', bg: 'rgba(239,68,68,0.12)',   color: '#f87171' },
};

const TaskApplications = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [task, setTask] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [taskRes, appsRes] = await Promise.all([
          api.get(`/tasks/${taskId}`),
          api.get(`/matching/tasks/${taskId}/applications`),
        ]);
        setTask(taskRes.data.task);
        setApplications(appsRes.data.applications || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load applications.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [taskId]);

  const handleAccept = async (applicationId) => {
    if (!window.confirm('Accept this applicant? All other applications will be rejected and the task will be marked as assigned.')) return;
    setAccepting(applicationId);
    try {
      const { data } = await api.patch(`/matching/tasks/${taskId}/accept/${applicationId}`);
      // Refresh
      setTask(data.task);
      setApplications((prev) =>
        prev.map((a) =>
          a._id === applicationId
            ? { ...a, status: 'accepted' }
            : a.status === 'pending' || a.status === 'invited'
            ? { ...a, status: 'rejected' }
            : a
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept applicant.');
    } finally {
      setAccepting(null);
    }
  };

  if (loading) {
    return (
      <div className="main-content" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#818cf8' }} />
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Loading applications…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#f87171' }}>{error}</p>
          <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isPoster = user && task && task.poster?._id === user._id;

  return (
    <div className="main-content">
      <button
        onClick={() => navigate(-1)}
        className="btn btn-secondary"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}
      >
        <ArrowLeft size={15} /> Back
      </button>

      {/* Header */}
      <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(17,24,39,0.95))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Sparkles size={16} color="#818cf8" />
              <span style={{ fontSize: '0.78rem', color: '#818cf8', fontWeight: 600 }}>Applications — Sorted by Match Score</span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{task?.title}</h1>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {applications.length} application{applications.length !== 1 ? 's' : ''} received
            </p>
          </div>
          <Link to={`/tasks/${taskId}`} style={{ color: '#818cf8', fontSize: '0.82rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            View task →
          </Link>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <User size={40} color="#818cf8" style={{ marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>No applications yet</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Applications will appear here as freelancers apply. You can also invite specific freelancers from the task page.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {applications.map((app) => {
            const meta = statusMeta[app.status] || statusMeta.pending;
            const fl = app.freelancer;
            const isAccepted = app.status === 'accepted';
            const isRejected = app.status === 'rejected';
            return (
              <div
                key={app._id}
                className="card"
                style={{
                  border: isAccepted
                    ? '1px solid rgba(16,185,129,0.35)'
                    : isRejected
                    ? '1px solid rgba(239,68,68,0.15)'
                    : '1px solid rgba(255,255,255,0.08)',
                  opacity: isRejected ? 0.65 : 1,
                }}
              >
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 50, height: 50, borderRadius: '50%', flexShrink: 0,
                    background: isAccepted
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', fontWeight: 800, color: '#fff',
                  }}>
                    {fl?.name?.[0]?.toUpperCase()}
                  </div>

                  {/* Main info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                      <div>
                        <Link to={`/profile/${fl?._id}`} style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>
                          {fl?.name}
                        </Link>
                        {fl?.professionalTitle && (
                          <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#a78bfa' }}>{fl.professionalTitle}</p>
                        )}
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    </div>

                    {/* Match score */}
                    {app.matchScore !== null && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Sparkles size={11} /> Match Score
                        </p>
                        <ScoreBar score={app.matchScore} />
                        {app.matchExplanation && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{app.matchExplanation}</p>
                        )}
                      </div>
                    )}

                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      <span><Star size={11} style={{ color: '#f59e0b', marginRight: 3, verticalAlign: 'middle' }} />{fl?.rating?.toFixed(1)}</span>
                      <span><CheckCircle size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />{fl?.completedTaskCount ?? 0} completed</span>
                      {fl?.reviewCount > 0 && <span>{fl.reviewCount} reviews</span>}
                      {app.bidAmount && (
                        <span style={{ color: '#10b981', fontWeight: 600 }}>
                          <DollarSign size={11} style={{ verticalAlign: 'middle' }} />{app.bidAmount} bid
                        </span>
                      )}
                      <span style={{ color: 'var(--text-dim)' }}>
                        <Clock size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                        {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Skills */}
                    {fl?.skills?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                        {fl.skills.slice(0, 6).map((s) => (
                          <span key={s} className="badge badge-skill" style={{ fontSize: '0.65rem' }}>{s}</span>
                        ))}
                      </div>
                    )}

                    {/* Badges */}
                    {fl?.badges?.filter((b) => b !== 'Newcomer').length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                        {fl.badges.filter((b) => b !== 'Newcomer').map((b) => (
                          <span key={b} style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '9999px', background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}>
                            <Award size={9} style={{ marginRight: 3, verticalAlign: 'middle' }} />{b}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Cover message */}
                    {app.message && (
                      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '0.6rem', padding: '0.75rem', marginBottom: '0.75rem' }}>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.4rem' }}>
                          <MessageSquare size={13} style={{ flexShrink: 0, marginTop: 2, color: '#818cf8' }} />
                          <span style={{ fontStyle: 'italic' }}>{app.message}</span>
                        </p>
                      </div>
                    )}

                    {/* Accept button */}
                    {isPoster && task?.status === 'open' && app.status === 'pending' || app.status === 'invited' ? (
                      <button
                        onClick={() => handleAccept(app._id)}
                        disabled={accepting === app._id}
                        className="btn btn-primary"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        {accepting === app._id ? (
                          <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <CheckCircle size={13} />
                        )}
                        Accept & Assign
                      </button>
                    ) : isAccepted ? (
                      <span style={{ fontSize: '0.82rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                        <CheckCircle size={14} /> Task Assigned to this Freelancer
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TaskApplications;
