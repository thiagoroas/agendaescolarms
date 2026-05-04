import React, { Component, ErrorInfo, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import { isSupabaseConfigured } from "@/lib/supabase";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AprovacoesPage from "./pages/AprovacoesPage";
import AdminAvisosPage from "./pages/AdminAvisosPage";
import AgendaPage from "./pages/AgendaPage";
import MinhasReservasPage from "./pages/MinhasReservasPage";
import PerfilPage from "./pages/PerfilPage";
import AdminProfessoresPage from "./pages/AdminProfessoresPage";
import AdminRecursosPage from "./pages/AdminRecursosPage";
import AdminReservasPage from "./pages/AdminReservasPage";
import AdminEscolasPage from "./pages/AdminEscolasPage";
import AdminHorariosPage from "./pages/AdminHorariosPage";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[CRITICAL ERROR]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen flex-col items-center justify-center p-4 text-center bg-background">
          <h1 className="text-2xl font-bold text-destructive">Erro ao carregar o aplicativo</h1>
          <pre className="mt-4 p-4 bg-muted rounded text-xs text-left overflow-auto max-w-full">
            {this.state.error?.message}
          </pre>
          <button onClick={() => window.location.reload()} className="mt-6 px-4 py-2 bg-primary text-white rounded-md">
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent = () => {
  const { loading, user, profile, logout, error } = useAuth();
  const location = useLocation();
  const [showEmergencyButton, setShowEmergencyButton] = React.useState(false);

  console.log("[LOOP DEBUG] render App");

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => {
        setShowEmergencyButton(true);
      }, 6000);
    } else {
      setShowEmergencyButton(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  console.log("[AppContent] state:", { 
    loading, 
    hasUser: !!user, 
    hasProfile: !!profile, 
    path: location.pathname,
    status: profile?.status,
    error
  });

  // 1. Loading global (apenas se não tivermos usuário E perfil já carregados)
  if (loading && (!user || !profile)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">Carregando perfil...</p>
            <p className="text-xs text-muted-foreground italic">Isso pode levar alguns segundos</p>
          </div>
          
          {showEmergencyButton && (
            <div className="mt-4 animate-in fade-in duration-500">
              <button 
                onClick={() => logout()} 
                className="px-4 py-2 bg-destructive/10 text-destructive text-sm font-medium rounded-lg hover:bg-destructive/20 transition-colors border border-destructive/20"
              >
                Sair e voltar ao login
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Se não está logado, a única rota permitida é /login
  if (!user) {
    if (location.pathname === "/login") {
      return (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      );
    }
    return <Navigate to="/login" replace />;
  }

  // 3. Se está logado mas não tem perfil
  if (!profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center bg-background">
        <h1 className="mb-2 text-2xl font-bold text-destructive">Perfil não encontrado</h1>
        <div className="space-y-2 mb-6">
          <p className="text-muted-foreground max-w-md">Não encontramos dados de perfil vinculados a este e-mail.</p>
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg text-left overflow-auto max-w-md">
            <p><strong>E-mail autenticado:</strong> {user.email}</p>
            <p><strong>ID do usuário:</strong> {user.id}</p>
            <p className="mt-2 text-amber-600 font-medium">⚠️ Existe usuário no Auth, mas não existe profile vinculado ao mesmo ID.</p>
          </div>
        </div>
        <button onClick={() => logout()} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
          Sair e tentar outro e-mail
        </button>
      </div>
    );
  }

  // 4. Se o perfil está pendente ou bloqueado
  if (profile?.status === "pendente") {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center bg-background">
        <h1 className="mb-2 text-2xl font-bold text-amber-600">Acesso em análise</h1>
        <p className="text-muted-foreground">Seu cadastro aguarda aprovação de um administrador.</p>
        <button onClick={() => logout()} className="mt-6 px-4 py-2 bg-primary text-white rounded-md">
          Sair
        </button>
      </div>
    );
  }

  if (profile?.status === "bloqueado" || profile?.status === "removido") {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center bg-background">
        <h1 className="mb-2 text-2xl font-bold text-destructive">Acesso negado</h1>
        <p className="text-muted-foreground">
          {profile?.status === "bloqueado" 
            ? "Seu acesso foi desativado pela coordenação." 
            : "Este usuário não faz mais parte desta escola."}
        </p>
        <button onClick={() => logout()} className="mt-6 px-4 py-2 bg-primary text-white rounded-md">
          Sair
        </button>
      </div>
    );
  }

  // 5. Se está logado e ativo, renderiza as rotas protegidas
  return (
    <>
      {!isSupabaseConfigured && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-slate-800/40 text-white text-[9px] font-medium py-0.5 px-4 text-center pointer-events-none uppercase tracking-[0.2em] backdrop-blur-[2px]">
          Ambiente de Demonstração (Modo Protótipo)
        </div>
      )}
      <Routes>
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/agenda" element={<ProtectedRoute><AppLayout><AgendaPage /></AppLayout></ProtectedRoute>} />
        <Route path="/minhas-reservas" element={<ProtectedRoute><AppLayout><MinhasReservasPage /></AppLayout></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><AppLayout><PerfilPage /></AppLayout></ProtectedRoute>} />
        
        <Route path="/admin/professores" element={<ProtectedRoute allowedRoles={["admin_lab", "admin_plataforma"]}><AppLayout><AdminProfessoresPage /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/recursos" element={<ProtectedRoute allowedRoles={["admin_lab", "admin_plataforma"]}><AppLayout><AdminRecursosPage /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/reservas" element={<ProtectedRoute allowedRoles={["admin_lab", "admin_plataforma"]}><AppLayout><AdminReservasPage /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/aprovacoes" element={<ProtectedRoute allowedRoles={["admin_lab", "admin_plataforma"]}><AppLayout><AprovacoesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/central" element={<ProtectedRoute allowedRoles={["admin_lab", "admin_plataforma"]}><AppLayout><AprovacoesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/avisos" element={<ProtectedRoute allowedRoles={["admin_lab", "admin_plataforma"]}><AppLayout><AdminAvisosPage /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/horarios" element={<ProtectedRoute allowedRoles={["admin_lab", "admin_plataforma"]}><AppLayout><AdminHorariosPage /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/escolas" element={<ProtectedRoute allowedRoles={["admin_plataforma"]}><AppLayout><AdminEscolasPage /></AppLayout></ProtectedRoute>} />

        {/* Redirecionamento da raiz e fallback */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
};

const queryClient = new QueryClient();

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
