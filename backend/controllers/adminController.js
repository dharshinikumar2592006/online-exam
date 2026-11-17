const User = require('../models/User');
const Exam = require('../models/Exam');
const ExamSession = require('../models/ExamSession');
const dfaEngine = require('../dfa/engine');
const { DFA_STATES, DFA_SYMBOLS, DFA_STATE_INFO } = require('../dfa/states');

// Helper to evaluate exam score for admin view
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

  return { score, totalMarks, percentage, isPassed, questionResults };
};

// @desc Dashboard Overview & DFA State Counts
// @route GET /api/admin/overview
exports.getOverviewStats = async (req, res) => {
  try {
    const [totalExams, totalStudents, totalSubmissions, sessions] = await Promise.all([
      Exam.countDocuments(),
      User.countDocuments({ role: 'student' }),
      ExamSession.countDocuments({ currentState: { $in: [DFA_STATES.S4, DFA_STATES.S5] } }),
      ExamSession.find().select('currentState studentId examId createdAt')
    ]);

    // Count sessions per DFA state
    const dfaStateDistribution = {
      [DFA_STATES.S0]: 0,
      [DFA_STATES.S1]: 0,
      [DFA_STATES.S2]: 0,
      [DFA_STATES.S3]: 0,
      [DFA_STATES.S4]: 0,
      [DFA_STATES.S5]: 0,
      [DFA_STATES.S6]: 0
    };

    sessions.forEach(s => {
      if (dfaStateDistribution[s.currentState] !== undefined) {
        dfaStateDistribution[s.currentState]++;
      }
    });

    // Recent submissions
    const recentSubmissions = await ExamSession.find({
      currentState: { $in: [DFA_STATES.S4, DFA_STATES.S5, DFA_STATES.S6] }
    })
      .populate('studentId', 'name email')
      .populate('examId', 'title totalMarks passingMarks')
      .sort({ updatedAt: -1 })
      .limit(6);

    return res.json({
      success: true,
      stats: {
        totalExams,
        totalStudents,
        totalSubmissions,
        activeInExam: dfaStateDistribution[DFA_STATES.S3],
        blockedCount: dfaStateDistribution[DFA_STATES.S6],
        dfaStateDistribution
      },
      dfaStatesInfo: DFA_STATE_INFO,
      recentSubmissions
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// @desc List all students with current status
// @route GET /api/admin/students
exports.getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).sort({ createdAt: -1 });

    // Fetch active session or latest state for each student
    const studentData = await Promise.all(
      students.map(async (student) => {
        const sessions = await ExamSession.find({ studentId: student._id })
          .populate('examId', 'title')
          .sort({ createdAt: -1 });

        return {
          id: student._id,
          name: student.name,
          email: student.email,
          role: student.role,
          isBlocked: student.isBlocked,
          globalState: student.currentGlobalDfaState || DFA_STATES.S1,
          createdAt: student.createdAt,
          totalAttempts: sessions.length,
          sessions: sessions.map(s => ({
            id: s._id,
            examId: s.examId?._id,
            examTitle: s.examId?.title || 'Unknown Exam',
            currentState: s.currentState,
            score: s.score,
            totalMarks: s.totalMarks,
            percentage: s.percentage,
            isPassed: s.isPassed,
            submissionType: s.submissionType,
            tabSwitchCount: s.tabSwitchCount,
            isBlocked: s.isBlocked
          }))
        };
      })
    );

    return res.json({
      success: true,
      count: studentData.length,
      data: studentData
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// @desc Admin blocks student (Triggers DFA S6)
// @route POST /api/admin/students/:studentId/block
exports.blockStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { reason } = req.body;

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    student.isBlocked = true;
    student.currentGlobalDfaState = DFA_STATES.S6;
    await student.save();

    // Also update any active sessions for this student to S6
    const activeSessions = await ExamSession.find({
      studentId: student._id,
      currentState: { $in: [DFA_STATES.S1, DFA_STATES.S2, DFA_STATES.S3] }
    });

    for (const session of activeSessions) {
      try {
        await dfaEngine.executeTransition(session, DFA_SYMBOLS.ADMIN_BLOCK, {
          adminId: req.user._id,
          reason: reason || 'Blocked by administrator'
        });
      } catch (e) {
        // Fallback force state if transition table doesn't map directly
        session.currentState = DFA_STATES.S6;
        session.isBlocked = true;
        await session.save();
      }
    }

    return res.json({
      success: true,
      message: `Student ${student.name} has been blocked (DFA State: S6 BLOCKED)`,
      dfaState: DFA_STATES.S6
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// @desc Admin unblocks student (DFA: S6 -> S1)
// @route POST /api/admin/students/:studentId/unblock
exports.unblockStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    student.isBlocked = false;
    student.currentGlobalDfaState = DFA_STATES.S1;
    await student.save();

    // If student had a blocked session, execute S6 -> S1 transition or clear block
    const blockedSessions = await ExamSession.find({
      studentId: student._id,
      currentState: DFA_STATES.S6
    });

    for (const session of blockedSessions) {
      try {
        await dfaEngine.executeTransition(session, DFA_SYMBOLS.ADMIN_UNBLOCK, {
          adminId: req.user._id,
          reason: 'Access restored by administrator'
        });
      } catch (e) {
        session.currentState = DFA_STATES.S1;
        session.isBlocked = false;
        await session.save();
      }
    }

    return res.json({
      success: true,
      message: `Student ${student.name} has been unblocked (DFA State: S6 -> S1 AUTHENTICATED)`,
      dfaState: DFA_STATES.S1
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// @desc Admin reset exam attempt
// @route POST /api/admin/sessions/:sessionId/reset
exports.resetSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ExamSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    await ExamSession.findByIdAndDelete(sessionId);

    return res.json({
      success: true,
      message: 'Exam session successfully reset. Student can now re-attempt.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// @desc View all student submissions and results
// @route GET /api/admin/submissions
exports.getAllSubmissions = async (req, res) => {
  try {
    const { examId, studentId, state } = req.query;
    const query = {};

    if (examId) query.examId = examId;
    if (studentId) query.studentId = studentId;
    if (state) query.currentState = state;

    const submissions = await ExamSession.find(query)
      .populate('studentId', 'name email')
      .populate('examId', 'title durationMinutes passingMarks totalMarks')
      .sort({ updatedAt: -1 });

    return res.json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// @desc View detailed submission report with DFA audit log
// @route GET /api/admin/submissions/:sessionId
exports.getSubmissionDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ExamSession.findById(sessionId)
      .populate('studentId', 'name email role isBlocked')
      .populate('examId');

    if (!session) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    const evalResult = calculateScore(session.examId, session.answers);

    return res.json({
      success: true,
      data: {
        session,
        scoreCalculation: evalResult,
        dfaStateInfo: DFA_STATE_INFO[session.currentState],
        dfaAuditTrail: session.dfaHistory,
        violationLogs: session.violationLogs
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
