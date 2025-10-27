import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // While verifying auth state, show a minimal non-janky placeholder
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-full h-10 w-10 border-2 border-muted-foreground/30 border-t-primary animate-spin" />
      </div>
    );
  }

  // Allow only when authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Otherwise, redirect to login and preserve the path
  return <Navigate to="/login" replace state={{ from: location }} />;
};

export default ProtectedRoute;
