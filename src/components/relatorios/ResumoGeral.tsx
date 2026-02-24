import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { categoryLabels, CategoriaAtleta } from '@/types/database';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

const DEPT_COLORS = ['hsl(280, 55%, 50%)', 'hsl(172, 50%, 40%)', 'hsl(25, 85%, 55%)'];
const CAT_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

export function ResumoGeral() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['relatorio-resumo'],
    queryFn: async () => {
      const [atletasRes, psicRes, anamRes, encamRes, regEscRes, matricRes] = await Promise.all([
        supabase.from('atletas').select('id, categoria, ativo'),
        supabase.from('atendimentos_psicologia').select('id, tipo_intervencao, categoria, data_atendimento'),
        supabase.from('anamnese_social').select('id, data_registro'),
        supabase.from('encaminhamentos').select('id, status, data_encaminhamento'),
        supabase.from('registro_escolar').select('id, frequencia_percentual, media_notas, data_registro'),
        supabase.from('matriculas_escolares').select('id, ativo'),
      ]);

      const atletas = atletasRes.data || [];
      const psic = psicRes.data || [];
      const anam = anamRes.data || [];
      const encam = encamRes.data || [];
      const regEsc = regEscRes.data || [];
      const matric = matricRes.data || [];

      // By category
      const catCounts: Record<string, number> = {};
      atletas.filter(a => a.ativo).forEach(a => {
        catCounts[a.categoria] = (catCounts[a.categoria] || 0) + 1;
      });
      const byCategory = Object.entries(catCounts).map(([cat, count]) => ({
        name: categoryLabels[cat as CategoriaAtleta] || cat,
        value: count,
      }));

      // By department
      const byDepartment = [
        { name: 'Psicologia', atendimentos: psic.length },
        { name: 'Serviço Social', atendimentos: anam.length + encam.length },
        { name: 'Pedagogia', atendimentos: regEsc.length },
      ];

      // Encaminhamentos by status
      const statusCounts: Record<string, number> = {};
      encam.forEach(e => {
        const s = e.status || 'pendente';
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });
      const byStatus = Object.entries(statusCounts).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
      }));

      // School stats
      const freqValues = regEsc.filter(r => r.frequencia_percentual != null).map(r => r.frequencia_percentual!);
      const notaValues = regEsc.filter(r => r.media_notas != null).map(r => r.media_notas!);
      const avgFreq = freqValues.length > 0 ? (freqValues.reduce((a, b) => a + b, 0) / freqValues.length) : null;
      const avgNota = notaValues.length > 0 ? (notaValues.reduce((a, b) => a + b, 0) / notaValues.length) : null;

      // Temporal evolution by month
      const monthMap: Record<string, { psicologia: number; servico_social: number; pedagogia: number }> = {};
      const toMonth = (dateStr: string | null) => dateStr ? dateStr.substring(0, 7) : null; // "YYYY-MM"
      const ensureMonth = (m: string) => {
        if (!monthMap[m]) monthMap[m] = { psicologia: 0, servico_social: 0, pedagogia: 0 };
      };
      psic.forEach(r => { const m = toMonth(r.data_atendimento); if (m) { ensureMonth(m); monthMap[m].psicologia++; } });
      anam.forEach((r: any) => { const m = toMonth(r.data_registro); if (m) { ensureMonth(m); monthMap[m].servico_social++; } });
      encam.forEach((r: any) => { const m = toMonth(r.data_encaminhamento); if (m) { ensureMonth(m); monthMap[m].servico_social++; } });
      regEsc.forEach((r: any) => { const m = toMonth(r.data_registro); if (m) { ensureMonth(m); monthMap[m].pedagogia++; } });

      const byMonth = Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, counts]) => {
          const [y, m] = month.split('-');
          return { name: `${m}/${y}`, ...counts };
        });

      return {
        totalAtletas: atletas.filter(a => a.ativo).length,
        totalPsic: psic.length,
        totalAnam: anam.length,
        totalEncam: encam.length,
        totalRegEsc: regEsc.length,
        totalMatric: matric.filter(m => m.ativo).length,
        byCategory,
        byDepartment,
        byStatus,
        avgFreq,
        avgNota,
        byMonth,
      };
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="stat-card text-center">
          <p className="text-2xl font-bold text-primary">{stats.totalAtletas}</p>
          <p className="text-xs text-muted-foreground">Atletas Ativos</p>
        </Card>
        <Card className="stat-card text-center">
          <p className="text-2xl font-bold text-[hsl(var(--psychology))]">{stats.totalPsic}</p>
          <p className="text-xs text-muted-foreground">Atend. Psicologia</p>
        </Card>
        <Card className="stat-card text-center">
          <p className="text-2xl font-bold text-[hsl(var(--social))]">{stats.totalAnam}</p>
          <p className="text-xs text-muted-foreground">Anamneses</p>
        </Card>
        <Card className="stat-card text-center">
          <p className="text-2xl font-bold text-[hsl(var(--social))]">{stats.totalEncam}</p>
          <p className="text-xs text-muted-foreground">Encaminhamentos</p>
        </Card>
        <Card className="stat-card text-center">
          <p className="text-2xl font-bold text-[hsl(var(--pedagogy))]">{stats.totalRegEsc}</p>
          <p className="text-xs text-muted-foreground">Reg. Escolares</p>
        </Card>
        <Card className="stat-card text-center">
          <p className="text-2xl font-bold text-[hsl(var(--pedagogy))]">{stats.totalMatric}</p>
          <p className="text-xs text-muted-foreground">Matrículas Ativas</p>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Department bar chart */}
        <Card className="card-elevated p-6">
          <h3 className="font-display font-semibold mb-4">Registros por Departamento</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.byDepartment}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(215, 20%, 45%)' }} />
              <YAxis tick={{ fill: 'hsl(215, 20%, 45%)' }} />
              <Tooltip
                contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(214, 25%, 88%)', borderRadius: '8px' }}
              />
              <Bar dataKey="atendimentos" name="Registros" radius={[6, 6, 0, 0]}>
                {stats.byDepartment.map((_: any, i: number) => (
                  <Cell key={i} fill={DEPT_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Category pie chart */}
        <Card className="card-elevated p-6">
          <h3 className="font-display font-semibold mb-4">Atletas por Categoria</h3>
          {stats.byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.byCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {stats.byCategory.map((_: any, i: number) => (
                    <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">Sem dados</div>
          )}
        </Card>
      </div>

      {/* Second row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Encaminhamento status */}
        <Card className="card-elevated p-6">
          <h3 className="font-display font-semibold mb-4">Encaminhamentos por Status</h3>
          {stats.byStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.byStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {stats.byStatus.map((_: any, i: number) => (
                    <Cell key={i} fill={['hsl(40, 95%, 50%)', 'hsl(145, 65%, 40%)', 'hsl(0, 72%, 50%)', 'hsl(200, 80%, 50%)'][i % 4]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">Sem dados</div>
          )}
        </Card>

        {/* School performance */}
        <Card className="card-elevated p-6">
          <h3 className="font-display font-semibold mb-4">Indicadores Pedagógicos</h3>
          <div className="flex flex-col items-center justify-center h-[250px] gap-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Frequência Média</p>
              <p className={`text-4xl font-bold ${stats.avgFreq != null && stats.avgFreq < 75 ? 'text-destructive' : 'text-[hsl(var(--success))]'}`}>
                {stats.avgFreq != null ? `${stats.avgFreq.toFixed(1)}%` : '—'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Média de Notas</p>
              <p className={`text-4xl font-bold ${stats.avgNota != null && stats.avgNota < 6 ? 'text-destructive' : 'text-[hsl(var(--success))]'}`}>
                {stats.avgNota != null ? stats.avgNota.toFixed(1) : '—'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Temporal evolution */}
      <Card className="card-elevated p-6">
        <h3 className="font-display font-semibold mb-4">Evolução Mensal por Departamento</h3>
        {(stats.byMonth?.length ?? 0) > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.byMonth}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(215, 20%, 45%)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(215, 20%, 45%)' }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(214, 25%, 88%)', borderRadius: '8px' }} />
              <Legend />
              <Line type="monotone" dataKey="psicologia" name="Psicologia" stroke="hsl(280, 55%, 50%)" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="servico_social" name="Serviço Social" stroke="hsl(172, 50%, 40%)" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="pedagogia" name="Pedagogia" stroke="hsl(25, 85%, 55%)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">Sem dados temporais disponíveis</div>
        )}
      </Card>
    </div>
  );
}
