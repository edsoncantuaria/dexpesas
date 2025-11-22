// src/components/dashboard/cartoes/card-closing-info-dialog.tsx
'use client';

import { useState, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Info, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BankClosingInfo {
    name: string;
    closingDayGap: number;
    exampleDue: number;
    exampleClosing: number;
}

const BANK_CLOSING_INFO: BankClosingInfo[] = [
    { name: 'Nubank', closingDayGap: 7, exampleDue: 15, exampleClosing: 8 },
    { name: 'Inter', closingDayGap: 8, exampleDue: 15, exampleClosing: 7 },
    { name: 'C6 Bank', closingDayGap: 7, exampleDue: 15, exampleClosing: 8 },
    { name: 'Itaú', closingDayGap: 7, exampleDue: 15, exampleClosing: 8 },
    { name: 'Bradesco', closingDayGap: 8, exampleDue: 15, exampleClosing: 7 },
    { name: 'Banco do Brasil', closingDayGap: 10, exampleDue: 15, exampleClosing: 5 },
    { name: 'Santander', closingDayGap: 8, exampleDue: 15, exampleClosing: 7 },
    { name: 'Caixa Econômica', closingDayGap: 10, exampleDue: 15, exampleClosing: 5 },
    { name: 'BTG+ (BTG Pactual)', closingDayGap: 7, exampleDue: 15, exampleClosing: 8 },
    { name: 'Next (Bradesco)', closingDayGap: 7, exampleDue: 15, exampleClosing: 8 },
    { name: 'PicPay', closingDayGap: 7, exampleDue: 15, exampleClosing: 8 },
    { name: 'Will Bank', closingDayGap: 7, exampleDue: 15, exampleClosing: 8 },
    { name: 'XP', closingDayGap: 7, exampleDue: 15, exampleClosing: 8 },
    { name: 'Neon', closingDayGap: 7, exampleDue: 15, exampleClosing: 8 },
    { name: 'Original', closingDayGap: 8, exampleDue: 15, exampleClosing: 7 },
].sort((a, b) => a.name.localeCompare(b.name));

interface CardClosingInfoDialogProps {
    trigger?: React.ReactNode;
}

export function CardClosingInfoDialog({ trigger }: CardClosingInfoDialogProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredBanks = useMemo(() => {
        if (!searchTerm.trim()) return BANK_CLOSING_INFO;

        const term = searchTerm.toLowerCase();
        return BANK_CLOSING_INFO.filter(bank =>
            bank.name.toLowerCase().includes(term)
        );
    }, [searchTerm]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                    >
                        <Info className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Quanto tempo antes do vencimento a fatura fecha?</DialogTitle>
                    <DialogDescription>
                        Consulte quantos dias antes do vencimento a fatura fecha em cada banco
                    </DialogDescription>
                </DialogHeader>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Pesquisar banco..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="overflow-auto flex-1">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40%]">Banco</TableHead>
                                <TableHead className="text-center w-[25%]">Dias Antes do Vencimento</TableHead>
                                <TableHead className="w-[35%]">Exemplo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBanks.length > 0 ? (
                                filteredBanks.map((bank) => (
                                    <TableRow key={bank.name}>
                                        <TableCell className="font-medium">{bank.name}</TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                {bank.closingDayGap} dias
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            Venc. dia <strong>{bank.exampleDue}</strong> → Fecha dia <strong>{bank.exampleClosing}</strong>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                        Nenhum banco encontrado
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>
                        <strong>Nota:</strong> Os períodos apresentados são aproximados e podem variar de acordo com a modalidade do cartão.
                        Consulte seu banco ou aplicativo do cartão para informações precisas.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
