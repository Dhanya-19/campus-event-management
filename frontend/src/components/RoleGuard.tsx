
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface RoleGuardProps {
  allowedRole: string;
}

export default function RoleGuard({
  allowedRole,
}: RoleGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role.toLowerCase() !== allowedRole.toLowerCase()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
