const Exam = require('../models/Exam');
const ExamSession = require('../models/ExamSession');
const dfaEngine = require('../dfa/engine');
const { DFA_STATES, DFA_SYMBOLS, DFA_STATE_INFO } = require('../dfa/states');

// Helper to evaluate exam score
const calculateScore = (exam, answers) => {
  let score = 0;
  const questionResults = [];

  const answerMap = new Map();
  if (answers && Array.isArray(answers)) {
    answers.forEach(a => answerMap.set(a.questionIndex, a.selectedOption));
  }

  exam.questions.forEach((q, idx) => {
    const studentChoice = answerMap.has(idx) ? answerMap.get(idx) : null;
    const isCorrect = studentChoice !== null && studentChoice === q.correctOption;
    const marksEarned = isCorrect ? (q.marks || 1) : 0;
    score += marksEarned;

    questionResults.push({
      questionIndex: idx,
      questionText: q.questionText,
      options: q.options,
      correctOption: q.correctOption,
      studentChoice,
      isCorrect,
      marks: q.marks || 1,
      marksEarned,
      explanation: q.explanation || ''
    });
  });

  const totalMarks = exam.totalMarks || exam.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
  const isPassed = score >= (exam.passingMarks || Math.ceil(totalMarks * 0.4));

  return {
    score,
    totalMarks,
    percentage,
    isPassed,
    questionResults
  };
};

// @desc Step 1: Student requests exam access (S1 -> S2)
// @route POST /api/dfa/access/:examId
exports.requestExamAccess = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user._id;

    const exam = await Exam.findById(examId);
    if (!exam || !exam.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found or is currently inactive'
      });
    }

    if (req.user.isBlocked) {
      return res.status(403).json({
        success: false,
        error: 'Student is blocked from taking exams (DFA: S6 BLOCKED)',
        dfaState: DFA_STATES.S6
      });
    }

    // Check if an existing session already exists
    let session = await ExamSession.findOne({ examId, studentId });

    // Allow student to retake by passing retake parameter
    if (req.query.retake === 'true' || req.body.retake === true) {
      await ExamSession.deleteMany({ examId, studentId });
      session = null;
    }

    if (session) {
      // If already in accepting states, inform client
      if (session.currentState === DFA_STATES.S4 || session.currentState === DFA_STATES.S5) {
        return res.status(400).json({
          success: false,
          error: `Exam already submitted. Current state: ${session.currentState} (${DFA_STATE_INFO[session.currentState]?.label})`,
          code: 'EXAM_ALREADY_COMPLETED',
          currentState: session.currentState,
          canRetake: true
        });
      }

      if (session.currentState === DFA_STATES.S6) {
        return res.status(403).json({
          success: false,
          error: 'Exam session is blocked due to security violations. Contact an administrator to unblock.',
          code: 'SESSION_BLOCKED',
          currentState: session.currentState
        });
      }

      // If already in S2 or S3, return current state
      if (session.currentState === DFA_STATES.S2 || session.currentState === DFA_STATES.S3) {
        return res.json({
          success: true,
          message: `Active session retrieved in state ${session.currentState}`,
          currentState: session.currentState,
          session
        });
      }
    } else {
      // Create fresh session starting conceptually from S1
      session = new ExamSession({
        examId,
        studentId,
        currentState: DFA_STATES.S1,
        totalMarks: exam.totalMarks
      });
    }

    // Execute DFA transition: S1 -> S2
    await dfaEngine.executeTransition(session, DFA_SYMBOLS.REQUEST_EXAM_ACCESS, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      reason: 'Student initiated exam access request'
    });

    return res.json({
      success: true,
      message: 'Exam access granted. DFA transition: S1 (AUTHENTICATED) -> S2 (EXAM_ACCESS_GRANTED)',
      dfa: {
        previousState: DFA_STATES.S1,
        currentState: DFA_STATES.S2,
        event: DFA_SYMBOLS.REQUEST_EXAM_ACCESS,
        timestamp: new Date()
      },
      exam: {
        id: exam._id,
        title: exam.title,
        description: exam.description,
        durationMinutes: exam.durationMinutes,
        passingMarks: exam.passingMarks,
        totalMarks: exam.totalMarks,
        questionCount: exam.questions.length,
        instructions: exam.instructions
      },
      session
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
      code: err.code || 'DFA_ERROR'
    });
  }
};

