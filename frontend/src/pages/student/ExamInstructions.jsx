import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { DFAStateBadge } from '../../components/DFAStateBadge';
import { DFAVisualGraph } from '../../components/DFAVisualGraph';
import { Shield, Clock, AlertTriangle, CheckCircle, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';

export const ExamInstructions = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const initAccess = async () => {
      setLoading(true);
      setError('');
      try {
        // Trigger DFA transition S1 -> S2 (EXAM_ACCESS_GRANTED)
        let accessRes;
        try {
          accessRes = await api.requestExamAccess(examId);
        } catch (initialErr) {
          // If already completed previously, automatically reset attempt so student can retake questions
          if (initialErr.data?.code === 'EXAM_ALREADY_COMPLETED' || initialErr.data?.canRetake) {
            accessRes = await api.retakeExam(examId);
          } else {
            throw initialErr;
          }
        }
        setExam(accessRes.exam);
        setSession(accessRes.session);
      } catch (err) {
        if (err.data?.currentState === 'EXAM_IN_PROGRESS') {
          // If already in progress, navigate straight to the exam room
          return navigate(`/student/exam/${examId}`, { replace: true });
        }
        setError(err.message || 'Failed to request exam access');
      } finally {
        setLoading(false);
      }
    };

    initAccess();
  }, [examId, navigate]);

  const handleStartExam = async () => {
    if (!agreed) return;
    setStarting(true);
    try {
      // Transition S2 -> S3 (START_EXAM)
      await api.startExam(examId);
      navigate(`/student/exam/${examId}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to start examination');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
        Verifying prerequisites and granting exam access (DFA S1 &rarr; S2)...
      </div>
    );
  }

  if (error && !exam) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center', padding: '2rem' }}>
        <AlertCircle size={44} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem' }}>
          Exam Access Denied
        </h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={() => navigate('/student')} className="btn btn-primary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header card with state badge */}
      <div className="card" style={{ borderTop: '4px solid #0891b2' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#0891b2', letterSpacing: '0.05em' }}>
              Examination Verification Phase
            </span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
              {exam?.title}
            </h1>
          </div>
          <DFAStateBadge state="EXAM_ACCESS_GRANTED" />
        </div>

        <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6 }}>
          {exam?.description}
        </p>

        {/* Quick parameters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          background: '#f8fafc',
          padding: '1rem',
          borderRadius: '8px',
          marginTop: '1.25rem',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>DURATION</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{exam?.durationMinutes} mins</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>TOTAL QUESTIONS</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{exam?.questionCount} MCQs</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>PASSING SCORE</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{exam?.passingMarks} / {exam?.totalMarks}</div>
          </div>
        </div>
      </div>

      {/* DFA Visualizer in S2 */}
      <DFAVisualGraph currentState="EXAM_ACCESS_GRANTED" compact={true} />

      {/* Examination Rules & Anti-Cheating Protocol */}
      <div className="card">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={20} color="#2563eb" />
          <span>Rules and Automaton Constraints</span>
        </h2>

        <ul style={{ paddingLeft: '1.25rem', color: '#334155', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          <li><strong>Finite Automaton State S3 (EXAM_IN_PROGRESS):</strong> Starting this test transitions your backend state to S3 and initializes the server-synchronized timer.</li>
          <li><strong>Anti-Tampering & Tab-Switching Trap (S6 BLOCKED):</strong> Switching browser tabs, minimizing the browser window, or losing window focus is strictly tracked. Exceeding 3 violations transitions the state to <strong>S6 (BLOCKED)</strong>, locking you out of the exam.</li>
          <li><strong>Timeout Auto-Submission (S5 AUTO_SUBMITTED):</strong> When the timer expires, the backend automatically transitions to <strong>S5</strong> and evaluates all recorded answers.</li>
          <li><strong>Manual Submission (S4 SUBMITTED):</strong> You may manually submit at any time while in state S3. All answers will be graded immediately.</li>
          <li><strong>Navigation:</strong> You can navigate between questions freely, change your selected choices, and mark questions for review before submission.</li>
        </ul>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            marginBottom: '1.25rem'
          }}>
            {error}
          </div>
        )}

        {/* Agreement Checkbox */}
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '1rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          <input
            type="checkbox"
            id="agree-rules"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ width: '1.25rem', height: '1.25rem', marginTop: '0.15rem', accentColor: '#2563eb', cursor: 'pointer' }}
          />
          <label htmlFor="agree-rules" style={{ fontSize: '0.9rem', color: '#1e3a8a', cursor: 'pointer', lineHeight: 1.4 }}>
            <strong>I acknowledge and agree:</strong> I will maintain window focus, follow academic integrity standards, and understand that DFA state transitions are strictly validated by the server.
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button onClick={() => navigate('/student')} className="btn btn-outline">
            Cancel & Return
          </button>
          <button
            onClick={handleStartExam}
            disabled={!agreed || starting}
            className="btn btn-primary btn-lg"
          >
            <span>{starting ? 'Commencing Test...' : 'Commence Examination (DFA: S2 -> S3)'}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamInstructions;
