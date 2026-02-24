import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole } from '@/types/database';
import { Loader2, ShieldCheck, Clock, Mail, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useCallback } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading, signOut, refreshUserData } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(false);

  // Auto-poll every 15 seconds when awaiting approval
  useEffect(() => {
    if (!user || role || loading) return;
    const interval = setInterval(() => {
      refreshUserData();
    }, 15000);
    return () => clearInterval(interval);
  }, [user, role, loading, refreshUserData]);

  const handleCheckStatus = async () => {
    setChecking(true);
    await refreshUserData();
    setTimeout(() => setChecking(false), 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-fade-in" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-secondary/5 blur-3xl animate-fade-in" style={{ animationDelay: '0.2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-border/30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-border/15" />
        </div>

        <div className="relative z-10 w-full max-w-lg mx-4 animate-slide-up">
          {/* Main card */}
          <div className="bg-card rounded-2xl border shadow-lg overflow-hidden">
            {/* Top gradient bar */}
            <div className="h-1.5 w-full" style={{ background: 'var(--gradient-hero)' }} />

            <div className="p-8 sm:p-10">
              {/* Animated icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="h-10 w-10 text-primary" />
                  </div>
                  {/* Pulsing ring */}
                  <div className="absolute -inset-2 rounded-2xl border-2 border-primary/20 animate-[pulse_3s_ease-in-out_infinite]" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground text-center mb-2">
                Aguardando Aprovação
              </h2>
              <p className="text-muted-foreground text-center text-sm mb-8">
                Sua conta foi criada com sucesso!
              </p>

              {/* Status steps */}
              <div className="space-y-4 mb-8">
                {/* Step 1 - Done */}
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-[hsl(var(--success))]/15 flex items-center justify-center mt-0.5">
                    <Mail className="h-4 w-4 text-[hsl(var(--success))]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Conta criada</p>
                    <p className="text-xs text-muted-foreground">Seu cadastro foi realizado com sucesso</p>
                  </div>
                </div>

                {/* Connector */}
                <div className="ml-[17px] h-4 w-px bg-border" />

                {/* Step 2 - In progress */}
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center mt-0.5">
                    <Clock className="h-4 w-4 text-accent animate-[pulse_2s_ease-in-out_infinite]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Aprovação pendente</p>
                    <p className="text-xs text-muted-foreground">Um administrador precisa atribuir seu perfil de acesso ao sistema</p>
                  </div>
                </div>

                {/* Connector */}
                <div className="ml-[17px] h-4 w-px bg-border/50 border-l border-dashed border-border" />

                {/* Step 3 - Pending */}
                <div className="flex items-start gap-4 opacity-40">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-muted flex items-center justify-center mt-0.5">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Acesso liberado</p>
                    <p className="text-xs text-muted-foreground">Você poderá acessar o sistema normalmente</p>
                  </div>
                </div>
              </div>

              {/* Info box */}
              <div className="rounded-xl bg-muted/60 border border-border/50 p-4 mb-6">
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  Enquanto isso, entre em contato com a equipe administrativa para agilizar a liberação do seu acesso.
                </p>
              </div>

              {/* Action */}
              <div className="flex gap-3">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={handleCheckStatus}
                  disabled={checking}
                >
                  {checking ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Verificar status
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </div>

          {/* Footer text */}
          <p className="text-xs text-muted-foreground/60 text-center mt-4">
            Sistema de Gestão Multidisciplinar
          </p>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
