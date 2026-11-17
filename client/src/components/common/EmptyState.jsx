import React from 'react';
import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There are no records to display matching your criteria.',
  actionLabel,
  actionLink,
  onActionClick,
  minHeight = '300px',
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
        padding: '3rem 2rem',
        minHeight,
        margin: '1rem 0',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          marginBottom: '1.25rem',
        }}
      >
        <Icon size={28} />
      </div>

      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.45rem', color: '#fff' }}>{title}</h3>
      <p
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.92rem',
          maxWidth: '450px',
          margin: '0 auto 1.5rem',
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>

      {actionLabel && actionLink && (
        <Link to={actionLink} className="btn btn-primary btn-sm">
          {actionLabel}
        </Link>
      )}

      {actionLabel && onActionClick && !actionLink && (
        <button onClick={onActionClick} className="btn btn-primary btn-sm">
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
