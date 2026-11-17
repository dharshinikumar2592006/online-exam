import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { DFAStateBadge } from '../../components/DFAStateBadge';
import { DFAVisualGraph } from '../../components/DFAVisualGraph';
import { Award, CheckCircle2, XCircle, Clock, ArrowLeft, History, BookOpen, AlertTriangle } from 'lucide-react';

export const ExamResult = () => {
  const { examId } = useParams();
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await api.getExamResult(examId);
        setResultData(res);
      } catch (err) {
        setError(err.message || 'Failed to fetch examination results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [examId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
        Retrieving examination evaluation & DFA audit trail...
      </div>
    );
  }

  if (error || !resultData) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center', padding: '2rem' }}>
        <AlertTriangle size={44} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem' }}>
          Unable to Load Results
        </h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{error}</p>
        <Link to="/student" className="btn btn-primary">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { exam, results, questionBreakdown, dfaAuditTrail } = resultData;
  const isPassed = results.isPassed;

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Navigation */}
      <div>
        <Link to="/student" className="btn btn-outline btn-sm">
          <ArrowLeft size={16} />
          <span>Back to My Examinations</span>
        </Link>
      </div>

      {/* Main Scorecard Banner */}
      <div className="card" style={{
        background: isPassed
          ? 'linear-gradient(135deg, #065f46 0%, #059669 50%, #10b981 100%)'
          : 'linear-gradient(135deg, #991b1b 0%, #dc2626 50%, #ef4444 100%)',
        color: '#ffffff',
        padding: '2.5rem',
        borderRadius: '20px',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Award size={28} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
                Official Examination Scorecard
              </span>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>
                {exam?.title}
              </h1>
            </div>
          </div>

          <DFAStateBadge state={results?.currentState} />
        </div>

        {/* Big Score Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          background: 'rgba(0, 0, 0, 0.15)',
          padding: '1.25rem',
          borderRadius: '12px',
          backdropFilter: 'blur(4px)',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: 600 }}>SCORE EARNED</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{results?.score} <span style={{ fontSize: '1rem', opacity: 0.8 }}>/ {results?.totalMarks}</span></div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: 600 }}>PERCENTAGE</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{results?.percentage}%</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: 600 }}>STATUS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.4rem' }}>
              {isPassed ? 'PASSED' : 'FAILED'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: 600 }}>SUBMISSION TYPE</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.6rem' }}>
              {results?.submissionType === 'MANUAL' ? 'Manual (S4)' : 'Auto-Timer (S5)'}
            </div>
          </div>
        </div>
      </div>

      {/* DFA Visual Graph in Terminal State */}
      <DFAVisualGraph currentState={results?.currentState} compact={true} />

      {/* DFA State Transition Audit Trail (Chronological Log) */}
      <div className="card">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={20} color="#2563eb" />
          <span>Finite Automata Transition Audit Trail</span>
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
          Timestamped chronological log of every validated DFA transition verified by the backend engine:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {dfaAuditTrail?.map((trans, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#2563eb',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {idx + 1}
                </span>

                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>
                    <code style={{ color: '#1e40af' }}>{trans.fromState}</code>
                    <span style={{ margin: '0 0.5rem', color: '#64748b' }}>&rarr;</span>
                    <code style={{ color: '#059669', fontWeight: 700 }}>{trans.toState}</code>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Symbol: <strong>{trans.symbol}</strong> {trans.metadata?.reason ? `\u2022 ${trans.metadata.reason}` : ''}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                {new Date(trans.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Question Review Breakdown */}
      <div className="card">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={20} color="#2563eb" />
          <span>Question-by-Question Academic Review</span>
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
          Review your chosen answers against correct options with theoretical explanations:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {questionBreakdown?.map((q, idx) => {
            const isCorrect = q.isCorrect;
            return (
              <div
                key={idx}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  borderLeft: isCorrect ? '5px solid #10b981' : '5px solid #ef4444',
                  background: '#ffffff'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e40af' }}>
                    Question #{idx + 1}
                  </span>

                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px',
                    background: isCorrect ? '#ecfdf5' : '#fef2f2',
                    color: isCorrect ? '#065f46' : '#991b1b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}>
                    {isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    <span>{q.marksEarned} / {q.marks} Marks</span>
                  </span>
                </div>

                <p style={{ fontSize: '0.975rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem', lineHeight: 1.5 }}>
                  {q.questionText}
                </p>

                {/* Option list with indicator */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {q.options?.map((opt, optIdx) => {
                    const isStudentChoice = q.studentChoice === optIdx;
                    const isActualCorrect = q.correctOption === optIdx;
                    const letter = String.fromCharCode(65 + optIdx);

                    let bg = '#f8fafc';
                    let border = '#e2e8f0';
                    let tag = null;

                    if (isActualCorrect) {
                      bg = '#ecfdf5';
                      border = '#a7f3d0';
                      tag = <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.75rem' }}>[Correct Answer]</span>;
                    }
                    if (isStudentChoice && !isActualCorrect) {
                      bg = '#fef2f2';
                      border = '#fecaca';
                      tag = <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.75rem' }}>[Your Choice]</span>;
                    }

                    return (
                      <div
                        key={optIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '6px',
                          border: `1px solid ${border}`,
                          backgroundColor: bg,
                          fontSize: '0.875rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontWeight: 700, color: '#475569' }}>{letter}.</span>
                          <span>{opt}</span>
                        </div>
                        {tag}
                      </div>
                    );
                  })}
                </div>

                {/* Academic Explanation */}
                {q.explanation && (
                  <div style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '6px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.825rem',
                    color: '#1e3a8a',
                    lineHeight: 1.5
                  }}>
                    <strong>Academic Explanation: </strong>{q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExamResult;
