import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'psychology' | 'social' | 'pedagogy';
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <div className={cn(
      "stat-card animate-fade-in",
      variant === 'psychology' && "border-l-4 border-l-psychology",
      variant === 'social' && "border-l-4 border-l-social",
      variant === 'pedagogy' && "border-l-4 border-l-pedagogy",
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "p-3 rounded-lg",
          variant === 'default' && "bg-primary/10",
          variant === 'psychology' && "bg-psychology-light",
          variant === 'social' && "bg-social-light",
          variant === 'pedagogy' && "bg-pedagogy-light",
        )}>
          <Icon className={cn(
            "h-5 w-5",
            variant === 'default' && "text-primary",
            variant === 'psychology' && "text-psychology",
            variant === 'social' && "text-social",
            variant === 'pedagogy' && "text-pedagogy",
          )} />
        </div>
        {trend && (
          <span className={cn(
            "text-sm font-medium px-2 py-1 rounded-full",
            trend.isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <p className="text-3xl font-display font-bold text-foreground mb-1">{value}</p>
      <p className="text-sm font-medium text-foreground/80 mb-1">{title}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
