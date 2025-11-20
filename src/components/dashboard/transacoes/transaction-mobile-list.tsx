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
  Calendar,
  CreditCard,
  Banknote,
  Check,
  X
} from 'lucide-react';
import type { MouseEvent } from 'react';
import { useState, useMemo, useEffect, useRef } from 'react';
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
import { AnimatePresence, motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';


type TransactionMobileListProps = {
  data: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
  onTogglePaidStatus: (transactionId: string) => void;
  accounts: Account[];
  cards: CardType[];
};

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const MOBILE_PAGE_SIZE = 30;

// --- Skeleton Component ---
export function TransactionListSkeleton() {
  return (
    <div className="space-y-6 pb-20 px-4 pt-4">
      {[1, 2].map((group) => (
        <div key={group} className="space-y-3">
          {/* Date Header Skeleton */}
          <div className="flex justify-between items-center py-2">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
          {/* Transaction Cards Skeleton */}
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center p-4 gap-3 bg-card/50 rounded-xl border border-border/40">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-3 w-16 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// --- Swipeable Card Component ---
const SwipeableTransactionCard = ({
  transaction,
  onEdit,
  onDelete,
  onTogglePaidStatus,
  accountsAndCardsMap,
  isEven,
  handlePreviewClick
}: {
  transaction: Transaction,
  onEdit: (t: Transaction) => void,
  onDelete: (id: string) => void,
  onTogglePaidStatus: (id: string) => void,
  accountsAndCardsMap: Map<string, string>,
  isEven: boolean,
  handlePreviewClick: (e: MouseEvent, url: string) => void
}) => {
  const x = useMotionValue(0);
  const controls = useMotionValue(0);
  const [swipedState, setSwipedState] = useState<'none' | 'left' | 'right'>('none');

  // Background color based on swipe
  const bg = useTransform(x, [-100, 0, 100], ['rgba(239, 68, 68, 0.2)', 'rgba(0,0,0,0)', 'rgba(59, 130, 246, 0.2)']);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -100 || velocity < -500) {
      // Swiped Left (Delete)
      onDelete(transaction.id);
    } else if (offset > 100 || velocity > 500) {
      // Swiped Right (Edit/Pay)
      // For now, let's toggle paid status on right swipe as a quick action, or edit?
      // User said: "para a direita para editar/pagar"
      // Let's trigger Edit for now, or maybe show options. 
      // Actually, let's just trigger Edit as it's safer.
      onEdit(transaction);
    }
  };

  const isPaid = transaction.pago;
  const isReceita = transaction.tipo === 'receita';
  const sourceId = transaction.accountId || transaction.cardId;
  const sourceName = sourceId ? accountsAndCardsMap.get(sourceId) : 'N/A';
  const Icon = transaction.cardId ? CreditCard : Banknote;

  const installmentValue = Number(transaction.valor);
  const valorTotalOriginal = Number(transaction.valorTotal) || 0;
  const totalInstallments = transaction.totalInstallments || 1;
  const valueWithoutInterestPerInstallment = valorTotalOriginal > 0 ? valorTotalOriginal / totalInstallments : 0;
  const interestPerInstallment = transaction.withInterest ? installmentValue - valueWithoutInterestPerInstallment : 0;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Background Actions */}
      <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
        <div className={cn("flex items-center gap-2 text-blue-500 font-semibold transition-opacity duration-200", x.get() > 50 ? "opacity-100" : "opacity-0")}>
          <Pencil className="h-5 w-5" /> Editar
        </div>
        <div className={cn("flex items-center gap-2 text-red-500 font-semibold transition-opacity duration-200", x.get() < -50 ? "opacity-100" : "opacity-0")}>
          Excluir <Trash2 className="h-5 w-5" />
        </div>
      </div>

      <motion.div
        style={{ x, background: bg }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        className={cn(
          "relative bg-card border-0 shadow-sm transition-colors duration-200 rounded-xl",
          isEven ? "bg-card/40" : "bg-card/80",
          !isPaid && "opacity-80"
        )}
        whileTap={{ cursor: "grabbing" }}
      >
        <div className="flex items-center p-4 gap-3" onClick={() => onEdit(transaction)}>
          <button
            onClick={(e) => { e.stopPropagation(); onTogglePaidStatus(transaction.id); }}
            className={cn(
              "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 z-10",
              isPaid
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {isPaid ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </button>

          <div className="flex-1 min-w-0 space-y-1 pointer-events-none">
            <div className="flex justify-between items-start gap-2">
              <p className={cn(
                "font-semibold text-sm leading-tight truncate",
                !isPaid && "text-muted-foreground"
              )}>
                {transaction.descricao}
              </p>
              <div className={cn(
                'font-bold text-sm whitespace-nowrap',
                isReceita ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground',
                !isPaid && 'text-muted-foreground'
              )}>
                {isReceita ? '+' : '-'} {installmentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate max-w-[100px] bg-muted/50 px-1.5 py-0.5 rounded-md">
                {transaction.categoria}
              </span>
              <span>&bull;</span>
              <div className="flex items-center gap-1 truncate">
                <Icon className="h-3 w-3" />
                <span className="truncate max-w-[80px]">{sourceName}</span>
              </div>
            </div>

            {(transaction.tags?.length > 0 || transaction.installment) && (
              <div className="flex flex-wrap gap-1 pt-1">
                {transaction.installment && (
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal border-primary/20 text-primary">
                    {transaction.installmentNumber}/{transaction.totalInstallments}
                  </Badge>
                )}
                {transaction.tags?.map(tag => (
                  <Badge key={tag.id} variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-muted/50 text-muted-foreground">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 z-10">
            {transaction.attachmentUrl && (
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                onClick={(e) => { e.stopPropagation(); handlePreviewClick(e, transaction.attachmentUrl!); }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}

            <div className="flex gap-1">
              {transaction.notes && (
                <Popover>
                  <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/50">
                      <MessageSquareText className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2 text-sm whitespace-pre-wrap">
                    {transaction.notes}
                  </PopoverContent>
                </Popover>
              )}
              {interestPerInstallment > 0 && <Info className="h-3 w-3 text-muted-foreground/50 mt-2" />}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}


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
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/40 pb-2 pt-4 px-4 -mx-4 mb-2 shadow-sm">
      <CollapsibleTrigger asChild>
        <div className="flex justify-between items-center cursor-pointer group">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary/70" />
            <h3 className="text-sm font-bold capitalize text-foreground group-hover:text-primary transition-colors">
              {formatTransactionDate(parseISO(date))}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className={cn("text-sm font-bold", summary.balanceForecast >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                {formatCurrency(summary.balanceForecast)}
              </p>
            </div>
            <div className={cn("p-1 rounded-full bg-muted transition-transform duration-300", isOpen && "rotate-180 bg-primary/10 text-primary")}>
              <ChevronDown className="h-3 w-3" />
            </div>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 text-xs text-muted-foreground border-t pt-3 space-y-3"
        >
          {/* Bloco de Receitas */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/10 rounded-full"><ArrowUp className="h-3 w-3 text-emerald-500" /></div>
              <p className="text-sm font-medium text-foreground">Receitas</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(summary.income)}</p>
              <p className="text-[10px]">Previsto: {formatCurrency(summary.incomeForecast)}</p>
            </div>
          </div>
          <Separator className="bg-border/50" />
          {/* Bloco de Despesas */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-500/10 rounded-full"><ArrowDown className="h-3 w-3 text-rose-500" /></div>
              <p className="text-sm font-medium text-foreground">Despesas</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{formatCurrency(summary.expense)}</p>
              <p className="text-[10px]">Previsto: {formatCurrency(summary.expenseForecast)}</p>
            </div>
          </div>
          <Separator className="bg-border/50" />
          {/* Bloco de Balanço */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-full"><Scale className="h-3 w-3 text-primary" /></div>
              <p className="text-sm font-medium text-foreground">Balanço Previsto</p>
            </div>
            <div className="text-right">
              <p className={cn("text-sm font-bold", summary.balanceForecast >= 0 ? "text-primary" : "text-destructive")}>{formatCurrency(summary.balanceForecast)}</p>
              <p className="text-[10px]">Saldo final considerando pendentes</p>
            </div>
          </div>
        </motion.div>
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
  const [visibleCount, setVisibleCount] = useState(MOBILE_PAGE_SIZE);
  const accountsAndCardsMap = new Map([...accounts, ...cards].map(item => [item.id, item.nome]));

  useEffect(() => {
    setVisibleCount(MOBILE_PAGE_SIZE);
  }, [data]);

  const handlePreviewClick = (e: MouseEvent, objectName: string) => {
    e.stopPropagation();
    setViewingAttachment(objectName);
  }

  const limitedTransactions = useMemo(
    () => data.slice(0, visibleCount),
    [data, visibleCount]
  );

  const groupedTransactions = limitedTransactions.reduce((acc, transaction) => {
    const dateKey = format(parseISO(transaction.data), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const hasMore = data.length > visibleCount;
  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + MOBILE_PAGE_SIZE, data.length));
  };

  return (
    <>
      <div className="space-y-6 pb-20">
        <AnimatePresence mode='popLayout'>
          {sortedDates.map((date, groupIndex) => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: groupIndex * 0.05 }}
            >
              <DailySummaryHeader date={date} transactions={groupedTransactions[date]} />
              <div className="space-y-2 px-1">
                {groupedTransactions[date].map((transaction, itemIndex) => (
                  <SwipeableTransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    onEdit={onEdit}
                    onDelete={(id) => setDeletingTransaction(transaction)}
                    onTogglePaidStatus={onTogglePaidStatus}
                    accountsAndCardsMap={accountsAndCardsMap}
                    isEven={itemIndex % 2 === 0}
                    handlePreviewClick={handlePreviewClick}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {hasMore && (
        <div className="flex justify-center px-3 pb-8">
          <Button variant="outline" onClick={handleLoadMore} className="rounded-full shadow-sm">
            Carregar mais ({limitedTransactions.length}/{data.length})
          </Button>
        </div>
      )}

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
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/90 border-0">
          {viewingAttachment && (
            <div className="relative w-full h-[80vh] flex items-center justify-center">
              <AttachmentPreviewer
                objectName={viewingAttachment}
                onRemove={() => { }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-white hover:bg-white/20 rounded-full"
                onClick={() => setViewingAttachment(null)}
              >
                <ChevronDown className="h-6 w-6" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
