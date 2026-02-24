import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, roleLabels } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { toast } from '@/hooks/use-toast';
import {
  UserCheck,
  UserX,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ProfileWithRole {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  ativo: boolean;
  created_at: string;
  role?: AppRole | null;
  role_id?: string | null;
}

const allRoles: AppRole[] = ['admin', 'psicologo', 'assistente_social', 'pedagogo', 'gestor'];

export function UserManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [assignDialog, setAssignDialog] = useState<ProfileWithRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole | ''>('');
  const [toggleDialog, setToggleDialog] = useState<ProfileWithRole | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      return (profiles || []).map((p) => {
        const userRole = roles?.find((r) => r.user_id === p.user_id);
        return {
          ...p,
          role: userRole?.role as AppRole | undefined,
          role_id: userRole?.id,
        } as ProfileWithRole;
      });
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role, existingRoleId }: { userId: string; role: AppRole; existingRoleId?: string | null }) => {
      if (existingRoleId) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('id', existingRoleId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Perfil atualizado', description: 'O perfil do usuário foi atribuído com sucesso.' });
      setAssignDialog(null);
      setSelectedRole('');
    },
    onError: (error) => {
      toast({ title: 'Erro', description: `Erro ao atribuir perfil: ${error.message}`, variant: 'destructive' });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ profileId, ativo }: { profileId: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ ativo })
        .eq('id', profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Usuário atualizado', description: 'Status do usuário alterado com sucesso.' });
      setToggleDialog(null);
    },
    onError: (error) => {
      toast({ title: 'Erro', description: `Erro ao alterar status: ${error.message}`, variant: 'destructive' });
    },
  });

  const filteredUsers = users.filter(
    (u) =>
      u.nome.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role?: AppRole | null) => {
    if (!role) return <Badge variant="outline" className="text-muted-foreground">Sem perfil</Badge>;
    const colorMap: Record<AppRole, string> = {
      admin: 'bg-destructive/10 text-destructive border-destructive/20',
      psicologo: 'badge-psychology',
      assistente_social: 'badge-social',
      pedagogo: 'badge-pedagogy',
      gestor: 'bg-primary/10 text-primary border-primary/20',
    };
    return <Badge className={colorMap[role]}>{roleLabels[role]}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <UserCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-display font-bold">{users.filter((u) => u.role).length}</p>
            <p className="text-xs text-muted-foreground">Com perfil</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[hsl(var(--warning))]/10">
            <ShieldAlert className="h-5 w-5 text-[hsl(var(--warning))]" />
          </div>
          <div>
            <p className="text-2xl font-display font-bold">{users.filter((u) => !u.role).length}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[hsl(var(--success))]/10">
            <ShieldCheck className="h-5 w-5 text-[hsl(var(--success))]" />
          </div>
          <div>
            <p className="text-2xl font-display font-bold">{users.filter((u) => u.ativo).length}</p>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 input-field"
        />
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className="table-row-hover">
                <TableCell className="font-medium">{user.nome}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>
                  <Badge variant={user.ativo ? 'default' : 'secondary'} className={user.ativo ? 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]' : ''}>
                    {user.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAssignDialog(user);
                      setSelectedRole(user.role || '');
                    }}
                  >
                    Perfil
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setToggleDialog(user)}
                  >
                    {user.ativo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Assign Role Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={(open) => !open && setAssignDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Perfil</DialogTitle>
            <DialogDescription>
              Selecione o perfil para <strong>{assignDialog?.nome}</strong>
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um perfil" />
            </SelectTrigger>
            <SelectContent>
              {allRoles.map((r) => (
                <SelectItem key={r} value={r}>
                  {roleLabels[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(null)}>Cancelar</Button>
            <Button
              disabled={!selectedRole || assignRoleMutation.isPending}
              onClick={() => {
                if (assignDialog && selectedRole) {
                  assignRoleMutation.mutate({
                    userId: assignDialog.user_id,
                    role: selectedRole as AppRole,
                    existingRoleId: assignDialog.role_id,
                  });
                }
              }}
            >
              {assignRoleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Active Dialog */}
      <Dialog open={!!toggleDialog} onOpenChange={(open) => !open && setToggleDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{toggleDialog?.ativo ? 'Desativar' : 'Ativar'} Usuário</DialogTitle>
            <DialogDescription>
              Deseja {toggleDialog?.ativo ? 'desativar' : 'ativar'} o usuário <strong>{toggleDialog?.nome}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToggleDialog(null)}>Cancelar</Button>
            <Button
              variant={toggleDialog?.ativo ? 'destructive' : 'default'}
              disabled={toggleActiveMutation.isPending}
              onClick={() => {
                if (toggleDialog) {
                  toggleActiveMutation.mutate({
                    profileId: toggleDialog.id,
                    ativo: !toggleDialog.ativo,
                  });
                }
              }}
            >
              {toggleActiveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
