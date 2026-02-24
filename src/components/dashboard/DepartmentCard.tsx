import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DepartmentCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  stats: {
    label: string;
    value: string | number;
  }[];
  variant: 'psychology' | 'social' | 'pedagogy';
}

export function DepartmentCard({ title, description, icon: Icon, href, stats, variant }: DepartmentCardProps) {
  return (
    <div className={cn(
      "card-department group animate-slide-up",
      variant === 'psychology' && "border-l-psychology",
      variant === 'social' && "border-l-social",
      variant === 'pedagogy' && "border-l-pedagogy",
    )}>
      <div className="flex items-start gap-4 mb-4">
        <div className={cn(
          "p-3 rounded-lg shrink-0",
          variant === 'psychology' && "bg-psychology-light",
          variant === 'social' && "bg-social-light",
          variant === 'pedagogy' && "bg-pedagogy-light",
        )}>
          <Icon className={cn(
            "h-6 w-6",
            variant === 'psychology' && "text-psychology",
            variant === 'social' && "text-social",
            variant === 'pedagogy' && "text-pedagogy",
          )} />
        </div>
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-lg text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-muted/50 rounded-lg p-3">
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <Button asChild variant="outline" className="w-full group-hover:bg-muted transition-colors">
        <Link to={href}>
          Acessar módulo
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </Button>
    </div>
  );
}
