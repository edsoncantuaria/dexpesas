// src/components/dashboard/admin/items/items-table.tsx
'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2, Gem, Scroll, Skull } from 'lucide-react';
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
import type { Item } from '@/lib/definitions';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import type { LucideIcon } from 'lucide-react';

interface ItemsTableProps {
  data: Item[];
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
}

const itemTypeMap: Record<string, { label: string; icon: LucideIcon }> = {
    consumable: { label: 'Consumível', icon: Gem },
    cosmetic: { label: 'Cosmético', icon: Skull },
    bonus: { label: 'Bônus', icon: Scroll },
};

const rarityColorMap: Record<string, string> = {
    common: 'bg-gray-500',
    rare: 'bg-blue-500',
    epic: 'bg-purple-600',
    legendary: 'bg-yellow-500',
}

export function ItemsTable({ data, onEdit, onDelete }: ItemsTableProps) {
    const [deletingItem, setDeletingItem] = useState<Item | null>(null);

    const columns: ColumnDef<Item>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }) => {
        const typeInfo = itemTypeMap[row.original.type];
        const Icon = typeInfo ? typeInfo.icon : Gem;
        return (
            <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground"/>
                <span className="font-medium">{row.getValue('name')}</span>
            </div>
        )
      },
    },
    {
      accessorKey: 'key',
      header: 'Chave',
      cell: ({ row }) => <code className="text-sm text-muted-foreground">{row.getValue('key')}</code>,
    },
     {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => <Badge variant="outline">{itemTypeMap[row.getValue('type')]?.label || 'N/A'}</Badge>,
    },
    {
      accessorKey: 'rarity',
      header: 'Raridade',
      cell: ({ row }) => {
        const rarity = row.getValue('rarity') as string;
        if (!rarity) return <span className="text-muted-foreground">-</span>
        return <Badge className={`${rarityColorMap[rarity]} text-white`}>{rarity}</Badge>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const item = row.original;
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
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeletingItem(item)}
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
                Nenhum item encontrado. Crie o primeiro!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
     <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o item "{deletingItem?.name}".
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction asChild>
                <Button variant="destructive" onClick={() => {
                    if (deletingItem) onDelete(deletingItem.id);
                    setDeletingItem(null);
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
