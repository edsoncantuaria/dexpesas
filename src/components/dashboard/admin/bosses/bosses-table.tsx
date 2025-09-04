// src/components/dashboard/admin/bosses/bosses-table.tsx
'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
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
import type { Boss } from '@/lib/definitions';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface BossesTableProps {
  data: Boss[];
  onEdit: (boss: Boss) => void;
  onDelete: (id: string) => void;
}

const formatNumber = (num: number) => new Intl.NumberFormat('pt-BR').format(num);

export function BossesTable({ data, onEdit, onDelete }: BossesTableProps) {
    const [deletingBoss, setDeletingBoss] = useState<Boss | null>(null);

    const columns: ColumnDef<Boss>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'hp',
      header: 'HP Total',
       cell: ({ row }) => <div className="font-semibold text-destructive">{formatNumber(row.getValue('hp'))}</div>,
    },
    {
      accessorKey: 'currentHp',
      header: 'HP Atual',
      cell: ({ row }) => <div className="font-mono">{formatNumber(row.getValue('currentHp'))}</div>,
    },
    {
       accessorKey: 'isActive',
       header: 'Status',
       cell: ({ row }) => {
            const isActive = row.getValue('isActive');
            return (
                <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-green-500' : ''}>
                    {isActive ? <CheckCircle className="mr-2 h-4 w-4"/> : <XCircle className="mr-2 h-4 w-4 text-muted-foreground"/>}
                    {isActive ? 'Ativo' : 'Inativo'}
                </Badge>
            )
       }
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const boss = row.original;
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
                <DropdownMenuItem onClick={() => onEdit(boss)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeletingBoss(boss)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Nenhum chefe encontrado. Crie o primeiro!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
     <AlertDialog open={!!deletingBoss} onOpenChange={(open) => !open && setDeletingBoss(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o chefe "{deletingBoss?.name}".
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction asChild>
                <Button variant="destructive" onClick={() => {
                    if (deletingBoss) onDelete(deletingBoss.id);
                    setDeletingBoss(null);
                }}>
                    Sim, Excluir
                </Button>
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
