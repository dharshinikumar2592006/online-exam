const mongoose = require('mongoose');
const { DFA_STATES } = require('../dfa/states');

const dfaTransitionSchema = new mongoose.Schema({
  fromState: {
    type: String,
    required: true
  },
  toState: {
    type: String,
    required: true
  },
  symbol: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const answerSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: true
  },
  selectedOption: {
    type: Number,
    default: null
  },
  isMarkedForReview: {
    type: Boolean,
    default: false
  },
  answeredAt: {
    type: Date,
    default: Date.now
  }
});

const violationLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  reason: {
    type: String,
    required: true
  },
  details: {
    type: String,
    default: ''
  }
});

const examSessionSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  currentState: {
    type: String,
    enum: Object.values(DFA_STATES),
    default: DFA_STATES.S1 // Starts in AUTHENTICATED when student creates the session
  },
  dfaHistory: [dfaTransitionSchema],
  answers: [answerSchema],
  startedAt: {
    type: Date,
    default: null
  },
  submittedAt: {
    type: Date,
    default: null
  },
  submissionType: {
    type: String,
    enum: ['MANUAL', 'AUTO', 'NONE'],
    default: 'NONE'
  },
  score: {
    type: Number,
    default: 0
  },
  totalMarks: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  isPassed: {
    type: Boolean,
    default: false
  },
  tabSwitchCount: {
    type: Number,
    default: 0
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  violationLogs: [violationLogSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Composite index to easily find a student's session for an exam
examSessionSchema.index({ examId: 1, studentId: 1 });

module.exports = mongoose.model('ExamSession', examSessionSchema);
