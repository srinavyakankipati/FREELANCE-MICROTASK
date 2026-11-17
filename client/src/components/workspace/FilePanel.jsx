import React, { useState, useRef } from 'react';
import api from '../../api/axios';
import {
  FileText,
  Image as ImageIcon,
  FileArchive,
  Code2,
  File,
  Download,
  Trash2,
  UploadCloud,
  Search,
  Eye,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HardDrive,
} from 'lucide-react';

/* Format bytes into human-readable size */
const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/* File icon helper */
const getFileIcon = (mimeType = '', filename = '') => {
  const ext = filename.split('.').pop().toLowerCase();
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return <ImageIcon size={20} color="#ec4899" />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return <FileArchive size={20} color="#f59e0b" />;
  }
  if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'java', 'cpp'].includes(ext)) {
    return <Code2 size={20} color="#06b6d4" />;
  }
  if (mimeType.includes('pdf') || ['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) {
    return <FileText size={20} color="#6366f1" />;
  }
  return <File size={20} color="#94a3b8" />;
};

const FilePanel = ({
  workspaceId,
  files = [],
  onFileUploaded,
  onFileDeleted,
  currentUser,
  isPoster,
  isMobileDrawer = false,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);

  // Filter files by search term
  const filteredFiles = files.filter((f) =>
    f.originalName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle direct file upload
  const handleFileUpload = async (file) => {
    if (!file) return;

    // Check size limit: 25MB
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File size exceeds the 25 MB limit.');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post(`/workspaces/${workspaceId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.success) {
        setUploadSuccess(`"${file.name}" uploaded successfully!`);
        onFileUploaded && onFileUploaded(res.data.file);
        setTimeout(() => setUploadSuccess(''), 4000);
      }
    } catch (err) {
      console.error('File upload error:', err);
      setUploadError(err.response?.data?.message || 'Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Drag and drop handlers
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Delete file handler
  const handleDelete = async (fileId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }

    setDeletingId(fileId);
    try {
      const res = await api.delete(`/workspaces/files/${fileId}`);
      if (res.data?.success) {
        onFileDeleted && onFileDeleted(fileId);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete file.');
    } finally {
      setDeletingId(null);
    }
  };

  // Download handler
  const handleDownload = async (file, e) => {
    e.stopPropagation();
    try {
      const response = await api.get(`/workspaces/files/${file._id}/download`, {
        responseType: 'blob',
      });
      const objectUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('File download error:', err);
      alert(err.response?.data?.message || 'Failed to download file.');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(16px)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
        width: '100%',
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <HardDrive size={20} color="#06b6d4" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
            Workspace Files
          </h3>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.15rem 0.55rem',
              borderRadius: '999px',
              background: 'rgba(6, 182, 212, 0.15)',
              color: '#06b6d4',
              border: '1px solid rgba(6, 182, 212, 0.3)',
            }}
          >
            {files.length}
          </span>
        </div>

        {isMobileDrawer && onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Upload Dropzone */}
      <div style={{ padding: '1.25rem 1.5rem 0.75rem' }}>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        />

        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          style={{
            border: '2px dashed rgba(99, 102, 241, 0.35)',
            borderRadius: '0.85rem',
            padding: '1.25rem 1rem',
            textAlign: 'center',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            background: 'rgba(99, 102, 241, 0.04)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!isUploading) e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.7)';
          }}
          onMouseLeave={(e) => {
            if (!isUploading) e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.35)';
          }}
        >
          {isUploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <Loader2 size={26} color="#6366f1" className="animate-spin" />
              <p style={{ fontSize: '0.82rem', color: '#818cf8', margin: 0, fontWeight: 600 }}>
                Uploading to Cloudinary...
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
              <UploadCloud size={28} color="#818cf8" />
              <p style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600, margin: 0 }}>
                Click to upload or drag & drop
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                Images, PDFs, Docs, ZIPs up to 25 MB
              </p>
            </div>
          )}
        </div>

        {uploadError && (
          <div
            style={{
              marginTop: '0.6rem',
              padding: '0.6rem 0.8rem',
              borderRadius: '0.5rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.78rem',
              color: '#f87171',
            }}
          >
            <AlertCircle size={15} />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div
            style={{
              marginTop: '0.6rem',
              padding: '0.6rem 0.8rem',
              borderRadius: '0.5rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.78rem',
              color: '#34d399',
            }}
          >
            <CheckCircle2 size={15} />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {/* Search bar */}
        <div style={{ position: 'relative', marginTop: '1rem' }}>
          <Search
            size={15}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search workspace files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem 0.6rem 2.4rem',
              borderRadius: '0.6rem',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#fff',
              fontSize: '0.82rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Files List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.75rem 1.5rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
        }}
      >
        {filteredFiles.length === 0 ? (
          <div
            style={{
              padding: '3rem 1rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
            }}
          >
            <File size={36} color="rgba(255, 255, 255, 0.15)" style={{ marginBottom: '0.75rem' }} />
            <p style={{ margin: 0 }}>
              {searchTerm ? 'No files match your search.' : 'No files uploaded yet.'}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
              Upload deliverables, specs, or assets to collaborate.
            </p>
          </div>
        ) : (
          filteredFiles.map((file) => {
            const isImage =
              file.mimeType?.startsWith('image/') ||
              ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(file.originalName?.split('.').pop()?.toLowerCase());
            const canDelete =
              currentUser &&
              (file.uploader?._id === currentUser._id ||
                file.uploader === currentUser._id ||
                isPoster ||
                currentUser.role === 'admin');

            return (
              <div
                key={file._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 0.9rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  transition: 'background 0.2s ease, border-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                }}
              >
                {/* File info */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getFileIcon(file.mimeType, file.originalName)}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      title={file.originalName}
                      style={{
                        margin: 0,
                        fontSize: '0.83rem',
                        fontWeight: 600,
                        color: '#f8fafc',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {file.originalName}
                    </p>
                    <p
                      style={{
                        margin: '0.15rem 0 0',
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <span>{formatBytes(file.size)}</span>
                      <span>•</span>
                      <span>{file.uploader?.name || 'User'}</span>
                      <span>•</span>
                      <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.5rem' }}>
                  {isImage && (
                    <button
                      onClick={() => setPreviewImage(file.fileUrl)}
                      title="Preview Image"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: 'none',
                        borderRadius: '0.4rem',
                        padding: '0.4rem',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.2s, background 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#94a3b8';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                    >
                      <Eye size={15} />
                    </button>
                  )}

                  <button
                    onClick={(e) => handleDownload(file, e)}
                    title="Download File"
                    style={{
                      background: 'rgba(6, 182, 212, 0.1)',
                      border: '1px solid rgba(6, 182, 212, 0.2)',
                      borderRadius: '0.4rem',
                      padding: '0.4rem',
                      color: '#06b6d4',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(6, 182, 212, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
                    }}
                  >
                    <Download size={15} />
                  </button>

                  {canDelete && (
                    <button
                      onClick={(e) => handleDelete(file._id, e)}
                      disabled={deletingId === file._id}
                      title="Delete File"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '0.4rem',
                        padding: '0.4rem',
                        color: '#f87171',
                        cursor: deletingId === file._id ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                      }}
                    >
                      {deletingId === file._id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
            }}
          >
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '-2.5rem',
                right: 0,
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#fff',
                padding: '0.4rem',
                borderRadius: '50%',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                borderRadius: '0.75rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FilePanel;
