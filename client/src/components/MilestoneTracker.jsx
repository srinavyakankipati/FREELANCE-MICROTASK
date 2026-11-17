import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import RaiseDisputeModal from './dispute/RaiseDisputeModal';
import {
  ShieldCheck,
  Lock,
  Unlock,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  RotateCcw,
  Sparkles,
  Plus,
  Send,
  CreditCard,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  History,
  X,
  Loader2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

/* ─── State Machine Stepper Config ─── */
const STEP_ORDER = ['pending', 'funded', 'submitted', 'released'];

const getStepIndex = (status) => {
  if (status === 'refunded') return -1;
  const idx = STEP_ORDER.indexOf(status);
  return idx !== -1 ? idx : 0;
};

/* ─── Status Badge Colors ─── */
const getStatusMeta = (status) => {
  switch (status) {
    case 'pending':
      return { label: 'Pending Funding', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)' };
    case 'funded':
      return { label: 'Funded in Escrow', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.35)' };
    case 'submitted':
      return { label: 'Work Submitted', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.35)' };
    case 'approved':
    case 'released':
      return { label: 'Payment Released', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.35)' };
    case 'refunded':
      return { label: 'Refunded', color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)', border: 'rgba(248, 113, 113, 0.35)' };
    case 'disputed':
      return { label: 'In Dispute (Frozen)', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)' };
    default:
      return { label: status, color: '#94a3b8', bg: 'rgba(255, 255, 255, 0.05)', border: 'rgba(255, 255, 255, 0.1)' };
  }
};

const MilestoneTracker = ({ taskId, isPoster, isFreelancer, taskStatus }) => {
  const { user } = useContext(AuthContext);

  const [escrow, setEscrow] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [showDefineModal, setShowDefineModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(null); // milestone object
  const [showSubmitModal, setShowSubmitModal] = useState(null); // milestone object
  const [showRevisionModal, setShowRevisionModal] = useState(null); // milestone object
  const [showRefundModal, setShowRefundModal] = useState(null); // milestone object
  const [showDisputeModal, setShowDisputeModal] = useState(null); // milestone object
  const [showTransactionsDrawer, setShowTransactionsDrawer] = useState(false);

  // Form states
  const [newMilestones, setNewMilestones] = useState([
    { title: 'Milestone 1: Prototype & Core Setup', amount: '', description: '' },
  ]);
  const [submissionData, setSubmissionData] = useState({ workUrl: '', notes: '' });
  const [revisionNotes, setRevisionNotes] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('simulated_card');

  // Fetch Escrow & Milestones
  const fetchEscrowDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get(`/milestones/tasks/${taskId}/escrow`);
      setEscrow(data.escrow);
      setMilestones(data.milestones || []);
      setTransactions(data.transactions || []);
      setSummary(data.summary || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load milestone escrow data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchEscrowDetails();
    }
  }, [taskId]);

  // 1. Define Milestones
  const handleDefineMilestones = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post(`/milestones/tasks/${taskId}/define`, {
        milestones: newMilestones.map((m) => ({
          ...m,
          amount: Number(m.amount),
        })),
      });
      setShowDefineModal(false);
      setNewMilestones([{ title: '', amount: '', description: '' }]);
      await fetchEscrowDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to define milestones');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Fund Milestone
  const handleFundMilestone = async (e) => {
    e.preventDefault();
    if (!showFundModal) return;
    setActionLoading(true);
    try {
      await api.post(`/milestones/${showFundModal._id}/fund`, {
        paymentMethod,
      });
      setShowFundModal(null);
      await fetchEscrowDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to fund milestone');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Submit Work
  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!showSubmitModal) return;
    setActionLoading(true);
    try {
      await api.post(`/milestones/${showSubmitModal._id}/submit`, submissionData);
      setShowSubmitModal(null);
      setSubmissionData({ workUrl: '', notes: '' });
      await fetchEscrowDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit work');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Approve and Release Payment
  const handleReleasePayment = async (milestone) => {
    const confirmRelease = window.confirm(
      `Approve work and release $${milestone.amount} from escrow to the freelancer? This action cannot be reversed.`
    );
    if (!confirmRelease) return;

    setActionLoading(true);
    try {
      await api.post(`/milestones/${milestone._id}/release`);
      await fetchEscrowDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to release payment');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Request Revision
  const handleRequestRevision = async (e) => {
    e.preventDefault();
    if (!showRevisionModal) return;
    setActionLoading(true);
    try {
      await api.post(`/milestones/${showRevisionModal._id}/request-revision`, {
        notes: revisionNotes,
      });
      setShowRevisionModal(null);
      setRevisionNotes('');
      await fetchEscrowDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request revision');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Refund Milestone
  const handleRefundMilestone = async (e) => {
    e.preventDefault();
    if (!showRefundModal) return;
    setActionLoading(true);
    try {
      await api.post(`/milestones/${showRefundModal._id}/refund`, {
        reason: refundReason,
      });
      setShowRefundModal(null);
      setRefundReason('');
      await fetchEscrowDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to refund milestone');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }} />
        <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading Escrow & Milestone Tracker…</p>
      </div>
    );
  }

  const totalBudget = escrow?.totalBudget || summary?.totalBudget || 0;
  const inEscrow = escrow?.fundedBalance || 0;
  const released = escrow?.releasedAmount || 0;
  const refunded = escrow?.refundedAmount || 0;
  const remaining = Math.max(0, totalBudget - inEscrow - released - refunded);

  const releasedPercent = totalBudget > 0 ? (released / totalBudget) * 100 : 0;
  const inEscrowPercent = totalBudget > 0 ? (inEscrow / totalBudget) * 100 : 0;
  const refundedPercent = totalBudget > 0 ? (refunded / totalBudget) * 100 : 0;

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '1.25rem',
        padding: '1.75rem',
        marginTop: '2rem',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.4)',
            }}
          >
            <ShieldCheck size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                Escrow & Milestone Tracker
              </h3>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  background:
                    escrow?.status === 'completed'
                      ? 'rgba(16, 185, 129, 0.2)'
                      : escrow?.status === 'active'
                      ? 'rgba(56, 189, 248, 0.2)'
                      : 'rgba(148, 163, 184, 0.15)',
                  color:
                    escrow?.status === 'completed'
                      ? '#10b981'
                      : escrow?.status === 'active'
                      ? '#38bdf8'
                      : '#94a3b8',
                  border: '1px solid currentColor',
                }}
              >
                {escrow?.status || 'Active'}
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              100% payment protection · Funds held securely until deliverables are approved
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Audit Log Button */}
          <button
            onClick={() => setShowTransactionsDrawer(true)}
            className="btn btn-secondary"
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <History size={15} />
            History ({transactions.length})
          </button>

          {/* Add Milestone Button (Poster) */}
          {isPoster && taskStatus !== 'completed' && taskStatus !== 'cancelled' && (
            <button
              onClick={() => setShowDefineModal(true)}
              className="btn btn-primary"
              style={{
                padding: '0.45rem 0.95rem',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              }}
            >
              <Plus size={15} />
              Add Milestone
            </button>
          )}
        </div>
      </div>

      {/* ── Escrow Financial Overview Cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '0.85rem',
            padding: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
            <DollarSign size={13} /> Total Budget
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            ${totalBudget.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            {milestones.length} milestone(s)
          </div>
        </div>

        <div
          style={{
            background: 'rgba(56, 189, 248, 0.06)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '0.85rem',
            padding: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
            <Lock size={13} /> In Escrow
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>
            ${inEscrow.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#7dd3fc', marginTop: '0.2rem' }}>
            Funded & Protected
          </div>
        </div>

        <div
          style={{
            background: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '0.85rem',
            padding: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
            <CheckCircle2 size={13} /> Released
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>
            ${released.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#6ee7b7', marginTop: '0.2rem' }}>
            Paid to Freelancer
          </div>
        </div>

        {refunded > 0 && (
          <div
            style={{
              background: 'rgba(248, 113, 113, 0.06)',
              border: '1px solid rgba(248, 113, 113, 0.25)',
              borderRadius: '0.85rem',
              padding: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f87171', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
              <RotateCcw size={13} /> Refunded
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f87171' }}>
              ${refunded.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#fca5a5', marginTop: '0.2rem' }}>
              Returned to Poster
            </div>
          </div>
        )}
      </div>

      {/* ── Multi-segment Progress Bar ── */}
      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{
            height: 10,
            borderRadius: 9999,
            background: 'rgba(255, 255, 255, 0.06)',
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          <div style={{ width: `${releasedPercent}%`, background: '#10b981', transition: 'width 0.4s' }} title={`Released: $${released}`} />
          <div style={{ width: `${inEscrowPercent}%`, background: '#38bdf8', transition: 'width 0.4s' }} title={`In Escrow: $${inEscrow}`} />
          <div style={{ width: `${refundedPercent}%`, background: '#f87171', transition: 'width 0.4s' }} title={`Refunded: $${refunded}`} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
          <span>Released: ${released} ({Math.round(releasedPercent)}%)</span>
          <span>In Escrow: ${inEscrow} ({Math.round(inEscrowPercent)}%)</span>
          <span>Pending/Remaining: ${remaining}</span>
        </div>
      </div>

      {/* ── Milestones List ── */}
      {milestones.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1.5rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '1rem',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
          }}
        >
          <Sparkles size={36} color="#818cf8" style={{ marginBottom: '0.75rem' }} />
          <h4 style={{ color: '#fff', margin: '0 0 0.5rem' }}>No Milestones Defined Yet</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 450, margin: '0 auto 1.25rem' }}>
            Break down this project into structured milestones with protected escrow payments for each delivery phase.
          </p>
          {isPoster && (
            <button
              onClick={() => setShowDefineModal(true)}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={16} /> Define Initial Milestones
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {milestones.map((m, idx) => {
            const meta = getStatusMeta(m.status);
            const stepIdx = getStepIndex(m.status);

            return (
              <div
                key={m._id}
                style={{
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: `1px solid ${m.status === 'released' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.07)'}`,
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Milestone Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    marginBottom: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)' }}>
                        #{idx + 1}
                      </span>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                        {m.title}
                      </h4>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          color: meta.color,
                          background: meta.bg,
                          border: `1px solid ${meta.border}`,
                        }}
                      >
                        {meta.label}
                      </span>
                    </div>

                    {m.description && (
                      <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {m.description}
                      </p>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#10b981' }}>
                      ${m.amount.toLocaleString()}
                    </div>
                    {m.dueDate && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
                        <Clock size={11} /> Due: {new Date(m.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── State Machine Stepper Visualizer ── */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.5rem',
                    margin: '1rem 0 1.25rem',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '0.75rem',
                  }}
                >
                  {[
                    { label: 'Defined', icon: FileText, step: 0 },
                    { label: 'Funded', icon: Lock, step: 1 },
                    { label: 'Submitted', icon: Send, step: 2 },
                    { label: 'Released', icon: CheckCircle2, step: 3 },
                  ].map((step, sIdx) => {
                    const isPassed = stepIdx >= sIdx;
                    const isCurrent = stepIdx === sIdx;
                    const StepIcon = step.icon;

                    return (
                      <div
                        key={step.label}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          color: isPassed ? '#10b981' : isCurrent ? '#38bdf8' : 'var(--text-dim)',
                        }}
                      >
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: isPassed ? '#10b981' : isCurrent ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)',
                            color: isPassed || isCurrent ? '#0f172a' : 'var(--text-dim)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {isPassed ? '✓' : sIdx + 1}
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: isPassed || isCurrent ? 700 : 500 }}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* ── Revisions Feedback Callout (if any) ── */}
                {m.revisions && m.revisions.length > 0 && (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      borderRadius: '0.75rem',
                      padding: '0.85rem 1rem',
                      marginBottom: '1rem',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b', fontWeight: 700, marginBottom: '0.3rem' }}>
                      <RotateCcw size={14} /> Revision Requested ({m.revisions.length})
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                      "{m.revisions[m.revisions.length - 1].notes}"
                    </p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', marginTop: '0.3rem' }}>
                      Requested {new Date(m.revisions[m.revisions.length - 1].requestedAt).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* ── Submission Deliverables Details ── */}
                {m.submission && (m.status === 'submitted' || m.status === 'released') && (
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.05)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '0.75rem',
                      padding: '0.85rem 1rem',
                      marginBottom: '1rem',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle2 size={14} /> Deliverables Submitted
                      </span>
                      {m.submission.submittedAt && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          {new Date(m.submission.submittedAt).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {m.submission.workUrl && (
                      <div style={{ margin: '0.3rem 0' }}>
                        <a
                          href={m.submission.workUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#38bdf8',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          <ExternalLink size={13} /> View Deliverable: {m.submission.workUrl}
                        </a>
                      </div>
                    )}

                    {m.submission.notes && (
                      <p style={{ margin: '0.3rem 0 0', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {m.submission.notes}
                      </p>
                    )}
                  </div>
                )}

                {/* ── Role Action Buttons ── */}
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Poster: Fund Milestone (pending) */}
                  {isPoster && m.status === 'pending' && (
                    <button
                      onClick={() => setShowFundModal(m)}
                      disabled={actionLoading}
                      className="btn btn-primary"
                      style={{
                        padding: '0.45rem 1rem',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                      }}
                    >
                      <Lock size={14} /> Fund Milestone (${m.amount})
                    </button>
                  )}

                  {/* Poster: Approve & Release (submitted) */}
                  {isPoster && m.status === 'submitted' && (
                    <>
                      <button
                        onClick={() => handleReleasePayment(m)}
                        disabled={actionLoading}
                        className="btn btn-primary"
                        style={{
                          padding: '0.45rem 1rem',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        }}
                      >
                        <CheckCircle2 size={14} /> Approve & Release Payment
                      </button>

                      <button
                        onClick={() => setShowRevisionModal(m)}
                        disabled={actionLoading}
                        className="btn btn-secondary"
                        style={{
                          padding: '0.45rem 0.9rem',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          color: '#fbbf24',
                          borderColor: 'rgba(251, 191, 36, 0.4)',
                        }}
                      >
                        <RotateCcw size={14} /> Request Revision
                      </button>
                    </>
                  )}

                  {/* Poster: Refund Milestone (funded or submitted) */}
                  {isPoster && (m.status === 'funded' || m.status === 'submitted') && (
                    <button
                      onClick={() => setShowRefundModal(m)}
                      disabled={actionLoading}
                      className="btn btn-secondary"
                      style={{
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        color: '#f87171',
                        borderColor: 'rgba(248, 113, 113, 0.3)',
                      }}
                    >
                      <RotateCcw size={14} /> Refund
                    </button>
                  )}

                  {/* Freelancer: Submit Work (funded) */}
                  {isFreelancer && m.status === 'funded' && (
                    <button
                      onClick={() => setShowSubmitModal(m)}
                      disabled={actionLoading}
                      className="btn btn-primary"
                      style={{
                        padding: '0.45rem 1rem',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      }}
                    >
                      <Send size={14} /> Submit Deliverables
                    </button>
                  )}

                  {/* Informational badges for other states */}
                  {isFreelancer && m.status === 'pending' && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={13} /> Awaiting poster deposit before work begins
                    </span>
                  )}
                  {isFreelancer && m.status === 'submitted' && (
                    <span style={{ fontSize: '0.75rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={13} /> Work submitted — under poster review
                    </span>
                  )}
                  {m.status === 'released' && (
                    <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle2 size={13} /> Funds disbursed from escrow
                    </span>
                  )}

                  {/* Disputed state indicator */}
                  {m.status === 'disputed' && (
                    <Link
                      to="/my-disputes"
                      className="btn btn-secondary"
                      style={{
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.78rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        color: '#ef4444',
                        borderColor: 'rgba(239, 68, 68, 0.4)',
                        textDecoration: 'none',
                        background: 'rgba(239, 68, 68, 0.1)',
                      }}
                      title="Inspect active dispute case"
                    >
                      <AlertTriangle size={13} /> In Dispute (Inspect Case)
                    </Link>
                  )}

                  {/* Raise Dispute button for funded or submitted milestones */}
                  {(isPoster || isFreelancer) && (m.status === 'funded' || m.status === 'submitted') && (
                    <button
                      type="button"
                      onClick={() => setShowDisputeModal(m)}
                      disabled={actionLoading}
                      className="btn btn-secondary"
                      style={{
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.78rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        color: '#f87171',
                        borderColor: 'rgba(239, 68, 68, 0.35)',
                      }}
                      title="Raise a formal dispute on this milestone"
                    >
                      <AlertTriangle size={13} /> Dispute
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL: Define Milestones ── */}
      {showDefineModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '1.25rem',
              padding: '2rem',
              maxWidth: 550,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={20} color="#6366f1" /> Define Project Milestones
              </h3>
              <button
                onClick={() => setShowDefineModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleDefineMilestones}>
              {newMilestones.map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      Milestone Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Design Wireframes & API Architecture"
                      value={item.title}
                      onChange={(e) => {
                        const copy = [...newMilestones];
                        copy[i].title = e.target.value;
                        setNewMilestones(copy);
                      }}
                      className="input"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        Amount ($ USD) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="250"
                        value={item.amount}
                        onChange={(e) => {
                          const copy = [...newMilestones];
                          copy[i].amount = e.target.value;
                          setNewMilestones(copy);
                        }}
                        className="input"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        Due Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={item.dueDate || ''}
                        onChange={(e) => {
                          const copy = [...newMilestones];
                          copy[i].dueDate = e.target.value;
                          setNewMilestones(copy);
                        }}
                        className="input"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      Scope & Acceptance Criteria
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Explain what deliverables will be inspected before release..."
                      value={item.description}
                      onChange={(e) => {
                        const copy = [...newMilestones];
                        copy[i].description = e.target.value;
                        setNewMilestones(copy);
                      }}
                      className="input"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  setNewMilestones([
                    ...newMilestones,
                    { title: `Milestone ${newMilestones.length + 1}`, amount: '', description: '' },
                  ])
                }
                style={{
                  background: 'transparent',
                  border: '1px dashed rgba(99, 102, 241, 0.4)',
                  color: '#818cf8',
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                  width: '100%',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  marginBottom: '1.5rem',
                }}
              >
                + Add Another Milestone
              </button>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowDefineModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary">
                  {actionLoading ? 'Saving…' : 'Save Milestones'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Fund Milestone (Simulated Payment) ── */}
      {showFundModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '1.25rem',
              padding: '2rem',
              maxWidth: 480,
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={20} color="#38bdf8" /> Fund Milestone to Escrow
              </h3>
              <button
                onClick={() => setShowFundModal(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '0.75rem',
                padding: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#7dd3fc', marginBottom: '0.2rem' }}>Milestone</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{showFundModal.title}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38bdf8', marginTop: '0.4rem' }}>
                ${showFundModal.amount.toLocaleString()} USD
              </div>
            </div>

            <form onSubmit={handleFundMilestone}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Payment Method (Test Mode)
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                >
                  <option value="simulated_card">💳 Simulated Credit Card (Instant Escrow Authorization)</option>
                  <option value="stripe_test">⚡ Stripe Test Mode (Simulated PaymentIntent)</option>
                  <option value="razorpay_test">🏦 Razorpay Test Mode (Simulated Order)</option>
                </select>
              </div>

              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.4,
                  marginBottom: '1.5rem',
                  display: 'flex',
                  gap: '0.4rem',
                }}
              >
                <ShieldCheck size={16} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  Funds are secured in escrow. The freelancer will not be paid until you inspect and approve their completed work.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowFundModal(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)' }}
                >
                  {actionLoading ? 'Processing…' : `Deposit $${showFundModal.amount} into Escrow`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Freelancer Submit Work ── */}
      {showSubmitModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '1.25rem',
              padding: '2rem',
              maxWidth: 500,
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Send size={20} color="#818cf8" /> Submit Milestone Deliverables
              </h3>
              <button
                onClick={() => setShowSubmitModal(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Submitting deliverables for <strong style={{ color: '#fff' }}>"{showSubmitModal.title}"</strong> (${showSubmitModal.amount}).
            </p>

            <form onSubmit={handleSubmitWork}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  Deliverable URL (GitHub repo, live preview, Figma, Drive link)
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/user/project or https://preview.app"
                  value={submissionData.workUrl}
                  onChange={(e) => setSubmissionData({ ...submissionData, workUrl: e.target.value })}
                  className="input"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  Submission Notes & Summary of Work Done *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail the features implemented, testing steps, or instructions for the poster to review..."
                  value={submissionData.notes}
                  onChange={(e) => setSubmissionData({ ...submissionData, notes: e.target.value })}
                  className="input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowSubmitModal(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary">
                  {actionLoading ? 'Submitting…' : 'Submit for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Request Revision ── */}
      {showRevisionModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '1.25rem',
              padding: '2rem',
              maxWidth: 480,
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RotateCcw size={20} color="#f59e0b" /> Request Changes / Revision
              </h3>
              <button
                onClick={() => setShowRevisionModal(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Provide clear feedback to the freelancer explaining what needs adjustments before you approve this payment.
            </p>

            <form onSubmit={handleRequestRevision}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  Feedback & Required Revisions *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Specify the issues, missing features, or bugs that need to be addressed..."
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  className="input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowRevisionModal(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                  style={{ background: '#f59e0b', color: '#0f172a' }}
                >
                  {actionLoading ? 'Sending…' : 'Send Revision Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Refund Milestone ── */}
      {showRefundModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              borderRadius: '1.25rem',
              padding: '2rem',
              maxWidth: 480,
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RotateCcw size={20} color="#f87171" /> Refund Milestone Funds
              </h3>
              <button
                onClick={() => setShowRefundModal(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Refund <strong style={{ color: '#fff' }}>${showRefundModal.amount}</strong> from escrow back to the poster. This action will cancel this milestone.
            </p>

            <form onSubmit={handleRefundMilestone}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  Reason for Refund (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Scope cancellation or mutual resolution..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowRefundModal(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                  style={{ background: '#f87171', color: '#fff' }}
                >
                  {actionLoading ? 'Refunding…' : `Confirm Refund ($${showRefundModal.amount})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Transactions History Drawer ── */}
      {showTransactionsDrawer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '1.25rem',
              padding: '2rem',
              maxWidth: 700,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={20} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>
                  Escrow Audit & Transaction History
                </h3>
              </div>
              <button
                onClick={() => setShowTransactionsDrawer(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No financial transactions recorded for this escrow account yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {transactions.map((t) => (
                  <div
                    key={t._id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '0.75rem',
                      padding: '0.9rem 1.1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            background:
                              t.type === 'funding'
                                ? 'rgba(56, 189, 248, 0.15)'
                                : t.type === 'release'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(248, 113, 113, 0.15)',
                            color:
                              t.type === 'funding'
                                ? '#38bdf8'
                                : t.type === 'release'
                                ? '#10b981'
                                : '#f87171',
                          }}
                        >
                          {t.type}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                          {t.paymentReference}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#fff' }}>
                        {t.description || `${t.type} transaction`}
                      </p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(t.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: 800,
                          color:
                            t.type === 'funding'
                              ? '#38bdf8'
                              : t.type === 'release'
                              ? '#10b981'
                              : '#f87171',
                        }}
                      >
                        {t.type === 'release' ? '+' : t.type === 'refund' ? '↩' : ''}${t.amount.toLocaleString()}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>
                        ✓ {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: Raise Dispute ── */}
      {showDisputeModal && (
        <RaiseDisputeModal
          taskId={taskId}
          milestone={showDisputeModal}
          onClose={() => setShowDisputeModal(null)}
          onSuccess={() => {
            setShowDisputeModal(null);
            fetchEscrowDetails();
          }}
        />
      )}
    </div>
  );
};

export default MilestoneTracker;
