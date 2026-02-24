import { AppLayout } from '@/components/layout/AppLayout';
import { GraduationCap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EscolasTab } from '@/components/pedagogia/EscolasTab';
import { MatriculasTab } from '@/components/pedagogia/MatriculasTab';
import { RegistrosEscolaresTab } from '@/components/pedagogia/RegistrosEscolaresTab';

export default function Pedagogia() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-[hsl(var(--pedagogy-light))]">
            <GraduationCap className="h-8 w-8 text-[hsl(var(--pedagogy))]" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Pedagogia</h1>
            <p className="text-muted-foreground">Matrículas escolares, frequência e desempenho acadêmico</p>
          </div>
        </div>

        <Tabs defaultValue="escolas" className="space-y-6">
          <TabsList>
            <TabsTrigger value="escolas">Escolas</TabsTrigger>
            <TabsTrigger value="matriculas">Matrículas</TabsTrigger>
            <TabsTrigger value="registros">Registros Escolares</TabsTrigger>
          </TabsList>

          <TabsContent value="escolas">
            <EscolasTab />
          </TabsContent>

          <TabsContent value="matriculas">
            <MatriculasTab />
          </TabsContent>

          <TabsContent value="registros">
            <RegistrosEscolaresTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
