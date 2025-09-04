// src/components/dashboard/admin/achievements/achievements-table.tsx
'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
import type { Achievement } from '@/lib/definitions';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface AchievementsTableProps {
  data: Achievement[];
  onEdit: (achievement: Achievement) => void;
  onDelete: (id: string) => void;
}

export function AchievementsTable({ data, onEdit, onDelete }: AchievementsTableProps) {
    const [deletingAchievement, setDeletingAchievement] = useState<Achievement | null>(null);

    const columns: ColumnDef<Achievement>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'description',
      header: 'Descrição',
       cell: ({ row }) => <div className="text-sm text-muted-foreground">{row.getValue('description')}</div>,
    },
    {
      accessorKey: 'icon',
      header: 'Ícone',
    },
    {
      accessorKey: 'xp',
      header: 'XP',
       cell: ({ row }) => <div className="font-semibold text-primary">+{row.getValue('xp')}</div>,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const achievement = row.original;
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
                <DropdownMenuItem onClick={() => onEdit(achievement)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeletingAchievement(achievement)}
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
                Nenhuma conquista encontrada. Crie a primeira!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
     <AlertDialog open={!!deletingAchievement} onOpenChange={(open) => !open && setDeletingAchievement(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente a conquista "{deletingAchievement?.name}".
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction asChild>
                <Button variant="destructive" onClick={() => {
                    if (deletingAchievement) onDelete(deletingAchievement.id);
                    setDeletingAchievement(null);
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
