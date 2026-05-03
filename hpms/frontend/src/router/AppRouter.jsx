import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../modules/auth/AuthContext';
import { useAuth } from '../modules/auth/useAuth';
import NavBar from '../shared/NavBar';
import LoginPage from '../modules/auth/LoginPage';
import StudentDashboard from '../modules/student/StudentDashboard';
import RequestForm from '../modules/student/RequestForm';
import CertificatePage from '../modules/student/CertificatePage';
import WardenDashboard from '../modules/warden/WardenDashboard';
import GateScannerPage from '../modules/gate/GateScannerPage';
import SecurityDashboard from '../modules/gate/SecurityDashboard';
import AdminDashboard from '../modules/admin/AdminDashboard';
import ManageWardens from '../modules/admin/ManageWardens';
import ManageStudents from '../modules/admin/ManageStudents';
import ReportsPage from '../modules/admin/ReportsPage';
import StudentProfilePage from '../modules/profile/StudentProfilePage';
import WardenProfilePage from '../modules/profile/WardenProfilePage';
import { ThemeProvider } from '../shared/ThemeContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <span className="loading loading-bars loading-lg text-blue-600"></span>
        <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">Checking authorization...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

const UnauthorizedPage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-6 text-center">
    <div className="text-6xl mb-4">🚫</div>
    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Unauthorized Access</h2>
    <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-md">You do not have permission to view this page. If you believe this is an error, please contact the administrator.</p>
    <button onClick={() => window.history.back()} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium">Go Back</button>
  </div>
);

export default function AppRouter() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <NavBar />
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            <Route path="/certificate/:id" element={
              <ProtectedRoute allowedRoles={['STUDENT', 'WARDEN', 'CHIEF_WARDEN', 'ADMIN', 'SECURITY']}>
                <CertificatePage />
              </ProtectedRoute>
            } />
            
            <Route path="/student/*" element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <Routes>
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="profile" element={<StudentProfilePage />} />
                  <Route path="requests/new" element={<RequestForm />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </ProtectedRoute>
            } />
            
            <Route path="/warden/*" element={
              <ProtectedRoute allowedRoles={['WARDEN', 'CHIEF_WARDEN']}>
                <Routes>
                  <Route path="dashboard" element={<WardenDashboard />} />
                  <Route path="profile" element={<WardenProfilePage />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'CHIEF_WARDEN']}>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="wardens" element={<ManageWardens />} />
                  <Route path="students" element={<ManageStudents />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </ProtectedRoute>
            } />
            
            <Route path="/gate/*" element={
              <ProtectedRoute allowedRoles={['SECURITY', 'ADMIN', 'CHIEF_WARDEN']}>
                <Routes>
                  <Route path="scan" element={<GateScannerPage />} />
                  <Route path="dashboard" element={<SecurityDashboard />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
