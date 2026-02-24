import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { categoryLabels, CategoriaAtleta } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Download, Loader2, FileText } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportType = 'psicologia' | 'servico_social' | 'pedagogia';

export function ExportarRelatorio() {
  const [tipo, setTipo] = useState<ReportType>('psicologia');
  const [periodoId, setPeriodoId] = useState<string>('todos');
  const [generating, setGenerating] = useState(false);

  const { data: periodos = [] } = useQuery({
    queryKey: ['periodos-todos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('periodos_trimestrais')
        .select('*')
        .order('ano', { ascending: false })
        .order('trimestre', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['relatorio-export', tipo, periodoId],
    queryFn: async () => {
      if (tipo === 'psicologia') {
        let query = supabase.from('atendimentos_psicologia').select('*').order('data_atendimento', { ascending: false });
        if (periodoId !== 'todos') query = query.eq('periodo_id', periodoId);
        const { data, error } = await query;
        if (error) throw error;
        return { tipo: 'psicologia', rows: data || [] };
      }

      if (tipo === 'servico_social') {
        const [anamRes, encamRes] = await Promise.all([
          supabase.from('anamnese_social').select('*').order('data_registro', { ascending: false }),
          supabase.from('encaminhamentos').select('*').order('data_encaminhamento', { ascending: false }),
        ]);

        const atletaIds = [
          ...new Set([
            ...(anamRes.data || []).map(a => a.atleta_id),
            ...(encamRes.data || []).map(e => e.atleta_id),
          ]),
        ];
        const { data: atletasData } = atletaIds.length > 0
          ? await supabase.from('atletas').select('id, nome').in('id', atletaIds)
          : { data: [] };
        const atletaMap = Object.fromEntries((atletasData || []).map(a => [a.id, a.nome]));

        return {
          tipo: 'servico_social',
          anamneses: (anamRes.data || []).map(a => ({ ...a, atleta_nome: atletaMap[a.atleta_id] || '?' })),
          encaminhamentos: (encamRes.data || []).map(e => ({ ...e, atleta_nome: atletaMap[e.atleta_id] || '?' })),
        };
      }

      // pedagogia
      let query = supabase.from('registro_escolar').select('*').order('data_registro', { ascending: false });
      if (periodoId !== 'todos') query = query.eq('periodo_id', periodoId);
      const { data, error } = await query;
      if (error) throw error;

      const atletaIds = [...new Set((data || []).map(r => r.atleta_id))];
      const { data: atletasData } = atletaIds.length > 0
        ? await supabase.from('atletas').select('id, nome, categoria').in('id', atletaIds)
        : { data: [] };
      const atletaMap = Object.fromEntries((atletasData || []).map(a => [a.id, a]));

      return {
        tipo: 'pedagogia',
        rows: (data || []).map(r => ({
          ...r,
          atleta_nome: atletaMap[r.atleta_id]?.nome || '?',
          atleta_categoria: atletaMap[r.atleta_id]?.categoria,
        })),
      };
    },
  });

  const generatePDF = async () => {
    if (!reportData) return;
    setGenerating(true);

    try {
      const doc = new jsPDF();
      const now = new Date().toLocaleDateString('pt-BR');
      const periodoLabel = periodoId === 'todos'
        ? 'Todos os períodos'
        : (() => {
            const p = periodos.find(p => p.id === periodoId);
            return p ? `${p.trimestre}º Trimestre ${p.ano}` : periodoId;
          })();

      // Header
      doc.setFontSize(18);
      doc.setTextColor(33, 53, 85);
      doc.text('Relatório Multidisciplinar', 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Gerado em: ${now}`, 14, 30);
      doc.text(`Departamento: ${tipo === 'psicologia' ? 'Psicologia' : tipo === 'servico_social' ? 'Serviço Social' : 'Pedagogia'}`, 14, 36);
      doc.text(`Período: ${periodoLabel}`, 14, 42);

      doc.setDrawColor(200);
      doc.line(14, 46, 196, 46);

      if (reportData.tipo === 'psicologia') {
        const rows = reportData.rows as any[];
        doc.setFontSize(12);
        doc.text(`Total de atendimentos: ${rows.length}`, 14, 54);

        // Quantitative stats
        const tipoCounts: Record<string, number> = {};
        const catCounts: Record<string, number> = {};
        rows.forEach(r => {
          tipoCounts[r.tipo_intervencao] = (tipoCounts[r.tipo_intervencao] || 0) + 1;
          if (r.categoria) catCounts[r.categoria] = (catCounts[r.categoria] || 0) + 1;
        });

        autoTable(doc, {
          startY: 60,
          head: [['Tipo de Intervenção', 'Quantidade']],
          body: Object.entries(tipoCounts).map(([k, v]) => [k.replace(/_/g, ' '), v.toString()]),
          theme: 'striped',
          headStyles: { fillColor: [88, 55, 140] },
        });

        const finalY = (doc as any).lastAutoTable?.finalY || 100;

        if (Object.keys(catCounts).length > 0) {
          autoTable(doc, {
            startY: finalY + 10,
            head: [['Categoria', 'Atendimentos']],
            body: Object.entries(catCounts).map(([k, v]) => [
              categoryLabels[k as CategoriaAtleta] || k,
              v.toString(),
            ]),
            theme: 'striped',
            headStyles: { fillColor: [88, 55, 140] },
          });
        }
      } else if (reportData.tipo === 'servico_social') {
        const { anamneses, encaminhamentos } = reportData as any;

        doc.setFontSize(12);
        doc.text(`Anamneses: ${anamneses.length} | Encaminhamentos: ${encaminhamentos.length}`, 14, 54);

        autoTable(doc, {
          startY: 60,
          head: [['Atleta', 'Moradia', 'Renda', 'Benefícios']],
          body: anamneses.slice(0, 50).map((a: any) => [
            a.atleta_nome,
            a.situacao_moradia || '-',
            a.renda_familiar || '-',
            a.beneficios_sociais || '-',
          ]),
          theme: 'striped',
          headStyles: { fillColor: [0, 130, 115] },
        });

        const finalY = (doc as any).lastAutoTable?.finalY || 100;

        autoTable(doc, {
          startY: finalY + 10,
          head: [['Atleta', 'Tipo', 'Destino', 'Status']],
          body: encaminhamentos.slice(0, 50).map((e: any) => [
            e.atleta_nome,
            e.tipo,
            e.destino,
            e.status || 'pendente',
          ]),
          theme: 'striped',
          headStyles: { fillColor: [0, 130, 115] },
        });
      } else {
        const rows = (reportData as any).rows as any[];
        doc.setFontSize(12);
        doc.text(`Total de registros: ${rows.length}`, 14, 54);

        const freqVals = rows.filter(r => r.frequencia_percentual != null).map(r => r.frequencia_percentual);
        const notaVals = rows.filter(r => r.media_notas != null).map(r => r.media_notas);
        const avgFreq = freqVals.length > 0 ? (freqVals.reduce((a: number, b: number) => a + b, 0) / freqVals.length).toFixed(1) : '—';
        const avgNota = notaVals.length > 0 ? (notaVals.reduce((a: number, b: number) => a + b, 0) / notaVals.length).toFixed(1) : '—';

        doc.text(`Frequência média: ${avgFreq}% | Média de notas: ${avgNota}`, 14, 62);

        autoTable(doc, {
          startY: 70,
          head: [['Atleta', 'Categoria', 'Frequência', 'Média', 'Data']],
          body: rows.slice(0, 100).map((r: any) => [
            r.atleta_nome,
            r.atleta_categoria ? categoryLabels[r.atleta_categoria as CategoriaAtleta] : '-',
            r.frequencia_percentual != null ? `${r.frequencia_percentual}%` : '-',
            r.media_notas != null ? r.media_notas.toString() : '-',
            r.data_registro ? new Date(r.data_registro + 'T00:00:00').toLocaleDateString('pt-BR') : '-',
          ]),
          theme: 'striped',
          headStyles: { fillColor: [200, 100, 30] },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount} — Documento confidencial — Gerado automaticamente`, 14, 287);
      }

      doc.save(`relatorio-${tipo}-${now.replace(/\//g, '-')}.pdf`);
      toast({ title: 'PDF gerado com sucesso!' });
    } catch (error: any) {
      toast({ title: 'Erro ao gerar PDF', description: error.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const previewRows = () => {
    if (!reportData) return null;

    if (reportData.tipo === 'psicologia') {
      const rows = reportData.rows as any[];
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 10).map((r: any) => (
              <TableRow key={r.id} className="table-row-hover">
                <TableCell className="text-muted-foreground">{r.data_atendimento ? new Date(r.data_atendimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</TableCell>
                <TableCell>{r.tipo_intervencao?.replace(/_/g, ' ')}</TableCell>
                <TableCell>{r.categoria ? <Badge className="badge-psychology">{categoryLabels[r.categoria as CategoriaAtleta]}</Badge> : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (reportData.tipo === 'pedagogia') {
      const rows = (reportData as any).rows as any[];
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Atleta</TableHead>
              <TableHead>Frequência</TableHead>
              <TableHead>Média</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 10).map((r: any) => (
              <TableRow key={r.id} className="table-row-hover">
                <TableCell className="font-medium">{r.atleta_nome}</TableCell>
                <TableCell>{r.frequencia_percentual != null ? `${r.frequencia_percentual}%` : '-'}</TableCell>
                <TableCell>{r.media_notas != null ? r.media_notas : '-'}</TableCell>
                <TableCell className="text-muted-foreground">{r.data_registro ? new Date(r.data_registro + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    // servico_social
    const { anamneses, encaminhamentos } = reportData as any;
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium">Anamneses ({anamneses.length})</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Atleta</TableHead>
              <TableHead>Moradia</TableHead>
              <TableHead>Renda</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {anamneses.slice(0, 5).map((a: any) => (
              <TableRow key={a.id} className="table-row-hover">
                <TableCell className="font-medium">{a.atleta_nome}</TableCell>
                <TableCell className="text-muted-foreground">{a.situacao_moradia || '-'}</TableCell>
                <TableCell className="text-muted-foreground">{a.renda_familiar || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-sm font-medium">Encaminhamentos ({encaminhamentos.length})</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Atleta</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {encaminhamentos.slice(0, 5).map((e: any) => (
              <TableRow key={e.id} className="table-row-hover">
                <TableCell className="font-medium">{e.atleta_nome}</TableCell>
                <TableCell>{e.tipo}</TableCell>
                <TableCell><Badge variant="outline">{e.status || 'pendente'}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const totalRows = !reportData ? 0 :
    reportData.tipo === 'psicologia' ? (reportData.rows as any[]).length :
    reportData.tipo === 'servico_social' ? ((reportData as any).anamneses.length + (reportData as any).encaminhamentos.length) :
    ((reportData as any).rows as any[]).length;

  return (
    <div className="space-y-6">
      <Card className="card-elevated p-6">
        <h3 className="font-display font-semibold mb-4">Configurar Relatório</h3>
        <div className="grid sm:grid-cols-3 gap-4 items-end">
          <div>
            <Label>Departamento</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as ReportType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="psicologia">Psicologia</SelectItem>
                <SelectItem value="servico_social">Serviço Social</SelectItem>
                <SelectItem value="pedagogia">Pedagogia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Período</Label>
            <Select value={periodoId} onValueChange={setPeriodoId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os períodos</SelectItem>
                {periodos.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.trimestre}º Trimestre {p.ano} {p.fechado ? '🔒' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={generatePDF}
            disabled={generating || isLoading || totalRows === 0}
            className="bg-primary hover:bg-primary/90"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            Exportar PDF
          </Button>
        </div>
      </Card>

      {/* Preview */}
      <Card className="card-elevated overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Prévia do Relatório</span>
          </div>
          <Badge variant="outline">{totalRows} registros</Badge>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : totalRows === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhum dado encontrado para os filtros selecionados.</div>
        ) : (
          <div className="p-4">{previewRows()}</div>
        )}
      </Card>
    </div>
  );
}
