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
            <Route path="/*" element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/agenda" element={<AgendaPage />} />
                    <Route path="/minhas-reservas" element={<div>Minhas Reservas (em construção)</div>} />
                    <Route path="/perfil" element={<div>Perfil (em construção)</div>} />
                    <Route path="/admin/professores" element={<div>Admin Professores (em construção)</div>} />
                    <Route path="/admin/recursos" element={<div>Admin Recursos (em construção)</div>} />
                    <Route path="/admin/reservas" element={<div>Admin Reservas (em construção)</div>} />
                    <Route path="/admin/escolas" element={<div>Admin Escolas (em construção)</div>} />
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
