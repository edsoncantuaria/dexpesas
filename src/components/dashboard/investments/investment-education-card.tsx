// src/components/dashboard/investments/investment-education-card.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const classes = [
  {
    key: 'fixed-income',
    label: 'Renda Fixa',
    description: 'Tesouro Selic, CDBs e LCs. Ideal para reserva de emergência e metas de curto prazo.',
    badge: 'Conservador',
  },
  {
    key: 'funds',
    label: 'Fundos / ETFs',
    description: 'Diversifique com fundos de índice ou multimercados para equilibrar risco e retorno.',
    badge: 'Balanceado',
  },
  {
    key: 'crypto',
    label: 'Cripto & Ações',
    description: 'Para parcelas pequenas e objetivos de longo prazo. Sempre alinhe com sua tolerância de risco.',
    badge: 'Agressivo',
  },
];

export function InvestmentEducationCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Classes de ativos</CardTitle>
        <CardDescription>Conteúdo rápido para validar se o rendimento faz sentido.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {classes.map((item) => (
          <div key={item.key} className="rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{item.label}</p>
              <Badge variant="outline">{item.badge}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          Dica: registre o rendimento manualmente ao final do mês para que possamos comparar com o CDI e sugerir
          rebalanceamentos.
        </p>
      </CardContent>
    </Card>
  );
}

export default InvestmentEducationCard;
