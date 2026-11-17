import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Paperclip,
  Check,
  CheckCheck,
  Clock,
  Loader2,
  FileText,
  Download,
  Image as ImageIcon,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';

/* Format message timestamp */
const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/* Format message date separators */
const formatDateSeparator = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

const ChatWindow = ({
  messages = [],
  currentUser,
  onSendMessage,
  onTyping,
  typingUser,
  loadingEarlier,
  hasMore,
  onLoadEarlier,
  otherUser,
  isSending,
  onAttachFile,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  // Handle typing change with debounce
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    if (onTyping) {
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1500);
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if ((!inputText.trim() && !selectedAttachment) || isSending) return;

    if (onTyping) onTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    onSendMessage({
      content: inputText.trim(),
      attachment: selectedAttachment,
    });

    setInputText('');
    setSelectedAttachment(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (onAttachFile) {
        onAttachFile(file, (uploadedFile) => {
          setSelectedAttachment(uploadedFile);
        });
      }
    }
  };

  // Group messages by date
  let lastDate = null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: 'rgba(11, 15, 25, 0.65)',
        position: 'relative',
      }}
    >
      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}
      >
        {/* Load Earlier Messages Button */}
        {hasMore && (
          <div style={{ textAlign: 'center', margin: '0.5rem 0 1rem' }}>
            <button
              onClick={onLoadEarlier}
              disabled={loadingEarlier}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '999px',
                padding: '0.45rem 1.1rem',
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                cursor: loadingEarlier ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              {loadingEarlier ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Loading chat history...
                </>
              ) : (
                'Load earlier messages'
              )}
            </button>
          </div>
        )}

        {/* Empty chat state */}
        {messages.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              textAlign: 'center',
              padding: '2rem',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                border: '1px solid rgba(99, 102, 241, 0.25)',
              }}
            >
              <Sparkles size={28} color="#818cf8" />
            </div>
            <h4 style={{ margin: '0 0 0.4rem', color: '#fff', fontSize: '1.1rem' }}>
              Welcome to the Task Workspace!
            </h4>
            <p style={{ maxWidth: '380px', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
              This is a secure, real-time collaboration channel for this task. You can exchange updates, share
              deliverables, and ask questions directly.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine =
              currentUser && (msg.sender?._id === currentUser._id || msg.sender === currentUser._id);
            const msgDate = formatDateSeparator(msg.createdAt);
            const showDateSeparator = msgDate !== lastDate;
            if (showDateSeparator) {
              lastDate = msgDate;
            }

            // Check if read by the other participant
            const isRead =
              msg.readBy &&
              msg.readBy.some((r) => {
                const readerId = r.user?._id || r.user || r;
                return readerId && readerId.toString() !== currentUser?._id?.toString();
              });

            return (
              <React.Fragment key={msg._id || Math.random()}>
                {showDateSeparator && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0.75rem 0',
                    }}
                  >
                    <span
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '0.2rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {msgDate}
                    </span>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexDirection: isMine ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    gap: '0.65rem',
                    maxWidth: '82%',
                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                  }}
                >
                  {/* Sender Avatar for other user */}
                  {!isMine && (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background:
                          msg.sender?.role === 'client'
                            ? 'linear-gradient(135deg, #ec4899, #8b5cf6)'
                            : 'linear-gradient(135deg, #6366f1, #06b6d4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        flexShrink: 0,
                      }}
                    >
                      {msg.sender?.name?.charAt(0).toUpperCase() || <UserIcon size={16} />}
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                    {/* Sender Name for incoming messages */}
                    {!isMine && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                          marginBottom: '0.2rem',
                          marginLeft: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{msg.sender?.name || 'Participant'}</span>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: 'var(--text-dim)',
                            textTransform: 'capitalize',
                          }}
                        >
                          {msg.sender?.role || 'user'}
                        </span>
                      </span>
                    )}

                    {/* Bubble */}
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: isMine
                          ? '1.1rem 1.1rem 0.25rem 1.1rem'
                          : '1.1rem 1.1rem 1.1rem 0.25rem',
                        background: isMine
                          ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
                          : 'rgba(30, 41, 59, 0.85)',
                        border: isMine ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#fff',
                        fontSize: '0.88rem',
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                        boxShadow: isMine
                          ? '0 4px 14px rgba(79, 70, 229, 0.25)'
                          : '0 4px 12px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      {/* Attachments preview */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: msg.content ? '0.6rem' : '0' }}>
                          {msg.attachments.map((att) => {
                            const isImg =
                              att.mimeType?.startsWith('image/') ||
                              ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(
                                att.originalName?.split('.').pop()?.toLowerCase()
                              );

                            return (
                              <div
                                key={att._id || att.fileUrl}
                                style={{
                                  borderRadius: '0.6rem',
                                  overflow: 'hidden',
                                  background: 'rgba(0, 0, 0, 0.25)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                }}
                              >
                                {isImg ? (
                                  <a href={att.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={att.fileUrl}
                                      alt={att.originalName}
                                      style={{
                                        maxWidth: '240px',
                                        maxHeight: '180px',
                                        display: 'block',
                                        objectFit: 'cover',
                                        borderRadius: '0.5rem',
                                      }}
                                    />
                                  </a>
                                ) : (
                                  <a
                                    href={att.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={att.originalName}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.6rem',
                                      padding: '0.55rem 0.75rem',
                                      textDecoration: 'none',
                                      color: '#fff',
                                      fontSize: '0.8rem',
                                    }}
                                  >
                                    <FileText size={18} color="#06b6d4" />
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {att.originalName}
                                    </span>
                                    <Download size={14} color="#06b6d4" />
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Text content */}
                      {msg.content && <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>}

                      {/* Footer time & status */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '0.35rem',
                          marginTop: '0.3rem',
                          fontSize: '0.67rem',
                          color: isMine ? 'rgba(255, 255, 255, 0.75)' : 'var(--text-muted)',
                        }}
                      >
                        <span>{formatTime(msg.createdAt)}</span>
                        {isMine && (
                          <span>
                            {isRead ? (
                              <CheckCheck size={13} color="#67e8f9" title="Read" />
                            ) : (
                              <Check size={13} color="rgba(255, 255, 255, 0.7)" title="Delivered" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}

        {/* Real-time Typing indicator */}
        {typingUser && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              alignSelf: 'flex-start',
              padding: '0.5rem 0.85rem',
              borderRadius: '999px',
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: '#818cf8',
                  animation: 'pulse 1s infinite alternate',
                }}
              />
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: '#818cf8',
                  animation: 'pulse 1s infinite alternate 0.2s',
                }}
              />
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: '#818cf8',
                  animation: 'pulse 1s infinite alternate 0.4s',
                }}
              />
            </div>
            <span>
              <strong style={{ color: '#fff' }}>{typingUser}</strong> is typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Selected Attachment Preview Bar */}
      {selectedAttachment && (
        <div
          style={{
            padding: '0.6rem 1.25rem',
            background: 'rgba(30, 41, 59, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#818cf8' }}>
            <FileText size={16} />
            <span style={{ fontWeight: 600 }}>Attached:</span>
            <span style={{ color: '#fff' }}>{selectedAttachment.originalName}</span>
          </div>
          <button
            onClick={() => setSelectedAttachment(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            Remove
          </button>
        </div>
      )}

      {/* Chat Input Bar */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <form
          onSubmit={handleSend}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '0.85rem',
            padding: '0.4rem 0.6rem 0.4rem 0.9rem',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.6)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
        >
          {/* Hidden File Picker */}
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileSelected}
          />

          {/* Attach Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach a file"
            style={{
              background: 'none',
              border: 'none',
              color: selectedAttachment ? '#818cf8' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '0.4rem',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = selectedAttachment ? '#818cf8' : 'var(--text-muted)')}
          >
            <Paperclip size={18} />
          </button>

          {/* Input Field */}
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              otherUser
                ? `Message ${otherUser.name}... (Press Enter to send)`
                : 'Type your message... (Press Enter to send)'
            }
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '0.88rem',
              padding: '0.4rem 0',
            }}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!inputText.trim() && !selectedAttachment) || isSending}
            style={{
              background:
                (!inputText.trim() && !selectedAttachment) || isSending
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              border: 'none',
              borderRadius: '0.6rem',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: (!inputText.trim() && !selectedAttachment) || isSending ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow:
                (!inputText.trim() && !selectedAttachment) || isSending
                  ? 'none'
                  : '0 4px 12px rgba(99, 102, 241, 0.4)',
            }}
          >
            {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
