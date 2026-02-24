import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Atleta, categoryLabels, CategoriaAtleta } from '@/types/database';
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
import { Plus, Search, Loader2, Eye } from 'lucide-react';

const statusOptions = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
];

const tipoOptions = [
  { value: 'hospitalar', label: 'Hospitalar' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'juridico', label: 'Jurídico' },
  { value: 'educacional', label: 'Educacional' },
  { value: 'outro', label: 'Outro' },
];

const statusColors: Record<string, string> = {
  pendente: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]',
  em_andamento: 'bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]',
  concluido: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]',
  cancelado: 'bg-destructive/10 text-destructive',
};

export function EncaminhamentosTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialog, setViewDialog] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [form, setForm] = useState({
    atleta_id: '',
    tipo: '',
    destino: '',
    motivo: '',
    retorno: '',
  });

  const { data: atletas = [] } = useQuery({
    queryKey: ['atletas-ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atletas').select('*').eq('ativo', true).order('nome');
      if (error) throw error;
      return data as Atleta[];
    },
  });

  const { data: encaminhamentos = [], isLoading } = useQuery({
    queryKey: ['encaminhamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encaminhamentos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const atletaIds = [...new Set((data || []).map((e) => e.atleta_id))];
      if (atletaIds.length === 0) return [];

      const { data: atletasData } = await supabase
        .from('atletas').select('id, nome, categoria').in('id', atletaIds);

      const atletaMap = Object.fromEntries((atletasData || []).map((a) => [a.id, a]));

      return (data || []).map((e) => ({
        ...e,
        atleta_nome: atletaMap[e.atleta_id]?.nome || 'Desconhecido',
        atleta_categoria: atletaMap[e.atleta_id]?.categoria,
      }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('encaminhamentos').insert({
        atleta_id: form.atleta_id,
        profissional_id: user!.id,
        tipo: form.tipo,
        destino: form.destino,
        motivo: form.motivo,
        retorno: form.retorno || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encaminhamentos'] });
      toast({ title: 'Encaminhamento registrado' });
      closeDialog();
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('encaminhamentos').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encaminhamentos'] });
      toast({ title: 'Status atualizado' });
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setForm({ atleta_id: '', tipo: '', destino: '', motivo: '', retorno: '' });
  };

  const filtered = encaminhamentos
    .filter((e: any) => filterStatus === 'all' || e.status === filterStatus)
    .filter((e: any) =>
      e.atleta_nome?.toLowerCase().includes(search.toLowerCase()) ||
      e.destino?.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 input-field" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {statusOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-[hsl(var(--social))] hover:bg-[hsl(var(--social))]/90">
          <Plus className="h-4 w-4 mr-2" />
          Novo Encaminhamento
        </Button>
      </div>

      <div className="card-elevated overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--social))]" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhum encaminhamento encontrado.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Atleta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e: any) => (
                <TableRow key={e.id} className="table-row-hover">
                  <TableCell className="font-medium">{e.atleta_nome}</TableCell>
                  <TableCell className="capitalize">{tipoOptions.find((t) => t.value === e.tipo)?.label || e.tipo}</TableCell>
                  <TableCell className="text-muted-foreground">{e.destino}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.data_encaminhamento ? new Date(e.data_encaminhamento + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={e.status || 'pendente'}
                      onValueChange={(v) => updateStatusMutation.mutate({ id: e.id, status: v })}
                    >
                      <SelectTrigger className="w-[140px] h-8">
                        <Badge className={statusColors[e.status || 'pendente']}>
                          {statusOptions.find((s) => s.value === (e.status || 'pendente'))?.label}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setViewDialog(e)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Encaminhamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Atleta *</Label>
              <Select value={form.atleta_id} onValueChange={(v) => setForm({ ...form, atleta_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o atleta" /></SelectTrigger>
                <SelectContent>
                  {atletas.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {tipoOptions.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Destino *</Label>
                <Input value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} placeholder="Ex: Hospital X" className="input-field" />
              </div>
            </div>
            <div>
              <Label>Motivo *</Label>
              <Textarea value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Motivo do encaminhamento..." rows={3} />
            </div>
            <div>
              <Label>Retorno / Observações</Label>
              <Textarea value={form.retorno} onChange={(e) => setForm({ ...form, retorno: e.target.value })} placeholder="Informações de retorno..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button
              disabled={!form.atleta_id || !form.tipo || !form.destino || !form.motivo || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="bg-[hsl(var(--social))] hover:bg-[hsl(var(--social))]/90"
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewDialog} onOpenChange={(open) => !open && setViewDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Encaminhamento — {viewDialog?.atleta_nome}</DialogTitle>
          </DialogHeader>
          {viewDialog && (
            <div className="space-y-3 text-sm">
              <div><strong>Tipo:</strong> <span className="text-muted-foreground capitalize">{tipoOptions.find((t) => t.value === viewDialog.tipo)?.label || viewDialog.tipo}</span></div>
              <div><strong>Destino:</strong> <span className="text-muted-foreground">{viewDialog.destino}</span></div>
              <div><strong>Motivo:</strong><p className="text-muted-foreground mt-1">{viewDialog.motivo}</p></div>
              <div><strong>Retorno:</strong><p className="text-muted-foreground mt-1">{viewDialog.retorno || 'Sem retorno registrado'}</p></div>
              <div className="text-xs text-muted-foreground pt-2 border-t">
                Data: {viewDialog.data_encaminhamento ? new Date(viewDialog.data_encaminhamento + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
