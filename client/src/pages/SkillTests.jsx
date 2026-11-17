import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  CheckCircle,
  Clock,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Star,
  Sparkles,
  Layers,
  FileCheck2,
} from 'lucide-react';

const SkillTests = () => {
  const { user, isAuthenticated } = useAuth();
  const [tests, setTests] = useState([]);
  const [myResults, setMyResults] = useState(null);
  const [activeTab, setActiveTab] = useState('tests'); // 'tests' or 'my-badges'
  const [loading, setLoading] = useState(true);

  const fetchSkillData = async () => {
    setLoading(true);
    try {
      const testsRes = await api.get('/skill-tests');
      setTests(testsRes.data.tests || []);

      if (isAuthenticated) {
        const resultsRes = await api.get('/skill-tests/my-results');
        setMyResults(resultsRes.data);
      }
    } catch (err) {
      console.error('Error fetching skill tests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkillData();
  }, [isAuthenticated]);

  return (
    <div className="main-content">
      {/* Header Banner */}
      <div
        className="card"
        style={{
          padding: '2.5rem',
          marginBottom: '2rem',
          background:
            'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.12) 100%), rgba(17, 24, 39, 0.8)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
        }}
      >
        <div style={{ maxWidth: '680px' }}>
          <div
            className="badge badge-role"
            style={{ marginBottom: '0.85rem', background: 'rgba(99, 102, 241, 0.25)' }}
          >
            <ShieldCheck size={14} color="#818cf8" />
            <span>Skill Verification Engine</span>
          </div>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.75rem', lineHeight: '1.2' }}>
            Earn Official <span className="brand-gradient-text">Verified Badges</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6' }}>
            Take timed assessments to prove your technical competence. Passing an assessment automatically pins a verified badge to your public profile, increasing hiring rates by up to 3x!
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'tests' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('tests')}
          id="tab-available-tests"
        >
          <Layers size={16} />
          <span>Available Assessments ({tests.length})</span>
        </button>

        {isAuthenticated && (
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'my-badges' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('my-badges')}
            id="tab-my-badges"
          >
            <Award size={16} />
            <span>My Badges & Results ({myResults?.results?.length || 0})</span>
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="spinner" style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading assessments...</p>
        </div>
      ) : activeTab === 'tests' ? (
        /* =========================================================================
           AVAILABLE TESTS LIST
           ========================================================================= */
        <div className="grid-3">
          {tests.map((t) => {
            return (
              <div
                key={t._id}
                className="card card-hover"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  border: t.hasPassed
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span className="badge badge-role">{t.category}</span>
                  {t.hasPassed ? (
                    <span className="badge badge-open" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle size={13} />
                      <span>Verified</span>
                    </span>
                  ) : (
                    <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.06)', color: '#94a3b8' }}>
                      Ready
                    </span>
                  )}
                </div>

                <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', color: '#fff' }}>
                  {t.skill} Assessment
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '1.25rem', flex: 1 }}>
                  {t.description}
                </p>

                {/* Test details pill bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <HelpCircle size={15} />
                    <span>{t.questionCount} Questions</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={15} />
                    <span>{t.durationMinutes} Mins</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', fontWeight: '600' }}>
                    <span>Pass: {t.passingScore}%</span>
                  </div>
                </div>

                {t.bestScore !== null && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '0.85rem', textAlign: 'center' }}>
                    Your Best Score: <strong style={{ color: t.hasPassed ? '#10b981' : '#f59e0b' }}>{t.bestScore}%</strong>
                  </div>
                )}

                <Link
                  to={`/skill-tests/${t._id}`}
                  className={`btn ${t.hasPassed ? 'btn-secondary' : 'btn-primary'}`}
                  id={`btn-take-test-${t._id}`}
                  style={{ width: '100%' }}
                >
                  <span>{t.hasPassed ? 'Retake Assessment' : 'Start Assessment'}</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        /* =========================================================================
           MY BADGES & TEST RESULTS TAB
           ========================================================================= */
        <div>
          {/* Earned Badges Showcase */}
          <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={22} color="#818cf8" />
              <span>Earned Badges Showcase</span>
            </h2>

            {myResults?.badges?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No badges earned yet. Take an assessment above to earn your first verified badge!</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem' }}>
                {myResults?.badges?.map((badge) => {
                  const isVerified = badge.startsWith('Verified');
                  return (
                    <div
                      key={badge}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.65rem 1.15rem',
                        borderRadius: '12px',
                        background: isVerified
                          ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.15))'
                          : 'rgba(255, 255, 255, 0.05)',
                        border: isVerified
                          ? '1px solid rgba(99, 102, 241, 0.5)'
                          : '1px solid var(--border-subtle)',
                        boxShadow: isVerified ? '0 0 15px rgba(99, 102, 241, 0.25)' : 'none',
                      }}
                    >
                      <Award size={18} color={isVerified ? '#818cf8' : '#94a3b8'} />
                      <span style={{ fontWeight: '700', fontSize: '0.92rem', color: isVerified ? '#c7d2fe' : '#fff' }}>
                        {badge}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Test Attempt History */}
          <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCheck2 size={22} color="#34d399" />
              <span>Assessment History</span>
            </h2>

            {myResults?.results?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>You haven't completed any skill assessments yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {myResults?.results?.map((res) => (
                  <div
                    key={res._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle)',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{res.skillName}</strong>
                        {res.passed ? (
                          <span className="badge badge-open">Passed</span>
                        ) : (
                          <span className="badge badge-cancelled">Failed</span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        Completed on {new Date(res.createdAt).toLocaleDateString()} at{' '}
                        {new Date(res.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'block' }}>Score</span>
                        <span
                          style={{
                            fontSize: '1.25rem',
                            fontWeight: '800',
                            color: res.passed ? '#10b981' : '#f87171',
                          }}
                        >
                          {res.score}% ({res.correctCount}/{res.totalQuestions})
                        </span>
                      </div>

                      <Link
                        to={`/skill-tests/${res.skillTest?._id || res.skillTest}`}
                        className="btn btn-secondary btn-sm"
                      >
                        Retake
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillTests;
