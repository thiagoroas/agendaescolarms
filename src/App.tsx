import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import { isSupabaseConfigured } from "@/lib/supabase";

const SupabaseConfigError = () => (
  <div className="flex h-screen flex-col items-center justify-center p-4 text-center bg-background">
    <div className="max-w-md p-8 border rounded-lg shadow-sm bg-card">
      <h1 className="mb-4 text-2xl font-bold text-destructive">Supabase não configurado</h1>
      <p className="text-muted-foreground mb-6">
        As variáveis de ambiente <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> não foram encontradas.
      </p>
      <p className="text-sm text-muted-foreground">
        Por favor, conecte o projeto ao Supabase nas configurações do Lovable para restaurar o funcionamento.
      </p>
    </div>
  </div>
);

const AppContent = () => {
  const { loading, user, profile } = useAuth();

  if (!isSupabaseConfigured) {
    return <SupabaseConfigError />;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Profile error check: If user exists but no profile found after loading
  if (user && !profile && !loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center bg-background">
        <h1 className="mb-2 text-2xl font-bold text-destructive">Perfil não encontrado</h1>
        <p className="text-muted-foreground">Entre em contato com o administrador para configurar seu acesso.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
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

      <Route path="/admin/escolas" element={
        <ProtectedRoute allowedRoles={["admin_plataforma"]}>
          <AppLayout>
            <AdminEscolasPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to="/agenda" replace />} />
      <Route path="*" element={<Navigate to="/agenda" replace />} />
    </Routes>
  );
};

import LoginPage from "./pages/LoginPage";
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
  );
}