// @desc Step 2: Student starts the exam (S2 -> S3)
// @route POST /api/dfa/start/:examId
exports.startExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user._id;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam not found' });
    }

    const session = await ExamSession.findOne({ examId, studentId });
    if (!session) {
      return res.status(400).json({
        success: false,
        error: 'No granted access session found. Must request exam access first (DFA state S1 -> S2 required).',
        code: 'ACCESS_NOT_REQUESTED',
        expectedState: DFA_STATES.S2
      });
    }

    // If already in S3, allow resuming exam with current remaining time
    if (session.currentState === DFA_STATES.S3) {
      const elapsedMs = Date.now() - new Date(session.startedAt).getTime();
      const totalAllowedMs = exam.durationMinutes * 60 * 1000;
      const remainingSeconds = Math.max(0, Math.floor((totalAllowedMs - elapsedMs) / 1000));

      if (remainingSeconds <= 0) {
        // Auto-submit if time expired while away
        await dfaEngine.executeTransition(session, DFA_SYMBOLS.TIME_EXPIRED, {
          reason: 'Time expired while disconnected'
        });
        const evalResult = calculateScore(exam, session.answers);
        session.score = evalResult.score;
        session.percentage = evalResult.percentage;
        session.isPassed = evalResult.isPassed;
        await session.save();

        return res.status(400).json({
          success: false,
          error: 'Exam timer has already expired. Exam auto-submitted (DFA: S3 -> S5).',
          code: 'TIME_EXPIRED',
          currentState: DFA_STATES.S5
        });
      }

      // Return sanitized questions
      const sanitizedQuestions = exam.questions.map((q, idx) => ({
        index: idx,
        questionText: q.questionText,
        options: q.options,
        marks: q.marks || 1
      }));

      return res.json({
        success: true,
        message: 'Resuming active exam in progress (DFA State: S3)',
        currentState: DFA_STATES.S3,
        startedAt: session.startedAt,
        durationMinutes: exam.durationMinutes,
        timeRemainingSeconds: remainingSeconds,
        answers: session.answers,
        questions: sanitizedQuestions
      });
    }

    // DFA Transition: S2 -> S3
    await dfaEngine.executeTransition(session, DFA_SYMBOLS.START_EXAM, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      reason: 'Exam countdown timer started'
    });

    const timeRemainingSeconds = exam.durationMinutes * 60;

    const sanitizedQuestions = exam.questions.map((q, idx) => ({
      index: idx,
      questionText: q.questionText,
      options: q.options,
      marks: q.marks || 1
    }));

    return res.json({
      success: true,
      message: 'Exam officially started. DFA transition: S2 (EXAM_ACCESS_GRANTED) -> S3 (EXAM_IN_PROGRESS)',
      dfa: {
        previousState: DFA_STATES.S2,
        currentState: DFA_STATES.S3,
        event: DFA_SYMBOLS.START_EXAM,
        timestamp: new Date()
      },
      startedAt: session.startedAt,
      durationMinutes: exam.durationMinutes,
      timeRemainingSeconds,
      answers: session.answers,
      questions: sanitizedQuestions
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
      code: err.code || 'DFA_ERROR'
    });
  }
};

