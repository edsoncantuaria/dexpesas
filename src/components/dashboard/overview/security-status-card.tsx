// src/components/dashboard/overview/security-status-card.tsx
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, ShieldCheck, Smartphone } from 'lucide-react';
import { SecuritySummary } from '@/lib/definitions';

type SecurityStatusCardProps = {
  security: SecuritySummary | null;
};

export function SecurityStatusCard({ security }: SecurityStatusCardProps) {
  if (!security) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          {security.twoFactorEnabled ? (
            <ShieldCheck className="h-5 w-5 text-green-600" />
          ) : (
            <Shield className="h-5 w-5 text-yellow-600" />
          )}
          <CardTitle>Segurança e acesso</CardTitle>
        </div>
        <Badge variant={security.twoFactorEnabled ? 'default' : 'destructive'}>
          {security.twoFactorEnabled ? '2FA ativo' : '2FA inativo'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {security.pendingApprovals.length > 0 ? (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
            Existem {security.pendingApprovals.length} dispositivos aguardando aprovação.
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum dispositivo pendente. Continue monitorando novos acessos.
          </p>
        )}

        {security.pendingApprovals.length > 0 && (
          <div className="space-y-2">
            {security.pendingApprovals.map((device) => (
              <div key={device.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{device.deviceName}</p>
                    <p className="text-xs text-muted-foreground">{device.platform}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(device.lastLoginAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        )}

        <Link href="/dashboard/configuracoes?tab=seguranca">
          <Button variant="outline" className="w-full">
            Gerenciar segurança
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
