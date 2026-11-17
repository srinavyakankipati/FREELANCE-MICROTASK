import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import FreelancerMatchPanel from '../components/FreelancerMatchPanel';
import MilestoneTracker from '../components/MilestoneTracker';
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Calendar,
  Tag,
  Cpu,
  Star,
  User,
  Clock,
  CheckCircle,
  Loader2,
  Send,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from 'lucide-react';

/* ─── Status colour helper ─── */
const statusStyle = (status) => {
  const map = {
    open:        { bg: 'rgba(16,185,129,0.15)',  color: '#10b981' },
    assigned:    { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
    'in-progress':{ bg: 'rgba(99,102,241,0.15)', color: '#818cf8' },
    completed:   { bg: 'rgba(16,185,129,0.12)',  color: '#34d399' },
    cancelled:   { bg: 'rgba(239,68,68,0.12)',   color: '#f87171' },
  };
  return map[status] || { bg: 'rgba(255,255,255,0.08)', color: '#cbd5e1' };
};

/* ─── Bid / Apply form ─── */
const ApplyForm = ({ taskId, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post(`/matching/tasks/${taskId}/apply`, {
        bidAmount: bidAmount ? Number(bidAmount) : undefined,
        message,
      });
      setResult(data);
      onSuccess && onSuccess(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div style={{
        background: 'rgba(16,185,129,0.08)',
        border: '1px solid rgba(16,185,129,0.3)',
        borderRadius: '1rem',
        padding: '1.5rem',
        textAlign: 'center',
      }}>
        <CheckCircle size={36} color="#10b981" style={{ marginBottom: '0.75rem' }} />
        <h3 style={{ color: '#10b981', marginBottom: '0.4rem' }}>Application Submitted!</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
          {result.explanation}
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 700 }}>
          <Sparkles size={16} color="#818cf8" />
          <span style={{ color: '#818cf8' }}>Match Score: {result.matchScore}%</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(99,102,241,0.25)',
      borderRadius: '1rem',
      overflow: 'hidden',
    }}>
      {/* Toggle header */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '1rem 1.25rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#fff',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
          <Send size={16} color="#818cf8" />
          Apply / Place a Bid
        </span>
        {open ? <ChevronUp size={16} color="#818cf8" /> : <ChevronDown size={16} color="#818cf8" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} style={{ padding: '0 1.25rem 1.25rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Your Bid (USD) — optional
            </label>
            <input
              type="number"
              min="1"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder="Enter your price..."
              className="form-input"
              style={{ background: 'rgba(15,23,42,0.6)' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Cover Message
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Introduce yourself and explain why you're a great fit..."
              className="form-input"
              style={{ background: 'rgba(15,23,42,0.6)', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
          {error && (
            <p style={{ color: '#f87171', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
            {loading ? 'Submitting…' : 'Submit Application'}
          </button>
        </form>
      )}
    </div>
  );
};

/* ─── Main TaskDetail page ─── */
const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myMatch, setMyMatch] = useState(null);
  const [applied, setApplied] = useState(false);

  const isPoster = user && task && task.poster?._id === user._id;
  const isFreelancer = user?.role === 'freelancer';

  useEffect(() => {
    const loadTask = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/tasks/${id}`);
        setTask(data.task);
      } catch (err) {
        setError(err.response?.data?.message || 'Task not found.');
      } finally {
        setLoading(false);
      }
    };
    loadTask();
  }, [id]);

  // Fetch the freelancer's own match score for this task
  useEffect(() => {
    if (!task || !isFreelancer || isPoster) return;
    const fetchScore = async () => {
      try {
        const { data } = await api.get('/matching/my-applications');
        const existing = data.applications.find((a) => a.task?._id === task._id || a.task === task._id);
        if (existing) {
          setApplied(true);
          setMyMatch({ score: existing.matchScore, explanation: existing.matchExplanation });
        }
      } catch (_) {}
    };
    fetchScore();
  }, [task, isFreelancer, isPoster]);

  if (loading) {
    return (
      <div className="main-content" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#818cf8' }} />
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Loading task…</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="main-content">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Briefcase size={40} color="#f87171" style={{ marginBottom: '1rem' }} />
          <h2>{error || 'Task not found'}</h2>
          <button className="btn btn-secondary" onClick={() => navigate('/tasks')} style={{ marginTop: '1rem' }}>
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  const { bg: statusBg, color: statusColor } = statusStyle(task.status);
  const daysLeft = task.deadline
    ? Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="main-content">
      {/* Back link */}
      <button
        onClick={() => navigate(-1)}
        className="btn btn-secondary"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'flex-start' }}>
        {/* ── Left column: task details ── */}
        <div>
          {/* Header card */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.75rem', borderRadius: '9999px', background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                {task.category}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.75rem', borderRadius: '9999px', background: statusBg, color: statusColor }}>
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </span>
            </div>

            <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem', lineHeight: 1.3 }}>
              {task.title}
            </h1>

            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              {task.description}
            </p>

            {/* Skills */}
            {task.skills?.length > 0 && (
              <div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Cpu size={13} /> Required Skills
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {task.skills.map((s) => (
                    <span key={s} className="badge badge-skill">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Description / About card (separate for visual hierarchy) */}
          {task.poster && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={15} color="#818cf8" /> About the Client
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', fontWeight: 800, color: '#fff', flexShrink: 0,
                }}>
                  {task.poster.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <Link to={`/profile/${task.poster._id}`} style={{ color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
                    {task.poster.name}
                  </Link>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.2rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Star size={11} color="#f59e0b" fill="#f59e0b" /> {task.poster.rating?.toFixed(1)}
                    </span>
                    <span>{task.poster.role}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Assigned freelancer */}
          {task.assignedFreelancer && (
            <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(16,185,129,0.2)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle size={15} /> Assigned Freelancer
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', fontWeight: 800, color: '#fff',
                }}>
                  {task.assignedFreelancer.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <Link to={`/profile/${task.assignedFreelancer._id}`} style={{ color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
                    {task.assignedFreelancer.name}
                  </Link>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.2rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Star size={11} color="#f59e0b" fill="#f59e0b" /> {task.assignedFreelancer.rating?.toFixed(1)}
                    </span>
                    {task.assignedFreelancer.skills?.slice(0, 3).map((s) => (
                      <span key={s} className="badge badge-skill" style={{ fontSize: '0.65rem' }}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Task Workspace & Chat Banner for Poster or Assigned Freelancer */}
          {(isPoster || (user && task.assignedFreelancer && (task.assignedFreelancer._id === user._id || task.assignedFreelancer === user._id))) && (
            <div
              className="card"
              style={{
                marginBottom: '1.5rem',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))',
                border: '1px solid rgba(99,102,241,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  <MessageSquare size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', color: '#fff' }}>
                    Task Workspace & Live Chat
                  </h4>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Exchange instant messages, upload deliverables with Cloudinary, and track progress.
                  </p>
                </div>
              </div>
              <Link
                to={`/tasks/${task._id}/workspace`}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                  padding: '0.6rem 1.25rem',
                }}
              >
                <MessageSquare size={16} /> Open Workspace
              </Link>
            </div>
          )}

          {/* Freelancer match score banner */}
          {isFreelancer && !isPoster && myMatch && (
            <div className="card" style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.08))',
              border: '1px solid rgba(99,102,241,0.25)',
              marginBottom: '1.5rem',
              display: 'flex', alignItems: 'center', gap: '1rem',
            }}>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: myMatch.score >= 75 ? '#10b981' : myMatch.score >= 50 ? '#f59e0b' : '#818cf8' }}>
                  {myMatch.score}%
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Your match</div>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {myMatch.explanation}
                </p>
              </div>
            </div>
          )}

          {/* Apply form (freelancers only, open tasks) */}
          {isFreelancer && !isPoster && task.status === 'open' && !applied && (
            <ApplyForm taskId={task._id} onSuccess={() => setApplied(true)} />
          )}

          {applied && !myMatch && (
            <div style={{ padding: '1rem', color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={16} /> You have already applied to this task.
            </div>
          )}

          {/* Milestone and Escrow Tracker */}
          <MilestoneTracker
            taskId={task._id}
            isPoster={isPoster}
            isFreelancer={isFreelancer}
            taskStatus={task.status}
          />

          {/* Recommended freelancers panel (poster only) */}
          <FreelancerMatchPanel
            taskId={task._id}
            taskStatus={task.status}
            isPoster={isPoster}
          />
        </div>

        {/* ── Right sidebar ── */}
        <div style={{ position: 'sticky', top: '5.5rem' }}>
          {/* Budget & deadline card */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                <DollarSign size={12} /> Fixed Budget
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981', margin: 0 }}>
                ${task.budget.toLocaleString()}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>USD</p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                <Calendar size={12} /> Deadline
              </p>
              <p style={{ fontWeight: 700, color: '#fff', margin: 0 }}>
                {task.deadline ? new Date(task.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
              </p>
              {daysLeft !== null && (
                <p style={{ fontSize: '0.75rem', color: daysLeft < 3 ? '#f87171' : 'var(--text-muted)', margin: '0.2rem 0 0', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <Clock size={11} />
                  {daysLeft > 0 ? `${daysLeft} days remaining` : 'Deadline passed'}
                </p>
              )}
            </div>
          </div>

          {/* Meta card */}
          <div className="card" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span>Category</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{task.category}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span>Status</span>
              <span style={{ color: statusColor, fontWeight: 600 }}>{task.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Posted</span>
              <span style={{ color: '#fff' }}>{new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Edit link for poster */}
          {isPoster && (
            <Link
              to={`/my-tasks`}
              className="btn btn-secondary"
              style={{ display: 'block', textAlign: 'center', marginTop: '1rem', textDecoration: 'none' }}
            >
              Manage My Tasks
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
