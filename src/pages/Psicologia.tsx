import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  AtendimentoPsicologia, 
  Atleta, 
  TipoIntervencao,
  interventionLabels, 
  categoryLabels,
  CategoriaAtleta
} from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Brain, Calendar, Search, Loader2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AtendimentoWithAtletas extends AtendimentoPsicologia {
  atletas?: Atleta[];
}

export default function Psicologia() {
  const { user } = useAuth();
  const [atendimentos, setAtendimentos] = useState<AtendimentoWithAtletas[]>([]);
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    tipo_intervencao: '' as TipoIntervencao | '',
    data_atendimento: format(new Date(), 'yyyy-MM-dd'),
    hora_inicio: '',
    hora_fim: '',
    categoria: '' as CategoriaAtleta | '',
    descricao: '',
    observacoes_confidenciais: '',
    atletas_selecionados: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch atendimentos
      const { data: atendimentosData, error: atendimentosError } = await supabase
        .from('atendimentos_psicologia')
        .select('*')
        .order('data_atendimento', { ascending: false });

      if (atendimentosError) throw atendimentosError;

      // Fetch atletas for each atendimento
      const atendimentosWithAtletas = await Promise.all(
        (atendimentosData || []).map(async (atendimento) => {
          const { data: atletasData } = await supabase
            .from('atendimento_atletas')
            .select('atleta_id')
            .eq('atendimento_id', atendimento.id);

          if (atletasData && atletasData.length > 0) {
            const atletaIds = atletasData.map(a => a.atleta_id);
            const { data: atletasInfo } = await supabase
              .from('atletas')
              .select('*')
              .in('id', atletaIds);
            
            return { ...atendimento, atletas: atletasInfo || [] };
          }
          return { ...atendimento, atletas: [] };
        })
      );

      setAtendimentos(atendimentosWithAtletas as AtendimentoWithAtletas[]);

      // Fetch all atletas for the form
      const { data: atletasData, error: atletasError } = await supabase
        .from('atletas')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (atletasError) throw atletasError;
      setAtletas((atletasData as Atleta[]) || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tipo_intervencao) {
      toast.error('Selecione o tipo de intervenção');
      return;
    }
    if (formData.atletas_selecionados.length === 0) {
      toast.error('Selecione pelo menos um atleta');
      return;
    }

    setSaving(true);
    try {
      // Create atendimento
      const { data: atendimento, error: atendimentoError } = await supabase
        .from('atendimentos_psicologia')
        .insert({
          profissional_id: user?.id,
          tipo_intervencao: formData.tipo_intervencao,
          data_atendimento: formData.data_atendimento,
          hora_inicio: formData.hora_inicio || null,
          hora_fim: formData.hora_fim || null,
          categoria: formData.categoria || null,
          descricao: formData.descricao || null,
          observacoes_confidenciais: formData.observacoes_confidenciais || null,
        })
        .select()
        .single();

      if (atendimentoError) throw atendimentoError;

      // Link atletas
      const atletasInsert = formData.atletas_selecionados.map(atletaId => ({
        atendimento_id: atendimento.id,
        atleta_id: atletaId,
      }));

      const { error: atletasError } = await supabase
        .from('atendimento_atletas')
        .insert(atletasInsert);

      if (atletasError) throw atletasError;

      toast.success('Atendimento registrado com sucesso!');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating atendimento:', error);
      toast.error('Erro ao registrar atendimento');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo_intervencao: '',
      data_atendimento: format(new Date(), 'yyyy-MM-dd'),
      hora_inicio: '',
      hora_fim: '',
      categoria: '',
      descricao: '',
      observacoes_confidenciais: '',
      atletas_selecionados: [],
    });
  };

  const toggleAtleta = (atletaId: string) => {
    setFormData(prev => ({
      ...prev,
      atletas_selecionados: prev.atletas_selecionados.includes(atletaId)
        ? prev.atletas_selecionados.filter(id => id !== atletaId)
        : [...prev.atletas_selecionados, atletaId]
    }));
  };

  const interventionTypes = Object.entries(interventionLabels) as [TipoIntervencao, string][];
  const categories = Object.entries(categoryLabels) as [CategoriaAtleta, string][];

  const filteredAtendimentos = atendimentos.filter(a => 
    a.atletas?.some(atleta => atleta.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
    interventionLabels[a.tipo_intervencao].toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-psychology-light">
              <Brain className="h-8 w-8 text-psychology" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Psicologia</h1>
              <p className="text-muted-foreground">Registro de atendimentos e intervenções</p>
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-psychology hover:bg-psychology/90">
                <Plus className="mr-2 h-4 w-4" />
                Novo Atendimento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Atendimento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Tipo de Intervenção *</Label>
                    <Select
                      value={formData.tipo_intervencao}
                      onValueChange={(value) => setFormData({ ...formData, tipo_intervencao: value as TipoIntervencao })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {interventionTypes.map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Data *</Label>
                    <Input
                      type="date"
                      value={formData.data_atendimento}
                      onChange={(e) => setFormData({ ...formData, data_atendimento: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(value) => setFormData({ ...formData, categoria: value as CategoriaAtleta })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Hora Início</Label>
                    <Input
                      type="time"
                      value={formData.hora_inicio}
                      onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Hora Fim</Label>
                    <Input
                      type="time"
                      value={formData.hora_fim}
                      onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Atleta(s) *</Label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {atletas.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum atleta cadastrado</p>
                    ) : (
                      atletas.map((atleta) => (
                        <label
                          key={atleta.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                        >
                          <Checkbox
                            checked={formData.atletas_selecionados.includes(atleta.id)}
                            onCheckedChange={() => toggleAtleta(atleta.id)}
                          />
                          <span className="text-sm font-medium">{atleta.nome}</span>
                          <Badge variant="secondary" className="text-xs">
                            {categoryLabels[atleta.categoria]}
                          </Badge>
                        </label>
                      ))
                    )}
                  </div>
                  {formData.atletas_selecionados.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {formData.atletas_selecionados.length} atleta(s) selecionado(s)
                    </p>
                  )}
                </div>

                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descreva o atendimento..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Observações Confidenciais</Label>
                  <Textarea
                    value={formData.observacoes_confidenciais}
                    onChange={(e) => setFormData({ ...formData, observacoes_confidenciais: e.target.value })}
                    placeholder="Informações confidenciais (acesso restrito)..."
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Estas informações têm acesso restrito por RLS
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving} className="bg-psychology hover:bg-psychology/90">
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registrar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="stat-card border-l-4 border-l-psychology">
            <p className="text-2xl font-bold">{atendimentos.length}</p>
            <p className="text-sm text-muted-foreground">Total de atendimentos</p>
          </div>
          <div className="stat-card">
            <p className="text-2xl font-bold">
              {atendimentos.filter(a => a.tipo_intervencao === 'individual').length}
            </p>
            <p className="text-sm text-muted-foreground">Individuais</p>
          </div>
          <div className="stat-card">
            <p className="text-2xl font-bold">
              {atendimentos.filter(a => a.tipo_intervencao === 'grupo').length}
            </p>
            <p className="text-sm text-muted-foreground">Em grupo</p>
          </div>
          <div className="stat-card">
            <p className="text-2xl font-bold">
              {atendimentos.filter(a => a.tipo_intervencao === 'observacao_treino' || a.tipo_intervencao === 'observacao_jogo').length}
            </p>
            <p className="text-sm text-muted-foreground">Observações</p>
          </div>
        </div>

        {/* Search */}
        <div className="card-elevated p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por atleta ou tipo de intervenção..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="card-elevated overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-psychology" />
            </div>
          ) : filteredAtendimentos.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum atendimento encontrado' : 'Nenhum atendimento registrado'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Atleta(s)</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Horário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAtendimentos.map((atendimento) => (
                  <TableRow key={atendimento.id} className="table-row-hover cursor-pointer">
                    <TableCell>
                      {format(new Date(atendimento.data_atendimento), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge className="badge-psychology">
                        {interventionLabels[atendimento.tipo_intervencao]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {atendimento.atletas && atendimento.atletas.length > 0 ? (
                          <>
                            <span>{atendimento.atletas[0].nome}</span>
                            {atendimento.atletas.length > 1 && (
                              <Badge variant="outline" className="text-xs">
                                +{atendimento.atletas.length - 1}
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {atendimento.categoria ? categoryLabels[atendimento.categoria] : '-'}
                    </TableCell>
                    <TableCell>
                      {atendimento.hora_inicio 
                        ? `${atendimento.hora_inicio}${atendimento.hora_fim ? ` - ${atendimento.hora_fim}` : ''}`
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
