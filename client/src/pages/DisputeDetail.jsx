import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  FileText,
  UploadCloud,
  ShieldAlert,
  ShieldCheck,
  Scale,
  Clock,
  User,
  MessageSquare,
  HardDrive,
  Download,
  Loader2,
  Send,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const DisputeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dispute, setDispute] = useState(null);
  const [task, setTask] = useState(null);
  const [milestone, setMilestone] = useState(null);
  const [escrow, setEscrow] = useState(null);
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Evidence submission state
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const [evidenceError, setEvidenceError] = useState('');

  // Admin resolution state
  const [resolutionChoice, setResolutionChoice] = useState('split');
  const [splitPercent, setSplitPercent] = useState(50);
  const [adminNotes, setAdminNotes] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');
  const [showWorkspaceContext, setShowWorkspaceContext] = useState(false);

  const fetchDispute = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/disputes/${id}`);
      if (res.data?.success) {
        setDispute(res.data.dispute);
        setTask(res.data.task);
        setMilestone(res.data.milestone);
        setEscrow(res.data.escrow);
        setMessages(res.data.messages || []);
        setFiles(res.data.files || []);
      }
    } catch (err) {
      console.error('Failed to load dispute:', err);
      setError(err.response?.data?.message || 'Could not load dispute details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispute();
  }, [id]);

  // Submit new evidence
  const handleAddEvidence = async (e) => {
    e.preventDefault();
    if (!evidenceDesc.trim() && !evidenceFile) {
      setEvidenceError('Please provide a description or attach a file.');
      return;
    }

    setSubmittingEvidence(true);
    setEvidenceError('');

    try {
      const formData = new FormData();
      if (evidenceDesc) formData.append('description', evidenceDesc.trim());
      if (evidenceFile) formData.append('file', evidenceFile);

      const res = await api.post(`/disputes/${id}/evidence`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setDispute(res.data.dispute);
        setEvidenceDesc('');
        setEvidenceFile(null);
      }
    } catch (err) {
      setEvidenceError(err.response?.data?.message || 'Failed to submit evidence.');
    } finally {
      setSubmittingEvidence(false);
    }
  };

  // Admin resolution submit
  const handleResolve = async (e) => {
    e.preventDefault();
    if (!adminNotes.trim()) {
      setResolveError('Please provide administrative justification notes.');
      return;
    }

    if (!window.confirm(`Are you sure you want to resolve this dispute as "${resolutionChoice.toUpperCase()}"? This will execute irreversible financial payout movements.`)) {
      return;
    }

    setResolving(true);
    setResolveError('');

    try {
      const payload = {
        resolution: resolutionChoice,
        notes: adminNotes.trim(),
        splitPercentage: resolutionChoice === 'split' ? Number(splitPercent) : undefined,
      };

      const res = await api.patch(`/disputes/${id}/resolve`, payload);
      if (res.data?.success) {
        setDispute(res.data.dispute);
        setMilestone(res.data.milestone);
        setEscrow(res.data.escrow);
      }
    } catch (err) {
      setResolveError(err.response?.data?.message || 'Failed to resolve dispute.');
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <Loader2 size={36} color="#6366f1" className="animate-spin" />
        <p style={{ color: 'var(--text-muted)' }}>Loading dispute records...</p>
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="main-content" style={{ maxWidth: '600px', paddingTop: '4rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <AlertCircle size={44} color="#f87171" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: '#fff', marginBottom: '0.5rem' }}>Dispute Unavailable</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error || 'Dispute not found or access denied.'}</p>
          <Link to="/my-disputes" className="btn btn-primary">
            <ArrowLeft size={16} /> View My Disputes
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';
  const milestoneAmount = Number(milestone?.amount || 0);
  const freelancerSplitCalc = parseFloat(((milestoneAmount * splitPercent) / 100).toFixed(2));
  const posterSplitCalc = parseFloat((milestoneAmount - freelancerSplitCalc).toFixed(2));

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

  const statusMeta = getStatusBadge(dispute.status);

  return (
    <div className="main-content" style={{ maxWidth: '1080px' }}>
      {/* ── Top Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.45rem 0.6rem' }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 style={{ fontSize: '1.4rem', margin: 0 }}>
                Dispute Case #{dispute._id.slice(-6).toUpperCase()}
              </h1>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.6rem',
                  borderRadius: '999px',
                  background: statusMeta.bg,
                  color: statusMeta.color,
                  border: `1px solid ${statusMeta.border}`,
                  textTransform: 'uppercase',
                }}
              >
                {statusMeta.label}
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Opened {new Date(dispute.createdAt).toLocaleString()} on task{' '}
              <Link to={`/tasks/${task?._id}`} style={{ color: '#818cf8', fontWeight: 600 }}>
                "{task?.title}"
              </Link>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <Link to={`/tasks/${task?._id}/workspace`} className="btn btn-secondary btn-sm">
            <MessageSquare size={14} /> Open Workspace
          </Link>
          <Link to={`/tasks/${task?._id}`} className="btn btn-outline btn-sm">
            <ExternalLink size={14} /> Task Details
          </Link>
        </div>
      </div>

      {/* ── Resolution Banner (If Resolved) ── */}
      {dispute.status === 'resolved' && (
        <div
          className="card"
          style={{
            marginBottom: '1.75rem',
            background:
              dispute.resolution === 'release'
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.08))'
                : dispute.resolution === 'refund'
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.08))'
                : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(99, 102, 241, 0.1))',
            border:
              dispute.resolution === 'release'
                ? '1px solid rgba(16, 185, 129, 0.4)'
                : dispute.resolution === 'refund'
                ? '1px solid rgba(239, 68, 68, 0.4)'
                : '1px solid rgba(245, 158, 11, 0.4)',
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '0.75rem',
                background:
                  dispute.resolution === 'release' ? '#10b981' : dispute.resolution === 'refund' ? '#ef4444' : '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              <Scale size={24} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>
                  Dispute Resolved:{' '}
                  <span style={{ textTransform: 'uppercase', color: dispute.resolution === 'release' ? '#34d399' : dispute.resolution === 'refund' ? '#f87171' : '#fbbf24' }}>
                    {dispute.resolution}
                  </span>
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Resolved on {new Date(dispute.adminDecision?.resolvedAt || dispute.updatedAt).toLocaleDateString()}
                </span>
              </div>

              {/* Financial outcome pills */}
              <div style={{ display: 'flex', gap: '1rem', margin: '0.75rem 0', flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.5rem 0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Freelancer Payout:</span>
                  <p style={{ margin: '0.1rem 0 0', fontWeight: 800, color: '#34d399', fontSize: '1.05rem' }}>
                    ${dispute.adminDecision?.freelancerAmount || 0} USD
                  </p>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.5rem 0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Client Refund:</span>
                  <p style={{ margin: '0.1rem 0 0', fontWeight: 800, color: '#60a5fa', fontSize: '1.05rem' }}>
                    ${dispute.adminDecision?.posterAmount || 0} USD
                  </p>
                </div>
              </div>

              {dispute.adminDecision?.notes && (
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5, background: 'rgba(0,0,0,0.2)', padding: '0.65rem 0.85rem', borderRadius: '0.5rem' }}>
                  <strong>Admin Notes:</strong> {dispute.adminDecision.notes}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Grid: Case Overview & Parties ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        {/* Milestone at stake */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
              Milestone in Dispute
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                color: dispute.status === 'resolved' ? '#34d399' : '#ef4444',
                fontWeight: 700,
                padding: '0.1rem 0.45rem',
                borderRadius: '4px',
                background: dispute.status === 'resolved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              }}
            >
              {dispute.status === 'resolved' ? `RESOLVED · ${milestone?.status || 'complete'}` : 'FROZEN'}
            </span>
          </div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>{milestone?.title}</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.4rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10b981' }}>
              ${milestone?.amount}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>USD in Escrow</span>
          </div>
        </div>

        {/* Dispute Initiator & Reason */}
        <div className="card">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
            Raised By
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', margin: '0.5rem 0 0.75rem' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: '#fff',
                fontSize: '0.8rem',
              }}
            >
              {dispute.raisedBy?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
                {dispute.raisedBy?.name}
              </p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {dispute.raisedBy?.role}
              </p>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            <strong style={{ color: '#fff' }}>Reason: </strong> {dispute.reason}
          </div>
        </div>
      </div>

      {/* ── Admin Resolution Decision Form ── */}
      {isAdmin && dispute.status !== 'resolved' && (
        <div
          className="card"
          style={{
            marginBottom: '1.75rem',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(15, 23, 42, 0.95))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <Scale size={22} color="#818cf8" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>
                Admin Resolution Decision Panel
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Resolve this dispute and automatically disburse locked escrow funds
              </p>
            </div>
          </div>

          <form onSubmit={handleResolve}>
            {/* Resolution Options */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
              {/* Option 1: Release */}
              <div
                onClick={() => setResolutionChoice('release')}
                style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: `2px solid ${resolutionChoice === 'release' ? '#10b981' : 'rgba(255,255,255,0.08)'}`,
                  background: resolutionChoice === 'release' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>Release to Freelancer</span>
                  <input type="radio" checked={resolutionChoice === 'release'} onChange={() => setResolutionChoice('release')} />
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  100% (${milestoneAmount}) paid out to assigned freelancer.
                </p>
              </div>

              {/* Option 2: Refund */}
              <div
                onClick={() => setResolutionChoice('refund')}
                style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: `2px solid ${resolutionChoice === 'refund' ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
                  background: resolutionChoice === 'refund' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 700, color: '#f87171' }}>Refund to Client</span>
                  <input type="radio" checked={resolutionChoice === 'refund'} onChange={() => setResolutionChoice('refund')} />
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  100% (${milestoneAmount}) returned to task poster.
                </p>
              </div>

              {/* Option 3: Split */}
              <div
                onClick={() => setResolutionChoice('split')}
                style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: `2px solid ${resolutionChoice === 'split' ? '#f59e0b' : 'rgba(255,255,255,0.08)'}`,
                  background: resolutionChoice === 'split' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 700, color: '#f59e0b' }}>Split Escrow Funds</span>
                  <input type="radio" checked={resolutionChoice === 'split'} onChange={() => setResolutionChoice('split')} />
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Custom percentage split between both parties.
                </p>
              </div>
            </div>

            {/* If Split is selected: percentage slider */}
            {resolutionChoice === 'split' && (
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
                    Freelancer Share: {splitPercent}% (${freelancerSplitCalc})
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
                    Client Refund: {100 - splitPercent}% (${posterSplitCalc})
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={splitPercent}
                  onChange={(e) => setSplitPercent(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
                />

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {[25, 50, 75].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSplitPercent(preset)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                    >
                      {preset} / {100 - preset} Split
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Notes */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#fff', marginBottom: '0.4rem' }}>
                Official Decision Justification / Notes <span style={{ color: '#f87171' }}>*</span>
              </label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="State the findings, contractual terms, and reason for this disbursement decision..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.65rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            {resolveError && (
              <div style={{ color: '#f87171', fontSize: '0.82rem', marginBottom: '1rem' }}>
                {resolveError}
              </div>
            )}

            <button
              type="submit"
              disabled={resolving}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {resolving ? <Loader2 size={16} className="animate-spin" /> : <Scale size={16} />}
              <span>Execute Decision & Disburse Escrow</span>
            </button>
          </form>
        </div>
      )}

      {/* ── Evidence Gallery & Submissions ── */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} color="#06b6d4" />
          <span>Evidence & Documentation ({dispute.evidence?.length || 0})</span>
        </h3>

        {/* Existing Evidence List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {(!dispute.evidence || dispute.evidence.length === 0) ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              No supporting evidence has been uploaded yet.
            </p>
          ) : (
            dispute.evidence.map((item, idx) => (
              <div
                key={item._id || idx}
                style={{
                  padding: '0.9rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
                      {item.uploadedBy?.name || 'User'}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'capitalize' }}>
                      ({item.uploadedBy?.role || 'party'})
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      • {new Date(item.uploadedAt).toLocaleString()}
                    </span>
                  </div>

                  {item.description && (
                    <p style={{ margin: '0.25rem 0', fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {item.description}
                    </p>
                  )}

                  {item.fileName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem', fontSize: '0.75rem', color: '#818cf8' }}>
                      <FileText size={14} />
                      <span>{item.fileName}</span>
                    </div>
                  )}
                </div>

                {item.fileUrl && (
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Download size={14} /> Download File
                  </a>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Evidence Form */}
        {dispute.status !== 'resolved' && (
          <form
            onSubmit={handleAddEvidence}
            style={{
              padding: '1.25rem',
              borderRadius: '0.75rem',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#fff' }}>
              Add Additional Supporting Evidence
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <textarea
                rows={2}
                value={evidenceDesc}
                onChange={(e) => setEvidenceDesc(e.target.value)}
                placeholder="Explain the screenshot, message logs, or deliverables you are attaching..."
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '0.83rem',
                  outline: 'none',
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <input
                    type="file"
                    id="add-evidence-file"
                    style={{ display: 'none' }}
                    onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="add-evidence-file"
                    className="btn btn-secondary btn-sm"
                    style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <UploadCloud size={14} />
                    <span>{evidenceFile ? evidenceFile.name : 'Choose File Attachment'}</span>
                  </label>
                  {evidenceFile && (
                    <button
                      type="button"
                      onClick={() => setEvidenceFile(null)}
                      style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.75rem', marginLeft: '0.5rem', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submittingEvidence}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {submittingEvidence ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>Upload Evidence</span>
                </button>
              </div>

              {evidenceError && (
                <p style={{ color: '#f87171', fontSize: '0.78rem', margin: 0 }}>{evidenceError}</p>
              )}
            </div>
          </form>
        )}
      </div>

      {/* ── Task Workspace Chat & Files History Context Accordion ── */}
      <div className="card">
        <div
          onClick={() => setShowWorkspaceContext(!showWorkspaceContext)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <MessageSquare size={18} color="#818cf8" />
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>
              Task Workspace Audit Log (Chat & Deliverables)
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }}>
              {messages.length} messages, {files.length} files
            </span>
          </div>

          <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
            {showWorkspaceContext ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {showWorkspaceContext && (
          <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
            {/* Chat audit stream */}
            <h4 style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '0.75rem' }}>Conversation Transcript:</h4>
            <div
              style={{
                maxHeight: '300px',
                overflowY: 'auto',
                background: 'rgba(0,0,0,0.25)',
                padding: '1rem',
                borderRadius: '0.65rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                marginBottom: '1.25rem',
              }}
            >
              {messages.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                  No messages exchanged in workspace yet.
                </p>
              ) : (
                messages.map((m) => (
                  <div key={m._id} style={{ fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 700, color: m.sender?.role === 'client' ? '#ec4899' : '#06b6d4' }}>
                      {m.sender?.name}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginLeft: '0.4rem' }}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}:
                    </span>
                    <span style={{ color: '#e2e8f0', marginLeft: '0.5rem' }}>{m.content}</span>
                  </div>
                ))
              )}
            </div>

            {/* Uploaded deliverables audit */}
            <h4 style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '0.75rem' }}>Uploaded Files:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {files.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                  No files uploaded in workspace.
                </p>
              ) : (
                files.map((f) => (
                  <a
                    key={f._id}
                    href={f.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      color: '#06b6d4',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      textDecoration: 'none',
                    }}
                  >
                    <HardDrive size={14} />
                    <span>{f.originalName}</span>
                  </a>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisputeDetail;
