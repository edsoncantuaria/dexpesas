// src/components/dashboard/clans/clan-bank-card.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Banknote, ArrowDown, ArrowUp, Divide, Download, Loader2 } from 'lucide-react';
import type { Clan, Account } from '@/lib/definitions';
import { ContributionDialog } from './contribution-dialog';
import { ExpenseDialog } from './expense-dialog';
import { SplitExpenseDialog } from './split-expense-dialog';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';


interface ClanBankCardProps {
  clan: Clan;
  userAccounts: Account[];
  onTransactionSuccess: () => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function ClanBankCard({ clan, userAccounts, onTransactionSuccess }: ClanBankCardProps) {
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isSplitExpenseOpen, setIsSplitExpenseOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await api.get(`/familia/${clan.id}/export`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `extrato_familia_${clan.name.toLowerCase().replace(/\s/g, '_')}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro ao exportar relatório.' });
    } finally {
        setIsExporting(false);
    }
  }

  const isAdmin = user?.clanMembership?.role === 'LEADER' || user?.clanMembership?.role === 'ADMIN';


  return (
    <>
      <Card className="shadow-lg h-full flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Banknote className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="font-headline text-xl">Caixa da Família</CardTitle>
                <CardDescription>O tesouro compartilhado para despesas e metas.</CardDescription>
              </div>
            </div>
             {isAdmin && (
                <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Exportar
                </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Saldo Atual</p>
            <p className="text-4xl font-bold tracking-tight text-primary">
              {formatCurrency(Number(clan.balance))}
            </p>
          </div>
        </CardContent>
        <CardFooter className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <Button variant="outline" onClick={() => setIsContributionOpen(true)}>
            <ArrowUp className="mr-2 h-4 w-4 text-green-500" />
            Contribuir
          </Button>
          {isAdmin && (
            <>
                <Button variant="outline" onClick={() => setIsExpenseOpen(true)} disabled={Number(clan.balance) <= 0}>
                    <ArrowDown className="mr-2 h-4 w-4 text-red-500" />
                    Despesa
                </Button>
                <Button variant="outline" onClick={() => setIsSplitExpenseOpen(true)} className="sm:col-span-2 lg:col-span-1" disabled={Number(clan.balance) <= 0}>
                    <Divide className="mr-2 h-4 w-4 text-blue-500" />
                    Ratear Despesa
                </Button>
            </>
          )}
        </CardFooter>
      </Card>
      
      <ContributionDialog
        isOpen={isContributionOpen}
        onClose={() => setIsContributionOpen(false)}
        clanId={clan.id}
        userAccounts={userAccounts}
        onSuccess={onTransactionSuccess}
      />
      
      <ExpenseDialog
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        clanId={clan.id}
        clanBalance={Number(clan.balance)}
        onSuccess={onTransactionSuccess}
      />

       <SplitExpenseDialog
        isOpen={isSplitExpenseOpen}
        onClose={() => setIsSplitExpenseOpen(false)}
        clanId={clan.id}
        clanBalance={Number(clan.balance)}
        onSuccess={onTransactionSuccess}
      />
    </>
  );
}
