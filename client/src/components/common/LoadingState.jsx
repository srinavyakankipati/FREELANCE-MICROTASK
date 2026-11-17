import React from 'react';

const LoadingState = ({ message = 'Loading...', minHeight = '50vh', size = '2.5rem' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight,
        gap: '1rem',
        padding: '2rem',
      }}
      className="loading-state-wrapper"
    >
      <div className="spinner" style={{ width: size, height: size, borderWidth: '3px' }} />
      {message && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', fontWeight: 500, margin: 0 }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingState;
