import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  // Estados para controlar a barra lateral
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false); // Movido para cá para arrumar o espaçamento

  return (
    <div className="min-h-screen bg-background">
      {/* Header Mobile - Aparece apenas em telas pequenas (md:hidden) */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card text-foreground">
        <div className="flex items-center gap-2">
          <img src="/favicon.ico" alt="logo" className="w-8 h-8 rounded" />
          <span className="font-display font-bold text-lg">EC VITORIA</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      <Sidebar 
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main ajusta a margem: 0 no mobile, 20 se colapsado no PC, 64 se aberto no PC */}
      <main 
        className={cn(
          "p-4 md:p-8 transition-all duration-300",
          isMobile ? "ml-0" : (collapsed ? "ml-20" : "ml-64")
        )}
      >
        {children}
      </main>
    </div>
  );
}