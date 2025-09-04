// src/components/dashboard/metas/goal-details-dialog.tsx
'use client';

import type { Goal, GoalContribution } from '@/lib/definitions';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GoalDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal;
  contributions: GoalContribution[];
}

export function GoalDetailsDialog({ isOpen, onClose, goal, contributions }: GoalDetailsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Histórico da Meta: {goal.name}</DialogTitle>
          <DialogDescription>
            Veja todas as contribuições feitas para esta meta.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contributions.length > 0 ? (
                contributions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{format(new Date(c.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    <TableCell className="text-right font-medium text-green-500">
                      {Number(c.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    Nenhuma contribuição encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
