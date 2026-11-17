import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { BookOpen, PlusCircle, Edit, Trash2, Clock, Award, CheckCircle, XCircle } from 'lucide-react';

export const ExamManager = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await api.getExams();
      setExams(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load examinations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete exam "${title}"? All student attempts will also be removed.`)) {
      return;
    }
    try {
      await api.deleteExam(id);
      fetchExams();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleToggleStatus = async (exam) => {
    try {
      await api.updateExam(exam._id, { isActive: !exam.isActive });
      fetchExams();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
            Manage Examinations
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.925rem' }}>
            Create, configure, publish and manage MCQ assessments
          </p>
        </div>

        <Link to="/admin/exams/new" className="btn btn-primary">
          <PlusCircle size={18} />
          <span>Create New Exam</span>
        </Link>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '1rem', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
          Loading examinations...
        </div>
      ) : exams.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <BookOpen size={48} style={{ opacity: 0.35, marginBottom: '0.75rem' }} />
          <h3>No Examinations Found</h3>
          <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>Get started by creating your first exam.</p>
          <Link to="/admin/exams/new" className="btn btn-primary">
            Create Exam Now
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title & Category</th>
                <th>Duration</th>
                <th>Questions</th>
                <th>Passing / Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam._id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{exam.title}</div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#f1f5f9', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                      {exam.category || 'General'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={15} color="#0284c7" />
                      <span>{exam.durationMinutes} mins</span>
                    </div>
                  </td>
                  <td>
                    <strong>{exam.questions?.length || 0}</strong> MCQs
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Award size={15} color="#10b981" />
                      <span>{exam.passingMarks} / {exam.totalMarks}</span>
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleStatus(exam)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0
                      }}
                      title="Click to toggle status"
                    >
                      {exam.isActive ? (
                        <span className="badge badge-s4" style={{ cursor: 'pointer' }}>Active</span>
                      ) : (
                        <span className="badge badge-s0" style={{ cursor: 'pointer' }}>Draft</span>
                      )}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link
                        to={`/admin/exams/edit/${exam._id}`}
                        className="btn btn-outline btn-sm"
                        title="Edit Exam"
                      >
                        <Edit size={14} />
                        <span>Edit</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(exam._id, exam.title)}
                        className="btn btn-outline btn-sm"
                        style={{ color: '#ef4444', borderColor: '#fecaca' }}
                        title="Delete Exam"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExamManager;
