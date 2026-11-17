import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DFAStateBadge } from './DFAStateBadge';
import { Shield, BookOpen, Users, FileText, Activity, LogOut, CheckCircle2, User } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, isStudent, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand-link">
          <div className="brand-badge">
            <Activity size={20} />
          </div>
          <div>
            <span>AutoExam</span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500, display: 'block', marginTop: '-4px' }}>
              DFA Automaton Core
            </span>
          </div>
        </Link>

        <nav className="nav-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            Home
          </Link>

          {isAuthenticated ? (
            <>
              {isStudent && (
                <>
                  <Link to="/student" className={`nav-link ${isActive('/student') ? 'active' : ''}`}>
                    <BookOpen size={16} />
                    <span>My Exams</span>
                  </Link>
                </>
              )}

              {isAdmin && (
                <>
                  <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
                    <Activity size={16} />
                    <span>Overview</span>
                  </Link>
                  <Link to="/admin/exams" className={`nav-link ${isActive('/admin/exams') ? 'active' : ''}`}>
                    <BookOpen size={16} />
                    <span>Exams</span>
                  </Link>
                  <Link to="/admin/students" className={`nav-link ${isActive('/admin/students') ? 'active' : ''}`}>
                    <Users size={16} />
                    <span>Students</span>
                  </Link>
                  <Link to="/admin/submissions" className={`nav-link ${isActive('/admin/submissions') ? 'active' : ''}`}>
                    <FileText size={16} />
                    <span>Submissions</span>
                  </Link>
                  <Link to="/admin/dfa" className={`nav-link ${isActive('/admin/dfa') ? 'active' : ''}`}>
                    <Shield size={16} />
                    <span>DFA Monitor</span>
                  </Link>
                </>
              )}

              {/* User Profile Info & State Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                paddingLeft: '0.75rem',
                borderLeft: '1px solid #e2e8f0'
              }}>
                <DFAStateBadge state={user?.currentState || 'AUTHENTICATED'} />
                
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                    {user?.name}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'capitalize' }}>
                    {user?.role}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="btn btn-outline btn-sm"
                  title="Logout (DFA: S1 -> S0)"
                  style={{ padding: '0.4rem 0.6rem' }}
                >
                  <LogOut size={15} />
                  <span>Exit</span>
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-outline btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
