import React, { useState } from 'react';
import api from '../../api/axios';
import {
  AlertTriangle,
  X,
  UploadCloud,
  FileText,
  Lock,
  DollarSign,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const REASON_PRESETS = [
  'Deliverable not delivered or unresponsive counterparty',
  'Deliverable quality does not meet agreed specifications',
  'Scope creep or unauthorized modifications',
  'Unreasonable revision demands after completed work',
  'Payment dispute or deadline non-compliance',
  'Other custom disagreement',
];

const RaiseDisputeModal = ({ taskId, milestone, onClose, onSuccess }) => {
  const [selectedPreset, setSelectedPreset] = useState(REASON_PRESETS[0]);
  const [detailedReason, setDetailedReason] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalReason = `${selectedPreset}${detailedReason ? `: ${detailedReason}` : ''}`;

    if (!finalReason.trim()) {
      setError('Please provide a reason for raising this dispute.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('taskId', taskId);
      formData.append('milestoneId', milestone._id);
      formData.append('reason', finalReason.trim());
      if (detailedReason) {
        formData.append('description', detailedReason.trim());
      }
      if (file) {
        formData.append('file', file);
      }

      const res = await api.post('/disputes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.success) {
        onSuccess && onSuccess(res.data.dispute);
      }
    } catch (err) {
      console.error('Failed to raise dispute:', err);
      setError(err.response?.data?.message || 'Failed to raise dispute. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '1.25rem',
          maxWidth: '560px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 30px rgba(239, 68, 68, 0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(239, 68, 68, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '0.6rem',
                background: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f87171',
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>
                Raise a Milestone Dispute
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Funds will be frozen in escrow pending admin review
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.3rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', overflowY: 'auto' }}>
          {/* Milestone Target Summary */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '0.75rem',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Disputed Milestone
              </span>
              <p style={{ margin: '0.15rem 0 0', fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>
                {milestone.title}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Escrow Amount</span>
              <p style={{ margin: '0.15rem 0 0', fontWeight: 800, color: '#10b981', fontSize: '1.1rem' }}>
                ${milestone.amount}
              </p>
            </div>
          </div>

          {/* Warning Notice */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '0.75rem',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              marginBottom: '1.25rem',
              display: 'flex',
              gap: '0.65rem',
              fontSize: '0.8rem',
              color: '#fbbf24',
              lineHeight: 1.45,
            }}
          >
            <Lock size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Freezing Notice:</strong> Raising this dispute will immediately freeze this milestone. Neither
              payout release nor refund can proceed until an administrator resolves the dispute.
            </span>
          </div>

          {/* Reason Category Selection */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: '#fff', marginBottom: '0.4rem' }}>
              Primary Dispute Reason <span style={{ color: '#f87171' }}>*</span>
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.65rem',
                background: 'rgba(30, 41, 59, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            >
              {REASON_PRESETS.map((preset) => (
                <option key={preset} value={preset} style={{ background: '#0f172a' }}>
                  {preset}
                </option>
              ))}
            </select>
          </div>

          {/* Detailed Explanation */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: '#fff', marginBottom: '0.4rem' }}>
              Detailed Explanation & Specifics
            </label>
            <textarea
              rows={4}
              value={detailedReason}
              onChange={(e) => setDetailedReason(e.target.value)}
              placeholder="Describe the issue in detail, what was agreed upon, and what resolution you are seeking..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.65rem',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Initial Evidence Attachment */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: '#fff', marginBottom: '0.4rem' }}>
              Attach Supporting Evidence (Optional)
            </label>
            <div
              style={{
                border: '2px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '0.75rem',
                padding: '1rem',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <input
                type="file"
                id="dispute-file-input"
                style={{ display: 'none' }}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                  <FileText size={18} color="#818cf8" />
                  <span style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600 }}>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label htmlFor="dispute-file-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                  <UploadCloud size={24} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Upload screenshots, specification logs, or chat exports
                  </span>
                </label>
              )}
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-danger"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Freezing Milestone...
                </>
              ) : (
                <>
                  <AlertTriangle size={16} /> Raise Dispute & Freeze
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RaiseDisputeModal;
