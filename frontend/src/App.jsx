import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingSpinner } from './components/UI';
import { NativeAppInit } from './lib/native';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import CustomerDashboard from './pages/CustomerDashboard';
import ServiceRequestPage from './pages/ServiceRequestPage';
import TrackingPage from './pages/TrackingPage';
import RequestsPage from './pages/RequestsPage';
import VehiclesPage from './pages/VehiclesPage';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <RoleRedirect /> : <LandingPage />} />
      <Route path="/login" element={user ? <RoleRedirect /> : <LoginPage />} />

      <Route path="/dashboard" element={<ProtectedRoute roles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/vehicles" element={<ProtectedRoute roles={['customer']}><VehiclesPage /></ProtectedRoute>} />
      <Route path="/requests" element={<ProtectedRoute roles={['customer']}><RequestsPage /></ProtectedRoute>} />
      <Route path="/request/:slug" element={<ProtectedRoute roles={['customer']}><ServiceRequestPage /></ProtectedRoute>} />
      <Route path="/track/:id" element={<ProtectedRoute><TrackingPage /></ProtectedRoute>} />

      <Route path="/volunteer" element={<ProtectedRoute roles={['volunteer']}><VolunteerDashboard /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RoleRedirect() {
  const { user } = useAuth();
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'volunteer') return <Navigate to="/volunteer" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <NativeAppInit />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
