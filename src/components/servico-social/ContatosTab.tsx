import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Atleta } from '@/types/database';
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
import { Plus, Search, Loader2, Edit2, Phone, Mail } from 'lucide-react';

const tipoContatoOptions = [
  { value: 'familiar', label: 'Familiar' },
  { value: 'parceiro', label: 'Parceiro Externo' },
  { value: 'escola', label: 'Escola' },
  { value: 'saude', label: 'Saúde' },
  { value: 'outro', label: 'Outro' },
];

export function ContatosTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');

  const [form, setForm] = useState({
    atleta_id: '',
    nome: '',
    parentesco: '',
    telefone: '',
    email: '',
    endereco: '',
    tipo: '',
    observacoes: '',
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

  const { data: contatos = [], isLoading } = useQuery({
    queryKey: ['contatos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contatos')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;

      const atletaIds = [...new Set((data || []).filter(c => c.atleta_id).map(c => c.atleta_id!))];
      let atletaMap: Record<string, string> = {};
      if (atletaIds.length > 0) {
        const { data: atletasData } = await supabase
          .from('atletas').select('id, nome').in('id', atletaIds);
        atletaMap = Object.fromEntries((atletasData || []).map(a => [a.id, a.nome]));
      }

      return (data || []).map(c => ({
        ...c,
        atleta_nome: c.atleta_id ? atletaMap[c.atleta_id] || 'Desconhecido' : null,
      }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: form.nome,
        tipo: form.tipo,
        atleta_id: form.atleta_id || null,
        parentesco: form.parentesco || null,
        telefone: form.telefone || null,
        email: form.email || null,
        endereco: form.endereco || null,
        observacoes: form.observacoes || null,
      };

      if (editingId) {
        const { error } = await supabase.from('contatos').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('contatos').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contatos'] });
      toast({ title: editingId ? 'Contato atualizado' : 'Contato registrado' });
      closeDialog();
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm({ atleta_id: '', nome: '', parentesco: '', telefone: '', email: '', endereco: '', tipo: '', observacoes: '' });
  };

  const openEdit = (contato: any) => {
    setEditingId(contato.id);
    setForm({
      atleta_id: contato.atleta_id || '',
      nome: contato.nome,
      parentesco: contato.parentesco || '',
      telefone: contato.telefone || '',
      email: contato.email || '',
      endereco: contato.endereco || '',
      tipo: contato.tipo,
      observacoes: contato.observacoes || '',
    });
    setDialogOpen(true);
  };

  const filtered = contatos
    .filter((c: any) => filterTipo === 'all' || c.tipo === filterTipo)
    .filter((c: any) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      (c.atleta_nome && c.atleta_nome.toLowerCase().includes(search.toLowerCase()))
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar contato..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 input-field" />
          </div>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {tipoContatoOptions.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-[hsl(var(--social))] hover:bg-[hsl(var(--social))]/90">
          <Plus className="h-4 w-4 mr-2" />
          Novo Contato
        </Button>
      </div>

      <div className="card-elevated overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--social))]" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhum contato encontrado.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Atleta</TableHead>
                <TableHead>Parentesco</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c: any) => (
                <TableRow key={c.id} className="table-row-hover">
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{tipoContatoOptions.find((t) => t.value === c.tipo)?.label || c.tipo}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.atleta_nome || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{c.parentesco || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {c.telefone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />{c.telefone}
                        </span>
                      )}
                      {c.email && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />{c.email}
                        </span>
                      )}
                      {!c.telefone && !c.email && '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Contato' : 'Novo Contato'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome completo" className="input-field" />
              </div>
              <div>
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {tipoContatoOptions.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Atleta Vinculado</Label>
                <Select value={form.atleta_id} onValueChange={(v) => setForm({ ...form, atleta_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    {atletas.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Parentesco</Label>
                <Input value={form.parentesco} onChange={(e) => setForm({ ...form, parentesco: e.target.value })} placeholder="Ex: Mãe, Pai..." className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(00) 00000-0000" className="input-field" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" className="input-field" />
              </div>
            </div>
            <div>
              <Label>Endereço</Label>
              <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Endereço completo" className="input-field" />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Observações..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button
              disabled={!form.nome || !form.tipo || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="bg-[hsl(var(--social))] hover:bg-[hsl(var(--social))]/90"
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
