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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/agenda" element={<AgendaPage />} />
                    <Route path="/minhas-reservas" element={<MinhasReservasPage />} />
                    <Route path="/perfil" element={<PerfilPage />} />
                    
                    {/* Admin Lab + Admin Plataforma */}
                    <Route path="/admin/professores" element={
                      <ProtectedRoute allowedRoles={["admin_lab", "admin_plataforma"]}>
                        <AdminProfessoresPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/recursos" element={
                      <ProtectedRoute allowedRoles={["admin_lab", "admin_plataforma"]}>
                        <AdminRecursosPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/reservas" element={
                      <ProtectedRoute allowedRoles={["admin_lab", "admin_plataforma"]}>
                        <AdminReservasPage />
                      </ProtectedRoute>
                    } />
                    
                    {/* Admin Plataforma apenas */}
                    <Route path="/admin/escolas" element={
                      <ProtectedRoute allowedRoles={["admin_plataforma"]}>
                        <AdminEscolasPage />
                      </ProtectedRoute>
                    } />

                    <Route path="/" element={<Navigate to="/agenda" replace />} />
                    <Route path="*" element={<Navigate to="/agenda" replace />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
