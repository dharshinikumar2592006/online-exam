const Exam = require('../models/Exam');
const ExamSession = require('../models/ExamSession');

// @desc Get all exams (with session status for authenticated user)
// @route GET /api/exams
exports.getAllExams = async (req, res) => {
  try {
    const filter = req.user && req.user.role === 'admin' ? {} : { isActive: true };
    const exams = await Exam.find(filter).sort({ createdAt: -1 });

    // If student, attach their session state for each exam
    let examsWithStatus = exams.map(exam => exam.toObject());

    if (req.user && req.user.role === 'student') {
      const studentSessions = await ExamSession.find({
        studentId: req.user._id,
        examId: { $in: exams.map(e => e._id) }
      });

      const sessionMap = new Map();
      studentSessions.forEach(s => sessionMap.set(s.examId.toString(), s));

      examsWithStatus = examsWithStatus.map(exam => {
        const session = sessionMap.get(exam._id.toString());
        // For students browsing, don't expose question answers in exam list
        const questionCount = exam.questions ? exam.questions.length : 0;
        const sanitizedExam = {
          ...exam,
          questionCount,
          questions: undefined // hide question payloads in list
        };

        if (session) {
          sanitizedExam.session = {
            id: session._id,
            currentState: session.currentState,
            submissionType: session.submissionType,
            score: session.score,
            totalMarks: session.totalMarks,
            percentage: session.percentage,
            isPassed: session.isPassed,
            startedAt: session.startedAt,
            submittedAt: session.submittedAt,
            isBlocked: session.isBlocked
          };
        } else {
          sanitizedExam.session = null;
        }

        return sanitizedExam;
      });
    }

    return res.json({
      success: true,
      count: examsWithStatus.length,
      data: examsWithStatus
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Failed to fetch exams: ${err.message}`
    });
  }
};

// @desc Get single exam by ID
// @route GET /api/exams/:id
exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }

    let responseData = exam.toObject();

    // Check if student has an existing session
    let session = null;
    if (req.user) {
      session = await ExamSession.findOne({
        examId: exam._id,
        studentId: req.user._id
      });
    }

    // Hide answers if student and exam has not been submitted
    if (req.user && req.user.role === 'student') {
      const isComplete = session && (session.currentState === 'SUBMITTED' || session.currentState === 'AUTO_SUBMITTED');
      if (!isComplete) {
        responseData.questions = responseData.questions.map(q => ({
          _id: q._id,
          questionText: q.questionText,
          options: q.options,
          marks: q.marks
        }));
      }
    }

    return res.json({
      success: true,
      data: responseData,
      session
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Failed to fetch exam: ${err.message}`
    });
  }
};

// @desc Create a new exam
// @route POST /api/exams
exports.createExam = async (req, res) => {
  try {
    const { title, description, category, durationMinutes, passingMarks, questions, instructions, isActive } = req.body;

    if (!title || !durationMinutes || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide exam title, duration in minutes, and at least one question'
      });
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || !q.options || q.options.length < 2 || q.correctOption === undefined) {
        return res.status(400).json({
          success: false,
          error: `Question ${i + 1} is invalid. It must contain questionText, at least 2 options, and a valid correctOption index.`
        });
      }
    }

    const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);

    const exam = await Exam.create({
      title,
      description: description || '',
      category: category || 'General',
      durationMinutes: Number(durationMinutes),
      passingMarks: Number(passingMarks) || Math.ceil(totalMarks * 0.4),
      totalMarks,
      questions,
      instructions: instructions || undefined,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id
    });

    return res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: exam
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Failed to create exam: ${err.message}`
    });
  }
};

// @desc Update existing exam
// @route PUT /api/exams/:id
exports.updateExam = async (req, res) => {
  try {
    let exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }

    const updates = { ...req.body };
    if (updates.questions && Array.isArray(updates.questions)) {
      updates.totalMarks = updates.questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
    }

    exam = await Exam.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    return res.json({
      success: true,
      message: 'Exam updated successfully',
      data: exam
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Failed to update exam: ${err.message}`
    });
  }
};

// @desc Delete an exam
// @route DELETE /api/exams/:id
exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }

    // Delete associated sessions as well
    await ExamSession.deleteMany({ examId: exam._id });
    await Exam.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: 'Exam and all associated sessions deleted successfully'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Failed to delete exam: ${err.message}`
    });
  }
};
