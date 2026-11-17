import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { PlusCircle, Trash2, ArrowLeft, Save, AlertCircle, CheckCircle } from 'lucide-react';

export const ExamEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Computer Science');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [passingMarks, setPassingMarks] = useState(6);
  const [questions, setQuestions] = useState([
    {
      questionText: '',
      options: ['', '', '', ''],
      correctOption: 0,
      marks: 2,
      explanation: ''
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      const fetchExam = async () => {
        setLoading(true);
        try {
          const res = await api.getExamById(id);
          const e = res.data;
          setTitle(e.title || '');
          setDescription(e.description || '');
          setCategory(e.category || 'Computer Science');
          setDurationMinutes(e.durationMinutes || 15);
          setPassingMarks(e.passingMarks || 5);
          if (e.questions && e.questions.length > 0) {
            setQuestions(e.questions);
          }
        } catch (err) {
          setError(err.message || 'Failed to load exam for editing');
        } finally {
          setLoading(false);
        }
      };
      fetchExam();
    }
  }, [id, isEditing]);

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        questionText: '',
        options: ['', '', '', ''],
        correctOption: 0,
        marks: 2,
        explanation: ''
      }
    ]);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length === 1) {
      return alert('An examination must have at least one question.');
    }
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index, field, value) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    setQuestions(prev => {
      const updated = [...prev];
      const newOpts = [...updated[qIndex].options];
      newOpts[optIndex] = value;
      updated[qIndex] = { ...updated[qIndex], options: newOpts };
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Form Validation
    if (!title.trim()) {
      return setError('Exam title is required.');
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        return setError(`Question #${i + 1} is missing its question text.`);
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          return setError(`Question #${i + 1}, Option ${String.fromCharCode(65 + j)} cannot be empty.`);
        }
      }
    }

    setLoading(true);

    try {
      const payload = {
        title,
        description,
        category,
        durationMinutes: Number(durationMinutes),
        passingMarks: Number(passingMarks),
        questions
      };

      if (isEditing) {
        await api.updateExam(id, payload);
      } else {
        await api.createExam(payload);
      }

      navigate('/admin/exams');
    } catch (err) {
      setError(err.message || 'Failed to save examination.');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link to="/admin/exams" className="btn btn-outline btn-sm">
          <ArrowLeft size={16} />
          <span>Back to Examinations</span>
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
          {isEditing ? 'Edit Examination' : 'Create New Examination'}
        </h1>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Basic Exam Meta Card */}
        <div className="card">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>
            Examination Overview
          </h2>

          <div className="form-group">
            <label className="form-label">Exam Title</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Automata Theory & Compiler Design"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Computer Science"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Duration (Minutes)</label>
              <input
                type="number"
                min="1"
                required
                className="form-input"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Passing Marks</label>
              <input
                type="number"
                min="1"
                required
                className="form-input"
                value={passingMarks}
                onChange={(e) => setPassingMarks(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Description / Instructions</label>
            <textarea
              rows={3}
              className="form-textarea"
              placeholder="Brief description of the assessment scope and syllabus..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Dynamic Questions Builder */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              Questions Builder ({questions.length})
            </h2>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="btn btn-secondary btn-sm"
            >
              <PlusCircle size={16} />
              <span>Add Question</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {questions.map((q, qIdx) => (
              <div key={qIdx} className="card" style={{ borderLeft: '4px solid #2563eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 700, color: '#1e40af' }}>
                    Question #{qIdx + 1}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Marks:</label>
                      <input
                        type="number"
                        min="1"
                        style={{ width: '60px', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        value={q.marks || 1}
                        onChange={(e) => handleQuestionChange(qIdx, 'marks', Number(e.target.value))}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="btn btn-outline btn-sm"
                      style={{ color: '#ef4444', borderColor: '#fecaca', padding: '0.25rem 0.5rem' }}
                      title="Remove question"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Question Statement */}
                <div className="form-group">
                  <label className="form-label">Question Text</label>
                  <textarea
                    rows={2}
                    required
                    className="form-textarea"
                    placeholder="Enter the question statement..."
                    value={q.questionText}
                    onChange={(e) => handleQuestionChange(qIdx, 'questionText', e.target.value)}
                  />
                </div>

                {/* 4 Multiple Choice Options */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Options & Correct Answer</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Select radio button for the correct choice</span>
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {q.options.map((optText, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isCorrect = q.correctOption === optIdx;

                      return (
                        <div
                          key={optIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            background: isCorrect ? '#ecfdf5' : '#ffffff',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '6px',
                            border: isCorrect ? '1px solid #a7f3d0' : '1px solid #e2e8f0'
                          }}
                        >
                          <input
                            type="radio"
                            name={`correct-opt-${qIdx}`}
                            checked={isCorrect}
                            onChange={() => handleQuestionChange(qIdx, 'correctOption', optIdx)}
                            title="Mark as correct answer"
                            style={{ accentColor: '#10b981', cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                          <span style={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>
                            {letter}.
                          </span>
                          <input
                            type="text"
                            required
                            className="form-input"
                            style={{ padding: '0.4rem 0.65rem', fontSize: '0.875rem' }}
                            placeholder={`Option ${letter}`}
                            value={optText}
                            onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Academic Explanation (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Explanation shown to student after exam completion..."
                    value={q.explanation || ''}
                    onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Submission */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <Link to="/admin/exams" className="btn btn-outline">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn btn-primary btn-lg">
            <Save size={18} />
            <span>{loading ? 'Saving Examination...' : isEditing ? 'Update Examination' : 'Publish Examination'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExamEditor;
