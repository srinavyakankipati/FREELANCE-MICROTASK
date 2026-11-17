import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: '2.5rem', height: '2.5rem' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role restriction if provided
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="main-content" style={{ maxWidth: '640px', marginTop: '3rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '1rem', borderRadius: '50%', color: '#ef4444' }}>
              <ShieldAlert size={48} />
            </div>
          </div>
          <h2 style={{ marginBottom: '0.75rem', fontSize: '1.75rem' }}>Access Restricted</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            This page requires <strong>{allowedRoles.join(' or ')}</strong> privileges. Your current role is{' '}
            <span className="badge badge-role">{user.role}</span>.
          </p>
          <a href="/my-tasks" className="btn btn-primary">
            Return to My Tasks
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
