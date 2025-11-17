// src/components/dashboard/transacoes/transactions-table.tsx
'use client';

import { useEffect, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  getFilteredRowModel,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  Banknote,
  CheckCircle2,
  Circle,
  CreditCard,
  MessageSquareText,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Transaction, Account, Card as CardType } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DeleteTransactionDialog } from './delete-transaction-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TransactionsTableProps = {
  data: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
  onTogglePaidStatus: (transactionId: string) => void;
  accounts: Account[];
  cards: CardType[];
};

export function TransactionsTable({ 
    data, 
    onEdit, 
    onDelete, 
    onTogglePaidStatus,
    accounts,
    cards
}: TransactionsTableProps) {
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [data]);

  const accountsAndCardsMap = new Map([...accounts, ...cards].map(item => [item.id, item.nome]));

  const columns: ColumnDef<Transaction>[] = [
    {
      id: 'status',
      header: '',
      cell: ({ row }) => {
        const isPaid = row.original.pago;
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onTogglePaidStatus(row.original.id)}
                >
                  {isPaid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isPaid ? 'Marcar como não pago' : 'Marcar como pago'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'descricao',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="px-2"
        >
          Descrição
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const transaction = row.original;
        const isInstallment = transaction.installment;

        const installmentValue = Number(transaction.valor);
        const valorTotalOriginal = Number(transaction.valorTotal) || 0;
        const totalInstallments = transaction.totalInstallments || 1;
        const valueWithoutInterestPerInstallment = valorTotalOriginal > 0 ? valorTotalOriginal / totalInstallments : 0;
        const interestPerInstallment = transaction.withInterest ? installmentValue - valueWithoutInterestPerInstallment : 0;
        
        return (
            <div className="font-medium">
                 <div className='flex items-center gap-2'>
                    <span className='truncate max-w-[200px]'>{row.getValue('descricao')}</span>
                     {isInstallment && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Badge variant="outline" className="font-normal">
                                    {transaction.installmentNumber}/{transaction.totalInstallments}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                   <p>Parcela {transaction.installmentNumber} de {transaction.totalInstallments}.
                                   { interestPerInstallment > 0 && 
                                    ` Juros da parcela: ${interestPerInstallment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                                   }
                                   </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                     )}
                     {transaction.notes && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                   <p className="whitespace-pre-wrap">{transaction.notes}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                     )}
                 </div>
                 {/* Exibição das Tags */}
                {transaction.tags && transaction.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {transaction.tags.map(tag => (
                            <Badge key={tag.id} variant="secondary" className="font-normal">{tag.name}</Badge>
                        ))}
                    </div>
                )}
            </div>
        )
      },
    },
     {
      id: 'source',
      header: 'Conta/Cartão',
      cell: ({ row }) => {
        const transaction = row.original;
        const sourceId = transaction.accountId || transaction.cardId;
        const sourceName = sourceId ? accountsAndCardsMap.get(sourceId) : 'N/A';
        const Icon = transaction.cardId ? CreditCard : Banknote;
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
             <Icon className="h-4 w-4 shrink-0" />
             <span className='truncate max-w-[120px]'>{sourceName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'valor',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className='w-full justify-end px-2'
        >
          Valor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('valor'));
        const isReceita = row.original.tipo === 'receita';
        const formatted = amount.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        });

        return (
          <div className={cn('text-right font-semibold', isReceita ? 'text-green-500' : 'text-foreground')}>
            {isReceita ? `+ ${formatted}` : `- ${formatted}`}
          </div>
        );
      },
    },
    {
      accessorKey: 'categoria',
      header: 'Categoria',
      cell: ({row}) => (
        <Badge variant="outline">{row.original.category?.label || row.getValue('categoria')}</Badge>
      )
    },
    {
      accessorKey: 'data',
      header: 'Data',
      cell: ({ row }) => (
        <div className="capitalize text-muted-foreground">
          {format(new Date(row.getValue('data')), 'dd MMM', { locale: ptBR })}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const transaction = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(transaction)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  onClick={() => setDeletingTransaction(transaction)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  const totalRows = data.length;
  const currentRows = table.getRowModel().rows;
  const pageStart = totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const pageEnd = totalRows === 0 ? 0 : pageStart + currentRows.length - 1;

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {currentRows?.length ? (
                  currentRows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className={cn("cursor-pointer", !row.original.pago && 'text-muted-foreground/70 opacity-80')}
                      onClick={() => onEdit(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} onClick={(e) => ['status', 'actions'].includes(cell.column.id) && e.stopPropagation()}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-96 text-center">
                        Nenhuma transação encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-4 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {totalRows === 0 ? 'Nenhuma transação disponível' : `Mostrando ${pageStart}–${pageEnd} de ${totalRows}`}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Select
                value={String(pagination.pageSize)}
                onValueChange={(value) =>
                  setPagination((prev) => ({ ...prev, pageSize: Number(value), pageIndex: 0 }))
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Itens por página" />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} / página
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
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
    </>
  );
}
