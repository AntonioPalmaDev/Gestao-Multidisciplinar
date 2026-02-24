import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { CalendarDays, Lock, Plus, Loader2 } from 'lucide-react';

export function PeriodManagement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [closeDialog, setCloseDialog] = useState<string | null>(null);

  const [ano, setAno] = useState(new Date().getFullYear().toString());
  const [trimestre, setTrimestre] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['admin-periods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('periodos_trimestrais')
        .select('*')
        .order('ano', { ascending: false })
        .order('trimestre', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('periodos_trimestrais').insert({
        ano: parseInt(ano),
        trimestre: parseInt(trimestre),
        data_inicio: dataInicio,
        data_fim: dataFim,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-periods'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-current-period'] });
      toast({ title: 'Período criado', description: 'Período trimestral criado com sucesso.' });
      setShowCreate(false);
      setTrimestre('');
      setDataInicio('');
      setDataFim('');
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const closeMutation = useMutation({
    mutationFn: async (periodId: string) => {
      const { error } = await supabase
        .from('periodos_trimestrais')
        .update({ fechado: true, fechado_em: new Date().toISOString(), fechado_por: user?.id })
        .eq('id', periodId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-periods'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-current-period'] });
      toast({ title: 'Período fechado', description: 'O período foi fechado e os dados estão protegidos.' });
      setCloseDialog(null);
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">Períodos Trimestrais</h3>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Período
        </Button>
      </div>

      <div className="card-elevated overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ano</TableHead>
              <TableHead>Trimestre</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Fim</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {periods.map((p) => (
              <TableRow key={p.id} className="table-row-hover">
                <TableCell className="font-medium">{p.ano}</TableCell>
                <TableCell>{p.trimestre}º Trimestre</TableCell>
                <TableCell>{new Date(p.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>{new Date(p.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>
                  <Badge className={p.fechado ? 'bg-destructive/10 text-destructive' : 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]'}>
                    {p.fechado ? 'Fechado' : 'Aberto'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {!p.fechado && (
                    <Button variant="outline" size="sm" onClick={() => setCloseDialog(p.id)}>
                      <Lock className="h-4 w-4 mr-1" />
                      Fechar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {periods.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum período cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Período Trimestral</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ano</Label>
                <Input type="number" value={ano} onChange={(e) => setAno(e.target.value)} className="input-field" />
              </div>
              <div>
                <Label>Trimestre</Label>
                <Select value={trimestre} onValueChange={setTrimestre}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1º Trimestre</SelectItem>
                    <SelectItem value="2">2º Trimestre</SelectItem>
                    <SelectItem value="3">3º Trimestre</SelectItem>
                    <SelectItem value="4">4º Trimestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Início</Label>
                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="input-field" />
              </div>
              <div>
                <Label>Data Fim</Label>
                <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="input-field" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button
              disabled={!trimestre || !dataInicio || !dataFim || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Period Dialog */}
      <Dialog open={!!closeDialog} onOpenChange={(open) => !open && setCloseDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar Período</DialogTitle>
            <DialogDescription>
              Ao fechar este período, os dados ficarão apenas para leitura. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialog(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={closeMutation.isPending}
              onClick={() => closeDialog && closeMutation.mutate(closeDialog)}
            >
              {closeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Fechar Período
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
