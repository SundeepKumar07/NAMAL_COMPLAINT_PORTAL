import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import PageLoader from './components/PageLoader';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import AdminComplaints from './pages/admin/AdminComplaints';
import AdminAssign from './pages/admin/AdminAssign';
import AdminReports from './pages/admin/AdminReports';

// Staff
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffComplaints from './pages/staff/StaffComplaints';
import StaffReport from './pages/staff/StaffReport';

// User
import UserDashboard from './pages/user/UserDashboard';
import SubmitComplaint from './pages/user/SubmitComplaint';
import UserComplaints from './pages/user/UserComplaints';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <PageLoader />
          <Routes>

            {/* ── Public (redirect to dashboard if already logged in) ── */}
            <Route
              path="/"
              element={
                <PublicOnlyRoute>
                  <HomePage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/login/admin"
              element={
                <PublicOnlyRoute>
                  <LoginPage
                    roleType="admin"
                    title="Administrator Login"
                    subtitle="Enter your credentials to access the admin portal"
                  />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/login/staff"
              element={
                <PublicOnlyRoute>
                  <LoginPage
                    roleType="maintenance_staff"
                    title="Maintenance Staff Login"
                    subtitle="Enter your credentials to access the staff portal"
                    identifierField={{
                      label: 'Staff ID',
                      placeholder: 'STAFF-ELEC-001',
                      hint: 'Format: STAFF-[Department]-[Number]',
                    }}
                  />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/login/user"
              element={
                <PublicOnlyRoute>
                  <LoginPage
                    roleType="end_user"
                    title="Student / Faculty / Staff Login"
                    subtitle="Enter your credentials to access the complaint portal"
                    identifierField={{
                      label: 'University ID',
                      placeholder: 'NUM-BSCS-2024-75',
                      hint: 'Format: NUM-[Program]-[Year]-[Number]',
                    }}
                  />
                </PublicOnlyRoute>
              }
            />

            {/* ── Admin (admin role only) ── */}
            <Route
              path="/admin/dashboard"
              element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>}
            />
            <Route
              path="/admin/users"
              element={<ProtectedRoute allowedRoles={['admin']}><AdminUserManagement /></ProtectedRoute>}
            />
            <Route
              path="/admin/complaints"
              element={<ProtectedRoute allowedRoles={['admin']}><AdminComplaints /></ProtectedRoute>}
            />
            <Route
              path="/admin/assign"
              element={<ProtectedRoute allowedRoles={['admin']}><AdminAssign /></ProtectedRoute>}
            />
            <Route
              path="/admin/reports"
              element={<ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>}
            />

            {/* ── Staff (maintenance_staff role only) ── */}
            <Route
              path="/staff/dashboard"
              element={<ProtectedRoute allowedRoles={['maintenance_staff']}><StaffDashboard /></ProtectedRoute>}
            />
            <Route
              path="/staff/complaints"
              element={<ProtectedRoute allowedRoles={['maintenance_staff']}><StaffComplaints /></ProtectedRoute>}
            />
            <Route
              path="/staff/report"
              element={<ProtectedRoute allowedRoles={['maintenance_staff']}><StaffReport /></ProtectedRoute>}
            />

            {/* ── User (end_user role only) ── */}
            <Route
              path="/user/dashboard"
              element={<ProtectedRoute allowedRoles={['end_user']}><UserDashboard /></ProtectedRoute>}
            />
            <Route
              path="/user/submit"
              element={<ProtectedRoute allowedRoles={['end_user']}><SubmitComplaint /></ProtectedRoute>}
            />
            <Route
              path="/user/complaints"
              element={<ProtectedRoute allowedRoles={['end_user']}><UserComplaints /></ProtectedRoute>}
            />

            {/* ── 404 → home ── */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
