import { Navigate, useLocation } from "react-router-dom";
import { useAuth, UserRole } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  console.log("[ProtectedRoute] check:", { loading, hasUser: !!user, hasProfile: !!profile, path: location.pathname });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile) {
    // Redirecionamento ou tela de erro de perfil. 
    // Como o AppContent já trata !profile, isso é um fallback de segurança.
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
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
