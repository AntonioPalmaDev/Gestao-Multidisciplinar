import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { categoryLabels, CategoriaAtleta } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Search, Loader2, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';

const TURNOS = ['Manhã', 'Tarde', 'Noite', 'Integral'];

export function MatriculasTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    atleta_id: '',
    escola_id: '',
    serie: '',
    turno: '',
    ano_letivo: new Date().getFullYear().toString(),
  });

  const { data: atletas = [] } = useQuery({
    queryKey: ['atletas-ativos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('atletas').select('*').eq('ativo', true).order('nome');
      if (error) throw error;
      return data;
    },
  });

  const { data: escolas = [] } = useQuery({
    queryKey: ['escolas-ativas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('escolas').select('*').eq('ativo', true).order('nome');
      if (error) throw error;
      return data;
    },
  });

  const { data: matriculas = [], isLoading } = useQuery({
    queryKey: ['matriculas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('matriculas_escolares').select('*').order('ano_letivo', { ascending: false });
      if (error) throw error;

      const atletaIds = [...new Set((data || []).map((m) => m.atleta_id))];
      const escolaIds = [...new Set((data || []).map((m) => m.escola_id))];

      const [atletasRes, escolasRes] = await Promise.all([
        atletaIds.length > 0 ? supabase.from('atletas').select('id, nome, categoria').in('id', atletaIds) : { data: [] },
        escolaIds.length > 0 ? supabase.from('escolas').select('id, nome').in('id', escolaIds) : { data: [] },
      ]);

      const atletaMap = Object.fromEntries((atletasRes.data || []).map((a) => [a.id, a]));
      const escolaMap = Object.fromEntries((escolasRes.data || []).map((e) => [e.id, e]));

      return (data || []).map((m) => ({
        ...m,
        atleta_nome: atletaMap[m.atleta_id]?.nome || 'Desconhecido',
        atleta_categoria: atletaMap[m.atleta_id]?.categoria,
        escola_nome: escolaMap[m.escola_id]?.nome || 'Desconhecida',
      }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        atleta_id: form.atleta_id,
        escola_id: form.escola_id,
        serie: form.serie,
        turno: form.turno || null,
        ano_letivo: parseInt(form.ano_letivo),
      };
      if (editingId) {
        const { error } = await supabase.from('matriculas_escolares').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('matriculas_escolares').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matriculas'] });
      toast({ title: editingId ? 'Matrícula atualizada' : 'Matrícula registrada' });
      closeDialog();
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from('matriculas_escolares').update({ ativo }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matriculas'] });
      toast({ title: 'Status atualizado' });
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm({ atleta_id: '', escola_id: '', serie: '', turno: '', ano_letivo: new Date().getFullYear().toString() });
  };

  const openEdit = (m: any) => {
    setEditingId(m.id);
    setForm({
      atleta_id: m.atleta_id,
      escola_id: m.escola_id,
      serie: m.serie,
      turno: m.turno || '',
      ano_letivo: m.ano_letivo.toString(),
    });
    setDialogOpen(true);
  };

  const filtered = matriculas.filter((m: any) =>
    m.atleta_nome?.toLowerCase().includes(search.toLowerCase()) ||
    m.escola_nome?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar atleta ou escola..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 input-field" />
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-[hsl(var(--pedagogy))] hover:bg-[hsl(var(--pedagogy))]/90">
          <Plus className="h-4 w-4 mr-2" />
          Nova Matrícula
        </Button>
      </div>

      <div className="card-elevated overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--pedagogy))]" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhuma matrícula encontrada.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Atleta</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Escola</TableHead>
                <TableHead>Série</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m: any) => (
                <TableRow key={m.id} className="table-row-hover">
                  <TableCell className="font-medium">{m.atleta_nome}</TableCell>
                  <TableCell>
                    {m.atleta_categoria ? (
                      <Badge className="badge-pedagogy">{categoryLabels[m.atleta_categoria as CategoriaAtleta]}</Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.escola_nome}</TableCell>
                  <TableCell>{m.serie}</TableCell>
                  <TableCell className="text-muted-foreground">{m.turno || '-'}</TableCell>
                  <TableCell>{m.ano_letivo}</TableCell>
                  <TableCell>
                    <Badge className={m.ativo ? 'badge-pedagogy' : 'bg-muted text-muted-foreground'}>
                      {m.ativo ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleMutation.mutate({ id: m.id, ativo: !m.ativo })}>
                      {m.ativo ? <ToggleRight className="h-4 w-4 text-[hsl(var(--success))]" /> : <ToggleLeft className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Matrícula' : 'Nova Matrícula'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
            <div>
              <Label>Escola *</Label>
              <Select value={form.escola_id} onValueChange={(v) => setForm({ ...form, escola_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione a escola" /></SelectTrigger>
                <SelectContent>
                  {escolas.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Série *</Label>
                <Input value={form.serie} onChange={(e) => setForm({ ...form, serie: e.target.value })} placeholder="Ex: 9º ano" className="input-field" />
              </div>
              <div>
                <Label>Turno</Label>
                <Select value={form.turno} onValueChange={(v) => setForm({ ...form, turno: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {TURNOS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ano Letivo *</Label>
                <Input type="number" value={form.ano_letivo} onChange={(e) => setForm({ ...form, ano_letivo: e.target.value })} className="input-field" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button
              disabled={!form.atleta_id || !form.escola_id || !form.serie || !form.ano_letivo || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="bg-[hsl(var(--pedagogy))] hover:bg-[hsl(var(--pedagogy))]/90"
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? 'Atualizar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
