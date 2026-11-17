import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DFAStateBadge } from '../../components/DFAStateBadge';
import { FileText, CheckCircle, XCircle, History, X, RefreshCw, Clock, Award } from 'lucide-react';

export const SubmissionsManager = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterState, setFilterState] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterState) params.state = filterState;
      const res = await api.getSubmissions(params);
      setSubmissions(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [filterState]);

  const handleViewAudit = async (sessionId) => {
    setLoadingDetails(true);
    try {
      const res = await api.getSubmissionDetails(sessionId);
      setSelectedSession(res.data);
    } catch (err) {
      alert(`Failed to load submission audit: ${err.message}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
            Submissions & Evaluation Audits
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.925rem' }}>
            Complete scorecards and finite automata transition trails
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
          >
            <option value="">All States</option>
            <option value="SUBMITTED">S4: Manual Submission</option>
            <option value="AUTO_SUBMITTED">S5: Auto-Submitted (Timeout)</option>
            <option value="BLOCKED">S6: Blocked (Violation)</option>
          </select>

          <button onClick={fetchSubmissions} className="btn btn-outline btn-sm">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '1rem', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
          Loading student submissions...
        </div>
      ) : submissions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <FileText size={48} style={{ opacity: 0.35, marginBottom: '0.75rem' }} />
          <h3>No Submissions Found</h3>
          <p style={{ fontSize: '0.875rem' }}>Student submissions will be recorded here upon completion.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Examination</th>
                <th>DFA State</th>
                <th>Mode</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Status</th>
                <th>Date / Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s._id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{s.studentId?.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.studentId?.email}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1e40af' }}>{s.examId?.title || 'Unknown Exam'}</div>
                  </td>
                  <td>
                    <DFAStateBadge state={s.currentState} />
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: s.submissionType === 'MANUAL' ? '#10b981' : s.submissionType === 'AUTO' ? '#8b5cf6' : '#64748b' }}>
                      {s.submissionType === 'MANUAL' ? 'Manual (S4)' : s.submissionType === 'AUTO' ? 'Auto (S5)' : 'Incomplete'}
                    </span>
                  </td>
                  <td>
                    <strong>{s.score}</strong> / {s.examId?.totalMarks || 10}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{s.percentage}%</span>
                  </td>
                  <td>
                    {s.isPassed ? (
                      <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle size={15} /> PASSED
                      </span>
                    ) : (
                      <span style={{ color: '#dc2626', fontWeight: 700 }}>FAILED</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {new Date(s.submittedAt || s.createdAt).toLocaleDateString()} {new Date(s.submittedAt || s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <button
                      onClick={() => handleViewAudit(s._id)}
                      className="btn btn-outline btn-sm"
                    >
                      <History size={14} />
                      <span>Audit Trail</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Submission Audit Trail Modal */}
      {selectedSession && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                  DFA Examination Audit Report
                </span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                  {selectedSession.session?.studentId?.name} &bull; {selectedSession.session?.examId?.title}
                </h2>
              </div>
              <button onClick={() => setSelectedSession(null)} className="btn btn-outline btn-sm" style={{ padding: '0.35rem' }}>
                <X size={18} />
              </button>
            </div>

            {/* Scorecard Strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.75rem',
              background: '#f8fafc',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center',
              marginBottom: '1.5rem',
              border: '1px solid #e2e8f0'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Score</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                  {selectedSession.session?.score} / {selectedSession.scoreCalculation?.totalMarks}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Percentage</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                  {selectedSession.session?.percentage}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Outcome</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: selectedSession.session?.isPassed ? '#059669' : '#dc2626', marginTop: '0.2rem' }}>
                  {selectedSession.session?.isPassed ? 'PASSED' : 'FAILED'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>DFA State</div>
                <div style={{ marginTop: '0.2rem' }}>
                  <DFAStateBadge state={selectedSession.session?.currentState} />
                </div>
              </div>
            </div>

            {/* DFA Transition Timeline */}
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <History size={17} color="#2563eb" />
              <span>State Transition Chronological History</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {selectedSession.dfaAuditTrail?.map((trail, idx) => (
                <div key={idx} style={{
                  padding: '0.6rem 0.85rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.825rem'
                }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#1e40af' }}>{trail.fromState}</span>
                    <span style={{ margin: '0 0.4rem', color: '#64748b' }}>&rarr;</span>
                    <span style={{ fontWeight: 700, color: '#059669' }}>{trail.toState}</span>
                    <span style={{ marginLeft: '0.75rem', color: '#64748b' }}>({trail.symbol})</span>
                    {trail.metadata?.reason && (
                      <span style={{ marginLeft: '0.5rem', color: '#475569', fontSize: '0.78rem' }}>
                        &bull; {trail.metadata.reason}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                    {new Date(trail.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Question Breakdown */}
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
              Student Answers & Verification
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedSession.scoreCalculation?.questionResults?.map((q, qIdx) => (
                <div key={qIdx} style={{
                  padding: '0.85rem',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  borderLeft: q.isCorrect ? '4px solid #10b981' : '4px solid #ef4444',
                  background: '#ffffff',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.4rem' }}>
                    #{qIdx + 1}: {q.questionText}
                  </div>
                  <div style={{ color: '#475569' }}>
                    Student Choice: <strong>{q.studentChoice !== null ? q.options[q.studentChoice] : 'Not Answered'}</strong>
                    {q.isCorrect ? (
                      <span style={{ color: '#059669', marginLeft: '0.5rem', fontWeight: 700 }}>&check; Correct</span>
                    ) : (
                      <span style={{ color: '#dc2626', marginLeft: '0.5rem', fontWeight: 700 }}>&cross; Correct was: {q.options[q.correctOption]}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionsManager;
