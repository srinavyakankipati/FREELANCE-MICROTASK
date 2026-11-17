import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  ClipboardList,
  DollarSign,
  Calendar,
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  ChevronRight,
} from 'lucide-react';

const statusMeta = {
  pending:  { label: '⏳ Pending',  bg: 'rgba(99,102,241,0.12)',  color: '#818cf8' },
  invited:  { label: '✉ Invited',  bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  accepted: { label: '✓ Accepted', bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
  rejected: { label: '✗ Rejected', bg: 'rgba(239,68,68,0.1)',    color: '#f87171' },
};

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/matching/my-applications');
        setApplications(data.applications || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load applications.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="main-content">
      {/* Header */}
      <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(17,24,39,0.95))', border: '1px solid rgba(99,102,241,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <ClipboardList size={18} color="#818cf8" />
          <span style={{ color: '#818cf8', fontWeight: 700, fontSize: '0.85rem' }}>My Applications</span>
        </div>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>Task Applications</h1>
        <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Track all tasks you've applied to or been invited for.
        </p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#818cf8' }} />
          <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem' }}>Loading your applications…</p>
        </div>
      )}

      {!loading && error && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: '#f87171' }}>{error}</div>
      )}

      {!loading && !error && applications.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <ClipboardList size={40} color="#818cf8" style={{ marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>No applications yet</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
            Browse tasks and apply to start building your work history.
          </p>
          <Link to="/recommended" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={15} /> View Recommended Tasks
          </Link>
        </div>
      )}

      {!loading && applications.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {applications.map((app) => {
            const meta = statusMeta[app.status] || statusMeta.pending;
            const task = app.task;
            return (
              <div
                key={app._id}
                className="card"
                style={{
                  border: app.status === 'accepted'
                    ? '1px solid rgba(16,185,129,0.3)'
                    : app.status === 'rejected'
                    ? '1px solid rgba(239,68,68,0.12)'
                    : '1px solid rgba(255,255,255,0.07)',
                  opacity: app.status === 'rejected' ? 0.7 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      to={`/tasks/${task?._id}`}
                      style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      {task?.title}
                      <ChevronRight size={15} color="#818cf8" />
                    </Link>
                    <span style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 600 }}>{task?.category}</span>
                  </div>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700,
                    padding: '0.25rem 0.65rem',
                    borderRadius: '9999px',
                    background: meta.bg,
                    color: meta.color,
                    flexShrink: 0,
                  }}>
                    {meta.label}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  {task?.budget && (
                    <span style={{ color: '#10b981', fontWeight: 600 }}>
                      <DollarSign size={12} style={{ verticalAlign: 'middle' }} />${task.budget.toLocaleString()}
                    </span>
                  )}
                  {task?.deadline && (
                    <span>
                      <Calendar size={12} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                      {new Date(task.deadline).toLocaleDateString()}
                    </span>
                  )}
                  {app.bidAmount && (
                    <span style={{ color: '#f59e0b' }}>
                      Your bid: ${app.bidAmount}
                    </span>
                  )}
                  <span>
                    <Clock size={12} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                    Applied {new Date(app.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Match score */}
                {app.matchScore !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                    <Sparkles size={13} color="#818cf8" />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Match: <span style={{ color: app.matchScore >= 75 ? '#10b981' : app.matchScore >= 50 ? '#f59e0b' : '#818cf8', fontWeight: 700 }}>{app.matchScore}%</span>
                    </span>
                    {app.matchExplanation && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}> — {app.matchExplanation}</span>
                    )}
                  </div>
                )}

                {/* Cover message preview */}
                {app.message && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, borderLeft: '2px solid rgba(99,102,241,0.3)', paddingLeft: '0.75rem' }}>
                    "{app.message.substring(0, 120)}{app.message.length > 120 ? '…' : ''}"
                  </p>
                )}

                {app.type === 'invitation' && app.status === 'invited' && (
                  <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.9rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '0.6rem', fontSize: '0.78rem', color: '#f59e0b' }}>
                    <Mail size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
                    You've been invited by the client. Review the task and apply to respond.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyApplications;
