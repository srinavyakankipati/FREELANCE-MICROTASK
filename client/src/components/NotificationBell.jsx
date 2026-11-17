import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getSocket } from '../api/socket';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  CheckCheck,
  Trash2,
  UserPlus,
  Briefcase,
  DollarSign,
  Send,
  Award,
  MessageSquare,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react';

/* Relative time formatter */
const timeAgo = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/* Type to icon & color mapper */
const getNotificationMeta = (type) => {
  switch (type) {
    case 'new_applicant':
      return {
        icon: <UserPlus size={16} color="#06b6d4" />,
        bg: 'rgba(6, 182, 212, 0.12)',
        border: 'rgba(6, 182, 212, 0.3)',
      };
    case 'assignment':
      return {
        icon: <Briefcase size={16} color="#10b981" />,
        bg: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.3)',
      };
    case 'milestone_funded':
      return {
        icon: <DollarSign size={16} color="#f59e0b" />,
        bg: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.3)',
      };
    case 'milestone_submitted':
      return {
        icon: <Send size={16} color="#818cf8" />,
        bg: 'rgba(129, 140, 248, 0.12)',
        border: 'rgba(129, 140, 248, 0.3)',
      };
    case 'milestone_approved':
      return {
        icon: <Award size={16} color="#34d399" />,
        bg: 'rgba(52, 211, 153, 0.12)',
        border: 'rgba(52, 211, 153, 0.3)',
      };
    case 'new_message':
      return {
        icon: <MessageSquare size={16} color="#ec4899" />,
        bg: 'rgba(236, 72, 153, 0.12)',
        border: 'rgba(236, 72, 153, 0.3)',
      };
    case 'dispute_update':
      return {
        icon: <AlertTriangle size={16} color="#f87171" />,
        bg: 'rgba(239, 68, 68, 0.12)',
        border: 'rgba(239, 68, 68, 0.3)',
      };
    default:
      return {
        icon: <Info size={16} color="#94a3b8" />,
        bg: 'rgba(148, 163, 184, 0.12)',
        border: 'rgba(148, 163, 184, 0.3)',
      };
  }
};

const NotificationBell = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSocketLive, setIsSocketLive] = useState(false);

  const dropdownRef = useRef(null);

  // 1. Fetch unread count & initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await api.get('/notifications?limit=25');
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // 2. Socket.io Live Updates
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socket = getSocket();
    if (!socket) return;

    if (socket.connected) {
      setIsSocketLive(true);
    }

    const onConnect = () => setIsSocketLive(true);
    const onDisconnect = () => setIsSocketLive(false);

    // Listen to real-time incoming notification
    const handleNewNotification = (notification) => {
      setNotifications((prev) => [
        notification,
        ...prev.filter((item) => item._id !== notification._id),
      ]);
    };

    // Listen to unread count sync
    const handleUnreadCount = ({ count }) => {
      setUnreadCount(count);
    };
    const handleNotificationUpdated = (notification) => {
      setNotifications((prev) =>
        prev.map((item) => (item._id === notification._id ? notification : item))
      );
    };
    const handleNotificationsRead = () => {
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    };
    const handleNotificationDeleted = ({ id }) => {
      setNotifications((prev) => prev.filter((item) => item._id !== id));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('notification', handleNewNotification);
    socket.on('unread-count', handleUnreadCount);
    socket.on('notification-updated', handleNotificationUpdated);
    socket.on('notifications-read', handleNotificationsRead);
    socket.on('notification-deleted', handleNotificationDeleted);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('notification', handleNewNotification);
      socket.off('unread-count', handleUnreadCount);
      socket.off('notification-updated', handleNotificationUpdated);
      socket.off('notifications-read', handleNotificationsRead);
      socket.off('notification-deleted', handleNotificationDeleted);
    };
  }, [isAuthenticated, user]);

  // 3. Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 4. Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  // 5. Mark single as read & navigate
  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.read) {
        await api.patch(`/notifications/${notif._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      setIsOpen(false);
      if (notif.link) {
        navigate(notif.link);
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  // 6. Delete single notification
  const handleDelete = async (e, notifId) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${notifId}`);
      setNotifications((prev) => prev.filter((n) => n._id !== notifId));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        title="Notifications"
        style={{
          background: isOpen ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${isOpen ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
          borderRadius: '50%',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: unreadCount > 0 ? '#fff' : 'var(--text-muted)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = unreadCount > 0 ? '#fff' : 'var(--text-muted)';
          e.currentTarget.style.borderColor = isOpen ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.1)';
        }}
      >
        <Bell size={18} />

        {/* Unread badge count */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              background: 'linear-gradient(135deg, #ef4444, #ec4899)',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 800,
              minWidth: '18px',
              height: '18px',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)',
              animation: 'pulse 2s infinite',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '380px',
            maxWidth: '92vw',
            background: 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '1rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.15)',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.5rem',
                    borderRadius: '999px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#818cf8',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
              {/* Socket live dot */}
              <span
                title={isSocketLive ? 'Live real-time updates active' : 'Offline'}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isSocketLive ? '#10b981' : '#64748b',
                  boxShadow: isSocketLive ? '0 0 6px #10b981' : 'none',
                }}
              />
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#818cf8',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.2rem 0.4rem',
                  borderRadius: '0.3rem',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#818cf8')}
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div
            style={{
              maxHeight: '380px',
              overflowY: 'auto',
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ margin: 0, fontSize: '0.8rem' }}>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div
                style={{
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <Bell size={32} color="rgba(255, 255, 255, 0.15)" style={{ marginBottom: '0.75rem' }} />
                <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>
                  All caught up!
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                  No new notifications right now.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const meta = getNotificationMeta(notif.type);

                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.75rem 0.85rem',
                      borderRadius: '0.75rem',
                      background: notif.read ? 'rgba(255, 255, 255, 0.02)' : 'rgba(99, 102, 241, 0.08)',
                      border: `1px solid ${notif.read ? 'rgba(255, 255, 255, 0.04)' : 'rgba(99, 102, 241, 0.25)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = notif.read
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'rgba(99, 102, 241, 0.14)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = notif.read
                        ? 'rgba(255, 255, 255, 0.02)'
                        : 'rgba(99, 102, 241, 0.08)';
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '0.55rem',
                        background: meta.bg,
                        border: `1px solid ${meta.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '0.1rem',
                      }}
                    >
                      {meta.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          marginBottom: '0.2rem',
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: '0.82rem',
                            fontWeight: notif.read ? 600 : 700,
                            color: notif.read ? '#e2e8f0' : '#fff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {notif.title}
                        </h4>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            color: 'var(--text-dim)',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>

                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.78rem',
                          color: notif.read ? 'var(--text-dim)' : 'var(--text-muted)',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {notif.message}
                      </p>
                    </div>

                    {/* Unread indicator dot & Delete action */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.4rem',
                        marginLeft: '0.25rem',
                      }}
                    >
                      {!notif.read && (
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: '#06b6d4',
                            boxShadow: '0 0 6px #06b6d4',
                            marginTop: '0.35rem',
                          }}
                        />
                      )}
                      <button
                        onClick={(e) => handleDelete(e, notif._id)}
                        title="Delete notification"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                          padding: '0.2rem',
                          borderRadius: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0.6,
                          transition: 'opacity 0.2s, color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.color = '#f87171';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0.6';
                          e.currentTarget.style.color = 'var(--text-dim)';
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
