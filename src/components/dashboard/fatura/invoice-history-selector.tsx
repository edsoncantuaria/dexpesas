// src/components/dashboard/fatura/invoice-history-selector.tsx
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, Clock, AlertCircle, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface InvoiceMonth {
    month: string;
    year: number;
    monthNumber: number;
    status: 'paid' | 'open' | 'overdue';
    totalAmount: number;
    paidAmount: number;
    balance: number;
    paymentDate: string | null;
    transactionCount: number;
}

interface InvoiceHistorySelectorProps {
    cardId: string;
    selectedMonth: Date;
    onMonthSelect: (date: Date) => void;
}

export function InvoiceHistorySelector({
    cardId,
    selectedMonth,
    onMonthSelect,
}: InvoiceHistorySelectorProps) {
    const [history, setHistory] = useState<InvoiceMonth[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, [cardId]);

    const fetchHistory = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/cards/${cardId}/invoices/history?months=12`);
            setHistory(response.data);
        } catch (error) {
            console.error('Erro ao buscar histórico:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelect = (monthStr: string) => {
        const [year, month] = monthStr.split('-').map(Number);
        const newDate = new Date(year, month - 1, 15); // Meio do mês
        onMonthSelect(newDate);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'paid':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'overdue':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Clock className="h-4 w-4 text-blue-500" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'paid':
                return 'Paga';
            case 'overdue':
                return 'Vencida';
            default:
                return 'Aberta';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'text-green-600 dark:text-green-400';
            case 'overdue':
                return 'text-red-600 dark:text-red-400';
            default:
                return 'text-blue-600 dark:text-blue-400';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
        );
    }

    const selectedMonthStr = selectedMonth.toISOString().slice(0, 7);

    return (
        <div className="w-full">
            <Select value={selectedMonthStr} onValueChange={handleSelect}>
                <SelectTrigger className="w-full">
                    <SelectValue>
                        {history.find(h => h.month === selectedMonthStr) && (
                            <div className="flex items-center gap-2">
                                {getStatusIcon(history.find(h => h.month === selectedMonthStr)!.status)}
                                <span className="capitalize">
                                    {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
                                </span>
                                <span className={cn("text-xs font-medium", getStatusColor(history.find(h => h.month === selectedMonthStr)!.status))}>
                                    ({getStatusText(history.find(h => h.month === selectedMonthStr)!.status)})
                                </span>
                            </div>
                        )}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                    {history.map((invoice) => (
                        <SelectItem key={invoice.month} value={invoice.month}>
                            <div className="flex items-center justify-between gap-4 w-full">
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(invoice.status)}
                                    <span className="capitalize">
                                        {format(new Date(invoice.year, invoice.monthNumber - 1, 15), 'MMMM yyyy', { locale: ptBR })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                    <span className={getStatusColor(invoice.status)}>
                                        {getStatusText(invoice.status)}
                                    </span>
                                    <span className="text-muted-foreground">
                                        R$ {invoice.totalAmount.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Summary info */}
            {history.find(h => h.month === selectedMonthStr) && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                            {history.find(h => h.month === selectedMonthStr)!.transactionCount} transações
                        </span>
                        {history.find(h => h.month === selectedMonthStr)!.paymentDate && (
                            <span className="text-xs text-green-600 dark:text-green-400">
                                Paga em {format(new Date(history.find(h => h.month === selectedMonthStr)!.paymentDate!), 'dd/MM/yyyy')}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