// @desc Step 3: Save answer during exam (S3 -> S3 self-loop)
// @route POST /api/dfa/answer/:examId
exports.saveAnswer = async (req, res) => {
  try {
    const { examId } = req.params;
    const { questionIndex, selectedOption, isMarkedForReview } = req.body;
    const studentId = req.user._id;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, error: 'Exam not found' });

    const session = await ExamSession.findOne({ examId, studentId });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Exam session not found' });
    }

    // Strict DFA check: must be in S3
    if (session.currentState !== DFA_STATES.S3) {
      return res.status(400).json({
        success: false,
        error: `DFA Violation: Cannot record answers in state '${session.currentState}'. Examination must be in state 'EXAM_IN_PROGRESS' (S3).`,
        code: 'INVALID_DFA_STATE',
        currentState: session.currentState
      });
    }

    // Check timer expiration
    const elapsedMs = Date.now() - new Date(session.startedAt).getTime();
    const totalAllowedMs = exam.durationMinutes * 60 * 1000;
    const timeRemainingSeconds = Math.max(0, Math.floor((totalAllowedMs - elapsedMs) / 1000));

    if (timeRemainingSeconds <= 0) {
      // Auto-submit immediately! S3 -> S5
      await dfaEngine.executeTransition(session, DFA_SYMBOLS.TIME_EXPIRED, {
        reason: 'Timer expired while attempting to save answer'
      });
      const evalResult = calculateScore(exam, session.answers);
      session.score = evalResult.score;
      session.percentage = evalResult.percentage;
      session.isPassed = evalResult.isPassed;
      await session.save();

      return res.status(400).json({
        success: false,
        error: 'Exam time expired! Answers auto-submitted (DFA: S3 -> S5).',
        code: 'TIME_EXPIRED',
        currentState: DFA_STATES.S5,
        session
      });
    }

    // Update or add answer in session
    const existingAnswerIdx = session.answers.findIndex(a => a.questionIndex === Number(questionIndex));
    if (existingAnswerIdx > -1) {
      session.answers[existingAnswerIdx].selectedOption = selectedOption;
      if (isMarkedForReview !== undefined) {
        session.answers[existingAnswerIdx].isMarkedForReview = isMarkedForReview;
      }
      session.answers[existingAnswerIdx].answeredAt = new Date();
    } else {
      session.answers.push({
        questionIndex: Number(questionIndex),
        selectedOption,
        isMarkedForReview: Boolean(isMarkedForReview),
        answeredAt: new Date()
      });
    }

    // Execute DFA transition: S3 -> S3 (self-loop)
    await dfaEngine.executeTransition(session, DFA_SYMBOLS.SAVE_ANSWER, {
      questionIndex,
      selectedOption,
      timeRemainingSeconds
    });

    return res.json({
      success: true,
      message: 'Answer saved (DFA self-loop: S3 -> S3)',
      currentState: DFA_STATES.S3,
      timeRemainingSeconds,
      answers: session.answers
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
      code: err.code || 'DFA_ERROR'
    });
  }
};

// @desc Step 4A: Manual Submission (S3 -> S4)
// @route POST /api/dfa/submit/:examId
exports.manualSubmit = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user._id;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, error: 'Exam not found' });

    const session = await ExamSession.findOne({ examId, studentId });
    if (!session) return res.status(404).json({ success: false, error: 'Exam session not found' });

    // Validate state
    if (session.currentState !== DFA_STATES.S3) {
      return res.status(400).json({
        success: false,
        error: `DFA Violation: Cannot manually submit exam from state '${session.currentState}'. Must be in 'EXAM_IN_PROGRESS' (S3).`,
        code: 'INVALID_DFA_STATE',
        currentState: session.currentState
      });
    }

    // Compute score
    const evalResult = calculateScore(exam, session.answers);
    session.score = evalResult.score;
    session.totalMarks = evalResult.totalMarks;
    session.percentage = evalResult.percentage;
    session.isPassed = evalResult.isPassed;

    // DFA Transition: S3 -> S4
    await dfaEngine.executeTransition(session, DFA_SYMBOLS.MANUAL_SUBMIT, {
      ip: req.ip,
      reason: 'Student triggered manual submission button',
      score: evalResult.score,
      percentage: evalResult.percentage,
      isPassed: evalResult.isPassed
    });

    return res.json({
      success: true,
      message: 'Exam successfully submitted manually. DFA transition: S3 (EXAM_IN_PROGRESS) -> S4 (SUBMITTED)',
      dfa: {
        previousState: DFA_STATES.S3,
        currentState: DFA_STATES.S4,
        event: DFA_SYMBOLS.MANUAL_SUBMIT,
        timestamp: session.submittedAt
      },
      results: {
        score: evalResult.score,
        totalMarks: evalResult.totalMarks,
        percentage: evalResult.percentage,
        isPassed: evalResult.isPassed,
        submissionType: 'MANUAL',
        submittedAt: session.submittedAt
      }
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
      code: err.code || 'DFA_ERROR'
    });
  }
};

