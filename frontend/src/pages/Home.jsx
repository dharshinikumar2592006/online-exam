import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DFAVisualGraph } from '../components/DFAVisualGraph';
import { Shield, Clock, Award, CheckCircle2, ArrowRight, BookOpen, AlertTriangle, Cpu } from 'lucide-react';

export const Home = () => {
  const { isAuthenticated, isAdmin, login } = useAuth();
  const navigate = useNavigate();

  const handleDemoLogin = async (email, password) => {
    try {
      const res = await login(email, password);
      if (res.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    } catch (err) {
      alert(`Demo login error: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #0284c7 100%)',
        borderRadius: '24px',
        color: '#ffffff',
        padding: '3.5rem 2.5rem',
        boxShadow: '0 20px 25px -5px rgba(30, 64, 175, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '800px', position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.825rem',
            fontWeight: 600,
            marginBottom: '1.25rem',
            border: '1px solid rgba(255, 255, 255, 0.25)'
          }}>
            <Cpu size={15} />
            <span>Formally Verified Deterministic Finite Automaton (DFA)</span>
          </div>

          <h1 style={{
            fontSize: '2.75rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            marginBottom: '1.25rem'
          }}>
            Online Examination System Using Finite Automata
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: '#e0f2fe',
            lineHeight: 1.6,
            marginBottom: '2rem',
            maxWidth: '680px'
          }}>
            A rigorous full-stack examination platform where the entire student assessment lifecycle is mathematically verified by a backend Deterministic Finite Automaton across 7 distinct states: S0 to S6.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {isAuthenticated ? (
              <Link
                to={isAdmin ? '/admin' : '/student'}
                className="btn btn-lg"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#1e40af',
                  fontWeight: 700,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              >
                <span>Go to {isAdmin ? 'Admin Dashboard' : 'Student Portal'}</span>
                <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <button
                  onClick={() => handleDemoLogin('student@exam.com', 'student123')}
                  className="btn btn-lg"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#1e40af',
                    fontWeight: 700,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <BookOpen size={18} />
                  <span>Demo Student Portal</span>
                </button>

                <button
                  onClick={() => handleDemoLogin('admin@exam.com', 'admin123')}
                  className="btn btn-lg"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    fontWeight: 600,
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  <Shield size={18} />
                  <span>Demo Admin Console</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* DFA Interactive State Machine Visualizer */}
      <section>
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
              Automaton Architecture & State Machine
            </h2>
            <p style={{ fontSize: '0.925rem', color: '#64748b' }}>
              Deterministic transition function &delta;(state, symbol) enforces strict integrity:
            </p>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#1d4ed8', fontWeight: 600 }}>
            Formal Tuple: M = (Q, &Sigma;, &delta;, q&#8320;, F)
          </div>
        </div>

        <DFAVisualGraph currentState="NOT_LOGGED_IN" />
      </section>

      {/* Formal States Breakdown Cards */}
      <section>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>
          Deterministic States in Q = {'{S0, S1, S2, S3, S4, S5, S6}'}
        </h2>

        <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
          <div className="card" style={{ borderLeft: '4px solid #64748b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-s0">[S0]</span>
              <strong style={{ fontSize: '0.95rem' }}>NOT_LOGGED_IN</strong>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              The initial start state q&#8320;. User is completely unauthenticated. No exam data or questions are accessible.
            </p>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #0284c7' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-s1">[S1]</span>
              <strong style={{ fontSize: '0.95rem' }}>AUTHENTICATED</strong>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Reached via LOGIN symbol. JWT bearer token validated. User can browse available exams and view past results.
            </p>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #0891b2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-s2">[S2]</span>
              <strong style={{ fontSize: '0.95rem' }}>EXAM_ACCESS_GRANTED</strong>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Reached via REQUEST_EXAM_ACCESS. Student accepts rules, instructions, and anti-cheating guidelines.
            </p>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #eab308' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-s3">[S3]</span>
              <strong style={{ fontSize: '0.95rem' }}>EXAM_IN_PROGRESS</strong>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Active test state. Countdown timer ticks down. Answers trigger a deterministic self-loop &delta;(S3, SAVE_ANSWER) = S3.
            </p>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-s4">[S4]</span>
              <strong style={{ fontSize: '0.95rem' }}>SUBMITTED (Manual)</strong>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Accepting final state F&#8321;. Reached when student reviews questions and triggers voluntary manual submission.
            </p>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-s5">[S5]</span>
              <strong style={{ fontSize: '0.95rem' }}>AUTO_SUBMITTED</strong>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Accepting final state F&#8322;. Reached via TIME_EXPIRED when timer hits 00:00. Backend auto-evaluates submission.
            </p>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #ef4444', gridColumn: 'span 3' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-s6">[S6]</span>
              <strong style={{ fontSize: '0.95rem' }}>BLOCKED (Trap State)</strong>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Trap state entered upon 3 tab-switching security strikes or administrative lockdown. All further answers or submissions are rejected. Can only be unblocked to S1 by an administrator.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
        <div className="card">
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Clock size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Dual Submission Modes</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Support for graceful manual submission (S4) and automated server-validated countdown timeout submission (S5).
          </p>
        </div>

        <div className="card">
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Shield size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Anti-Cheating Trap State</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Monitors tab focus losses and window blurs. Three infractions transition student session into dead trap state S6 (BLOCKED).
          </p>
        </div>

        <div className="card">
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Award size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Audit Trail & Analytics</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Full timestamped chronological audit trail of all state transitions stored in MongoDB, with score breakdowns and answer explanations.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
