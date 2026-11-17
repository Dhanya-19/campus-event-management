
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import RoleGuard from "./components/RoleGuard";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import EventDetailsPage from "./pages/EventDetailsPage";

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role.toLowerCase() === "admin") {
    return <Navigate to="/admin-dashboard" replace />;
  }

  return <Navigate to="/student-dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Redirect based on role */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        
        {/* Student routes */}
        <Route element={<RoleGuard allowedRole="student" />}>
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/events/:id" element={<EventDetailsPage />} />
        </Route>

        {/* Admin routes */}
        <Route element={<RoleGuard allowedRole="admin" />}>
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Route>

      </Route>

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