// @desc Step 4B: Auto Submission on Timer Expiry (S3 -> S5)
// @route POST /api/dfa/auto-submit/:examId
exports.autoSubmit = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user._id;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, error: 'Exam not found' });

    const session = await ExamSession.findOne({ examId, studentId });
    if (!session) return res.status(404).json({ success: false, error: 'Exam session not found' });

    // Validate state
    if (session.currentState !== DFA_STATES.S3) {
      return res.status(400).json({
        success: false,
        error: `DFA Violation: Cannot auto-submit exam from state '${session.currentState}'. Must be in 'EXAM_IN_PROGRESS' (S3).`,
        code: 'INVALID_DFA_STATE',
        currentState: session.currentState
      });
    }

    // Compute score
    const evalResult = calculateScore(exam, session.answers);
    session.score = evalResult.score;
    session.totalMarks = evalResult.totalMarks;
    session.percentage = evalResult.percentage;
    session.isPassed = evalResult.isPassed;

    // DFA Transition: S3 -> S5
    await dfaEngine.executeTransition(session, DFA_SYMBOLS.TIME_EXPIRED, {
      ip: req.ip,
      reason: 'Countdown timer elapsed to 00:00',
      score: evalResult.score,
      percentage: evalResult.percentage,
      isPassed: evalResult.isPassed
    });

    return res.json({
      success: true,
      message: 'Exam auto-submitted upon timer expiration. DFA transition: S3 (EXAM_IN_PROGRESS) -> S5 (AUTO_SUBMITTED)',
      dfa: {
        previousState: DFA_STATES.S3,
        currentState: DFA_STATES.S5,
        event: DFA_SYMBOLS.TIME_EXPIRED,
        timestamp: session.submittedAt
      },
      results: {
        score: evalResult.score,
        totalMarks: evalResult.totalMarks,
        percentage: evalResult.percentage,
        isPassed: evalResult.isPassed,
        submissionType: 'AUTO',
        submittedAt: session.submittedAt
      }
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
      code: err.code || 'DFA_ERROR'
    });
  }
};

// @desc Step 5: Report security violation (e.g. Tab Switch) (S3 -> S6 or increment strike)
// @route POST /api/dfa/violation/:examId
exports.reportViolation = async (req, res) => {
  try {
    const { examId } = req.params;
    const { reason, details } = req.body;
    const studentId = req.user._id;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, error: 'Exam not found' });

    const session = await ExamSession.findOne({ examId, studentId });
    if (!session) return res.status(404).json({ success: false, error: 'Exam session not found' });

    // Violations are monitored during active exam states S2 or S3
    if (session.currentState !== DFA_STATES.S2 && session.currentState !== DFA_STATES.S3) {
      return res.status(400).json({
        success: false,
        error: `Cannot register violation in state '${session.currentState}'`,
        currentState: session.currentState
      });
    }

    session.tabSwitchCount = (session.tabSwitchCount || 0) + 1;
    const maxAllowed = exam.maxTabViolations || 3;

    session.violationLogs.push({
      timestamp: new Date(),
      reason: reason || 'Tab switch / Window focus lost',
      details: details || `Violation count: ${session.tabSwitchCount} / ${maxAllowed}`
    });

    let transitionOccurred = false;

    // Check if threshold exceeded -> Trigger S6 (BLOCKED)
    if (session.tabSwitchCount >= maxAllowed) {
      await dfaEngine.executeTransition(session, DFA_SYMBOLS.VIOLATION_DETECTED, {
        reason: `Exceeded maximum permissible tab switch violations (${session.tabSwitchCount}/${maxAllowed})`,
        details
      });
      transitionOccurred = true;
    } else {
      await session.save();
    }

    return res.json({
      success: true,
      warning: session.tabSwitchCount >= maxAllowed
        ? 'DFA State Transition: S3 -> S6 (BLOCKED). Exam locked due to security violations.'
        : `Security warning: Tab switch detected (${session.tabSwitchCount}/${maxAllowed}). ${maxAllowed - session.tabSwitchCount} attempts remaining before account lockdown.`,
      currentState: session.currentState,
      tabSwitchCount: session.tabSwitchCount,
      maxAllowed,
      isBlocked: session.currentState === DFA_STATES.S6,
      transitionOccurred
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
      code: err.code || 'DFA_ERROR'
    });
  }
};

