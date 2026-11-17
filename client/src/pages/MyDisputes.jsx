import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Scale,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  DollarSign,
  FileText,
  User,
  ShieldCheck,
} from 'lucide-react';

const MyDisputes = () => {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      setError('');
      const query = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await api.get(`/disputes/my${query}`);
      if (res.data?.success) {
        setDisputes(res.data.disputes || []);
      }
    } catch (err) {
      console.error('Failed to fetch disputes:', err);
      setError(err.response?.data?.message || 'Could not load disputes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return { label: 'Open', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.35)' };
      case 'under-review':
        return { label: 'Under Review', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.35)' };
      case 'resolved':
        return { label: 'Resolved', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.35)' };
      default:
        return { label: status, color: '#94a3b8', bg: 'rgba(255, 255, 255, 0.05)', border: 'rgba(255, 255, 255, 0.1)' };
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: '1080px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Scale size={28} color="#818cf8" />
            <span>Escrow Disputes & Resolutions</span>
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Track frozen milestones, view submitted evidence, and review administrative rulings.
          </p>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          {['all', 'open', 'under-review', 'resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {st.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <Loader2 size={36} color="#6366f1" className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading disputes...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#f87171' }}>
          <p>{error}</p>
        </div>
      ) : disputes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
          <ShieldCheck size={44} color="#10b981" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: '#fff', margin: '0 0 0.5rem', fontSize: '1.2rem' }}>No Disputes Found</h3>
          <p style={{ margin: 0, fontSize: '0.88rem', maxWidth: '420px', marginInline: 'auto' }}>
            {statusFilter === 'all'
              ? 'You have zero active or historical milestone disputes. All transactions are in good standing!'
              : `No disputes found matching the "${statusFilter}" status filter.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {disputes.map((d) => {
            const meta = getStatusBadge(d.status);

            return (
              <div
                key={d._id}
                className="card card-hover"
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.55rem',
                        borderRadius: '999px',
                        background: meta.bg,
                        color: meta.color,
                        border: `1px solid ${meta.border}`,
                        textTransform: 'uppercase',
                      }}
                    >
                      {meta.label}
                    </span>

                    {d.resolution && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.55rem',
                          borderRadius: '999px',
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#818cf8',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Resolution: {d.resolution}
                      </span>
                    )}

                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      Case #{d._id.slice(-6).toUpperCase()}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.1rem', color: '#fff' }}>
                    {d.milestone?.title || 'Milestone Dispute'}
                  </h3>

                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Task: <strong style={{ color: '#e2e8f0' }}>{d.task?.title}</strong> • Raised by{' '}
                    <strong style={{ color: '#e2e8f0' }}>{d.raisedBy?.name}</strong> •{' '}
                    {new Date(d.createdAt).toLocaleDateString()}
                  </p>

                  <p
                    style={{
                      margin: '0.4rem 0 0',
                      fontSize: '0.8rem',
                      color: 'var(--text-dim)',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    <strong>Reason:</strong> {d.reason}
                  </p>
                </div>

                {/* Amount and Action */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Frozen Escrow
                    </span>
                    <p style={{ margin: '0.1rem 0 0', fontSize: '1.4rem', fontWeight: 900, color: '#10b981' }}>
                      ${d.milestone?.amount || 0}
                    </p>
                  </div>

                  <Link
                    to={`/disputes/${d._id}`}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
                  >
                    <span>Inspect Case</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyDisputes;
