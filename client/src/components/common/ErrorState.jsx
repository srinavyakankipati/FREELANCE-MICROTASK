import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorState = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this data. Please try again.',
  onRetry,
  minHeight = '280px',
}) => {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2.5rem 2rem',
        minHeight,
        margin: '1rem 0',
        borderColor: 'rgba(239, 68, 68, 0.3)',
        background: 'rgba(239, 68, 68, 0.05)',
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ef4444',
          marginBottom: '1rem',
        }}
      >
        <AlertCircle size={26} />
      </div>

      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.45rem', color: '#fca5a5' }}>{title}</h3>
      <p
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
          maxWidth: '460px',
          margin: '0 auto 1.5rem',
          lineHeight: 1.5,
        }}
      >
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <RefreshCw size={15} />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
