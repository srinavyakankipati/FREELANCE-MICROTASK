import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getSocket } from '../api/socket';
import { useAuth } from '../context/AuthContext';
import ChatWindow from '../components/workspace/ChatWindow';
import FilePanel from '../components/workspace/FilePanel';
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Calendar,
  Layers,
  HardDrive,
  MessageSquare,
  Sparkles,
  Wifi,
  WifiOff,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

const TaskWorkspace = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workspace, setWorkspace] = useState(null);
  const [task, setTask] = useState(null);
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // For mobile: 'chat' | 'files'
  const [showFilePanel, setShowFilePanel] = useState(true); // Desktop toggle

  const socketRef = useRef(null);

  // 1. Mark messages as read
  const markAsRead = useCallback(async (wsId) => {
    if (!wsId) return;
    try {
      await api.patch(`/workspaces/${wsId}/messages/read`);
    } catch (_) {
      // Non-critical
    }
  }, []);

  // 2. Fetch workspace data, messages, and files
  useEffect(() => {
    let isMounted = true;

    const initWorkspace = async () => {
      setLoading(true);
      setError('');

      try {
        // 1. Get or create workspace for task
        const wsRes = await api.get(`/workspaces/task/${taskId}`);
        if (!isMounted) return;

        const ws = wsRes.data.workspace;
        setWorkspace(ws);
        setTask(ws.task);

        // 2. Load initial chat history (page 1)
        const msgRes = await api.get(`/workspaces/${ws._id}/messages?page=1&limit=30`);
        if (!isMounted) return;

        setMessages(msgRes.data.messages || []);
        setPage(msgRes.data.page || 1);
        setTotalPages(msgRes.data.totalPages || 1);
        setHasMore(msgRes.data.hasMore || false);

        // 3. Load workspace files
        const filesRes = await api.get(`/workspaces/${ws._id}/files`);
        if (!isMounted) return;

        setFiles(filesRes.data.files || []);

        // 4. Mark unread messages as read
        markAsRead(ws._id);
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load workspace:', err);
        setError(
          err.response?.data?.message ||
            'Could not load workspace. Please ensure you are the task poster or assigned freelancer.'
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initWorkspace();

    return () => {
      isMounted = false;
    };
  }, [taskId, markAsRead]);

  // 3. Socket.io setup and real-time event listeners
  useEffect(() => {
    if (!workspace?._id || !taskId) return;

    const socket = getSocket();
    if (!socket) return;
    socketRef.current = socket;

    // Connect listener
    const joinTaskRoom = () => {
      socket.emit('join-task', { taskId }, (ack) => {
        if (ack?.success) {
          setIsConnected(true);
        } else {
          setIsConnected(false);
          console.warn('Socket join-task error:', ack?.message);
        }
      });
    };
    const onConnect = () => {
      setIsConnected(false);
      joinTaskRoom();
    };
    const onDisconnect = () => setIsConnected(false);

    if (socket.connected) {
      setIsConnected(true);
    }
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (socket.connected) joinTaskRoom();

    // Handle new-message event
    const handleNewMessage = ({ message, workspaceId }) => {
      if (workspaceId === workspace._id) {
        setMessages((prev) => {
          // Avoid duplicate messages if already present
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });

        // If the message is from someone else, mark as read
        if (user && message.sender?._id !== user._id && message.sender !== user._id) {
          markAsRead(workspace._id);
        }
      }
    };

    // Handle typing event
    const handleTyping = ({ userId, userName, isTyping }) => {
      if (user && userId !== user._id) {
        setTypingUser(isTyping ? userName : null);
      }
    };

    // Handle file-uploaded event
    const handleFileUploaded = ({ file }) => {
      setFiles((prev) => {
        if (prev.some((f) => f._id === file._id)) return prev;
        return [file, ...prev];
      });
    };

    // Handle file-deleted event
    const handleFileDeleted = ({ fileId }) => {
      setFiles((prev) => prev.filter((f) => f._id !== fileId));
    };

    // Handle messages-read event
    const handleMessagesRead = ({ userId }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.sender?._id === user?._id || m.sender === user?._id) {
            const hasRead = m.readBy?.some(
              (r) => (r.user?._id || r.user || r)?.toString() === userId.toString()
            );
            if (!hasRead) {
              return {
                ...m,
                readBy: [...(m.readBy || []), { user: userId, readAt: new Date() }],
              };
            }
          }
          return m;
        })
      );
    };

    socket.on('new-message', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('file-uploaded', handleFileUploaded);
    socket.on('file-deleted', handleFileDeleted);
    socket.on('messages-read', handleMessagesRead);

    return () => {
      socket.emit('leave-task', { taskId });
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new-message', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('file-uploaded', handleFileUploaded);
      socket.off('file-deleted', handleFileDeleted);
      socket.off('messages-read', handleMessagesRead);
    };
  }, [workspace?._id, taskId, user, markAsRead]);

  // 4. Load earlier messages (pagination)
  const handleLoadEarlier = async () => {
    if (!hasMore || loadingEarlier || !workspace) return;
    setLoadingEarlier(true);

    try {
      const nextPage = page + 1;
      const res = await api.get(`/workspaces/${workspace._id}/messages?page=${nextPage}&limit=30`);
      if (res.data?.success) {
        const olderMessages = res.data.messages || [];
        setMessages((prev) => [...olderMessages, ...prev]);
        setPage(nextPage);
        setHasMore(res.data.hasMore);
      }
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setLoadingEarlier(false);
    }
  };

  // 5. Send message handler
  const handleSendMessage = async ({ content, attachment }) => {
    if (!workspace) return;
    setIsSending(true);

    try {
      const payload = {
        content,
        attachmentId: attachment?._id || undefined,
      };

      const res = await api.post(`/workspaces/${workspace._id}/messages`, payload);

      if (res.data?.success) {
        const newMsg = res.data.message;
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      alert(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  // 6. Typing indicator emitter
  const handleTypingChange = (isTyping) => {
    if (socketRef.current) {
      socketRef.current.emit('typing', { taskId, isTyping });
    }
  };

  // 7. Inline file attachment upload
  const handleAttachFile = async (file, callback) => {
    if (!workspace) return;
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post(`/workspaces/${workspace._id}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        const uploadedFile = res.data.file;
        setFiles((prev) => [uploadedFile, ...prev]);
        callback && callback(uploadedFile);
      }
    } catch (err) {
      console.error('Failed to attach file:', err);
      alert(err.response?.data?.message || 'File upload failed');
    }
  };

  // Determine participant roles
  const isPoster = user && workspace && (workspace.poster?._id === user._id || workspace.poster === user._id);
  const otherUser = isPoster ? workspace?.freelancer : workspace?.poster;

  // Status color pill helper
  const getStatusColor = (status) => {
    switch (status) {
      case 'in-progress':
        return '#818cf8';
      case 'completed':
        return '#34d399';
      case 'assigned':
        return '#f59e0b';
      case 'open':
        return '#06b6d4';
      default:
        return '#94a3b8';
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
        }}
      >
        <Loader2 size={36} color="#6366f1" className="animate-spin" />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Loading Task Workspace...</p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="main-content" style={{ maxWidth: '640px', paddingTop: '4rem' }}>
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <AlertCircle size={44} color="#f87171" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.4rem', color: '#f87171', marginBottom: '0.75rem' }}>
            Workspace Access Denied
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            {error || 'You do not have permission to view this task workspace.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Link to={`/tasks/${taskId}`} className="btn btn-primary">
              <ArrowLeft size={16} /> Return to Task
            </Link>
            <Link to="/my-tasks" className="btn btn-secondary">
              My Tasks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 65px)',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
      }}
    >
      {/* ── Top Workspace Bar ── */}
      <div
        style={{
          height: '64px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {/* Left: Back link & Task details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
          <button
            onClick={() => navigate(`/tasks/${taskId}`)}
            title="Back to Task Details"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0.5rem',
              padding: '0.45rem',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={18} />
          </button>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  margin: 0,
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '380px',
                }}
              >
                {task?.title || 'Task Workspace'}
              </h2>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.55rem',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: getStatusColor(task?.status),
                  border: `1px solid ${getStatusColor(task?.status)}33`,
                  textTransform: 'uppercase',
                }}
              >
                {task?.status}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginTop: '0.15rem',
              }}
            >
              <span>{task?.category}</span>
              <span>•</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>${task?.budget} USD</span>
              <span>•</span>
              <Link
                to={`/tasks/${taskId}`}
                style={{
                  color: '#818cf8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                }}
              >
                Details <ExternalLink size={11} />
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Participants, Socket Live Status, and File Panel Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Other participant badge */}
          {otherUser ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background:
                    otherUser.role === 'client'
                      ? 'linear-gradient(135deg, #ec4899, #8b5cf6)'
                      : 'linear-gradient(135deg, #6366f1, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {otherUser.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ lineHeight: 1.1 }}>
                <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, color: '#f8fafc' }}>
                  {otherUser.name}
                </p>
                <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'capitalize' }}>
                  {isPoster ? 'Assigned Freelancer' : 'Task Poster'}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              No freelancer assigned yet
            </div>
          )}

          {/* Real-time Socket Indicator */}
          <div
            title={isConnected ? 'Connected to live task room' : 'Reconnecting...'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '0.3rem 0.65rem',
              borderRadius: '999px',
              background: isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: isConnected ? '#34d399' : '#f87171',
              border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isConnected ? '#10b981' : '#ef4444',
                boxShadow: isConnected ? '0 0 8px #10b981' : 'none',
              }}
            />
            <span>{isConnected ? 'Live' : 'Offline'}</span>
          </div>

          {/* Toggle File Panel Button */}
          <button
            onClick={() => setShowFilePanel(!showFilePanel)}
            style={{
              background: showFilePanel ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${showFilePanel ? 'rgba(6, 182, 212, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '0.5rem',
              padding: '0.45rem 0.8rem',
              color: showFilePanel ? '#06b6d4' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            <HardDrive size={16} />
            <span>Files ({files.length})</span>
          </button>
        </div>
      </div>

      {/* ── Main Workspace Body (Split Chat & Files) ── */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: showFilePanel ? '1fr 380px' : '1fr',
          height: 'calc(100% - 64px)',
          overflow: 'hidden',
          transition: 'grid-template-columns 0.3s ease',
        }}
      >
        {/* Chat Component */}
        <ChatWindow
          messages={messages}
          currentUser={user}
          onSendMessage={handleSendMessage}
          onTyping={handleTypingChange}
          typingUser={typingUser}
          loadingEarlier={loadingEarlier}
          hasMore={hasMore}
          onLoadEarlier={handleLoadEarlier}
          otherUser={otherUser}
          isSending={isSending}
          onAttachFile={handleAttachFile}
        />

        {/* Files Panel */}
        {showFilePanel && (
          <FilePanel
            workspaceId={workspace._id}
            files={files}
            onFileUploaded={(newFile) =>
              setFiles((prev) => (prev.some((file) => file._id === newFile._id) ? prev : [newFile, ...prev]))
            }
            onFileDeleted={(fileId) => setFiles((prev) => prev.filter((f) => f._id !== fileId))}
            currentUser={user}
            isPoster={isPoster}
            onClose={() => setShowFilePanel(false)}
          />
        )}
      </div>
    </div>
  );
};

export default TaskWorkspace;
