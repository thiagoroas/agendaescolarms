import React, { Component, ErrorInfo, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import { isSupabaseConfigured } from "@/lib/supabase";

// Error Boundary para evitar tela branca
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[CRITICAL ERROR]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen flex-col items-center justify-center p-4 text-center bg-background">
          <h1 className="text-2xl font-bold text-destructive">Erro ao carregar o aplicativo</h1>
          <p className="text-muted-foreground mt-2">Tente recarregar a página ou entre em contato com o suporte.</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary text-white rounded-md">
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

if (import.meta.env.DEV) {
  console.log("isSupabaseConfigured", isSupabaseConfigured);
}

const SupabaseConfigError = () => (
  <div className="flex h-screen flex-col items-center justify-center p-4 text-center bg-background">
    <div className="max-w-md p-8 border rounded-lg shadow-sm bg-card">
      <h1 className="mb-4 text-2xl font-bold text-destructive">Supabase não configurado</h1>
      <p className="text-muted-foreground mb-6">
        As variáveis de ambiente <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> não foram encontradas.
      </p>
      <p className="text-sm text-muted-foreground">
        Por favor, conecte o projeto ao Supabase nas configurações do Lovable para restaurar o funcionamento.
      </p>
    </div>
  </div>
);

const AppContent = () => {
  const { loading, profileLoading, user, profile } = useAuth();
  
  console.log("[AppContent] render state:", { loading, profileLoading, hasUser: !!user, hasProfile: !!profile });

  // 1. Rota de login deve estar disponível IMEDIATAMENTE se não houver usuário decidido
  // ou se for a rota de login explicitamente
  const isLoginPage = window.location.pathname === "/login";

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // 2. Loading inicial de Auth (Apenas se ainda estiver decidindo se há usuário ou não)
  if (loading && !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Iniciando...</p>
        </div>
      </div>
    );
  }

  // Se não houver usuário, redirecionar para login (fora da condição de loading para garantir renderização)
  if (!user && !loading) {
    return (
      <Routes>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // 3. Loading de Perfil (Diferente do loading de Auth)
  if (user && profileLoading && !profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-medium">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  // 4. Status de Acesso (Pendente/Bloqueado)
  if (profile) {
    if (profile.status === "pendente") {
      return (
        <div className="flex h-screen flex-col items-center justify-center p-4 text-center bg-background">
          <h1 className="mb-2 text-2xl font-bold text-amber-600">Acesso em análise</h1>
          <p className="text-muted-foreground">Seu acesso está aguardando aprovação de um administrador.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
          >
            Verificar novamente
          </button>
        </div>
      );
    }
    
    if (profile.status === "bloqueado") {
      return (
        <div className="flex h-screen flex-col items-center justify-center p-4 text-center bg-background">
          <h1 className="mb-2 text-2xl font-bold text-destructive">Acesso bloqueado</h1>
          <p className="text-muted-foreground">Seu acesso foi desativado. Entre em contato com a coordenação.</p>
        </div>
      );
    }
  }

  // 5. Perfil não encontrado real (após carregar e não existir)
  if (user && !profile && !profileLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center bg-background">
        <h1 className="mb-2 text-2xl font-bold text-destructive">Perfil não encontrado</h1>
        <p className="text-muted-foreground">Não encontramos dados de perfil para seu usuário.</p>
        <p className="text-sm text-muted-foreground mt-1">Entre em contato com o administrador para configurar seu acesso.</p>
        <div className="flex gap-4 mt-6">
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
          >
            Tentar novamente
          </button>
          <button 
            onClick={() => {
              // Limpar local storage e deslogar para permitir novo login
              localStorage.clear();
              window.location.href = "/login";
            }} 
            className="px-4 py-2 border border-input bg-background hover:bg-accent rounded-md transition-opacity"
          >
            Sair e tentar outro e-mail
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isSupabaseConfigured && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-slate-800/40 text-white text-[9px] font-medium py-0.5 px-4 text-center pointer-events-none uppercase tracking-[0.2em] backdrop-blur-[2px]">
          Ambiente de Demonstração (Modo Protótipo)
        </div>
      )}
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout>
            <DashboardPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/agenda" element={
        <ProtectedRoute>
          <AppLayout>
            <AgendaPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/minhas-reservas" element={
        <ProtectedRoute>
          <AppLayout>
            <MinhasReservasPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/perfil" element={
        <ProtectedRoute>
          <AppLayout>
            <PerfilPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/professores" element={
        <ProtectedRoute allowedRoles={["admin_lab", "admin_plataforma"]}>
          <AppLayout>
            <AdminProfessoresPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/recursos" element={
        <ProtectedRoute allowedRoles={["admin_lab", "admin_plataforma"]}>
          <AppLayout>
            <AdminRecursosPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/reservas" element={
        <ProtectedRoute allowedRoles={["admin_lab", "admin_plataforma"]}>
          <AppLayout>
            <AdminReservasPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/aprovacoes" element={
        <ProtectedRoute allowedRoles={["admin_lab", "admin_plataforma"]}>
          <AppLayout>
            <AprovacoesPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/admin/avisos" element={
        <ProtectedRoute allowedRoles={["admin_lab", "admin_plataforma"]}>
          <AppLayout>
            <AdminAvisosPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/escolas" element={
        <ProtectedRoute allowedRoles={["admin_plataforma"]}>
          <AppLayout>
            <AdminEscolasPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
};

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
