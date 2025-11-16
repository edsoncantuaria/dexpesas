// src/components/dashboard/overview/alerts-card.tsx
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardAlert } from '@/lib/definitions';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertsCardProps = {
  alerts: DashboardAlert[];
};

const severityMap: Record<
  DashboardAlert['severity'],
  { label: string; icon: React.ElementType; badgeClass: string; iconClass: string }
> = {
  critical: {
    label: 'Crítico',
    icon: AlertTriangle,
    badgeClass: 'bg-destructive/10 text-destructive',
    iconClass: 'text-destructive',
  },
  warning: {
    label: 'Atenção',
    icon: Info,
    badgeClass: 'bg-yellow-500/10 text-yellow-600',
    iconClass: 'text-yellow-600',
  },
  info: {
    label: 'Info',
    icon: Info,
    badgeClass: 'bg-blue-500/10 text-blue-600',
    iconClass: 'text-blue-600',
  },
};

export function AlertsCard({ alerts }: AlertsCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Alertas rápidos</CardTitle>
        <Badge variant={alerts.length > 0 ? 'destructive' : 'secondary'}>
          {alerts.length > 0 ? `+${alerts.length}` : 'Sem pendências'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Tudo em ordem. Nenhum alerta urgente.
          </div>
        ) : (
          alerts.slice(0, 5).map((alert) => {
            const config = severityMap[alert.severity];
            const Icon = config.icon;
            return (
              <div key={alert.id} className="rounded-md border p-3 space-y-2 bg-muted/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', config.badgeClass)}>
                      {config.label}
                    </span>
                    <p className="font-semibold text-sm">{alert.title}</p>
                  </div>
                  <Icon className={cn('h-4 w-4', config.iconClass)} />
                </div>
                <p className="text-sm text-muted-foreground">{alert.description}</p>
                {alert.href && (
                  <Link
                    href={alert.href}
                    className="inline-flex text-xs font-semibold text-primary hover:underline underline-offset-2"
                  >
                    Ir para a tela
                  </Link>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
