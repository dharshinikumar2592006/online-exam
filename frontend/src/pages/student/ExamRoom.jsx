import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { DFAStateBadge } from '../../components/DFAStateBadge';
import { Clock, AlertTriangle, CheckCircle, Flag, ChevronLeft, ChevronRight, X, ShieldAlert, Maximize2 } from 'lucide-react';

export const ExamRoom = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [qIndex]: { selectedOption, isMarkedForReview } }
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [tabViolations, setTabViolations] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  const timerRef = useRef(null);

  // Initialize session or resume
  useEffect(() => {
    const initExam = async () => {
      setLoading(true);
      try {
        // Start or resume exam (S2 -> S3 or verify S3)
        const res = await api.startExam(examId);

        setQuestions(res.questions || []);
        setTimeRemaining(res.timeRemainingSeconds || 0);

        // Prepopulate existing answers if resuming
        const answerMap = {};
        if (res.answers && Array.isArray(res.answers)) {
          res.answers.forEach(a => {
            answerMap[a.questionIndex] = {
              selectedOption: a.selectedOption,
              isMarkedForReview: a.isMarkedForReview
            };
          });
        }
        setAnswers(answerMap);
      } catch (err) {
        if (err.data?.currentState === 'SUBMITTED' || err.data?.currentState === 'AUTO_SUBMITTED') {
          return navigate(`/student/results/${examId}`, { replace: true });
        }
        if (err.data?.currentState === 'BLOCKED') {
          setIsBlocked(true);
        }
        setError(err.message || 'Failed to initialize exam session');
      } finally {
        setLoading(false);
      }
    };

    initExam();
  }, [examId, navigate]);

  // Handle Automatic Submission on Timeout (S3 -> S5)
  const handleAutoSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);

    try {
      await api.autoSubmit(examId);
      navigate(`/student/results/${examId}`, { replace: true });
    } catch (err) {
      alert(`Auto-submission completed. Redirecting to results...`);
      navigate(`/student/results/${examId}`, { replace: true });
    }
  }, [examId, navigate, submitting]);

  // Countdown Timer
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || isBlocked) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeRemaining, isBlocked, handleAutoSubmit]);

  // Anti-Cheating & Tab Switching Detector
  useEffect(() => {
    if (isBlocked || loading) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        try {
          const res = await api.reportViolation(examId, {
            reason: 'Tab switched / Browser minimized',
            details: `Focus lost at ${new Date().toLocaleTimeString()}`
          });

          setTabViolations(res.tabSwitchCount);
          if (res.isBlocked) {
            setIsBlocked(true);
            clearInterval(timerRef.current);
          } else {
            setWarningMessage(res.warning);
            // Hide toast after 6 seconds
            setTimeout(() => setWarningMessage(''), 6000);
          }
        } catch (e) {
          // ignore network glitch
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [examId, isBlocked, loading]);

  // Save current answer to backend (S3 -> S3 self-loop)
  const saveAnswerToServer = async (qIdx, selectedOpt, marked) => {
    try {
      await api.saveAnswer(examId, {
        questionIndex: qIdx,
        selectedOption: selectedOpt,
        isMarkedForReview: marked
      });
    } catch (err) {
      if (err.data?.currentState === 'AUTO_SUBMITTED') {
        navigate(`/student/results/${examId}`);
      }
    }
  };

  const handleSelectOption = (optIndex) => {
    const current = answers[currentIndex] || {};
    const updated = {
      ...current,
      selectedOption: optIndex
    };

    setAnswers(prev => ({ ...prev, [currentIndex]: updated }));
    saveAnswerToServer(currentIndex, optIndex, current.isMarkedForReview);
  };

  const handleClearOption = () => {
    const current = answers[currentIndex] || {};
    const updated = {
      ...current,
      selectedOption: null
    };

    setAnswers(prev => ({ ...prev, [currentIndex]: updated }));
    saveAnswerToServer(currentIndex, null, current.isMarkedForReview);
  };

  const handleToggleMarkForReview = () => {
    const current = answers[currentIndex] || {};
    const updated = {
      ...current,
      isMarkedForReview: !current.isMarkedForReview
    };

    setAnswers(prev => ({ ...prev, [currentIndex]: updated }));
    saveAnswerToServer(currentIndex, current.selectedOption, updated.isMarkedForReview);
  };

  // Manual Submission (S3 -> S4)
  const handleManualSubmit = async () => {
    setSubmitting(true);
    clearInterval(timerRef.current);
    try {
      await api.manualSubmit(examId);
      navigate(`/student/results/${examId}`, { replace: true });
    } catch (err) {
      alert(`Submission error: ${err.message}`);
      setSubmitting(false);
    }
  };

  // Format time remaining
  const formatTime = (seconds) => {
    if (seconds === null || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Palette stats
  const totalQuestions = questions.length;
  const answeredCount = Object.values(answers).filter(a => a.selectedOption !== null && a.selectedOption !== undefined).length;
  const markedCount = Object.values(answers).filter(a => a.isMarkedForReview).length;
  const unansweredCount = totalQuestions - answeredCount;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
        Loading examination room & synchronizing DFA timer...
      </div>
    );
  }

  // S6 BLOCKED State Screen
  if (isBlocked) {
    return (
      <div className="card" style={{ maxWidth: '640px', margin: '3rem auto', textAlign: 'center', padding: '2.5rem', borderTop: '6px solid #ef4444' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#fef2f2',
          color: '#ef4444',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem'
        }}>
          <ShieldAlert size={36} />
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#991b1b', marginBottom: '0.5rem' }}>
          Examination Session Blocked
        </h1>
        <div style={{ marginBottom: '1rem' }}>
          <DFAStateBadge state="BLOCKED" />
        </div>
        <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          The backend Deterministic Finite Automaton transitioned your session to <strong>S6 (BLOCKED)</strong> due to excessive tab switching infractions or security policy violations.
        </p>
        <p style={{ fontSize: '0.875rem', color: '#64748b', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
          Only an authorized administrator can unblock your account and restore your session (DFA: S6 &rarr; S1).
        </p>
        <button onClick={() => navigate('/student')} className="btn btn-primary">
          Return to Portal
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex] || {};
  const currentAnswer = answers[currentIndex] || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Status Bar: Timer, DFA State, Progress */}
      <div className="card" style={{
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        borderLeft: '4px solid #eab308'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <DFAStateBadge state="EXAM_IN_PROGRESS" />
          <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 600 }}>
            Question {currentIndex + 1} of {totalQuestions}
          </span>
        </div>

        {/* Live Countdown Timer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: timeRemaining < 120 ? '#fee2e2' : timeRemaining < 300 ? '#fef3c7' : '#eff6ff',
          color: timeRemaining < 120 ? '#b91c1c' : timeRemaining < 300 ? '#b45309' : '#1e40af',
          padding: '0.4rem 0.85rem',
          borderRadius: '8px',
          fontWeight: 700,
          fontSize: '1.1rem',
          letterSpacing: '0.025em',
          border: '1px solid currentColor'
        }}>
          <Clock size={18} />
          <span>{formatTime(timeRemaining)}</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>remaining</span>
        </div>

        {/* Anti-Cheating Violation Counter & Submit Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {tabViolations > 0 && (
            <span style={{
              fontSize: '0.75rem',
              color: '#b91c1c',
              background: '#fef2f2',
              padding: '0.3rem 0.6rem',
              borderRadius: '6px',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <AlertTriangle size={14} />
              <span>Strikes: {tabViolations}/3</span>
            </span>
          )}

          <button
            onClick={() => setShowSubmitModal(true)}
            className="btn btn-success btn-sm"
          >
            Submit Examination (S3 &rarr; S4)
          </button>
        </div>
      </div>

      {/* Warning banner on tab switch strike */}
      {warningMessage && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          color: '#92400e',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertTriangle size={18} />
          <span>{warningMessage}</span>
        </div>
      )}

      {/* Main Examination Layout: Question Area + Palette Sidebar */}
      <div className="exam-layout">
        {/* Left Column: Active Question */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e40af' }}>
                Question #{currentIndex + 1}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b', background: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                {currentQ.marks || 1} Marks
              </span>
            </div>

            {/* Question Text */}
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              {currentQ.questionText}
            </h2>

            {/* Multiple Choice Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {currentQ.options?.map((optionText, optIdx) => {
                const isSelected = currentAnswer.selectedOption === optIdx;
                const letter = String.fromCharCode(65 + optIdx); // A, B, C, D

                return (
                  <div
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`option-item ${isSelected ? 'selected' : ''}`}
                  >
                    <span style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: isSelected ? '#2563eb' : '#f1f5f9',
                      color: isSelected ? '#ffffff' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      flexShrink: 0
                    }}>
                      {letter}
                    </span>

                    <span style={{ fontSize: '0.925rem', color: '#1e293b', flex: 1 }}>
                      {optionText}
                    </span>

                    <input
                      type="radio"
                      name={`question-${currentIndex}`}
                      checked={isSelected}
                      onChange={() => handleSelectOption(optIdx)}
                      className="option-radio"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question Action Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '2rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid #f1f5f9',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleToggleMarkForReview}
                className={`btn btn-sm ${currentAnswer.isMarkedForReview ? 'btn-secondary' : 'btn-outline'}`}
                style={{
                  background: currentAnswer.isMarkedForReview ? '#ede9fe' : undefined,
                  color: currentAnswer.isMarkedForReview ? '#6d28d9' : undefined,
                  borderColor: currentAnswer.isMarkedForReview ? '#ddd6fe' : undefined
                }}
              >
                <Flag size={15} />
                <span>{currentAnswer.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
              </button>

              {currentAnswer.selectedOption !== null && currentAnswer.selectedOption !== undefined && (
                <button
                  onClick={handleClearOption}
                  className="btn btn-outline btn-sm"
                  title="Clear selected option"
                >
                  <X size={15} />
                  <span>Clear Choice</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="btn btn-outline btn-sm"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <button
                onClick={() => setCurrentIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                disabled={currentIndex === totalQuestions - 1}
                className="btn btn-primary btn-sm"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Question Palette & Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
              Question Palette
            </h3>

            {/* Status Legend */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              fontSize: '0.75rem',
              color: '#475569',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981', display: 'inline-block' }} />
                <span>Answered ({answeredCount})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#8b5cf6', display: 'inline-block' }} />
                <span>Review ({markedCount})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f1f5f9', border: '1px solid #cbd5e1', display: 'inline-block' }} />
                <span>Unanswered ({unansweredCount})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', border: '2px solid #2563eb', display: 'inline-block' }} />
                <span>Current</span>
              </div>
            </div>

            {/* Grid of Palette Buttons */}
            <div className="question-palette-grid">
              {questions.map((_, idx) => {
                const ans = answers[idx];
                const isAnswered = ans?.selectedOption !== null && ans?.selectedOption !== undefined;
                const isMarked = ans?.isMarkedForReview;
                const isCurrent = idx === currentIndex;

                let btnClass = 'unanswered';
                if (isMarked) {
                  btnClass = 'marked';
                } else if (isAnswered) {
                  btnClass = 'answered';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`palette-btn ${btnClass} ${isCurrent ? 'current' : ''}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
              <button
                onClick={() => setShowSubmitModal(true)}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                Submit Examination
              </button>
            </div>
          </div>

          {/* Automaton Integrity Card */}
          <div className="card" style={{ background: '#f8fafc', padding: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
            <div style={{ fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
              Automaton Guard Active
            </div>
            <div>&bull; Every answer persists via self-loop: &delta;(S3, SAVE_ANSWER) = S3</div>
            <div>&bull; Countdown expiry triggers auto-transition: &delta;(S3, TIME_EXPIRED) = S5</div>
            <div>&bull; Tab switch strikes lead to trap: &delta;(S3, VIOLATION) = S6</div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Manual Submission (S3 -> S4) */}
      {showSubmitModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              Confirm Examination Submission
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Trigger DFA State Transition: <code style={{ color: '#059669', fontWeight: 700 }}>S3 (EXAM_IN_PROGRESS) &rarr; S4 (SUBMITTED)</code>
            </p>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              textAlign: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem'
            }}>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>{answeredCount}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Answered</div>
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#8b5cf6' }}>{markedCount}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Marked for Review</div>
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#64748b' }}>{unansweredCount}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Unanswered</div>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Are you sure you wish to submit? Once submitted, the session enters an accepting final state and no further answer changes will be permitted.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="btn btn-outline"
              >
                Back to Exam
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={submitting}
                className="btn btn-success"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit Examination'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamRoom;
