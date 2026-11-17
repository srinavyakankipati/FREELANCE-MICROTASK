import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { disconnectSocket } from '../api/socket';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('taskforge_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('taskforge_token') || null);
  const [loading, setLoading] = useState(true);

  function logout() {
    disconnectSocket();
    localStorage.removeItem('taskforge_token');
    localStorage.removeItem('taskforge_user');
    setToken(null);
    setUser(null);
  }

  // Sync token to api & verify with /api/auth/me on mount
  useEffect(() => {
    const verifyUser = async () => {
      const savedToken = localStorage.getItem('taskforge_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('taskforge_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Session expired or invalid token:', err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();

    // Listen to 401 unauth events from Axios interceptor
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = res.data;

    localStorage.setItem('taskforge_token', receivedToken);
    localStorage.setItem('taskforge_user', JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);
    return res.data;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { token: receivedToken, user: receivedUser } = res.data;

    localStorage.setItem('taskforge_token', receivedToken);
    localStorage.setItem('taskforge_user', JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);
    return res.data;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
