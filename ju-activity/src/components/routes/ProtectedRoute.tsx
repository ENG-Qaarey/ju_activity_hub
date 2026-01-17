import { ReactElement } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Loading } from "@/components/ui/loading";

interface ProtectedRouteProps {
  children: ReactElement;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isHydrated, authState } = useAuth();
  const location = useLocation();

  if (!isHydrated) {
    return <Loading fullScreen text="Restoring session..." />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is not loaded yet, show loading spinner
  if (!user) {
    return <Loading fullScreen text="Loading..." />;
  }

  // If allowedRoles is specified and user's role is not in the list, deny access
  // BUT: Admins should have access to everything, so we check if user is admin first
  if (allowedRoles && allowedRoles.length > 0) {
    // Admins have access to all routes
    if (user.role === "admin") {
      return children;
    }
    
    // For non-admins, check if their role is in allowedRoles
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/access-denied" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
