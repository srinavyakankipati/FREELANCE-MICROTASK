import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Briefcase,
  Layers,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const SUGGESTED_SKILLS = [
  'React',
  'Node.js',
  'Python',
  'UI/UX',
  'Figma',
  'TypeScript',
  'WordPress',
  'TailwindCSS',
];

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client'); // default client or freelancer
  const [skills, setSkills] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleAddSkillChip = (skillName) => {
    const list = skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!list.includes(skillName)) {
      list.push(skillName);
      setSkills(list.join(', '));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name,
        email,
        password,
        role,
        skills,
      });
      // Redirect based on role
      if (role === 'client') {
        navigate('/post-task');
      } else {
        navigate('/tasks');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Registration failed. Please check your information.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 8px 20px var(--primary-glow)',
            }}
          >
            <UserPlus size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Join TaskForge to collaborate on micro-tasks and projects
          </p>
        </div>

        {error && (
          <div className="alert alert-error" id="register-error-alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Account Type Selector */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Select Your Account Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div
                onClick={() => setRole('client')}
                id="role-select-client"
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  background:
                    role === 'client'
                      ? 'rgba(99, 102, 241, 0.15)'
                      : 'rgba(255, 255, 255, 0.03)',
                  border:
                    role === 'client'
                      ? '2px solid var(--primary)'
                      : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Briefcase size={20} color={role === 'client' ? '#818cf8' : '#94a3b8'} />
                  {role === 'client' && <CheckCircle2 size={16} color="#818cf8" />}
                </div>
                <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>I'm a Client</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Post tasks & hire talent
                </span>
              </div>

              <div
                onClick={() => setRole('freelancer')}
                id="role-select-freelancer"
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  background:
                    role === 'freelancer'
                      ? 'rgba(236, 72, 153, 0.15)'
                      : 'rgba(255, 255, 255, 0.03)',
                  border:
                    role === 'freelancer'
                      ? '2px solid var(--secondary)'
                      : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Layers size={20} color={role === 'freelancer' ? '#f472b6' : '#94a3b8'} />
                  {role === 'freelancer' && <CheckCircle2 size={16} color="#f472b6" />}
                </div>
                <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>I'm a Freelancer</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Work on tasks & get paid
                </span>
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-name">
              Full Name
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <UserIcon size={18} />
              </span>
              <input
                id="register-name"
                type="text"
                required
                className="form-input has-icon"
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-email">
              Email Address
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Mail size={18} />
              </span>
              <input
                id="register-email"
                type="email"
                required
                className="form-input has-icon"
                placeholder="alex@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-password">
              Password <span className="form-hint">(min 6 characters)</span>
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Lock size={18} />
              </span>
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                className="form-input has-icon"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="input-action-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Skills (especially relevant for Freelancers) */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-skills">
              Skills / Expertise <span className="form-hint">(comma separated)</span>
            </label>
            <input
              id="register-skills"
              type="text"
              className="form-input"
              placeholder="e.g. React, Node.js, UI Design"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
            {/* Quick chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
              {SUGGESTED_SKILLS.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => handleAddSkillChip(item)}
                  className="badge badge-skill"
                  style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            id="btn-register-submit"
            style={{ width: '100%', marginTop: '1.25rem' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Join TaskForge as {role === 'client' ? 'Client' : 'Freelancer'}</span>
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }} id="link-to-login">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
