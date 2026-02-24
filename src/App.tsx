import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Atletas from "./pages/Atletas";
import Psicologia from "./pages/Psicologia";
import ServicoSocial from "./pages/ServicoSocial";
import Pedagogia from "./pages/Pedagogia";
import Relatorios from "./pages/Relatorios";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/atletas"
              element={
                <ProtectedRoute>
                  <Atletas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/psicologia"
              element={
                <ProtectedRoute allowedRoles={['admin', 'psicologo', 'gestor']}>
                  <Psicologia />
                </ProtectedRoute>
              }
            />
            <Route
              path="/servico-social"
              element={
                <ProtectedRoute allowedRoles={['admin', 'assistente_social', 'gestor']}>
                  <ServicoSocial />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pedagogia"
              element={
                <ProtectedRoute allowedRoles={['admin', 'pedagogo', 'gestor']}>
                  <Pedagogia />
                </ProtectedRoute>
              }
            />
            <Route
              path="/relatorios"
              element={
                <ProtectedRoute>
                  <Relatorios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Admin />
                </ProtectedRoute>
              }
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
