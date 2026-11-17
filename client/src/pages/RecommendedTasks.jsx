import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  Sparkles,
  DollarSign,
  Calendar,
  Star,
  Cpu,
  Loader2,
  Briefcase,
  TrendingUp,
  Zap,
} from 'lucide-react';

const RecommendedTasks = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/matching/recommended-tasks?limit=20');
        setRecommendations(data.recommendations || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load recommendations.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const scoreColor = (s) => (s >= 75 ? '#10b981' : s >= 50 ? '#f59e0b' : '#6366f1');

  return (
    <div className="main-content">
      {/* Hero */}
      <div
        className="card"
        style={{
          padding: '2.5rem',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
          border: '1px solid rgba(99,102,241,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <Sparkles size={18} color="#818cf8" />
          <span style={{ color: '#818cf8', fontWeight: 700, fontSize: '0.85rem' }}>AI-Powered Matching</span>
        </div>
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>
          Recommended for You
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Tasks ranked by your skill overlap, rating, verified badges, and delivery track record.
        </p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#818cf8' }} />
          <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem' }}>Finding your best matches…</p>
        </div>
      )}

      {!loading && error && (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: '#f87171' }}>{error}</div>
      )}

      {!loading && !error && recommendations.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <TrendingUp size={40} color="#818cf8" style={{ marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>No recommendations yet</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Add skills to your profile to get personalised task recommendations.
          </p>
          <Link to="/profile" className="btn btn-primary" style={{ display: 'inline-flex', marginTop: '1rem', textDecoration: 'none' }}>
            Update Profile
          </Link>
        </div>
      )}

      {!loading && recommendations.length > 0 && (
        <div className="grid-2">
          {recommendations.map(({ task, matchScore, explanation }) => (
            <Link
              key={task._id}
              to={`/tasks/${task._id}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="card card-hover"
                style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}
              >
                {/* Score badge */}
                <div style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  fontSize: '0.8rem', fontWeight: 800,
                  color: scoreColor(matchScore),
                  background: `${scoreColor(matchScore)}18`,
                  border: `1px solid ${scoreColor(matchScore)}33`,
                  borderRadius: '9999px',
                  padding: '0.2rem 0.55rem',
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                }}>
                  <Zap size={11} />{matchScore}% match
                </div>

                <div style={{ marginBottom: '0.65rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '9999px', background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                    {task.category}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem', paddingRight: '5.5rem' }}>
                  {task.title}
                </h3>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '0.75rem', flex: 1 }}>
                  {explanation}
                </p>

                {task.skills?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                    {task.skills.slice(0, 4).map((s) => (
                      <span key={s} className="badge badge-skill" style={{ fontSize: '0.65rem' }}>{s}</span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>Budget</span>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>${task.budget?.toLocaleString()}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>Deadline</span>
                    <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                      {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>

                {task.poster && (
                  <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>By</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{task.poster.name}</span>
                    {task.poster.rating && (
                      <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.1rem' }}>
                        <Star size={10} fill="#f59e0b" />{task.poster.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendedTasks;
