import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ExamInstructions } from './pages/student/ExamInstructions';
import { ExamRoom } from './pages/student/ExamRoom';
import { ExamResult } from './pages/student/ExamResult';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ExamManager } from './pages/admin/ExamManager';
import { ExamEditor } from './pages/admin/ExamEditor';
import { StudentManager } from './pages/admin/StudentManager';
import { SubmissionsManager } from './pages/admin/SubmissionsManager';
import { DFAMonitor } from './pages/admin/DFAMonitor';

export const App = () => {
  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student Protected Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/instructions/:examId"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ExamInstructions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exam/:examId"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ExamRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/results/:examId"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ExamResult />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exams"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ExamManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exams/new"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ExamEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exams/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ExamEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <StudentManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/submissions"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SubmissionsManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dfa"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DFAMonitor />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
};

export default App;
