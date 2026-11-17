import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Award,
  ArrowRight,
  ArrowLeft,
  Send,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

const TakeTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active question index
  const [currentIndex, setCurrentIndex] = useState(0);
  // Answers map: { [questionIndex]: selectedOptionIndex }
  const [userAnswers, setUserAnswers] = useState({});

  // Timer state
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [timeTaken, setTimeTaken] = useState(0);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Result state after submission
  const [result, setResult] = useState(null);

  // Load test questions
  useEffect(() => {
    const fetchTest = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/skill-tests/${id}`);
        setTest(res.data.test);
        const durationSec = (res.data.test.durationMinutes || 5) * 60;
        setTimeLeft(durationSec);
      } catch (err) {
        console.error('Failed to load test:', err);
        setError('Failed to load assessment. It may not exist or has been disabled.');
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [id]);

  // Real-time countdown timer
  useEffect(() => {
    if (loading || !test || result || isTimeUp) return;

    if (timeLeft <= 0) {
      setIsTimeUp(true);
      handleSubmitAnswers(true); // auto-submit on timeout
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimeUp(true);
          handleSubmitAnswers(true);
          return 0;
        }
        return prev - 1;
      });
      setTimeTaken((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, test, result, timeLeft, isTimeUp]);

  // Select an option
  const handleSelectOption = (optionIndex) => {
    if (result) return; // locked after submission
    setUserAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
  };

  // Submit test
  const handleSubmitAnswers = async (forcedByTimer = false) => {
    if (!test || isSubmitting || result) return;

    // Check if unanswered questions exist (if not forced by timer)
    if (!forcedByTimer) {
      const answeredCount = Object.keys(userAnswers).length;
      if (answeredCount < test.questions.length) {
        const confirmSubmit = window.confirm(
          `You have answered ${answeredCount} of ${test.questions.length} questions. Are you sure you want to submit now?`
        );
        if (!confirmSubmit) return;
      }
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Format answers as array of selected indices matching question order
      const answersArray = test.questions.map((q, idx) =>
        userAnswers[idx] !== undefined ? userAnswers[idx] : -1
      );

      const res = await api.post(`/skill-tests/${id}/submit`, {
        answers: answersArray,
        timeTakenSeconds: timeTaken,
      });

      setResult(res.data.result);
    } catch (err) {
      console.error('Failed to submit test:', err);
      setError(err.response?.data?.message || 'Error submitting test. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="main-content" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="spinner" style={{ width: '3rem', height: '3rem', margin: '0 auto 1.5rem' }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Preparing skill assessment environment...</p>
      </div>
    );
  }

  if (error && !test) {
    return (
      <div className="main-content" style={{ maxWidth: '600px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h2>Unable to Load Test</h2>
          <p style={{ color: 'var(--text-muted)', margin: '1rem 0 2rem' }}>{error}</p>
          <Link to="/skill-tests" className="btn btn-primary">
            Back to Skill Tests
          </Link>
        </div>
      </div>
    );
  }

  const currentQ = test.questions[currentIndex];
  const isTimeCritical = timeLeft < 60; // < 1 minute left
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="main-content" style={{ maxWidth: '860px' }}>
      {/* =========================================================================
          RESULT OVERLAY CARD (Shown after test is submitted)
          ========================================================================= */}
      {result ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem', animation: 'scaleUp 0.3s ease' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: result.passed
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))'
                : 'rgba(239, 68, 68, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: result.passed ? '#34d399' : '#ef4444',
              marginBottom: '1.5rem',
              boxShadow: result.passed ? '0 0 30px rgba(16, 185, 129, 0.3)' : 'none',
            }}
          >
            {result.passed ? <Award size={44} /> : <XCircle size={44} />}
          </div>

          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>
            {result.passed ? 'Assessment Passed! 🎉' : 'Assessment Not Passed'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '540px', margin: '0 auto 2rem' }}>
            {result.passed
              ? `You demonstrated verified competence in ${result.skill}. The official badge has been added to your profile!`
              : `You scored ${result.score}%. A minimum score of ${result.passingScore}% is required to earn the verified badge.`}
          </p>

          {/* Score details card */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '1.75rem',
              maxWidth: '480px',
              margin: '0 auto 2.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block' }}>
                Your Score
              </span>
              <span
                style={{
                  fontSize: '1.75rem',
                  fontWeight: '800',
                  color: result.passed ? '#10b981' : '#f87171',
                }}
              >
                {result.score}%
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block' }}>
                Passing Score
              </span>
              <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fff' }}>
                {result.passingScore}%
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block' }}>
                Correct Answers
              </span>
              <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#818cf8' }}>
                {result.correctCount}/{result.totalQuestions}
              </span>
            </div>
          </div>

          {/* Badge Display */}
          {result.passed && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: '9999px',
                padding: '0.6rem 1.4rem',
                marginBottom: '2.5rem',
              }}
            >
              <ShieldCheck size={22} color="#818cf8" />
              <span style={{ fontWeight: '700', color: '#c7d2fe', fontSize: '1.05rem' }}>
                Badge Awarded: {result.earnedBadge}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/skill-tests" className="btn btn-secondary">
              <RotateCcw size={16} />
              <span>Back to Skill Tests</span>
            </Link>
            <Link to="/tasks" className="btn btn-primary">
              <Sparkles size={16} />
              <span>Browse Freelance Tasks</span>
            </Link>
          </div>
        </div>
      ) : (
        /* =========================================================================
           ACTIVE TEST-TAKING VIEW
           ========================================================================= */
        <div>
          {/* Header Bar with Real-Time Timer */}
          <div
            className="card"
            style={{
              padding: '1.25rem 1.75rem',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              borderColor: isTimeCritical ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <span className="badge badge-role">{test.category}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  Passing: {test.passingScore}%
                </span>
              </div>
              <h2 style={{ fontSize: '1.35rem' }}>{test.skill} Assessment</h2>
            </div>

            {/* Timer Badge */}
            <div
              id="test-timer-badge"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: isTimeCritical
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'rgba(99, 102, 241, 0.15)',
                color: isTimeCritical ? '#fca5a5' : '#a5b4fc',
                border: isTimeCritical
                  ? '1px solid rgba(239, 68, 68, 0.5)'
                  : '1px solid rgba(99, 102, 241, 0.3)',
                padding: '0.6rem 1.2rem',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '1.2rem',
                letterSpacing: '0.05em',
                animation: isTimeCritical ? 'pulse 1s infinite' : 'none',
              }}
            >
              <Clock size={20} color={isTimeCritical ? '#ef4444' : '#818cf8'} />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Progress Indicator */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              <span>
                Question {currentIndex + 1} of {test.questions.length}
              </span>
              <span>
                {answeredCount} of {test.questions.length} answered
              </span>
            </div>
            {/* Progress bar */}
            <div
              style={{
                width: '100%',
                height: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '9999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${((currentIndex + 1) / test.questions.length) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="card" style={{ padding: '2.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.75rem' }}>
              <div
                style={{
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: '#a5b4fc',
                  fontWeight: '800',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                }}
              >
                Q{currentIndex + 1}
              </div>
              <h3 style={{ fontSize: '1.25rem', lineHeight: '1.5', flex: 1 }}>
                {currentQ.question}
              </h3>
            </div>

            {/* Options List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {currentQ.options.map((opt, oIdx) => {
                const isSelected = userAnswers[currentIndex] === oIdx;
                const letter = String.fromCharCode(65 + oIdx); // A, B, C, D

                return (
                  <div
                    key={oIdx}
                    onClick={() => handleSelectOption(oIdx)}
                    id={`q${currentIndex}-option-${oIdx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem 1.25rem',
                      borderRadius: '12px',
                      background: isSelected
                        ? 'rgba(99, 102, 241, 0.15)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected
                        ? '2px solid var(--primary)'
                        : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 0 15px rgba(99, 102, 241, 0.2)' : 'none',
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                      }}
                    >
                      {letter}
                    </div>
                    <span style={{ fontSize: '0.95rem', color: isSelected ? '#fff' : 'var(--text-main)', flex: 1 }}>
                      {opt}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation & Submit Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
            >
              <ArrowLeft size={16} />
              <span>Previous</span>
            </button>

            {/* Quick jump pills */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {test.questions.map((_, qIdx) => {
                const isCurrent = qIdx === currentIndex;
                const isAnswered = userAnswers[qIdx] !== undefined;

                return (
                  <button
                    key={qIdx}
                    type="button"
                    onClick={() => setCurrentIndex(qIdx)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: isCurrent
                        ? 'var(--primary)'
                        : isAnswered
                        ? 'rgba(16, 185, 129, 0.25)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: isCurrent
                        ? '1px solid #fff'
                        : isAnswered
                        ? '1px solid rgba(16, 185, 129, 0.5)'
                        : '1px solid var(--border-subtle)',
                      color: isCurrent || isAnswered ? '#fff' : 'var(--text-dim)',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    {qIdx + 1}
                  </button>
                );
              })}
            </div>

            {currentIndex < test.questions.length - 1 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setCurrentIndex((prev) => Math.min(test.questions.length - 1, prev + 1))}
              >
                <span>Next</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                id="btn-submit-assessment"
                onClick={() => handleSubmitAnswers(false)}
                disabled={isSubmitting}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                }}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner"></div>
                    <span>Grading Assessment...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Submit & Finish</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeTest;
