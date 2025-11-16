// src/components/dashboard/contas/account-list.tsx
'use client';

import type { Account } from '@/lib/definitions';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MoreVertical, Pencil, Trash2, Landmark, PiggyBank, BarChart3, Wallet, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { DeleteAccountDialog } from './delete-account-dialog';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type AccountListProps = {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (accountId: string) => void;
  isLoading: boolean;
};

// Mapeamento de tipos de conta para ícones
const accountTypeIcons: Record<string, LucideIcon> = {
  corrente: Wallet,
  poupanca: PiggyBank,
  investimento: TrendingUp,
};

// Função para obter o estilo do banco
const getBankStyle = (institution: string): { bg: string; text: string; logoFilter?: string } => {
  const name = institution.toLowerCase();

  // Mapeamento de palavras-chave para estilos
  const bankStyles: { [key: string]: { bg: string; text: string; logoFilter?: string } } = {
    'nubank': { bg: 'bg-gradient-to-br from-purple-800 to-purple-600', text: 'text-white' },
    'inter': { bg: 'bg-gradient-to-br from-orange-500 to-orange-400', text: 'text-white' },
    'itaú': { bg: 'bg-gradient-to-br from-blue-900 to-orange-500', text: 'text-white' },
    'itau': { bg: 'bg-gradient-to-br from-blue-900 to-orange-500', text: 'text-white' },
    'bradesco': { bg: 'bg-gradient-to-br from-red-700 to-red-600', text: 'text-white' },
    'santander': { bg: 'bg-gradient-to-br from-red-600 to-red-500', text: 'text-white' },
    'brasil': { bg: 'bg-gradient-to-br from-blue-800 to-yellow-400', text: 'text-white' },
    'caixa': { bg: 'bg-gradient-to-br from-blue-700 to-orange-500', text: 'text-white' },
    'c6': { bg: 'bg-gradient-to-br from-gray-900 to-gray-700', text: 'text-white' },
    'neon': { bg: 'bg-gradient-to-br from-cyan-500 to-blue-500', text: 'text-white' },
    'next': { bg: 'bg-gradient-to-br from-green-500 to-gray-900', text: 'text-white' },
    'picpay': { bg: 'bg-gradient-to-br from-green-500 to-green-400', text: 'text-white' },
    'pagbank': { bg: 'bg-gradient-to-br from-green-500 to-yellow-400', text: 'text-white' },
    'original': { bg: 'bg-gradient-to-br from-green-800 to-green-700', text: 'text-white' },
    'mercado pago': { bg: 'bg-gradient-to-br from-cyan-400 to-blue-500', text: 'text-white' },
    'safra': { bg: 'bg-gradient-to-br from-blue-900 to-yellow-600', text: 'text-white' },
    'btg': { bg: 'bg-gradient-to-br from-blue-900 to-blue-800', text: 'text-white' },
  };

  for (const key in bankStyles) {
    if (name.includes(key)) {
      return bankStyles[key];
    }
  }

  // Estilo padrão
  return { bg: 'bg-gradient-to-br from-primary to-primary/80', text: 'text-primary-foreground' };
};


export function AccountList({ accounts, onEdit, onDelete, isLoading }: AccountListProps) {
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);

  const handleConfirmDelete = () => {
    if (!deletingAccount) return;
    onDelete(deletingAccount.id);
    setDeletingAccount(null);
  };
  
  if (isLoading) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
                 <Skeleton key={i} className="h-44 w-full rounded-2xl" />
            ))}
        </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => {
           const style = getBankStyle(account.instituicao);
           const Icon = accountTypeIcons[account.tipo] || Landmark;
           const projectedBalance = Number(account.saldo ?? account.saldoPago ?? 0);
           const availableBalance = Number(account.saldoPago ?? account.saldo ?? 0);
           return (
            <div key={account.id} className="relative group">
              <Link href={`/dashboard/transacoes?accountId=${account.id}`} className="block">
                  <Card className={cn("shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] rounded-2xl overflow-hidden border-none h-44 flex flex-col justify-between p-5", style.bg, style.text)}>
                  <CardHeader className="p-0 [text-shadow:_1px_1px_2px_rgb(0_0_0_/_0.4)]">
                      <div className="flex justify-between items-start">
                          <h3 className="text-lg font-bold">{account.nome}</h3>
                          <p className="font-semibold text-sm opacity-80">{account.instituicao}</p>
                      </div>
                  </CardHeader>
                  <CardContent className="p-0 [text-shadow:_1px_1px_2px_rgb(0_0_0_/_0.2)]">
                      <div className="space-y-1">
                          <p className="text-xs opacity-70">Saldo disponível</p>
                          <p className="text-3xl font-bold tracking-tight">
                              {availableBalance.toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                              })}
                          </p>
                          <p className="text-xs opacity-70">Saldo projetado: {projectedBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                          <div className="flex items-center gap-1.5 text-xs pt-1 opacity-80">
                             <Icon className="h-3.5 w-3.5" />
                             <span className="capitalize">{account.tipo}</span>
                          </div>
                      </div>
                  </CardContent>
              </Card>
              </Link>
              <div className="absolute top-4 right-4 z-10">
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 bg-black/20 hover:bg-black/40 hover:text-white rounded-full">
                          <MoreVertical className="h-4 w-4" />
                      </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(account)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={() => setDeletingAccount(account)}
                      >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                      </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
              </div>
            </div>
           )
        })}
      </div>
      
      <DeleteAccountDialog 
        isOpen={!!deletingAccount}
        onClose={() => setDeletingAccount(null)}
        onConfirm={handleConfirmDelete}
        accountName={deletingAccount?.nome || ''}
      />
    </>
  );
}
