import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { DFAStateBadge } from '../../components/DFAStateBadge';
import { DFAVisualGraph } from '../../components/DFAVisualGraph';
import { BookOpen, Clock, Award, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, RotateCcw } from 'lucide-react';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await api.getExams();
      setExams(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch examinations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleStartExam = async (exam) => {
    const session = exam.session;
    if (session?.currentState === 'EXAM_IN_PROGRESS') {
      navigate(`/student/exam/${exam._id}`);
    } else {
      navigate(`/student/instructions/${exam._id}`);
    }
  };

  const handleRetakeExam = async (examId) => {
    try {
      await api.retakeExam(examId);
      navigate(`/student/instructions/${examId}`);
    } catch (err) {
      alert(`Could not reset exam: ${err.message}`);
    }
  };

  const completedExams = exams.filter(e => e.session && ['SUBMITTED', 'AUTO_SUBMITTED'].includes(e.session.currentState));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Profile Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #0284c7 100%)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem',
        padding: '2rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              Welcome back, {user?.name}!
            </h1>
            <DFAStateBadge state={user?.currentState || 'AUTHENTICATED'} />
          </div>
          <p style={{ color: '#e0f2fe', fontSize: '0.95rem' }}>
            Registered Student Portal &bull; Formal Finite Automaton Session Integrity Active
          </p>
        </div>

        <button
          onClick={fetchExams}
          className="btn btn-secondary btn-sm"
          style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)' }}
        >
          <RefreshCw size={15} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* DFA Visualizer */}
      <DFAVisualGraph currentState={user?.currentState || 'AUTHENTICATED'} compact={true} />

      {/* Available Examinations List */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>
              Available Examinations
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Select an examination to initiate formal access verification (DFA: S1 &rarr; S2)
            </p>
          </div>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
            {exams.length} Total Exams
          </span>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            Loading available examinations...
          </div>
        ) : exams.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#64748b' }}>
            <BookOpen size={40} style={{ opacity: 0.35, marginBottom: '0.75rem' }} />
            <p style={{ fontWeight: 600 }}>No examinations found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2" style={{ gap: '1.25rem' }}>
            {exams.map((exam) => {
              const session = exam.session;
              const isInProgress = session?.currentState === 'EXAM_IN_PROGRESS';
              const isCompleted = session?.currentState === 'SUBMITTED' || session?.currentState === 'AUTO_SUBMITTED';
              const isBlocked = session?.currentState === 'BLOCKED';

              return (
                <div key={exam._id} className="card" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: isInProgress ? '4px solid #eab308' : isCompleted ? '4px solid #10b981' : isBlocked ? '4px solid #ef4444' : '4px solid #2563eb'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: '#2563eb',
                        background: '#eff6ff',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px'
                      }}>
                        {exam.category || 'General'}
                      </span>

                      {session?.currentState ? (
                        <DFAStateBadge state={session.currentState} />
                      ) : (
                        <span className="badge badge-s1">READY</span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                      {exam.title}
                    </h3>

                    <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                      {exam.description || 'Comprehensive evaluation exam.'}
                    </p>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.25rem',
                      fontSize: '0.825rem',
                      color: '#475569',
                      padding: '0.75rem 0',
                      borderTop: '1px solid #f1f5f9',
                      borderBottom: '1px solid #f1f5f9',
                      marginBottom: '1.25rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={16} color="#0284c7" />
                        <span><strong>{exam.durationMinutes}</strong> mins</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Award size={16} color="#10b981" />
                        <span>Pass: <strong>{exam.passingMarks}</strong> / {exam.totalMarks}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <BookOpen size={16} color="#8b5cf6" />
                        <span><strong>{exam.questionCount || 0}</strong> Questions</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {isBlocked ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: '#fef2f2',
                        color: '#b91c1c',
                        padding: '0.65rem 1rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem'
                      }}>
                        <AlertTriangle size={18} />
                        <span>Session Blocked (DFA: S6). Contact admin to unblock.</span>
                      </div>
                    ) : isCompleted ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleRetakeExam(exam._id)}
                          className="btn btn-primary"
                          style={{ flex: 1 }}
                        >
                          <RotateCcw size={16} />
                          <span>Retake Exam (MCQs)</span>
                        </button>
                        <Link
                          to={`/student/results/${exam._id}`}
                          className="btn btn-outline"
                        >
                          Scorecard
                        </Link>
                      </div>
                    ) : isInProgress ? (
                      <button
                        onClick={() => handleStartExam(exam)}
                        className="btn btn-secondary"
                        style={{ width: '100%' }}
                      >
                        <span>Resume Examination (Questions)</span>
                        <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartExam(exam)}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                      >
                        <span>Start Examination &bull; MCQs</span>
                        <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Submissions & Results */}
      {completedExams.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            Completed Submissions & Scorecards
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
            Accepting DFA Final States: S4 (MANUAL_SUBMIT) &bull; S5 (AUTO_SUBMITTED)
          </p>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Exam Title</th>
                  <th>Submission Mode</th>
                  <th>DFA State</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {completedExams.map((exam) => {
                  const s = exam.session;
                  return (
                    <tr key={exam._id}>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{exam.title}</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: s.submissionType === 'MANUAL' ? '#10b981' : '#8b5cf6' }}>
                          {s.submissionType === 'MANUAL' ? 'Manual Submit' : 'Auto-Submit (Timer)'}
                        </span>
                      </td>
                      <td>
                        <DFAStateBadge state={s.currentState} />
                      </td>
                      <td>
                        <strong>{s.score}</strong> / {s.totalMarks}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{s.percentage}%</span>
                      </td>
                      <td>
                        {s.isPassed ? (
                          <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle2 size={16} /> PASSED
                          </span>
                        ) : (
                          <span style={{ color: '#dc2626', fontWeight: 700 }}>
                            FAILED
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <Link to={`/student/results/${exam._id}`} className="btn btn-outline btn-sm">
                            View Results
                          </Link>
                          <button
                            onClick={() => handleRetakeExam(exam._id)}
                            className="btn btn-primary btn-sm"
                            title="Retake multiple choice questions"
                          >
                            <RotateCcw size={14} />
                            <span>Retake</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
