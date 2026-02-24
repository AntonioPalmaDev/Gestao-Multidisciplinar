import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DepartmentCard } from '@/components/dashboard/DepartmentCard';
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard';
import { roleLabels } from '@/types/database';
import { Users, Brain, Home, GraduationCap, CalendarDays, FileText, TrendingUp, Loader2 } from 'lucide-react';
import { useDashboardStats, useDepartmentStats, useRecentActivities, useCurrentPeriod } from '@/hooks/useDashboardData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { profile, role } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: deptStats, isLoading: deptLoading } = useDepartmentStats();
  const { data: activities, isLoading: activitiesLoading } = useRecentActivities();
  const { data: periodo, isLoading: periodoLoading } = useCurrentPeriod();

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Olá, {profile?.nome?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground">
            {role ? roleLabels[role] : 'Sem perfil'} • Bem-vindo ao Sistema de Gestão Multidisciplinar
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </>
          ) : (
            <>
              <StatCard
                icon={Users}
                title="Atletas Ativos"
                value={stats?.atletasAtivos ?? 0}
                subtitle="Total cadastrado"
              />
              <StatCard
                icon={CalendarDays}
                title="Atendimentos"
                value={stats?.atendimentosMes ?? 0}
                subtitle="Este mês"
              />
              <StatCard
                icon={FileText}
                title="Encaminhamentos"
                value={stats?.encaminhamentosPendentes ?? 0}
                subtitle="Pendentes"
              />
              <StatCard
                icon={TrendingUp}
                title="Registros Escolares"
                value={stats?.acompanhamentosAtivos ?? 0}
                subtitle="Total"
              />
            </>
          )}
        </div>

        {/* Department Cards */}
        <h2 className="text-xl font-display font-semibold mb-4">Departamentos</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {deptLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}
            </>
          ) : (
            <>
              {(role === 'admin' || role === 'psicologo' || role === 'gestor') && (
                <DepartmentCard
                  title="Psicologia"
                  description="Atendimentos individuais, grupos, observações e testes psicológicos"
                  icon={Brain}
                  href="/psicologia"
                  variant="psychology"
                  stats={[
                    { label: 'Atendimentos hoje', value: deptStats?.psicologia.atendimentosHoje ?? 0 },
                    { label: 'Esta semana', value: deptStats?.psicologia.atendimentosSemana ?? 0 },
                  ]}
                />
              )}
              {(role === 'admin' || role === 'assistente_social' || role === 'gestor') && (
                <DepartmentCard
                  title="Serviço Social"
                  description="Anamneses, encaminhamentos e acompanhamento familiar"
                  icon={Home}
                  href="/servico-social"
                  variant="social"
                  stats={[
                    { label: 'Encaminhamentos', value: deptStats?.servicoSocial.encaminhamentos ?? 0 },
                    { label: 'Anamneses', value: deptStats?.servicoSocial.anamneses ?? 0 },
                  ]}
                />
              )}
              {(role === 'admin' || role === 'pedagogo' || role === 'gestor') && (
                <DepartmentCard
                  title="Pedagogia"
                  description="Matrículas escolares, frequência e desempenho acadêmico"
                  icon={GraduationCap}
                  href="/pedagogia"
                  variant="pedagogy"
                  stats={[
                    { label: 'Acompanhamentos', value: deptStats?.pedagogia.acompanhamentos ?? 0 },
                    { label: 'Alertas freq.', value: deptStats?.pedagogia.alertas ?? 0 },
                  ]}
                />
              )}
            </>
          )}
        </div>

        {/* Recent Activity + Period */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {activitiesLoading ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : (
              <RecentActivityCard activities={activities ?? []} />
            )}
          </div>
          <div className="card-elevated p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Período Atual</h3>
            {periodoLoading ? (
              <Skeleton className="h-32 rounded-lg" />
            ) : periodo ? (
              <>
                <div className="bg-muted rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-foreground">{periodo.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(periodo.dataInicio), "dd/MM/yyyy")} - {format(new Date(periodo.dataFim), "dd/MM/yyyy")}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={periodo.fechado ? "text-destructive font-medium" : "text-success font-medium"}>
                      {periodo.fechado ? 'Fechado' : 'Aberto'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dias restantes</span>
                    <span className="font-medium">{periodo.diasRestantes}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">Nenhum período configurado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
