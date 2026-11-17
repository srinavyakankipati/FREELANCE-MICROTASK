import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import {
  Sparkles,
  Star,
  Award,
  CheckCircle,
  Zap,
  ChevronRight,
  UserCheck,
  TrendingUp,
  Mail,
  Loader2,
} from 'lucide-react';

/* ─── Score ring component ─── */
const ScoreRing = ({ score }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  const color =
    score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#6366f1';

  return (
    <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
      <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
        <circle
          cx="36" cy="36" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '0.95rem', fontWeight: 800, color }}>{score}%</span>
      </div>
    </div>
  );
};

/* ─── Badge chip ─── */
const BadgeChip = ({ label }) => (
  <span style={{
    fontSize: '0.65rem', fontWeight: 700,
    padding: '0.18rem 0.5rem',
    borderRadius: '9999px',
    background: 'rgba(139,92,246,0.2)',
    color: '#a78bfa',
    border: '1px solid rgba(139,92,246,0.3)',
  }}>
    {label}
  </span>
);

/* ─── Main Panel ─── */
const FreelancerMatchPanel = ({ taskId, taskStatus, isPoster }) => {
  const { user } = useContext(AuthContext);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviting, setInviting] = useState(null); // freelancerId being invited
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState({});

  useEffect(() => {
    if (!taskId || !isPoster) return;
    const fetchMatches = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/matching/tasks/${taskId}/matches?limit=8`);
        setMatches(data.matches || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load recommendations.');
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [taskId, isPoster]);

  const handleInvite = async (freelancerId) => {
    try {
      setInviting(freelancerId);
      await api.post(`/matching/tasks/${taskId}/invite/${freelancerId}`, {
        message: inviteMsg || 'We think you would be a great fit for this task!',
      });
      setInviteSuccess((prev) => ({ ...prev, [freelancerId]: true }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send invitation.');
    } finally {
      setInviting(null);
    }
  };

  if (!isPoster) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, rgba(99,102,241,0.07) 0%, rgba(17,24,39,0.9) 100%)',
        border: '1px solid rgba(99,102,241,0.25)',
        borderRadius: '1.25rem',
        padding: '1.75rem',
        marginTop: '2rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
        <div style={{
          width: 36, height: 36,
          borderRadius: '0.6rem',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Sparkles size={18} color="#fff" />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
            Recommended Freelancers
          </h3>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            AI-ranked by skill match · rating · badges · delivery history
          </p>
        </div>
      </div>

      {/* Score legend */}
      <div style={{
        display: 'flex', gap: '1rem', marginBottom: '1.25rem',
        padding: '0.65rem 0.9rem',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '0.6rem',
        flexWrap: 'wrap',
      }}>
        {[
          { color: '#10b981', label: '≥75% Excellent' },
          { color: '#f59e0b', label: '50–74% Good' },
          { color: '#6366f1', label: '<50% Developing' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* State: Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--text-muted)' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Scoring freelancers…</p>
        </div>
      )}

      {/* State: Error */}
      {!loading && error && (
        <div style={{ color: '#f87171', fontSize: '0.85rem', padding: '1rem', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* State: Empty */}
      {!loading && !error && matches.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No freelancers found yet. As more users join, matches will appear here.
        </div>
      )}

      {/* Matches list */}
      {!loading && matches.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {matches.map(({ freelancer, matchScore, breakdown, explanation, applicationStatus }) => (
            <div
              key={freelancer._id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: applicationStatus?.status === 'accepted'
                  ? '1px solid rgba(16,185,129,0.4)'
                  : applicationStatus
                  ? '1px solid rgba(99,102,241,0.2)'
                  : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '1rem',
                padding: '1.1rem 1.25rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                transition: 'border-color 0.2s, transform 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
            >
              {/* Score ring */}
              <ScoreRing score={matchScore} />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div>
                    <Link
                      to={`/profile/${freelancer._id}`}
                      style={{ color: '#fff', fontWeight: 700, fontSize: '0.97rem', textDecoration: 'none' }}
                    >
                      {freelancer.name}
                    </Link>
                    {freelancer.professionalTitle && (
                      <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#a78bfa' }}>
                        {freelancer.professionalTitle}
                      </p>
                    )}
                  </div>
                  {/* Status badge */}
                  {applicationStatus && (
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 700,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '9999px',
                      background: applicationStatus.status === 'accepted'
                        ? 'rgba(16,185,129,0.2)'
                        : applicationStatus.status === 'invited'
                        ? 'rgba(245,158,11,0.2)'
                        : 'rgba(99,102,241,0.2)',
                      color: applicationStatus.status === 'accepted'
                        ? '#10b981'
                        : applicationStatus.status === 'invited'
                        ? '#f59e0b'
                        : '#818cf8',
                    }}>
                      {applicationStatus.status === 'invited' ? '✉ Invited' :
                       applicationStatus.status === 'accepted' ? '✓ Accepted' :
                       applicationStatus.status === 'pending' ? '⏳ Applied' : applicationStatus.status}
                    </span>
                  )}
                </div>

                {/* Explanation */}
                <p style={{ margin: '0.45rem 0 0.6rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {explanation}
                </p>

                {/* Score breakdown pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                    <Zap size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                    Skills {breakdown.skillOverlap.weighted}%
                  </span>
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 6, background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                    <Star size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                    Rating {breakdown.rating.weighted}%
                  </span>
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 6, background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }}>
                    <Award size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                    Badges {breakdown.verifiedBadges.weighted}%
                  </span>
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 6, background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                    <CheckCircle size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                    Delivery {breakdown.completedTasks.weighted}%
                  </span>
                </div>

                {/* Skills matched */}
                {breakdown.skillOverlap.matchedSkills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.6rem' }}>
                    {breakdown.skillOverlap.matchedSkills.slice(0, 5).map((s) => (
                      <span key={s} style={{
                        fontSize: '0.65rem', padding: '0.15rem 0.45rem',
                        borderRadius: 5,
                        background: 'rgba(16,185,129,0.12)',
                        color: '#34d399',
                        border: '1px solid rgba(16,185,129,0.25)',
                      }}>
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats row */}
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  <span><Star size={11} style={{ marginRight: 3, color: '#f59e0b', verticalAlign: 'middle' }} />{freelancer.rating?.toFixed(1)}</span>
                  <span><UserCheck size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />{freelancer.completedTaskCount ?? 0} completed</span>
                  {freelancer.reviewCount > 0 && <span>{freelancer.reviewCount} reviews</span>}
                </div>

                {/* Badges */}
                {freelancer.badges?.filter((b) => b !== 'Newcomer').length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                    {freelancer.badges.filter((b) => b !== 'Newcomer').map((b) => (
                      <BadgeChip key={b} label={b} />
                    ))}
                  </div>
                )}

                {/* Invite button */}
                {taskStatus === 'open' && !inviteSuccess[freelancer._id] && applicationStatus?.status !== 'accepted' && (
                  <button
                    onClick={() => handleInvite(freelancer._id)}
                    disabled={inviting === freelancer._id || !!applicationStatus}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.4rem 0.9rem',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(99,102,241,0.4)',
                      background: inviting === freelancer._id ? 'rgba(99,102,241,0.1)' : 'transparent',
                      color: '#818cf8',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: inviting === freelancer._id || !!applicationStatus ? 'not-allowed' : 'pointer',
                      opacity: !!applicationStatus ? 0.6 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    {inviting === freelancer._id ? (
                      <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Mail size={13} />
                    )}
                    {applicationStatus?.status === 'invited' ? 'Invited' : 'Send Invite'}
                  </button>
                )}

                {/* Success state */}
                {inviteSuccess[freelancer._id] && (
                  <span style={{ fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle size={13} /> Invitation sent!
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View all link */}
      {matches.length > 0 && (
        <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
          <Link
            to={`/tasks/${taskId}/applications`}
            style={{ fontSize: '0.82rem', color: '#818cf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
          >
            View all applications <ChevronRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
};

export default FreelancerMatchPanel;
