/**
 * Frontend API Service Layer
 * Online Examination System with Deterministic Finite Automata
 */

const BASE_URL = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || 'Network request failed');
    error.status = res.status;
    error.code = data.code;
    error.dfaState = data.dfaState;
    error.data = data;
    throw error;
  }
  return data;
};

export const api = {
  // Auth
  login: async (credentials) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return handleResponse(res);
  },

  register: async (userData) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return handleResponse(res);
  },

  logout: async () => {
    const res = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  getMe: async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Exams
  getExams: async () => {
    const res = await fetch(`${BASE_URL}/exams`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  getExamById: async (id) => {
    const res = await fetch(`${BASE_URL}/exams/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  createExam: async (examData) => {
    const res = await fetch(`${BASE_URL}/exams`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(examData)
    });
    return handleResponse(res);
  },

  updateExam: async (id, examData) => {
    const res = await fetch(`${BASE_URL}/exams/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(examData)
    });
    return handleResponse(res);
  },

  deleteExam: async (id) => {
    const res = await fetch(`${BASE_URL}/exams/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // DFA State Transitions
  requestExamAccess: async (examId, retake = false) => {
    const res = await fetch(`${BASE_URL}/dfa/access/${examId}${retake ? '?retake=true' : ''}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  retakeExam: async (examId) => {
    const res = await fetch(`${BASE_URL}/dfa/retake/${examId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  startExam: async (examId) => {
    const res = await fetch(`${BASE_URL}/dfa/start/${examId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  getSession: async (examId) => {
    const res = await fetch(`${BASE_URL}/dfa/session/${examId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  saveAnswer: async (examId, answerData) => {
    const res = await fetch(`${BASE_URL}/dfa/answer/${examId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(answerData)
    });
    return handleResponse(res);
  },

  manualSubmit: async (examId) => {
    const res = await fetch(`${BASE_URL}/dfa/submit/${examId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  autoSubmit: async (examId) => {
    const res = await fetch(`${BASE_URL}/dfa/auto-submit/${examId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  reportViolation: async (examId, violationData) => {
    const res = await fetch(`${BASE_URL}/dfa/violation/${examId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(violationData)
    });
    return handleResponse(res);
  },

  getExamResult: async (examId) => {
    const res = await fetch(`${BASE_URL}/dfa/result/${examId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // DFA Specification
  getDfaSpec: async () => {
    const res = await fetch(`${BASE_URL}/dfa/spec`);
    return handleResponse(res);
  },

  // Admin
  getAdminOverview: async () => {
    const res = await fetch(`${BASE_URL}/admin/overview`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  getStudents: async () => {
    const res = await fetch(`${BASE_URL}/admin/students`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  blockStudent: async (studentId, reason) => {
    const res = await fetch(`${BASE_URL}/admin/students/${studentId}/block`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    return handleResponse(res);
  },

  unblockStudent: async (studentId) => {
    const res = await fetch(`${BASE_URL}/admin/students/${studentId}/unblock`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  resetSession: async (sessionId) => {
    const res = await fetch(`${BASE_URL}/admin/sessions/${sessionId}/reset`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  getSubmissions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/admin/submissions${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  getSubmissionDetails: async (sessionId) => {
    const res = await fetch(`${BASE_URL}/admin/submissions/${sessionId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  }
};
