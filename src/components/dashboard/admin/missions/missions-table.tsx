// src/components/dashboard/admin/missions/missions-table.tsx
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
import type { Mission } from '@/lib/definitions';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface MissionsTableProps {
  data: Mission[];
  onEdit: (mission: Mission) => void;
  onDelete: (id: string) => void;
}

export function MissionsTable({ data, onEdit, onDelete }: MissionsTableProps) {
    const [deletingMission, setDeletingMission] = useState<Mission | null>(null);

    const columns: ColumnDef<Mission>[] = [
    {
      accessorKey: 'title',
      header: 'Título',
      cell: ({ row }) => <div className="font-medium">{row.getValue('title')}</div>,
    },
    {
      accessorKey: 'xpReward',
      header: 'XP',
       cell: ({ row }) => <div className="font-semibold text-primary">+{row.getValue('xpReward')}</div>,
    },
    {
      accessorKey: 'minLevel',
      header: 'Nível Min.',
    },
    {
       accessorKey: 'isActive',
       header: 'Status',
       cell: ({ row }) => {
            const isActive = row.getValue('isActive');
            return (
                <Badge variant={isActive ? 'default' : 'secondary'}>
                    {isActive ? <CheckCircle className="mr-2 h-4 w-4 text-green-400"/> : <XCircle className="mr-2 h-4 w-4 text-muted-foreground"/>}
                    {isActive ? 'Ativa' : 'Inativa'}
                </Badge>
            )
       }
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const mission = row.original;
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
                <DropdownMenuItem onClick={() => onEdit(mission)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeletingMission(mission)}
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
                Nenhuma missão encontrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
     <AlertDialog open={!!deletingMission} onOpenChange={(open) => !open && setDeletingMission(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente a missão "{deletingMission?.title}".
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction asChild>
                <Button variant="destructive" onClick={() => {
                    if (deletingMission) onDelete(deletingMission.id);
                    setDeletingMission(null);
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
