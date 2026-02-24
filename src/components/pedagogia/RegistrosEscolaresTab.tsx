import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { categoryLabels, CategoriaAtleta } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Loader2, Eye, Edit2 } from 'lucide-react';

export function RegistrosEscolaresTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialog, setViewDialog] = useState<any | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    atleta_id: '',
    periodo_id: '',
    frequencia_percentual: '',
    media_notas: '',
    queixas: '',
    ocorrencias: '',
    observacoes: '',
  });

  const { data: atletas = [] } = useQuery({
    queryKey: ['atletas-ativos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('atletas').select('*').eq('ativo', true).order('nome');
      if (error) throw error;
      return data;
    },
  });

  const { data: periodos = [] } = useQuery({
    queryKey: ['periodos-abertos'],
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

  const { data: registros = [], isLoading } = useQuery({
    queryKey: ['registros-escolares'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registro_escolar')
        .select('*')
        .order('data_registro', { ascending: false });
      if (error) throw error;

      const atletaIds = [...new Set((data || []).map((r) => r.atleta_id))];
      const periodoIds = [...new Set((data || []).filter((r) => r.periodo_id).map((r) => r.periodo_id!))];

      const [atletasRes, periodosRes] = await Promise.all([
        atletaIds.length > 0 ? supabase.from('atletas').select('id, nome, categoria').in('id', atletaIds) : { data: [] },
        periodoIds.length > 0 ? supabase.from('periodos_trimestrais').select('*').in('id', periodoIds) : { data: [] },
      ]);

      const atletaMap = Object.fromEntries((atletasRes.data || []).map((a) => [a.id, a]));
      const periodoMap = Object.fromEntries((periodosRes.data || []).map((p) => [p.id, p]));

      return (data || []).map((r) => ({
        ...r,
        atleta_nome: atletaMap[r.atleta_id]?.nome || 'Desconhecido',
        atleta_categoria: atletaMap[r.atleta_id]?.categoria,
        periodo_label: r.periodo_id && periodoMap[r.periodo_id]
          ? `${periodoMap[r.periodo_id].trimestre}º Tri ${periodoMap[r.periodo_id].ano}`
          : null,
        periodo_fechado: r.periodo_id && periodoMap[r.periodo_id] ? periodoMap[r.periodo_id].fechado : false,
      }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        atleta_id: form.atleta_id,
        profissional_id: user!.id,
        periodo_id: form.periodo_id || null,
        frequencia_percentual: form.frequencia_percentual ? parseFloat(form.frequencia_percentual) : null,
        media_notas: form.media_notas ? parseFloat(form.media_notas) : null,
        queixas: form.queixas || null,
        ocorrencias: form.ocorrencias || null,
        observacoes: form.observacoes || null,
      };
      if (editingId) {
        const { profissional_id, atleta_id, ...updatePayload } = payload;
        const { error } = await supabase.from('registro_escolar').update(updatePayload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('registro_escolar').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registros-escolares'] });
      toast({ title: editingId ? 'Registro atualizado' : 'Registro lançado' });
      closeDialog();
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm({ atleta_id: '', periodo_id: '', frequencia_percentual: '', media_notas: '', queixas: '', ocorrencias: '', observacoes: '' });
  };

  const openEdit = (r: any) => {
    if (r.periodo_fechado) {
      toast({ title: 'Período fechado', description: 'Este registro pertence a um período trimestral fechado e não pode ser editado.', variant: 'destructive' });
      return;
    }
    setEditingId(r.id);
    setForm({
      atleta_id: r.atleta_id,
      periodo_id: r.periodo_id || '',
      frequencia_percentual: r.frequencia_percentual?.toString() || '',
      media_notas: r.media_notas?.toString() || '',
      queixas: r.queixas || '',
      ocorrencias: r.ocorrencias || '',
      observacoes: r.observacoes || '',
    });
    setDialogOpen(true);
  };

  const filtered = registros.filter((r: any) =>
    r.atleta_nome?.toLowerCase().includes(search.toLowerCase())
  );

  const periodosAbertos = periodos.filter((p: any) => !p.fechado);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por atleta..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 input-field" />
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-[hsl(var(--pedagogy))] hover:bg-[hsl(var(--pedagogy))]/90">
          <Plus className="h-4 w-4 mr-2" />
          Novo Registro
        </Button>
      </div>

      <div className="card-elevated overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--pedagogy))]" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhum registro escolar encontrado.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Atleta</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Frequência</TableHead>
                <TableHead>Média</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r: any) => (
                <TableRow key={r.id} className="table-row-hover">
                  <TableCell className="font-medium">{r.atleta_nome}</TableCell>
                  <TableCell>
                    {r.atleta_categoria ? (
                      <Badge className="badge-pedagogy">{categoryLabels[r.atleta_categoria as CategoriaAtleta]}</Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {r.periodo_label ? (
                      <Badge variant={r.periodo_fechado ? 'secondary' : 'outline'}>
                        {r.periodo_label} {r.periodo_fechado ? '🔒' : ''}
                      </Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {r.frequencia_percentual != null ? (
                      <span className={r.frequencia_percentual < 75 ? 'text-destructive font-medium' : 'text-[hsl(var(--success))]'}>
                        {r.frequencia_percentual}%
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {r.media_notas != null ? (
                      <span className={r.media_notas < 6 ? 'text-destructive font-medium' : 'text-[hsl(var(--success))]'}>
                        {r.media_notas}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.data_registro ? new Date(r.data_registro + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => setViewDialog(r)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(r)} disabled={r.periodo_fechado}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Registro Escolar' : 'Novo Registro Escolar'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingId && (
              <div>
                <Label>Atleta *</Label>
                <Select value={form.atleta_id} onValueChange={(v) => setForm({ ...form, atleta_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o atleta" /></SelectTrigger>
                  <SelectContent>
                    {atletas.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>{a.nome} - {categoryLabels[a.categoria as CategoriaAtleta]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Período Trimestral</Label>
              <Select value={form.periodo_id} onValueChange={(v) => setForm({ ...form, periodo_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o período (opcional)" /></SelectTrigger>
                <SelectContent>
                  {periodosAbertos.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.trimestre}º Trimestre {p.ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Frequência (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.frequencia_percentual}
                  onChange={(e) => setForm({ ...form, frequencia_percentual: e.target.value })}
                  placeholder="Ex: 85.5"
                  className="input-field"
                />
              </div>
              <div>
                <Label>Média de Notas</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={form.media_notas}
                  onChange={(e) => setForm({ ...form, media_notas: e.target.value })}
                  placeholder="Ex: 7.5"
                  className="input-field"
                />
              </div>
            </div>
            <div>
              <Label>Queixas Pedagógicas</Label>
              <Textarea value={form.queixas} onChange={(e) => setForm({ ...form, queixas: e.target.value })} placeholder="Queixas relatadas pela escola..." rows={3} />
            </div>
            <div>
              <Label>Ocorrências</Label>
              <Textarea value={form.ocorrencias} onChange={(e) => setForm({ ...form, ocorrencias: e.target.value })} placeholder="Ocorrências disciplinares ou acadêmicas..." rows={3} />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Observações adicionais..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button
              disabled={(!editingId && !form.atleta_id) || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="bg-[hsl(var(--pedagogy))] hover:bg-[hsl(var(--pedagogy))]/90"
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? 'Atualizar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewDialog} onOpenChange={(open) => !open && setViewDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registro Escolar — {viewDialog?.atleta_nome}</DialogTitle>
          </DialogHeader>
          {viewDialog && (
            <div className="space-y-3 text-sm">
              {viewDialog.periodo_label && (
                <div>
                  <strong>Período:</strong>
                  <p className="text-muted-foreground mt-1">{viewDialog.periodo_label} {viewDialog.periodo_fechado ? '(Fechado)' : ''}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Frequência:</strong>
                  <p className={`mt-1 ${viewDialog.frequencia_percentual != null && viewDialog.frequencia_percentual < 75 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {viewDialog.frequencia_percentual != null ? `${viewDialog.frequencia_percentual}%` : 'Não informado'}
                  </p>
                </div>
                <div>
                  <strong>Média:</strong>
                  <p className={`mt-1 ${viewDialog.media_notas != null && viewDialog.media_notas < 6 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {viewDialog.media_notas != null ? viewDialog.media_notas : 'Não informado'}
                  </p>
                </div>
              </div>
              <div><strong>Queixas:</strong><p className="text-muted-foreground mt-1">{viewDialog.queixas || 'Nenhuma'}</p></div>
              <div><strong>Ocorrências:</strong><p className="text-muted-foreground mt-1">{viewDialog.ocorrencias || 'Nenhuma'}</p></div>
              <div><strong>Observações:</strong><p className="text-muted-foreground mt-1">{viewDialog.observacoes || 'Nenhuma'}</p></div>
              <div className="text-xs text-muted-foreground pt-2 border-t">
                Registrado em {viewDialog.data_registro ? new Date(viewDialog.data_registro + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
