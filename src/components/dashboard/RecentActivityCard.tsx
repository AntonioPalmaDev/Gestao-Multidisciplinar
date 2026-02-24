import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface Activity {
  id: string;
  type: 'psychology' | 'social' | 'pedagogy';
  title: string;
  description: string;
  time: string;
}

interface RecentActivityCardProps {
  activities: Activity[];
}

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  if (activities.length === 0) {
    return (
      <div className="card-elevated p-6">
        <h3 className="font-display font-semibold text-lg mb-4">Atividade Recente</h3>
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma atividade recente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated p-6">
      <h3 className="font-display font-semibold text-lg mb-4">Atividade Recente</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3">
            <div className={cn(
              "w-2 h-2 rounded-full mt-2 shrink-0",
              activity.type === 'psychology' && "bg-psychology",
              activity.type === 'social' && "bg-social",
              activity.type === 'pedagogy' && "bg-pedagogy",
            )} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{activity.title}</p>
              <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
