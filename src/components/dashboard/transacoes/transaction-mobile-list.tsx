// src/components/dashboard/transacoes/transaction-mobile-list.tsx
'use client';

import {
  CheckCircle2,
  Circle,
  MoreVertical,
  Pencil,
  Trash2,
  Info,
  Eye,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Scale,
  MessageSquareText,
} from 'lucide-react';
import type { MouseEvent } from 'react';
import { useState, useMemo } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Account, Card as CardType, Transaction } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AttachmentPreviewer } from '@/components/ui/attachment-previewer';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { DeleteTransactionDialog } from './delete-transaction-dialog';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';


type TransactionMobileListProps = {
  data: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
  onTogglePaidStatus: (transactionId: string) => void;
  accounts: Account[];
  cards: CardType[];
};

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);


// Componente para o cabeçalho de resumo diário
const DailySummaryHeader = ({ date, transactions }: { date: string, transactions: Transaction[] }) => {
    const [isOpen, setIsOpen] = useState(false);

    const summary = useMemo(() => {
        const dailyTransactions = transactions;
        const paid = dailyTransactions.filter(t => t.pago);
        const income = paid.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + Number(t.valor), 0);
        const expense = paid.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + Number(t.valor), 0);
        const incomeForecast = dailyTransactions.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + Number(t.valor), 0);
        const expenseForecast = dailyTransactions.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + Number(t.valor), 0);
        const balance = income - expense;
        const balanceForecast = incomeForecast - expenseForecast;
        return { income, incomeForecast, expense, expenseForecast, balance, balanceForecast };
    }, [transactions]);

    const formatTransactionDate = (d: Date) => {
        if (isToday(d)) return 'Hoje';
        if (isYesterday(d)) return 'Ontem';
        return format(d, "dd 'de' MMMM", { locale: ptBR });
    };

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="px-3 pt-4 pb-2">
            <CollapsibleTrigger asChild>
                 <div className="flex justify-between items-center cursor-pointer">
                    <h3 className="text-sm font-semibold capitalize text-muted-foreground">
                        {formatTransactionDate(parseISO(date))}
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="text-right">
                           <p className={cn("text-sm font-bold", summary.balance >= 0 ? "text-green-500" : "text-destructive")}>
                                {formatCurrency(summary.balance)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Previsto: {formatCurrency(summary.balanceForecast)}
                            </p>
                        </div>
                        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                    </div>
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
                 <div className="mt-3 text-xs text-muted-foreground border-t pt-3 space-y-3">
                    {/* Bloco de Receitas */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-green-500/10 rounded-full"><ArrowUp className="h-4 w-4 text-green-500"/></div>
                            <p className="text-sm font-semibold text-foreground">Receitas</p>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-bold text-green-500">{formatCurrency(summary.income)}</p>
                           <p>Previsto: {formatCurrency(summary.incomeForecast)}</p>
                        </div>
                    </div>
                    <Separator/>
                     {/* Bloco de Despesas */}
                     <div className="flex justify-between items-center">
                         <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-red-500/10 rounded-full"><ArrowDown className="h-4 w-4 text-red-500"/></div>
                            <p className="text-sm font-semibold text-foreground">Despesas</p>
                        </div>
                         <div className="text-right">
                           <p className="text-sm font-bold text-destructive">{formatCurrency(summary.expense)}</p>
                           <p>Previsto: {formatCurrency(summary.expenseForecast)}</p>
                        </div>
                    </div>
                     <Separator/>
                     {/* Bloco de Balanço */}
                     <div className="flex justify-between items-center">
                         <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-gray-500/10 rounded-full"><Scale className="h-4 w-4 text-gray-500"/></div>
                            <p className="text-sm font-semibold text-foreground">Balanço Previsto</p>
                        </div>
                         <div className="text-right">
                           <p className={cn("text-sm font-bold", summary.balanceForecast >= 0 ? "text-primary" : "text-destructive")}>{formatCurrency(summary.balanceForecast)}</p>
                           <p>Saldo final considerando pendentes</p>
                        </div>
                    </div>
                 </div>
            </CollapsibleContent>
        </Collapsible>
    )
}


