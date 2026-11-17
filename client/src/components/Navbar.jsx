import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Layers,
  PlusCircle,
  Briefcase,
  LogOut,
  User as UserIcon,
  LogIn,
  UserPlus,
  Award,
  Search,
  Sparkles,
  ClipboardList,
  Scale,
  ShieldAlert,
  Menu,
  X,
  LayoutDashboard,
} from 'lucide-react';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/" className="brand-logo" id="nav-brand-logo" onClick={closeMobile}>
          <div className="brand-icon">
            <Layers size={22} />
          </div>
          <span>
            Task<span className="brand-gradient-text">Forge</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="nav-links desktop-nav-links">
          {isAuthenticated && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              id="nav-link-dashboard"
            >
              <LayoutDashboard size={17} />
              <span>Dashboard</span>
            </NavLink>
          )}

          <NavLink
            to="/tasks"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            id="nav-link-browse"
          >
            <Briefcase size={17} />
            <span>Browse</span>
          </NavLink>

          <NavLink
            to="/search"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            id="nav-link-search"
          >
            <Search size={17} />
            <span>Search</span>
          </NavLink>

          <NavLink
            to="/skill-tests"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            id="nav-link-skill-tests"
          >
            <Award size={17} />
            <span>Skill Tests</span>
          </NavLink>

          {isAuthenticated && (
            <>
              <NavLink
                to="/my-tasks"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                id="nav-link-my-tasks"
              >
                <span>My Tasks</span>
              </NavLink>

              {user?.role === 'freelancer' && (
                <>
                  <NavLink
                    to="/recommended"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    id="nav-link-recommended"
                  >
                    <Sparkles size={17} />
                    <span>For You</span>
                  </NavLink>
                  <NavLink
                    to="/my-applications"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    id="nav-link-my-applications"
                  >
                    <ClipboardList size={17} />
                    <span>Applications</span>
                  </NavLink>
                </>
              )}

              {user?.role !== 'freelancer' && (
                <NavLink
                  to="/post-task"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  id="nav-link-post-task"
                >
                  <PlusCircle size={17} />
                  <span>Post a Task</span>
                </NavLink>
              )}

              <NavLink
                to="/my-disputes"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                id="nav-link-disputes"
              >
                <Scale size={17} />
                <span>Disputes</span>
              </NavLink>

              {user?.role === 'admin' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  id="nav-link-admin"
                  style={({ isActive }) => ({
                    color: isActive ? '#fff' : '#f472b6',
                    borderColor: 'rgba(236, 72, 153, 0.4)',
                  })}
                >
                  <ShieldAlert size={17} />
                  <span>Admin</span>
                </NavLink>
              )}
            </>
          )}
        </nav>

        {/* User Auth Info / Actions */}
        <div className="nav-user-panel">
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <NotificationBell />
              <Link
                to="/profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  textDecoration: 'none',
                  color: 'inherit',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '10px',
                  transition: 'background 0.2s',
                }}
                className="nav-link"
                id="nav-link-my-profile"
                title="View My Profile & Portfolio"
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    color: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={18} />}
                </div>
                <div style={{ display: 'none', flexDirection: 'column' }} className="desktop-nav-links">
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', lineHeight: 1.2 }}>
                    {user?.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                    <span className="badge badge-role" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                      {user?.role}
                    </span>
                  </div>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="btn btn-outline btn-sm desktop-nav-links"
                title="Sign out"
                id="btn-logout"
                style={{ padding: '0.45rem 0.75rem' }}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="desktop-nav-links">
              <Link to="/login" className="btn btn-outline btn-sm" id="btn-nav-login">
                <LogIn size={15} />
                <span>Sign In</span>
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm" id="btn-nav-register">
                <UserPlus size={15} />
                <span>Get Started</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            id="btn-mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={closeMobile}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="brand-icon" style={{ width: '30px', height: '30px' }}>
                  <Layers size={16} />
                </div>
                <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>TaskForge</span>
              </div>
              <button
                onClick={closeMobile}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {isAuthenticated && (
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#fff' }}>{user?.name}</div>
                  <span className="badge badge-role" style={{ fontSize: '0.65rem' }}>
                    {user?.role}
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {isAuthenticated && (
                <NavLink to="/dashboard" className="nav-link" onClick={closeMobile}>
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </NavLink>
              )}

              <NavLink to="/tasks" className="nav-link" onClick={closeMobile}>
                <Briefcase size={18} />
                <span>Browse Tasks</span>
              </NavLink>

              <NavLink to="/search" className="nav-link" onClick={closeMobile}>
                <Search size={18} />
                <span>Search</span>
              </NavLink>

              <NavLink to="/skill-tests" className="nav-link" onClick={closeMobile}>
                <Award size={18} />
                <span>Skill Tests</span>
              </NavLink>

              {isAuthenticated ? (
                <>
                  <NavLink to="/my-tasks" className="nav-link" onClick={closeMobile}>
                    <Briefcase size={18} />
                    <span>My Tasks</span>
                  </NavLink>

                  {user?.role === 'freelancer' && (
                    <>
                      <NavLink to="/recommended" className="nav-link" onClick={closeMobile}>
                        <Sparkles size={18} />
                        <span>Recommended</span>
                      </NavLink>
                      <NavLink to="/my-applications" className="nav-link" onClick={closeMobile}>
                        <ClipboardList size={18} />
                        <span>Applications</span>
                      </NavLink>
                    </>
                  )}

                  {user?.role !== 'freelancer' && (
                    <NavLink to="/post-task" className="nav-link" onClick={closeMobile}>
                      <PlusCircle size={18} />
                      <span>Post a Task</span>
                    </NavLink>
                  )}

                  <NavLink to="/my-disputes" className="nav-link" onClick={closeMobile}>
                    <Scale size={18} />
                    <span>Disputes</span>
                  </NavLink>

                  {user?.role === 'admin' && (
                    <NavLink to="/admin" className="nav-link" onClick={closeMobile}>
                      <ShieldAlert size={18} />
                      <span>Admin Governance</span>
                    </NavLink>
                  )}

                  <NavLink to="/profile" className="nav-link" onClick={closeMobile}>
                    <UserIcon size={18} />
                    <span>Profile & Portfolio</span>
                  </NavLink>

                  <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      onClick={handleLogout}
                      className="btn btn-outline"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                  <Link to="/login" className="btn btn-outline" onClick={closeMobile}>
                    <LogIn size={16} />
                    <span>Sign In</span>
                  </Link>
                  <Link to="/register" className="btn btn-primary" onClick={closeMobile}>
                    <UserPlus size={16} />
                    <span>Get Started</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
