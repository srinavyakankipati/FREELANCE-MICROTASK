import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  User as UserIcon,
  Star,
  MapPin,
  DollarSign,
  Briefcase,
  ExternalLink,
  PlusCircle,
  Edit3,
  Trash2,
  ShieldCheck,
  Award,
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react';

const Profile = () => {
  const { id } = useParams();
  const { user: authUser, isAuthenticated } = useAuth();

  // If no ID param is passed, we view our own profile
  const profileUserId = id || authUser?._id;
  const isOwnProfile = !id || id === authUser?._id;

  const [profileData, setProfileData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit Profile Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    professionalTitle: '',
    bio: '',
    location: '',
    hourlyRate: '',
    skills: '',
  });

  // Add Portfolio Modal State
  const [isAddPortfolioOpen, setIsAddPortfolioOpen] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({
    title: '',
    description: '',
    projectUrl: '',
    imageUrl: '',
    tags: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  const fetchProfile = async () => {
    if (!profileUserId) return;
    setLoading(true);
    try {
      const [profileRes, reviewsRes] = await Promise.all([
        api.get(`/users/profile/${profileUserId}`),
        api.get(`/reviews/user/${profileUserId}`).catch(() => ({ data: { reviews: [] } })),
      ]);

      setProfileData(profileRes.data.user);
      setReviews(reviewsRes.data.reviews || profileRes.data.reviews || []);

      if (profileRes.data.user) {
        setProfileForm({
          name: profileRes.data.user.name || '',
          professionalTitle: profileRes.data.user.professionalTitle || '',
          bio: profileRes.data.user.bio || '',
          location: profileRes.data.user.location || '',
          hourlyRate: profileRes.data.user.hourlyRate || '',
          skills: (profileRes.data.user.skills || []).join(', '),
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Failed to load profile information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [profileUserId]);

  // Handle Edit Profile Submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const res = await api.put('/users/profile', profileForm);
      setProfileData((prev) => ({ ...prev, ...res.data.user }));
      setIsEditProfileOpen(false);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Add Portfolio Submission
  const handlePortfolioSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const res = await api.post('/users/portfolio', portfolioForm);
      setProfileData((prev) => ({ ...prev, portfolio: res.data.portfolio }));
      setIsAddPortfolioOpen(false);
      setPortfolioForm({ title: '', description: '', projectUrl: '', imageUrl: '', tags: '' });
      setSuccessMsg('Portfolio project added!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add portfolio item.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Portfolio Item
  const handleDeletePortfolio = async (itemId) => {
    if (!window.confirm('Are you sure you want to remove this project?')) return;
    try {
      const res = await api.delete(`/users/portfolio/${itemId}`);
      setProfileData((prev) => ({ ...prev, portfolio: res.data.portfolio }));
      setSuccessMsg('Portfolio item removed.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to remove portfolio project.');
    }
  };

  if (loading) {
    return (
      <div className="main-content" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="spinner" style={{ width: '3rem', height: '3rem', margin: '0 auto 1.5rem' }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading profile details...</p>
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div className="main-content" style={{ maxWidth: '600px', textAlign: 'center', padding: '3rem' }}>
        <div className="card">
          <AlertCircle size={44} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h2>Profile Not Found</h2>
          <p style={{ color: 'var(--text-muted)', margin: '1rem 0 1.5rem' }}>{error}</p>
          <Link to="/tasks" className="btn btn-primary">
            Explore Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Notifications */}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
          <X size={18} style={{ cursor: 'pointer' }} onClick={() => setSuccessMsg('')} />
        </div>
      )}

      {/* =========================================================================
          PROFILE HEADER CARD
          ========================================================================= */}
      <div
        className="card"
        style={{
          padding: '2.5rem',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(30, 41, 59, 0.8))',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.25rem',
                fontWeight: '800',
                color: '#fff',
                boxShadow: '0 8px 25px var(--primary-glow)',
              }}
            >
              {profileData?.name ? profileData.name.charAt(0).toUpperCase() : <UserIcon size={36} />}
            </div>

            {/* Basic Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '2rem' }}>{profileData?.name}</h1>
                <span className="badge badge-role">{profileData?.role}</span>
              </div>

              <p style={{ color: '#c7d2fe', fontSize: '1.1rem', fontWeight: '500', marginBottom: '0.75rem' }}>
                {profileData?.professionalTitle || 'Independent Talent'}
              </p>

              {/* Stats Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f59e0b', fontWeight: '700' }}>
                  <Star size={16} fill="#f59e0b" />
                  <span>{profileData?.rating ? profileData.rating.toFixed(1) : '5.0'}</span>
                  <span style={{ color: 'var(--text-dim)', fontWeight: '400' }}>
                    ({profileData?.reviewCount || reviews.length} reviews)
                  </span>
                </div>

                {profileData?.hourlyRate > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontWeight: '600' }}>
                    <DollarSign size={15} />
                    <span>${profileData.hourlyRate}/hr</span>
                  </div>
                )}

                {profileData?.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={15} />
                    <span>{profileData.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions for Profile Owner */}
          {isOwnProfile && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsEditProfileOpen(true)}
                id="btn-edit-profile"
              >
                <Edit3 size={15} />
                <span>Edit Profile</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsAddPortfolioOpen(true)}
                id="btn-add-portfolio"
              >
                <PlusCircle size={15} />
                <span>Add Project</span>
              </button>
            </div>
          )}
        </div>

        {/* Bio */}
        {profileData?.bio && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
            <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              {profileData.bio}
            </p>
          </div>
        )}

        {/* Verified Badges */}
        {profileData?.badges?.length > 0 && (
          <div style={{ marginTop: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.5rem' }}>
              Verified Badges & Accreditations:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {profileData.badges.map((badge) => {
                const isVerified = badge.startsWith('Verified');
                return (
                  <div
                    key={badge}
                    className="badge"
                    style={{
                      background: isVerified
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(6, 182, 212, 0.2))'
                        : 'rgba(255, 255, 255, 0.05)',
                      color: isVerified ? '#c7d2fe' : '#cbd5e1',
                      border: isVerified ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid var(--border-subtle)',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <ShieldCheck size={14} color={isVerified ? '#818cf8' : '#94a3b8'} />
                    <span>{badge}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Skills */}
        {profileData?.skills?.length > 0 && (
          <div style={{ marginTop: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.5rem' }}>
              Core Skills:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {profileData.skills.map((skill) => (
                <span key={skill} className="badge badge-skill">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          PORTFOLIO SHOWCASE SECTION
          ========================================================================= */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem' }}>Portfolio Projects</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Showcase of completed work, applications, and client deliverables
            </p>
          </div>
          {isOwnProfile && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsAddPortfolioOpen(true)}
            >
              <PlusCircle size={15} />
              <span>Add Project</span>
            </button>
          )}
        </div>

        {profileData?.portfolio?.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <Layers size={36} color="#818cf8" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>No portfolio projects yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              {isOwnProfile
                ? 'Add your past work and live demos to attract premium clients!'
                : 'This freelancer has not added any portfolio items yet.'}
            </p>
            {isOwnProfile && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsAddPortfolioOpen(true)}
              >
                Add Your First Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid-2">
            {profileData?.portfolio?.map((item) => (
              <div key={item._id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Thumbnail if provided */}
                {item.imageUrl && (
                  <div
                    style={{
                      height: '180px',
                      borderRadius: '12px',
                      backgroundImage: `url(${item.imageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      marginBottom: '1rem',
                      border: '1px solid var(--border-subtle)',
                    }}
                  />
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>{item.title}</h3>
                  {isOwnProfile && (
                    <button
                      type="button"
                      className="input-action-btn"
                      onClick={() => handleDeletePortfolio(item._id)}
                      title="Delete project"
                      style={{ position: 'static' }}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </button>
                  )}
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1rem', flex: 1 }}>
                  {item.description}
                </p>

                {/* Tags */}
                {item.tags?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                    {item.tags.map((t) => (
                      <span key={t} className="badge badge-skill">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Project Link */}
                {item.projectUrl && (
                  <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <a
                      href={item.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    >
                      <span>View Live Demo</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
          CLIENT REVIEWS & RATINGS SECTION
          ========================================================================= */}
      <div>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.5rem' }}>Client Reviews & Ratings</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Verified feedback submitted after successful micro-task completion
          </p>
        </div>

        {reviews.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <Star size={36} color="#f59e0b" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>No reviews yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Reviews will appear here once tasks are completed.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviews.map((rev) => (
              <div key={rev._id} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: '#818cf8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                      }}
                    >
                      {rev.reviewer?.name ? rev.reviewer.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ color: '#fff' }}>{rev.reviewer?.name || 'Verified Client'}</strong>
                        <span className="badge badge-role" style={{ fontSize: '0.7rem' }}>
                          {rev.reviewer?.role}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        Task: {rev.task?.title || 'Micro-Task'}
                      </span>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#f59e0b' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        fill={i < rev.rating ? '#f59e0b' : 'transparent'}
                        color={i < rev.rating ? '#f59e0b' : '#64748b'}
                      />
                    ))}
                    <span style={{ marginLeft: '0.35rem', fontWeight: '700', fontSize: '0.95rem' }}>
                      {rev.rating}.0
                    </span>
                  </div>
                </div>

                <p style={{ color: 'var(--text-main)', fontSize: '0.92rem', lineHeight: '1.6' }}>
                  "{rev.comment}"
                </p>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.75rem' }}>
                  Reviewed on {new Date(rev.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
          EDIT PROFILE MODAL
          ========================================================================= */}
      {isEditProfileOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem' }}>Edit Your Profile</h2>
              <button
                type="button"
                className="input-action-btn"
                onClick={() => setIsEditProfileOpen(false)}
                style={{ position: 'static' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProfileSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Professional Headline / Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Senior React & Node.js Developer"
                  value={profileForm.professionalTitle}
                  onChange={(e) => setProfileForm({ ...profileForm, professionalTitle: e.target.value })}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Hourly Rate (USD)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="65"
                    value={profileForm.hourlyRate}
                    onChange={(e) => setProfileForm({ ...profileForm, hourlyRate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="San Francisco, CA"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Skills (comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="React, TypeScript, Node.js, GraphQL"
                  value={profileForm.skills}
                  onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bio & Professional Summary</label>
                <textarea
                  rows={4}
                  className="form-textarea"
                  placeholder="Describe your background, years of experience, and technical specializations..."
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsEditProfileOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD PORTFOLIO MODAL
          ========================================================================= */}
      {isAddPortfolioOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem' }}>Add Portfolio Project</h2>
              <button
                type="button"
                className="input-action-btn"
                onClick={() => setIsAddPortfolioOpen(false)}
                style={{ position: 'static' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePortfolioSubmit}>
              <div className="form-group">
                <label className="form-label">Project Title</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. E-Commerce Analytics Dashboard"
                  value={portfolioForm.title}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Live Demo / Repository URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://github.com/username/project or live URL"
                  value={portfolioForm.projectUrl}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, projectUrl: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Image Thumbnail URL (optional)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://images.unsplash.com/..."
                  value={portfolioForm.imageUrl}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, imageUrl: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Technologies / Tags (comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="React, Redux, Stripe, Tailwind"
                  value={portfolioForm.tags}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, tags: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project Description</label>
                <textarea
                  rows={3}
                  className="form-textarea"
                  placeholder="Briefly explain what you built, the challenges solved, and results achieved..."
                  value={portfolioForm.description}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsAddPortfolioOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Adding Project...' : 'Add Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
