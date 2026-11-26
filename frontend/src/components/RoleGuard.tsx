import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface RoleGuardProps {
  allowedRoles: string[];
}

export default function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const normalizedRole = user.role.toLowerCase();
  const allowed = allowedRoles.map((r) => r.toLowerCase());

  if (!allowed.includes(normalizedRole)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