// @desc View current session details & timer
// @route GET /api/dfa/session/:examId
exports.getSession = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user._id;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, error: 'Exam not found' });

    const session = await ExamSession.findOne({ examId, studentId });
    if (!session) {
      return res.json({
        success: true,
        session: null,
        currentState: DFA_STATES.S1
      });
    }

    let timeRemainingSeconds = null;
    if (session.currentState === DFA_STATES.S3 && session.startedAt) {
      const elapsedMs = Date.now() - new Date(session.startedAt).getTime();
      const totalAllowedMs = exam.durationMinutes * 60 * 1000;
      timeRemainingSeconds = Math.max(0, Math.floor((totalAllowedMs - elapsedMs) / 1000));

      // Auto-submit if expired while inspecting
      if (timeRemainingSeconds <= 0) {
        await dfaEngine.executeTransition(session, DFA_SYMBOLS.TIME_EXPIRED, {
          reason: 'Exam timer expired'
        });
        const evalResult = calculateScore(exam, session.answers);
        session.score = evalResult.score;
        session.percentage = evalResult.percentage;
        session.isPassed = evalResult.isPassed;
        await session.save();
      }
    }

    return res.json({
      success: true,
      session,
      currentState: session.currentState,
      dfaStateInfo: DFA_STATE_INFO[session.currentState],
      timeRemainingSeconds
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// @desc Step 6: View final results & DFA audit trail (allowed only in S4, S5, S6)
// @route GET /api/dfa/result/:examId
exports.getExamResult = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user._id;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, error: 'Exam not found' });

    const session = await ExamSession.findOne({ examId, studentId });
    if (!session) return res.status(404).json({ success: false, error: 'Exam session not found' });

    // Check DFA accepting states
    const terminalStates = [DFA_STATES.S4, DFA_STATES.S5, DFA_STATES.S6];
    if (!terminalStates.includes(session.currentState)) {
      return res.status(400).json({
        success: false,
        error: `DFA Violation: Results are inaccessible in state '${session.currentState}'. Examination must be completed (S4 SUBMITTED or S5 AUTO_SUBMITTED).`,
        code: 'EXAM_NOT_COMPLETED',
        currentState: session.currentState
      });
    }

    const evalResult = calculateScore(exam, session.answers);

    return res.json({
      success: true,
      exam: {
        id: exam._id,
        title: exam.title,
        durationMinutes: exam.durationMinutes,
        passingMarks: exam.passingMarks,
        totalMarks: exam.totalMarks
      },
      results: {
        score: session.score || evalResult.score,
        totalMarks: session.totalMarks || evalResult.totalMarks,
        percentage: session.percentage || evalResult.percentage,
        isPassed: session.isPassed !== undefined ? session.isPassed : evalResult.isPassed,
        submissionType: session.submissionType,
        startedAt: session.startedAt,
        submittedAt: session.submittedAt,
        tabSwitchCount: session.tabSwitchCount,
        isBlocked: session.isBlocked,
        currentState: session.currentState,
        dfaStateInfo: DFA_STATE_INFO[session.currentState]
      },
      questionBreakdown: evalResult.questionResults,
      dfaAuditTrail: session.dfaHistory,
      violationLogs: session.violationLogs
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// @desc Retake exam: reset attempt and grant fresh access (DFA: S1 -> S2)
// @route POST /api/dfa/retake/:examId
exports.retakeExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user._id;

    const exam = await Exam.findById(examId);
    if (!exam || !exam.isActive) {
      return res.status(404).json({ success: false, error: 'Exam not found or inactive' });
    }

    if (req.user.isBlocked) {
      return res.status(403).json({ success: false, error: 'Student is blocked (S6)', dfaState: DFA_STATES.S6 });
    }

    // Delete existing sessions for this student and exam
    await ExamSession.deleteMany({ examId, studentId });

    // Create fresh session in S1
    const session = new ExamSession({
      examId,
      studentId,
      currentState: DFA_STATES.S1,
      totalMarks: exam.totalMarks
    });

    // DFA Transition S1 -> S2
    await dfaEngine.executeTransition(session, DFA_SYMBOLS.REQUEST_EXAM_ACCESS, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      reason: 'Student initiated fresh exam retake'
    });

    return res.json({
      success: true,
      message: 'Exam session reset. DFA: S1 (AUTHENTICATED) -> S2 (EXAM_ACCESS_GRANTED)',
      dfa: {
        previousState: DFA_STATES.S1,
        currentState: DFA_STATES.S2,
        event: DFA_SYMBOLS.REQUEST_EXAM_ACCESS,
        timestamp: new Date()
      },
      exam: {
        id: exam._id,
        title: exam.title,
        description: exam.description,
        durationMinutes: exam.durationMinutes,
        passingMarks: exam.passingMarks,
        totalMarks: exam.totalMarks,
        questionCount: exam.questions.length,
        instructions: exam.instructions
      },
      session
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message, code: err.code || 'DFA_ERROR' });
  }
};
