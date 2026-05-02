import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../modules/auth/AuthContext';
import { useAuth } from '../modules/auth/useAuth';
import LoginPage from '../modules/auth/LoginPage';
import StudentDashboard from '../modules/student/StudentDashboard';
import RequestForm from '../modules/student/RequestForm';
import CertificatePage from '../modules/student/CertificatePage';
import WardenDashboard from '../modules/warden/WardenDashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
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
  <div style={{ textAlign: 'center', marginTop: '50px' }}>
    <h2>Unauthorized Access</h2>
    <p>You do not have permission to view this page.</p>
  </div>
);

export default function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          
          <Route path="/student/*" element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <Routes>
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="requests/new" element={<RequestForm />} />
                <Route path="certificate/:id" element={<CertificatePage />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </ProtectedRoute>
          } />
          
          <Route path="/warden/*" element={
            <ProtectedRoute allowedRoles={['WARDEN', 'CHIEF_WARDEN']}>
              <Routes>
                <Route path="dashboard" element={<WardenDashboard />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CHIEF_WARDEN']}>
              <div>Admin Dashboard</div>
            </ProtectedRoute>
          } />
          
          <Route path="/gate/*" element={
            <ProtectedRoute allowedRoles={['SECURITY']}>
              <div>Gate Scanner App</div>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
