import { AppLayout } from '@/components/layout/AppLayout';
import { Home } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnamnesesTab } from '@/components/servico-social/AnamnesesTab';
import { EncaminhamentosTab } from '@/components/servico-social/EncaminhamentosTab';
import { ContatosTab } from '@/components/servico-social/ContatosTab';

export default function ServicoSocial() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-[hsl(var(--social-light))]">
            <Home className="h-8 w-8 text-[hsl(var(--social))]" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Serviço Social</h1>
            <p className="text-muted-foreground">Anamneses, encaminhamentos e acompanhamento familiar</p>
          </div>
        </div>

        <Tabs defaultValue="anamneses" className="space-y-6">
          <TabsList>
            <TabsTrigger value="anamneses">Anamneses</TabsTrigger>
            <TabsTrigger value="encaminhamentos">Encaminhamentos</TabsTrigger>
            <TabsTrigger value="contatos">Contatos</TabsTrigger>
          </TabsList>

          <TabsContent value="anamneses">
            <AnamnesesTab />
          </TabsContent>

          <TabsContent value="encaminhamentos">
            <EncaminhamentosTab />
          </TabsContent>

          <TabsContent value="contatos">
            <ContatosTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
