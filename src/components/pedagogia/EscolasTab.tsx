import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Loader2, Edit2, School, ToggleLeft, ToggleRight } from 'lucide-react';

export function EscolasTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    nome: '',
    endereco: '',
    telefone: '',
    email: '',
    responsavel: '',
  });

  const { data: escolas = [], isLoading } = useQuery({
    queryKey: ['escolas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('escolas')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: form.nome,
        endereco: form.endereco || null,
        telefone: form.telefone || null,
        email: form.email || null,
        responsavel: form.responsavel || null,
      };
      if (editingId) {
        const { error } = await supabase.from('escolas').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('escolas').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escolas'] });
      toast({ title: editingId ? 'Escola atualizada' : 'Escola cadastrada' });
      closeDialog();
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from('escolas').update({ ativo }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escolas'] });
      toast({ title: 'Status atualizado' });
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm({ nome: '', endereco: '', telefone: '', email: '', responsavel: '' });
  };

  const openEdit = (escola: any) => {
    setEditingId(escola.id);
    setForm({
      nome: escola.nome,
      endereco: escola.endereco || '',
      telefone: escola.telefone || '',
      email: escola.email || '',
      responsavel: escola.responsavel || '',
    });
    setDialogOpen(true);
  };

  const filtered = escolas.filter((e: any) =>
    e.nome?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar escola..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 input-field" />
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-[hsl(var(--pedagogy))] hover:bg-[hsl(var(--pedagogy))]/90">
          <Plus className="h-4 w-4 mr-2" />
          Nova Escola
        </Button>
      </div>

      <div className="card-elevated overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--pedagogy))]" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhuma escola encontrada.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e: any) => (
                <TableRow key={e.id} className="table-row-hover">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <School className="h-4 w-4 text-[hsl(var(--pedagogy))]" />
                      {e.nome}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-[200px]">{e.endereco || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{e.telefone || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{e.responsavel || '-'}</TableCell>
                  <TableCell>
                    <Badge className={e.ativo ? 'badge-pedagogy' : 'bg-muted text-muted-foreground'}>
                      {e.ativo ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(e)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMutation.mutate({ id: e.id, ativo: !e.ativo })}
                    >
                      {e.ativo ? <ToggleRight className="h-4 w-4 text-[hsl(var(--success))]" /> : <ToggleLeft className="h-4 w-4" />}
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
            <DialogTitle>{editingId ? 'Editar Escola' : 'Nova Escola'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome da escola" className="input-field" />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Endereço completo" className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(00) 00000-0000" className="input-field" />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="escola@email.com" className="input-field" />
              </div>
            </div>
            <div>
              <Label>Responsável</Label>
              <Input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} placeholder="Nome do responsável" className="input-field" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button
              disabled={!form.nome || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="bg-[hsl(var(--pedagogy))] hover:bg-[hsl(var(--pedagogy))]/90"
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
