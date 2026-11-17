import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { DFAStateBadge } from '../../components/DFAStateBadge';
import { DFAVisualGraph } from '../../components/DFAVisualGraph';
import { BookOpen, Users, FileText, Shield, AlertTriangle, CheckCircle, Activity, PlusCircle, ArrowRight } from 'lucide-react';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminOverview();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load administrator metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
        Loading administrator dashboard & state distribution...
      </div>
    );
  }

  const { stats, recentSubmissions, dfaStatesInfo } = data || {};
  const dfaDist = stats?.dfaStateDistribution || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header and Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
            Administrator Command Center
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.925rem' }}>
            System overview and real-time Finite Automata session monitoring
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/admin/exams/new" className="btn btn-primary btn-sm">
            <PlusCircle size={16} />
            <span>Create New Exam</span>
          </Link>
          <Link to="/admin/dfa" className="btn btn-outline btn-sm">
            <Shield size={16} />
            <span>Full DFA Monitor</span>
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '1rem', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-4" style={{ gap: '1.25rem' }}>
        <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>TOTAL EXAMINATIONS</span>
            <BookOpen size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>{stats?.totalExams || 0}</div>
          <Link to="/admin/exams" style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
            <span>Manage exams</span> <ArrowRight size={12} />
          </Link>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>REGISTERED STUDENTS</span>
            <Users size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>{stats?.totalStudents || 0}</div>
          <Link to="/admin/students" style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
            <span>Manage students</span> <ArrowRight size={12} />
          </Link>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>TOTAL SUBMISSIONS</span>
            <FileText size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>{stats?.totalSubmissions || 0}</div>
          <Link to="/admin/submissions" style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
            <span>View results</span> <ArrowRight size={12} />
          </Link>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>BLOCKED SESSIONS</span>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#991b1b' }}>{stats?.blockedCount || 0}</div>
          <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.5rem', display: 'block' }}>
            DFA Trap State (S6)
          </span>
        </div>
      </div>

      {/* DFA State Live Distribution Grid */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              Real-Time Automaton State Distribution
            </h2>
            <p style={{ fontSize: '0.825rem', color: '#64748b' }}>
              Current session distribution across all 7 formal DFA states:
            </p>
          </div>
          <span style={{ fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace', color: '#2563eb' }}>
            M = (Q, &Sigma;, &delta;, q&#8320;, F)
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.75rem',
          textAlign: 'center'
        }}>
          {Object.entries(dfaStatesInfo || {}).map(([stateKey, info]) => {
            const count = dfaDist[stateKey] || 0;
            return (
              <div
                key={stateKey}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '1rem 0.5rem',
                  borderTop: `3px solid ${info.color}`
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: info.color }}>
                  [{info.id}]
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
                  {count}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                  {info.label.split(' ')[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Embedded DFA Graph */}
      <DFAVisualGraph currentState="AUTHENTICATED" />

      {/* Recent Submissions Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
            Recent Examination Submissions
          </h2>
          <Link to="/admin/submissions" style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
            View all submissions &rarr;
          </Link>
        </div>

        {recentSubmissions?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.875rem' }}>
            No completed exam sessions recorded yet.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Examination</th>
                  <th>DFA State</th>
                  <th>Submission Type</th>
                  <th>Score</th>
                  <th>Outcome</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions?.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{s.studentId?.name || 'Unknown'}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.studentId?.email}</div>
                    </td>
                    <td>{s.examId?.title || 'Unknown Exam'}</td>
                    <td><DFAStateBadge state={s.currentState} /></td>
                    <td>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: s.submissionType === 'MANUAL' ? '#10b981' : '#8b5cf6' }}>
                        {s.submissionType === 'MANUAL' ? 'Manual (S4)' : 'Auto-Timer (S5)'}
                      </span>
                    </td>
                    <td><strong>{s.score}</strong> / {s.examId?.totalMarks || 10}</td>
                    <td>
                      {s.isPassed ? (
                        <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle size={15} /> PASSED
                        </span>
                      ) : (
                        <span style={{ color: '#dc2626', fontWeight: 700 }}>FAILED</span>
                      )}
                    </td>
                    <td>
                      <Link to={`/admin/submissions/${s._id}`} className="btn btn-outline btn-sm">
                        View Audit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
