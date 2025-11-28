import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type OverviewCardProps = {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
};

export function OverviewCard({ title, value, change, icon: Icon }: OverviewCardProps) {
  const isPositive = change.startsWith('+');
  const isNeutral = !change.startsWith('+') && !change.startsWith('-');
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={cn('text-xs', {
          'text-green-500': isPositive,
          'text-red-500': !isPositive && !isNeutral,
          'text-muted-foreground': isNeutral
        })}>
          {change}
        </p>
      </CardContent>
    </Card>
  );
}
