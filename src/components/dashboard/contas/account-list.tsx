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
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

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
const getBankStyle = (institution: string): { bg: string; text: string } => {
  const name = institution.toLowerCase();

  // Mapeamento de palavras-chave para estilos
  const bankStyles: { [key: string]: { bg: string; text: string } } = {
    'nubank': { bg: 'bg-gradient-to-br from-purple-800 via-purple-700 to-purple-900', text: 'text-white' },
    'inter': { bg: 'bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700', text: 'text-white' },
    'itaú': { bg: 'bg-gradient-to-br from-blue-900 via-blue-800 to-orange-500', text: 'text-white' },
    'itau': { bg: 'bg-gradient-to-br from-blue-900 via-blue-800 to-orange-500', text: 'text-white' },
    'bradesco': { bg: 'bg-gradient-to-br from-red-700 via-red-600 to-red-800', text: 'text-white' },
    'santander': { bg: 'bg-gradient-to-br from-red-600 via-red-700 to-red-800', text: 'text-white' },
    'brasil': { bg: 'bg-gradient-to-br from-blue-800 via-blue-700 to-yellow-400', text: 'text-white' },
    'caixa': { bg: 'bg-gradient-to-br from-blue-700 via-blue-600 to-orange-500', text: 'text-white' },
    'c6': { bg: 'bg-gradient-to-br from-gray-900 via-gray-800 to-black', text: 'text-white' },
    'neon': { bg: 'bg-gradient-to-br from-cyan-500 via-cyan-600 to-blue-600', text: 'text-white' },
    'next': { bg: 'bg-gradient-to-br from-green-500 via-green-600 to-gray-900', text: 'text-white' },
    'picpay': { bg: 'bg-gradient-to-br from-green-500 via-green-600 to-green-700', text: 'text-white' },
    'pagbank': { bg: 'bg-gradient-to-br from-green-500 via-green-600 to-yellow-500', text: 'text-white' },
    'original': { bg: 'bg-gradient-to-br from-green-800 via-green-700 to-green-900', text: 'text-white' },
    'mercado pago': { bg: 'bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-600', text: 'text-white' },
    'safra': { bg: 'bg-gradient-to-br from-blue-900 via-blue-800 to-yellow-600', text: 'text-white' },
    'btg': { bg: 'bg-gradient-to-br from-blue-900 via-blue-800 to-black', text: 'text-white' },
  };

  for (const key in bankStyles) {
    if (name.includes(key)) {
      return bankStyles[key];
    }
  }

  // Estilo padrão
  return { bg: 'bg-gradient-to-br from-primary via-primary/90 to-primary/70', text: 'text-primary-foreground' };
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
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 text-center rounded-3xl border-2 border-dashed bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm">
        <div className="p-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
          <Landmark className="h-16 w-16 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className='text-2xl font-bold font-headline'>Nenhuma Conta Cadastrada</h3>
          <p className="text-muted-foreground max-w-md">
            Adicione suas contas bancárias para gerenciar seus saldos e transações.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account, index) => (
          <AccountCard
            key={account.id}
            account={account}
            index={index}
            onEdit={onEdit}
            onDelete={() => setDeletingAccount(account)}
          />
        ))}
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

function AccountCard({
  account,
  index,
  onEdit,
  onDelete
}: {
  account: Account;
  index: number;
  onEdit: (account: Account) => void;
  onDelete: () => void;
}) {
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-100, 0, 100],
    ['rgb(239 68 68 / 0.2)', 'transparent', 'rgb(59 130 246 / 0.2)']
  );

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 80;
    if (info.offset.x < -threshold) {
      onDelete();
    } else if (info.offset.x > threshold) {
      onEdit(account);
    }
  };

  const style = getBankStyle(account.instituicao);
  const Icon = accountTypeIcons[account.tipo] || Landmark;
  const projectedBalance = Number(account.saldo ?? account.saldoPago ?? 0);
  const availableBalance = Number(account.saldoPago ?? account.saldo ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      style={{ background }}
      className="relative rounded-2xl"
    >
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileHover={{ scale: 1.03, rotateY: 5 }}
        transition={{ duration: 0.3 }}
        className="relative group cursor-grab active:cursor-grabbing"
      >
        <Link href={`/dashboard/transacoes?accountId=${account.id}`} className="block">
          <Card className={cn(
            "shadow-xl transition-all hover:shadow-2xl rounded-2xl overflow-hidden border-none h-48 flex flex-col justify-between p-6 relative",
            style.bg,
            style.text
          )}>
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            <CardHeader className="p-0 relative z-10 [text-shadow:_1px_1px_3px_rgb(0_0_0_/_0.5)]">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold">{account.nome}</h3>
                <p className="font-semibold text-sm opacity-90">{account.instituicao}</p>
              </div>
            </CardHeader>

            <CardContent className="p-0 relative z-10 space-y-2 [text-shadow:_1px_1px_2px_rgb(0_0_0_/_0.3)]">
              <div>
                <p className="text-xs opacity-75 mb-1">Saldo disponível</p>
                <motion.p
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  className="text-3xl font-bold tracking-tight"
                >
                  {availableBalance.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </motion.p>
              </div>

              <div className="flex justify-between items-end">
                <p className="text-xs opacity-75">
                  Projetado: {projectedBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <div className="flex items-center gap-1.5 text-xs opacity-90">
                  <Icon className="h-4 w-4" />
                  <span className="capitalize font-semibold">{account.tipo}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <div className="absolute top-4 right-4 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white/90 bg-black/30 hover:bg-black/50 hover:text-white rounded-full backdrop-blur-sm transition-all"
                onClick={(e) => e.preventDefault()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(account); }}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    </motion.div>
  );
}
