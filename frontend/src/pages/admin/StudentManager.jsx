import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DFAStateBadge } from '../../components/DFAStateBadge';
import { Users, ShieldAlert, ShieldCheck, RefreshCw, RotateCcw, AlertTriangle } from 'lucide-react';

export const StudentManager = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.getStudents();
      setStudents(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleBlock = async (studentId, studentName) => {
    const reason = prompt(`Enter reason for blocking student ${studentName} (DFA: S6 BLOCKED):`, 'Academic integrity policy violation');
    if (!reason) return;

    setActionInProgress(true);
    try {
      await api.blockStudent(studentId, reason);
      await fetchStudents();
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleUnblock = async (studentId, studentName) => {
    if (!window.confirm(`Unblock student ${studentName}? This transitions their state S6 -> S1 (AUTHENTICATED).`)) {
      return;
    }

    setActionInProgress(true);
    try {
      await api.unblockStudent(studentId);
      await fetchStudents();
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleResetSession = async (sessionId, studentName) => {
    if (!window.confirm(`Reset this exam attempt for ${studentName}? They will be allowed to retake the test.`)) {
      return;
    }

    setActionInProgress(true);
    try {
      await api.resetSession(sessionId);
      await fetchStudents();
    } catch (err) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
            Manage Students & DFA States
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.925rem' }}>
            Inspect student states, enforce security blocks (S6), and restore access (S1)
          </p>
        </div>

        <button onClick={fetchStudents} className="btn btn-outline btn-sm">
          <RefreshCw size={15} />
          <span>Refresh List</span>
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '1rem', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
          Loading registered students and active sessions...
        </div>
      ) : students.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <Users size={48} style={{ opacity: 0.35, marginBottom: '0.75rem' }} />
          <h3>No Registered Students</h3>
          <p style={{ fontSize: '0.875rem' }}>Students will appear here once they register or take exams.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Global DFA State</th>
                <th>Status</th>
                <th>Active / Latest Session</th>
                <th>Attempts</th>
                <th>Security Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st) => {
                const latestSession = st.sessions && st.sessions[0];
                return (
                  <tr key={st.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{st.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{st.email}</div>
                    </td>
                    <td>
                      <DFAStateBadge state={st.globalState} />
                    </td>
                    <td>
                      {st.isBlocked ? (
                        <span className="badge badge-s6" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <ShieldAlert size={12} /> BLOCKED
                        </span>
                      ) : (
                        <span className="badge badge-s4" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <ShieldCheck size={12} /> ACTIVE
                        </span>
                      )}
                    </td>
                    <td>
                      {latestSession ? (
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e40af' }}>
                            {latestSession.examTitle}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                            <DFAStateBadge state={latestSession.currentState} showId={true} />
                            {latestSession.tabSwitchCount > 0 && (
                              <span style={{ fontSize: '0.72rem', color: '#b91c1c', background: '#fef2f2', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                                {latestSession.tabSwitchCount} Strikes
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>None</span>
                      )}
                    </td>
                    <td>
                      <strong>{st.totalAttempts}</strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {st.isBlocked ? (
                          <button
                            onClick={() => handleUnblock(st.id, st.name)}
                            disabled={actionInProgress}
                            className="btn btn-outline btn-sm"
                            style={{ color: '#059669', borderColor: '#a7f3d0' }}
                            title="Unblock student (S6 -> S1)"
                          >
                            <ShieldCheck size={14} />
                            <span>Unblock</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBlock(st.id, st.name)}
                            disabled={actionInProgress}
                            className="btn btn-outline btn-sm"
                            style={{ color: '#ef4444', borderColor: '#fecaca' }}
                            title="Block student (S1 -> S6)"
                          >
                            <ShieldAlert size={14} />
                            <span>Block</span>
                          </button>
                        )}

                        {latestSession && (
                          <button
                            onClick={() => handleResetSession(latestSession.id, st.name)}
                            disabled={actionInProgress}
                            className="btn btn-outline btn-sm"
                            title="Reset Exam Attempt"
                          >
                            <RotateCcw size={14} />
                            <span>Reset</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentManager;
