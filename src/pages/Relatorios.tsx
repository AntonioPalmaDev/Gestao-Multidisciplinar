import { AppLayout } from '@/components/layout/AppLayout';
import { FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResumoGeral } from '@/components/relatorios/ResumoGeral';
import { ExportarRelatorio } from '@/components/relatorios/ExportarRelatorio';

export default function Relatorios() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-primary/10">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground">Estatísticas quantitativas e exportação de relatórios</p>
          </div>
        </div>

        <Tabs defaultValue="resumo" className="space-y-6">
          <TabsList>
            <TabsTrigger value="resumo">Resumo Geral</TabsTrigger>
            <TabsTrigger value="exportar">Exportar PDF</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo">
            <ResumoGeral />
          </TabsContent>

          <TabsContent value="exportar">
            <ExportarRelatorio />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
