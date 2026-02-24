import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Atleta, categoryLabels, CategoriaAtleta } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Search, Users, Filter, Loader2 } from 'lucide-react';

export default function Atletas() {
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    data_nascimento: '',
    categoria: '' as CategoriaAtleta | '',
    posicao: '',
    numero_camisa: '',
    observacoes: '',
  });

  useEffect(() => {
    fetchAtletas();
  }, []);

  const fetchAtletas = async () => {
    try {
      const { data, error } = await supabase
        .from('atletas')
        .select('*')
        .order('nome');

      if (error) throw error;
      setAtletas((data as Atleta[]) || []);
    } catch (error) {
      console.error('Error fetching athletes:', error);
      toast.error('Erro ao carregar atletas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoria) {
      toast.error('Selecione uma categoria');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('atletas').insert({
        nome: formData.nome,
        data_nascimento: formData.data_nascimento,
        categoria: formData.categoria,
        posicao: formData.posicao || null,
        numero_camisa: formData.numero_camisa ? parseInt(formData.numero_camisa) : null,
        observacoes: formData.observacoes || null,
      });

      if (error) throw error;

      toast.success('Atleta cadastrado com sucesso!');
      setDialogOpen(false);
      setFormData({
        nome: '',
        data_nascimento: '',
        categoria: '',
        posicao: '',
        numero_camisa: '',
        observacoes: '',
      });
      fetchAtletas();
    } catch (error) {
      console.error('Error creating athlete:', error);
      toast.error('Erro ao cadastrar atleta');
    } finally {
      setSaving(false);
    }
  };

  const filteredAtletas = atletas.filter((atleta) => {
    const matchesSearch = atleta.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || atleta.categoria === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Object.entries(categoryLabels) as [CategoriaAtleta, string][];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">Atletas</h1>
            <p className="text-muted-foreground">Gerencie os atletas cadastrados no sistema</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Atleta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Atleta</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="nome">Nome completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="data_nascimento">Data de nascimento *</Label>
                    <Input
                      id="data_nascimento"
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoria">Categoria *</Label>
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
                    <Label htmlFor="posicao">Posição</Label>
                    <Input
                      id="posicao"
                      value={formData.posicao}
                      onChange={(e) => setFormData({ ...formData, posicao: e.target.value })}
                      placeholder="Ex: Atacante"
                    />
                  </div>
                  <div>
                    <Label htmlFor="numero_camisa">Número</Label>
                    <Input
                      id="numero_camisa"
                      type="number"
                      min="1"
                      max="99"
                      value={formData.numero_camisa}
                      onChange={(e) => setFormData({ ...formData, numero_camisa: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cadastrar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="card-elevated p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar atleta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {categories.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card-elevated overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredAtletas.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {searchTerm || categoryFilter !== 'all' 
                  ? 'Nenhum atleta encontrado com os filtros aplicados' 
                  : 'Nenhum atleta cadastrado'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Posição</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAtletas.map((atleta) => (
                  <TableRow key={atleta.id} className="table-row-hover cursor-pointer">
                    <TableCell className="font-medium">{atleta.nome}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {categoryLabels[atleta.categoria]}
                      </Badge>
                    </TableCell>
                    <TableCell>{atleta.posicao || '-'}</TableCell>
                    <TableCell>{atleta.numero_camisa || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={atleta.ativo ? 'default' : 'outline'}>
                        {atleta.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
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
