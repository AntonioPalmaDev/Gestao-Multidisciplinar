import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        {isLogin ? (
          <LoginForm onToggleMode={() => setIsLogin(false)} />
        ) : (
          <SignupForm onToggleMode={() => setIsLogin(true)} />
        )}
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex flex-1 hero-gradient items-center justify-center p-12">
        <div className="max-w-lg text-center text-primary-foreground">
          <h1 className="text-4xl font-display font-bold mb-6">
            Sistema de Gestão Multidisciplinar
          </h1>
          <p className="text-xl opacity-90 mb-8">
            Plataforma integrada para os departamentos de Psicologia, 
            Serviço Social e Pedagogia
          </p>
          <div className="grid grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
              <div className="text-3xl font-bold mb-1">🧠</div>
              <div className="text-sm font-medium">Psicologia</div>
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
              <div className="text-3xl font-bold mb-1">🏠</div>
              <div className="text-sm font-medium">Serviço Social</div>
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
              <div className="text-3xl font-bold mb-1">📚</div>
              <div className="text-sm font-medium">Pedagogia</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
