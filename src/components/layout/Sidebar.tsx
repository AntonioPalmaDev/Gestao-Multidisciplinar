import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { roleLabels } from '@/types/database';
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
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

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

export function Sidebar() {
  const location = useLocation();
  const { profile, role, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = navItems.filter(item => {
    if (!item.roles) return true;
    return role && item.roles.includes(role);
  });

  return (
    <aside 
      className={cn(
  "fixed left-0 top-0 h-screen bg-gradient-to-b from-black to-zinc-900 text-sidebar-foreground flex flex-col transition-all duration-300 z-50",
  collapsed ? "w-20" : "w-64"
)}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
        <img src="/favicon.ico" alt="logo"  />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-display font-bold text-lg leading-tight">EC VITORIA</h1>
              <p className="text-xs text-sidebar-foreground/70">Gestão Multidisciplinar</p>
            </div>
          )}
        </div>
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
                      ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                      : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    item.departmentColor === 'psychology' && "text-psychology",
                    item.departmentColor === 'social' && "text-social",
                    item.departmentColor === 'pedagogy' && "text-pedagogy",
                  )} />
                  {!collapsed && (
                    <span className="font-medium text-sm">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        {!collapsed && profile && (
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
            "w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-foreground" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-foreground" />
        )}
      </button>
    </aside>
  );
}
