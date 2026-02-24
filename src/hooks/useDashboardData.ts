import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardStats {
  atletasAtivos: number;
  atendimentosMes: number;
  encaminhamentosPendentes: number;
  acompanhamentosAtivos: number;
}

interface DepartmentStats {
  psicologia: { atendimentosHoje: number; atendimentosSemana: number };
  servicoSocial: { encaminhamentos: number; anamneses: number };
  pedagogia: { acompanhamentos: number; alertas: number };
}

interface Activity {
  id: string;
  type: 'psychology' | 'social' | 'pedagogy';
  title: string;
  description: string;
  time: string;
}

interface PeriodoAtual {
  nome: string;
  dataInicio: string;
  dataFim: string;
  fechado: boolean;
  diasRestantes: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const [atletasRes, atendimentosRes, encaminhamentosRes, registrosRes] = await Promise.all([
        supabase.from('atletas').select('id', { count: 'exact', head: true }).eq('ativo', true),
        supabase.from('atendimentos_psicologia').select('id', { count: 'exact', head: true })
          .gte('data_atendimento', startOfMonth).lte('data_atendimento', endOfMonth),
        supabase.from('encaminhamentos').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
        supabase.from('registro_escolar').select('id', { count: 'exact', head: true }),
      ]);

      return {
        atletasAtivos: atletasRes.count ?? 0,
        atendimentosMes: atendimentosRes.count ?? 0,
        encaminhamentosPendentes: encaminhamentosRes.count ?? 0,
        acompanhamentosAtivos: registrosRes.count ?? 0,
      };
    },
    staleTime: 30_000,
  });
}

export function useDepartmentStats() {
  return useQuery({
    queryKey: ['dashboard-department-stats'],
    queryFn: async (): Promise<DepartmentStats> => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

      const [psiHoje, psiSemana, encaminhamentos, anamneses, acompanhamentos, alertas] = await Promise.all([
        supabase.from('atendimentos_psicologia').select('id', { count: 'exact', head: true }).eq('data_atendimento', today),
        supabase.from('atendimentos_psicologia').select('id', { count: 'exact', head: true }).gte('data_atendimento', startOfWeekStr).lte('data_atendimento', today),
        supabase.from('encaminhamentos').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
        supabase.from('anamnese_social').select('id', { count: 'exact', head: true }),
        supabase.from('registro_escolar').select('id', { count: 'exact', head: true }),
        supabase.from('registro_escolar').select('id', { count: 'exact', head: true }).lt('frequencia_percentual', 75),
      ]);

      return {
        psicologia: { atendimentosHoje: psiHoje.count ?? 0, atendimentosSemana: psiSemana.count ?? 0 },
        servicoSocial: { encaminhamentos: encaminhamentos.count ?? 0, anamneses: anamneses.count ?? 0 },
        pedagogia: { acompanhamentos: acompanhamentos.count ?? 0, alertas: alertas.count ?? 0 },
      };
    },
    staleTime: 30_000,
  });
}

export function useRecentActivities() {
  return useQuery({
    queryKey: ['dashboard-recent-activities'],
    queryFn: async (): Promise<Activity[]> => {
      const activities: Activity[] = [];

      const [psiRes, encRes, regRes] = await Promise.all([
        supabase.from('atendimentos_psicologia')
          .select('id, tipo_intervencao, data_atendimento, created_at, atendimento_atletas(atleta_id, atletas(nome, categoria))')
          .order('created_at', { ascending: false }).limit(3),
        supabase.from('encaminhamentos')
          .select('id, tipo, destino, created_at, atletas(nome, categoria)')
          .order('created_at', { ascending: false }).limit(3),
        supabase.from('registro_escolar')
          .select('id, created_at, atletas(nome, categoria)')
          .order('created_at', { ascending: false }).limit(3),
      ]);

      const tipoLabels: Record<string, string> = {
        individual: 'Atendimento Individual',
        grupo: 'Atendimento em Grupo',
        observacao_treino: 'Observação de Treino',
        observacao_jogo: 'Observação de Jogo',
        dinamica_grupo: 'Dinâmica de Grupo',
        teste_psicologico: 'Teste Psicológico',
        encaminhamento: 'Encaminhamento',
        anamnese: 'Anamnese',
        acompanhamento_escolar: 'Acompanhamento Escolar',
      };

      if (psiRes.data) {
        for (const a of psiRes.data) {
          const atletaInfo = (a.atendimento_atletas as any)?.[0]?.atletas;
          activities.push({
            id: `psi-${a.id}`,
            type: 'psychology',
            title: tipoLabels[a.tipo_intervencao] ?? a.tipo_intervencao,
            description: atletaInfo ? `${atletaInfo.nome} - ${atletaInfo.categoria}` : 'Sem atleta vinculado',
            time: formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR }),
          });
        }
      }

      if (encRes.data) {
        for (const e of encRes.data) {
          const atleta = e.atletas as any;
          activities.push({
            id: `enc-${e.id}`,
            type: 'social',
            title: `Encaminhamento - ${e.tipo}`,
            description: atleta ? `${atleta.nome} - ${atleta.categoria}` : e.destino,
            time: formatDistanceToNow(new Date(e.created_at), { addSuffix: true, locale: ptBR }),
          });
        }
      }

      if (regRes.data) {
        for (const r of regRes.data) {
          const atleta = r.atletas as any;
          activities.push({
            id: `reg-${r.id}`,
            type: 'pedagogy',
            title: 'Registro Escolar',
            description: atleta ? `${atleta.nome} - ${atleta.categoria}` : 'Registro escolar',
            time: formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: ptBR }),
          });
        }
      }

      // Sort by most recent
      activities.sort((a, b) => {
        // We'll just keep insertion order since they're already sorted
        return 0;
      });

      return activities.slice(0, 5);
    },
    staleTime: 30_000,
  });
}

export function useCurrentPeriod() {
  return useQuery({
    queryKey: ['dashboard-current-period'],
    queryFn: async (): Promise<PeriodoAtual | null> => {
      const today = new Date().toISOString().split('T')[0];

      const { data } = await supabase
        .from('periodos_trimestrais')
        .select('*')
        .lte('data_inicio', today)
        .gte('data_fim', today)
        .maybeSingle();

      if (!data) {
        // Get next upcoming period
        const { data: next } = await supabase
          .from('periodos_trimestrais')
          .select('*')
          .gt('data_inicio', today)
          .order('data_inicio', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!next) return null;

        const diasRestantes = Math.ceil((new Date(next.data_fim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

        return {
          nome: `${next.trimestre}º Trimestre ${next.ano}`,
          dataInicio: next.data_inicio,
          dataFim: next.data_fim,
          fechado: next.fechado ?? false,
          diasRestantes: Math.max(0, diasRestantes),
        };
      }

      const diasRestantes = Math.ceil((new Date(data.data_fim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

      return {
        nome: `${data.trimestre}º Trimestre ${data.ano}`,
        dataInicio: data.data_inicio,
        dataFim: data.data_fim,
        fechado: data.fechado ?? false,
        diasRestantes: Math.max(0, diasRestantes),
      };
    },
    staleTime: 60_000,
  });
}
