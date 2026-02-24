import { AppLayout } from '@/components/layout/AppLayout';
import { Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from '@/components/admin/UserManagement';
import { PeriodManagement } from '@/components/admin/PeriodManagement';

export default function Admin() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-primary/10">
            <Settings className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Administração</h1>
            <p className="text-muted-foreground">Gerenciamento de usuários e configurações do sistema</p>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="periods">Períodos Trimestrais</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="periods">
            <PeriodManagement />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