export function TransactionMobileList({
  data,
  onEdit,
  onDelete,
  onTogglePaidStatus,
  accounts,
  cards
}: TransactionMobileListProps) {
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const accountsAndCardsMap = new Map([...accounts, ...cards].map(item => [item.id, item.nome]));

  const handleDropdownClick = (e: MouseEvent) => {
    e.stopPropagation();
  };
  
  const handleToggleStatusClick = (e: MouseEvent, transactionId: string) => {
    e.stopPropagation();
    onTogglePaidStatus(transactionId);
  }

  const handlePreviewClick = (e: MouseEvent, objectName: string) => {
    e.stopPropagation();
    setViewingAttachment(objectName);
  }
  
  const groupedTransactions = data.reduce((acc, transaction) => {
    const dateKey = format(parseISO(transaction.data), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <>
    <div className="space-y-2">
      <AnimatePresence>
      {sortedDates.map((date, groupIndex) => (
         <motion.div 
            key={date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: groupIndex * 0.1 }}
          >
            <DailySummaryHeader date={date} transactions={groupedTransactions[date]}/>
            <div className="bg-card rounded-lg border">
                {groupedTransactions[date].map((transaction, itemIndex) => {
                    const isPaid = transaction.pago;
                    const isReceita = transaction.tipo === 'receita';
                    const sourceId = transaction.accountId || transaction.cardId;
                    const sourceName = sourceId ? accountsAndCardsMap.get(sourceId) : 'N/A';
                    
                    const installmentValue = Number(transaction.valor);
                    const valorTotalOriginal = Number(transaction.valorTotal) || 0;
                    const totalInstallments = transaction.totalInstallments || 1;
                    const valueWithoutInterestPerInstallment = valorTotalOriginal > 0 ? valorTotalOriginal / totalInstallments : 0;
                    const interestPerInstallment = transaction.withInterest ? installmentValue - valueWithoutInterestPerInstallment : 0;
                    

                    return (
                        <div key={transaction.id} onClick={() => onEdit(transaction)} className="cursor-pointer">
                            <div className="flex items-center p-3">
                                <button onClick={(e) => handleToggleStatusClick(e, transaction.id)} className="mr-3 flex-shrink-0">
                                    {isPaid ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </button>

                                <div className="flex-1 space-y-1 overflow-hidden">
                                    <p className={cn("font-medium leading-tight truncate", !isPaid && "text-muted-foreground")}>{transaction.descricao}</p>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <p className="text-xs text-muted-foreground truncate">
                                            {transaction.categoria} &bull; {sourceName}
                                        </p>
                                        {/* Exibição das Tags */}
                                        {transaction.tags && transaction.tags.map(tag => (
                                            <Badge key={tag.id} variant="secondary" className="font-normal text-xs">{tag.name}</Badge>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-1 ml-2">
                                     {transaction.notes && (
                                        <Popover>
                                            <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                                    <MessageSquareText className="h-4 w-4" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-64 p-2 text-sm whitespace-pre-wrap">
                                               {transaction.notes}
                                            </PopoverContent>
                                        </Popover>
                                     )}
                                     {transaction.attachmentUrl && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={(e) => handlePreviewClick(e, transaction.attachmentUrl!)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                     )}
                                     {interestPerInstallment > 0 && (
                                        <Popover>
                                            <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                                    <Info className="h-3 w-3" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-2 text-xs" onClick={(e) => e.stopPropagation()}>
                                               Juros da parcela: {interestPerInstallment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                    <div className={cn(
                                        'font-bold text-sm text-right whitespace-nowrap',
                                        isReceita ? 'text-green-500' : 'text-foreground',
                                        !isPaid && 'text-muted-foreground'
                                    )}>
                                        {isReceita ? '+' : '-'} {installmentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" onClick={handleDropdownClick}>
                                            <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" onClick={handleDropdownClick}>
                                            <DropdownMenuItem onClick={() => onEdit(transaction)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem 
                                                className="text-destructive focus:text-destructive"
                                                onClick={() => setDeletingTransaction(transaction)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                            {itemIndex < groupedTransactions[date].length - 1 && <Separator />}
                        </div>
                    );
                })}
            </div>
         </motion.div>
      ))}
      </AnimatePresence>
    </div>
    
    <DeleteTransactionDialog
      isOpen={!!deletingTransaction}
      onClose={() => setDeletingTransaction(null)}
      onConfirm={() => {
        if (deletingTransaction) {
            onDelete(deletingTransaction.id);
            setDeletingTransaction(null);
        }
      }}
      transactionDescription={deletingTransaction?.descricao || ''}
    />
    
    {/* Dialog para visualização de anexo */}
    <Dialog open={!!viewingAttachment} onOpenChange={(isOpen) => !isOpen && setViewingAttachment(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Visualizador de Comprovante</DialogTitle>
          </DialogHeader>
           {viewingAttachment && (
               <AttachmentPreviewer
                    objectName={viewingAttachment}
                    onRemove={() => {}} // Não precisamos da função de remover aqui
                />
           )}
        </DialogContent>
    </Dialog>
    </>
  );
}
