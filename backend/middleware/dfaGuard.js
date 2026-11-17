const ExamSession = require('../models/ExamSession');
const { DFA_STATES, DFA_STATE_INFO } = require('../dfa/states');

/**
 * Middleware generator to enforce required DFA state(s) on exam operations
 * @param {Array<string>|string} allowedStates 
 */
const requireDfaState = (allowedStates) => {
  const states = Array.isArray(allowedStates) ? allowedStates : [allowedStates];

  return async (req, res, next) => {
    try {
      const examId = req.params.examId || req.body.examId;
      if (!examId) {
        return res.status(400).json({
          success: false,
          error: 'Exam ID is required for DFA state verification'
        });
      }

      const session = await ExamSession.findOne({
        examId,
        studentId: req.user._id
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'No active exam session found for this student and exam.',
          code: 'SESSION_NOT_FOUND',
          requiredStates: states
        });
      }

      if (!states.includes(session.currentState)) {
        return res.status(400).json({
          success: false,
          error: `DFA Guard Violation: Current session state is '${session.currentState}' (${DFA_STATE_INFO[session.currentState]?.id}), but one of [${states.join(', ')}] is required for this operation.`,
          code: 'INVALID_DFA_STATE',
          currentState: session.currentState,
          requiredStates: states,
          dfaStateInfo: DFA_STATE_INFO[session.currentState]
        });
      }

      req.examSession = session;
      next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: `DFA Verification Error: ${err.message}`
      });
    }
  };
};

module.exports = { requireDfaState };
