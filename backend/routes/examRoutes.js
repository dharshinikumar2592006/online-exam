const express = require('express');
const router = express.Router();
const { getAllExams, getExamById, createExam, updateExam, deleteExam } = require('../controllers/examController');
const { protect } = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// Public/student list (with auth to customize status)
router.get('/', protect, getAllExams);
router.get('/:id', protect, getExamById);

// Admin operations
router.post('/', protect, adminOnly, createExam);
router.put('/:id', protect, adminOnly, updateExam);
router.delete('/:id', protect, adminOnly, deleteExam);

module.exports = router;
