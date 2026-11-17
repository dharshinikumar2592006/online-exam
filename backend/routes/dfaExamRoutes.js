const express = require('express');
const router = express.Router();
const {
  requestExamAccess,
  startExam,
  saveAnswer,
  manualSubmit,
  autoSubmit,
  reportViolation,
  getSession,
  getExamResult
} = require('../controllers/dfaExamController');
const { protect } = require('../middleware/auth');

// All exam DFA transitions require authentication (user in S1 or beyond)
router.post('/access/:examId', protect, requestExamAccess);
router.post('/start/:examId', protect, startExam);
router.get('/session/:examId', protect, getSession);
router.post('/answer/:examId', protect, saveAnswer);
router.post('/submit/:examId', protect, manualSubmit);
router.post('/auto-submit/:examId', protect, autoSubmit);
router.post('/violation/:examId', protect, reportViolation);
router.get('/result/:examId', protect, getExamResult);

module.exports = router;
