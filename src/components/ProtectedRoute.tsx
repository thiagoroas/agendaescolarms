import { Navigate, useLocation } from "react-router-dom";
import { useAuth, UserRole } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="mb-2 text-2xl font-bold text-destructive">Acesso negado</h1>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        <button
          onClick={() => window.history.back()}
          className="mt-4 text-primary hover:underline"
        >
          Voltar
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
