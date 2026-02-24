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
import { Plus, Search, Loader2, Eye, Edit2 } from 'lucide-react';

export function AnamnesesTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialog, setViewDialog] = useState<any | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    atleta_id: '',
    composicao_familiar: '',
    situacao_moradia: '',
    renda_familiar: '',
    beneficios_sociais: '',
    situacao_escolar: '',
    observacoes: '',
  });

  const { data: atletas = [] } = useQuery({
    queryKey: ['atletas-ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atletas')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data as Atleta[];
    },
  });

  const { data: anamneses = [], isLoading } = useQuery({
    queryKey: ['anamneses-social'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anamnese_social')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch athlete names
      const atletaIds = [...new Set((data || []).map((a) => a.atleta_id))];
      if (atletaIds.length === 0) return [];

      const { data: atletasData } = await supabase
        .from('atletas')
        .select('id, nome, categoria')
        .in('id', atletaIds);

      const atletaMap = Object.fromEntries(
        (atletasData || []).map((a) => [a.id, a])
      );

      return (data || []).map((a) => ({
        ...a,
        atleta_nome: atletaMap[a.atleta_id]?.nome || 'Desconhecido',
        atleta_categoria: atletaMap[a.atleta_id]?.categoria,
      }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase
          .from('anamnese_social')
          .update({
            composicao_familiar: form.composicao_familiar || null,
            situacao_moradia: form.situacao_moradia || null,
            renda_familiar: form.renda_familiar || null,
            beneficios_sociais: form.beneficios_sociais || null,
            situacao_escolar: form.situacao_escolar || null,
            observacoes: form.observacoes || null,
          })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('anamnese_social').insert({
          atleta_id: form.atleta_id,
          profissional_id: user!.id,
          composicao_familiar: form.composicao_familiar || null,
          situacao_moradia: form.situacao_moradia || null,
          renda_familiar: form.renda_familiar || null,
          beneficios_sociais: form.beneficios_sociais || null,
          situacao_escolar: form.situacao_escolar || null,
          observacoes: form.observacoes || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anamneses-social'] });
      toast({ title: editingId ? 'Anamnese atualizada' : 'Anamnese registrada' });
      closeDialog();
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm({ atleta_id: '', composicao_familiar: '', situacao_moradia: '', renda_familiar: '', beneficios_sociais: '', situacao_escolar: '', observacoes: '' });
  };

  const openEdit = (anamnese: any) => {
    setEditingId(anamnese.id);
    setForm({
      atleta_id: anamnese.atleta_id,
      composicao_familiar: anamnese.composicao_familiar || '',
      situacao_moradia: anamnese.situacao_moradia || '',
      renda_familiar: anamnese.renda_familiar || '',
      beneficios_sociais: anamnese.beneficios_sociais || '',
      situacao_escolar: anamnese.situacao_escolar || '',
      observacoes: anamnese.observacoes || '',
    });
    setDialogOpen(true);
  };

  const filtered = anamneses.filter((a: any) =>
    a.atleta_nome?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por atleta..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 input-field" />
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-[hsl(var(--social))] hover:bg-[hsl(var(--social))]/90">
          <Plus className="h-4 w-4 mr-2" />
          Nova Anamnese
        </Button>
      </div>

      <div className="card-elevated overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--social))]" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhuma anamnese encontrada.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Atleta</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Data Registro</TableHead>
                <TableHead>Moradia</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a: any) => (
                <TableRow key={a.id} className="table-row-hover">
                  <TableCell className="font-medium">{a.atleta_nome}</TableCell>
                  <TableCell>
                    {a.atleta_categoria ? (
                      <Badge className="badge-social">{categoryLabels[a.atleta_categoria as CategoriaAtleta]}</Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {a.data_registro ? new Date(a.data_registro + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-[200px]">
                    {a.situacao_moradia || '-'}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => setViewDialog(a)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>
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
            <DialogTitle>{editingId ? 'Editar Anamnese' : 'Nova Anamnese Social'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingId && (
              <div>
                <Label>Atleta *</Label>
                <Select value={form.atleta_id} onValueChange={(v) => setForm({ ...form, atleta_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o atleta" /></SelectTrigger>
                  <SelectContent>
                    {atletas.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.nome} - {categoryLabels[a.categoria]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Composição Familiar</Label>
              <Textarea value={form.composicao_familiar} onChange={(e) => setForm({ ...form, composicao_familiar: e.target.value })} placeholder="Descreva a composição familiar..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Situação de Moradia</Label>
                <Input value={form.situacao_moradia} onChange={(e) => setForm({ ...form, situacao_moradia: e.target.value })} placeholder="Ex: Casa própria, aluguel..." className="input-field" />
              </div>
              <div>
                <Label>Renda Familiar</Label>
                <Input value={form.renda_familiar} onChange={(e) => setForm({ ...form, renda_familiar: e.target.value })} placeholder="Ex: 2 salários mínimos" className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Benefícios Sociais</Label>
                <Input value={form.beneficios_sociais} onChange={(e) => setForm({ ...form, beneficios_sociais: e.target.value })} placeholder="Ex: Bolsa Família..." className="input-field" />
              </div>
              <div>
                <Label>Situação Escolar</Label>
                <Input value={form.situacao_escolar} onChange={(e) => setForm({ ...form, situacao_escolar: e.target.value })} placeholder="Ex: Matriculado, evadido..." className="input-field" />
              </div>
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
              className="bg-[hsl(var(--social))] hover:bg-[hsl(var(--social))]/90"
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
            <DialogTitle>Anamnese Social — {viewDialog?.atleta_nome}</DialogTitle>
          </DialogHeader>
          {viewDialog && (
            <div className="space-y-3 text-sm">
              <div><strong>Composição Familiar:</strong><p className="text-muted-foreground mt-1">{viewDialog.composicao_familiar || 'Não informado'}</p></div>
              <div><strong>Situação de Moradia:</strong><p className="text-muted-foreground mt-1">{viewDialog.situacao_moradia || 'Não informado'}</p></div>
              <div><strong>Renda Familiar:</strong><p className="text-muted-foreground mt-1">{viewDialog.renda_familiar || 'Não informado'}</p></div>
              <div><strong>Benefícios Sociais:</strong><p className="text-muted-foreground mt-1">{viewDialog.beneficios_sociais || 'Não informado'}</p></div>
              <div><strong>Situação Escolar:</strong><p className="text-muted-foreground mt-1">{viewDialog.situacao_escolar || 'Não informado'}</p></div>
              <div><strong>Observações:</strong><p className="text-muted-foreground mt-1">{viewDialog.observacoes || 'Não informado'}</p></div>
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
