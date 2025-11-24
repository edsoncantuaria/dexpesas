'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Position {
    id: string;
    asset: {
        ticker: string;
        name: string;
        class: string;
    };
    quantity: number;
    avgPrice: number;
    currentValue: number;
}

interface PositionTableProps {
    positions: Position[];
}

export default function PositionTable({ positions }: PositionTableProps) {
    if (positions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Posições</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">Nenhuma posição encontrada nesta carteira.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Posições Detalhadas</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ativo</TableHead>
                            <TableHead>Classe</TableHead>
                            <TableHead className="text-right">Qtd</TableHead>
                            <TableHead className="text-right">Preço Médio</TableHead>
                            <TableHead className="text-right">Valor Atual</TableHead>
                            <TableHead className="text-right">Resultado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {positions.map((pos) => {
                            const invested = Number(pos.quantity) * Number(pos.avgPrice);
                            const current = Number(pos.currentValue);
                            const pnl = current - invested;
                            const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;

                            return (
                                <TableRow key={pos.id}>
                                    <TableCell>
                                        <div className="font-medium">{pos.asset.ticker || pos.asset.name}</div>
                                        <div className="text-xs text-muted-foreground">{pos.asset.name}</div>
                                    </TableCell>
                                    <TableCell>{pos.asset.class}</TableCell>
                                    <TableCell className="text-right">{Number(pos.quantity).toLocaleString('pt-BR')}</TableCell>
                                    <TableCell className="text-right">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(pos.avgPrice))}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(current)}
                                    </TableCell>
                                    <TableCell className={`text-right ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        <div>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pnl)}</div>
                                        <div className="text-xs">({pnlPercent.toFixed(2)}%)</div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
