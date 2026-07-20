import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

const Layout             = lazy(() => import('./pages/Layout'));
const Login              = lazy(() => import('./pages/Login'));
const Register           = lazy(() => import('./pages/Register'));
const Dashboard          = lazy(() => import('./pages/Dashboard'));
const Students           = lazy(() => import('./pages/Students'));
const AddStudent         = lazy(() => import('./pages/AddStudent'));
const EditStudent        = lazy(() => import('./pages/EditStudent'));
const TakeAttendance     = lazy(() => import('./pages/TakeAttendance'));
const Profile            = lazy(() => import('./pages/Profile'));
const ManageFaculty      = lazy(() => import('./pages/faculty/ManageFaculty'));
const AddFaculty         = lazy(() => import('./pages/faculty/AddFaculty'));
const ManageSubjects     = lazy(() => import('./pages/faculty/ManageSubjects'));
const FacultyAssignments = lazy(() => import('./pages/faculty/FacultyAssignments'));

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = localStorage.getItem('auth')
  if (!auth) {
    return <Navigate to="/fras/login" replace />
  }
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter basename="/fras">
      <Suspense fallback={<Layout />}>
        <Routes>
          <Route path="/" element={ <Layout /> }>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="students-section"
              element={
                <ProtectedRoute>
                  <Students />
                </ProtectedRoute>
              }
            />
            <Route
              path="add-student"
              element={
                <ProtectedRoute>
                  <AddStudent />
                </ProtectedRoute>
              }
            />
            <Route
              path="edit-student"
              element={
                <ProtectedRoute>
                  <EditStudent />
                </ProtectedRoute>
              }
            />
            <Route
              path="take-attendance"
              element={
                <ProtectedRoute>
                  <TakeAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="manage-faculty"
              element={
                <ProtectedRoute>
                  <ManageFaculty />
                </ProtectedRoute>
              }
            />
            <Route
              path="add-faculty"
              element={
                <ProtectedRoute>
                  <AddFaculty />
                </ProtectedRoute>
              }
            />
            <Route
              path="manage-subjects"
              element={
                <ProtectedRoute>
                  <ManageSubjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="faculty-assignments"
              element={
                <ProtectedRoute>
                  <FacultyAssignments />
                </ProtectedRoute>
              }
            />
            
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
