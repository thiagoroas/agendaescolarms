import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

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
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
