const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  options: {
    type: [String],
    validate: [val => val.length >= 2, 'Question must have at least 2 options'],
    required: true
  },
  correctOption: {
    type: Number,
    required: [true, 'Correct option index is required (0-based)'],
    min: 0
  },
  marks: {
    type: Number,
    default: 1,
    min: 1
  },
  explanation: {
    type: String,
    default: ''
  }
});

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Exam title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'General'
  },
  durationMinutes: {
    type: Number,
    required: [true, 'Exam duration in minutes is required'],
    min: 1,
    default: 15
  },
  passingMarks: {
    type: Number,
    required: [true, 'Passing marks are required'],
    default: 5
  },
  totalMarks: {
    type: Number,
    default: 10
  },
  questions: [questionSchema],
  instructions: {
    type: [String],
    default: [
      'Ensure you have a stable internet connection.',
      'Do not switch browser tabs or minimize the window during the exam.',
      'Three consecutive tab-switches will trigger DFA state S6 (BLOCKED).',
      'The examination will auto-submit when the countdown reaches 00:00 (DFA state S5).',
      'You can review and change your answers before final manual submission.'
    ]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxTabViolations: {
    type: Number,
    default: 3
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate total marks before saving if not explicitly set
examSchema.pre('save', function (next) {
  if (this.questions && this.questions.length > 0) {
    this.totalMarks = this.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  }
  next();
});

module.exports = mongoose.model('Exam', examSchema);
