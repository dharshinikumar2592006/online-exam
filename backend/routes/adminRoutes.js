const express = require('express');
const router = express.Router();
const {
  getOverviewStats,
  getStudents,
  blockStudent,
  unblockStudent,
  resetSession,
  getAllSubmissions,
  getSubmissionDetails
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// All admin routes require protect + adminOnly
router.use(protect, adminOnly);

router.get('/overview', getOverviewStats);
router.get('/students', getStudents);
router.post('/students/:studentId/block', blockStudent);
router.post('/students/:studentId/unblock', unblockStudent);
router.post('/sessions/:sessionId/reset', resetSession);
router.get('/submissions', getAllSubmissions);
router.get('/submissions/:sessionId', getSubmissionDetails);

module.exports = router;
