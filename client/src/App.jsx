import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import PostTask from './pages/PostTask';
import MyTasks from './pages/MyTasks';
import TasksFeed from './pages/TasksFeed';
import TaskDetail from './pages/TaskDetail';
import TaskApplications from './pages/TaskApplications';
import RecommendedTasks from './pages/RecommendedTasks';
import MyApplications from './pages/MyApplications';
import SkillTests from './pages/SkillTests';
import TakeTest from './pages/TakeTest';
import Profile from './pages/Profile';
import SearchPage from './pages/SearchPage';
import TaskWorkspace from './pages/TaskWorkspace';
import DisputeDetail from './pages/DisputeDetail';
import MyDisputes from './pages/MyDisputes';
import AdminDashboard from './pages/AdminDashboard';
import PosterDashboard from './pages/dashboards/PosterDashboard';
import FreelancerDashboard from './pages/dashboards/FreelancerDashboard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="app-container">
            <Navbar />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/tasks" element={<TasksFeed />} />
              <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/skill-tests" element={<SkillTests />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/skill-tests/:id"
              element={
                <ProtectedRoute>
                  <TakeTest />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-tasks"
              element={
                <ProtectedRoute>
                  <MyTasks />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tasks/:taskId/applications"
              element={
                <ProtectedRoute>
                  <TaskApplications />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tasks/:taskId/workspace"
              element={
                <ProtectedRoute>
                  <TaskWorkspace />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-disputes"
              element={
                <ProtectedRoute>
                  <MyDisputes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/disputes/:id"
              element={
                <ProtectedRoute>
                  <DisputeDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/recommended"
              element={
                <ProtectedRoute allowedRoles={['freelancer']}>
                  <RecommendedTasks />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-applications"
              element={
                <ProtectedRoute allowedRoles={['freelancer']}>
                  <MyApplications />
                </ProtectedRoute>
              }
            />

            <Route
              path="/post-task"
              element={
                <ProtectedRoute allowedRoles={['client', 'admin']}>
                  <PostTask />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/poster"
              element={
                <ProtectedRoute allowedRoles={['client', 'admin']}>
                  <PosterDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/freelancer"
              element={
                <ProtectedRoute allowedRoles={['freelancer', 'admin']}>
                  <FreelancerDashboard />
                </ProtectedRoute>
              }
            />

            {/* 404 Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
