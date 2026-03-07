import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { roleLabels } from '@/types/database';
import { useIsMobile } from '@/hooks/use-mobile'; // <-- Importando o seu hook
import { useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Brain,
  Home,
  GraduationCap,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X // <-- Adicionado ícone de fechar para o mobile
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Novas props para receber o estado do AppLayout
interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  roles?: string[];
  departmentColor?: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Atletas', href: '/atletas' },
  {
    icon: Brain,
    label: 'Psicologia',
    href: '/psicologia',
    roles: ['admin', 'psicologo', 'gestor'],
    departmentColor: 'psychology'
  },
  {
    icon: Home,
    label: 'Serviço Social',
    href: '/servico-social',
    roles: ['admin', 'assistente_social', 'gestor'],
    departmentColor: 'social'
  },
  {
    icon: GraduationCap,
    label: 'Pedagogia',
    href: '/pedagogia',
    roles: ['admin', 'pedagogo', 'gestor'],
    departmentColor: 'pedagogy'
  },
  { icon: FileText, label: 'Relatórios', href: '/relatorios' },
  {
    icon: Settings,
    label: 'Administração',
    href: '/admin',
    roles: ['admin']
  },
];

export function Sidebar({ collapsed, setCollapsed, isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
  const location = useLocation();
  const { profile, role, signOut } = useAuth();
  const isMobile = useIsMobile();

  // Fecha o menu no celular automaticamente quando o usuário clica em um link
  useEffect(() => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [location.pathname, isMobile, setIsMobileMenuOpen]);

  const filteredItems = navItems.filter(item => {
    if (!item.roles) return true;
    return role && item.roles.includes(role);
  });

  return (
    <>
      {/* Overlay escuro para o mobile quando o menu está aberto */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-gradient-to-b from-black to-zinc-900 text-sidebar-foreground flex flex-col transition-all duration-300 z-50",
          // Lógica de largura e posição (Mobile vs Desktop)
          isMobile 
            ? cn("w-64", isMobileMenuOpen ? "translate-x-0" : "-translate-x-full") 
            : cn("translate-x-0", collapsed ? "w-20" : "w-64")
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/10">
              <img src="/favicon.ico" alt="logo" className="w-8 h-8" />
            </div>
            {(!collapsed || isMobile) && (
              <div className="overflow-hidden">
                <h1 className="font-display font-bold text-lg leading-tight">EC VITORIA</h1>
                <p className="text-xs text-sidebar-foreground/70">Gestão Multidisciplinar</p>
              </div>
            )}
          </div>
          {/* Botão de fechar visível apenas no celular */}
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="text-sidebar-foreground/80 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {filteredItems.map((item) => {
              const isActive = location.pathname === item.href ||
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                      isActive
                        ? "bg-red-700/40 text-red-400"
                        : "text-sidebar-foreground/80 hover:bg-red-700/30 hover:text-red-400"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 flex-shrink-0",
                      item.departmentColor === 'psychology' && "text-psychology",
                      item.departmentColor === 'social' && "text-social",
                      item.departmentColor === 'pedagogy' && "text-pedagogy",
                    )} />
                    {/* Exibe o texto se não estiver colapsado OU se estiver no mobile */}
                    {(!collapsed || isMobile) && (
                      <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          {(!collapsed || isMobile) && profile && (
            <div className="mb-3 px-3">
              <p className="font-medium text-sm truncate">{profile.nome}</p>
              <p className="text-xs text-sidebar-foreground/70">
                {role ? roleLabels[role] : 'Sem perfil'}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className={cn(
              "w-full justify-start text-sidebar-foreground/80 hover:text-red-400 hover:bg-red-700/30 transition-colors duration-200",            
              (collapsed && !isMobile) && "justify-center px-0"
            )}
          >
            <LogOut className="h-4 w-4" />
            {(!collapsed || isMobile) && <span className="ml-2">Sair</span>}
          </Button>
        </div>

        {/* Collapse button - Oculto no celular */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border shadow-sm flex items-center justify-center hover:bg-muted transition-colors text-foreground"
          >
            {collapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </button>
        )}
      </aside>
    </>
  );
}