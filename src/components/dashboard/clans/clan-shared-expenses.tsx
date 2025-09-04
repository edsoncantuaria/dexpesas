// src/components/dashboard/clans/clan-shared-expenses.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Landmark, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SharedExpense {
    id: string;
    description: string;
    totalAmount: number;
    createdAt: string;
    creator: { name: string };
    participants: { amountOwed: number, user: { name: string } }[];
    category: { label: string };
}

interface ClanSharedExpensesProps {
  expenses: SharedExpense[];
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function ClanSharedExpenses({ expenses }: ClanSharedExpensesProps) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
            <Users className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <CardTitle className="font-headline text-xl">Histórico de Rateios</CardTitle>
            <CardDescription>Despesas pagas pelo caixa comum e divididas entre os membros.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {expenses.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Responsável</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map(expense => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div className="font-medium">{expense.description}</div>
                      <Badge variant="outline">{expense.category.label}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-destructive">{formatCurrency(Number(expense.totalAmount))}</TableCell>
                    <TableCell>{format(new Date(expense.createdAt), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell>{expense.creator.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <p>Nenhuma despesa foi rateada ainda.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
