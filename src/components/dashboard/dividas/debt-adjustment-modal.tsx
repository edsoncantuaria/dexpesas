'use client';

import { useState } from 'react';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { AlertTriangle, DollarSign, Info } from 'lucide-react';
import { type DebtAdjustmentData } from '@/hooks/use-debts';

interface DebtAdjustmentModalProps {
    debt: {
        id: string;
        name: string;
        currentBalance: number;
    };
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onSubmit: (data: DebtAdjustmentData) => Promise<void>;
}

const ADJUSTMENT_REASONS = [
    { value: 'LATE_FEE', label: 'Multa por Atraso' },
    { value: 'INTEREST_INCREASE', label: 'Aumento de Juros' },
    { value: 'RENEGOTIATION', label: 'Renegociação' },
    { value: 'OTHER', label: 'Outro' }
] as const;

export function DebtAdjustmentModal({ debt, isOpen, setIsOpen, onSubmit }: DebtAdjustmentModalProps) {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState<DebtAdjustmentData['reason']>('LATE_FEE');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const amountValue = parseFloat(amount) || 0;
    const newBalance = Number(debt.currentBalance) + amountValue;
    const isNegativeAdjustment = amountValue < 0;
    const isSignificant = Math.abs(amountValue) > Number(debt.currentBalance) * 0.1; // More than 10%

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || !description.trim()) return;

        setIsSubmitting(true);
        try {
            await onSubmit({
                amount: amountValue,
                reason,
                description: description.trim()
            });
            // Reset form
            setAmount('');
            setReason('LATE_FEE');
            setDescription('');
            setIsOpen(false);
        } catch (error) {
            console.error('Error submitting adjustment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ResponsiveDialog
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            title="Registrar Ajuste"
            description={`Registre um ajuste na dívida ${debt.name}`}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Info Alert */}
                <div className="flex gap-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 text-sm">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p><strong>O que é um ajuste?</strong></p>
                        <p className="text-muted-foreground">
                            Use ajustes para registrar imprevistos como multas, renegociações ou aumentos de juros.
                            Valores positivos aumentam a dívida, valores negativos reduzem.
                        </p>
                    </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                    <Label htmlFor="amount">Valor do Ajuste *</Label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder="0.00 (use - para redução)"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="pl-10"
                            required
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Use valores positivos para aumentos e negativos para reduções
                    </p>
                </div>

                {/* Reason Select */}
                <div className="space-y-2">
                    <Label htmlFor="reason">Motivo do Ajuste *</Label>
                    <Select value={reason} onValueChange={(value) => setReason(value as DebtAdjustmentData['reason'])}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {ADJUSTMENT_REASONS.map((r) => (
                                <SelectItem key={r.value} value={r.value}>
                                    {r.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <Label htmlFor="description">Descrição *</Label>
                    <Textarea
                        id="description"
                        placeholder="Descreva o motivo deste ajuste..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        required
                    />
                    <p className="text-xs text-muted-foreground">
                        Explique o que causou este ajuste para manter um histórico claro
                    </p>
                </div>

                {/* Impact Preview */}
                {amountValue !== 0 && (
                    <div className={`rounded-lg p-4 space-y-3 ${amountValue > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-green-50 dark:bg-green-950/30'
                        }`}>
                        <div className="flex items-center gap-2 text-sm font-medium">
                            {amountValue > 0 ? (
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                            ) : (
                                <Info className="h-4 w-4 text-green-600" />
                            )}
                            <span>Impacto do Ajuste</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Saldo Atual</span>
                                <span className="font-medium">{formatCurrency(Number(debt.currentBalance))}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Ajuste</span>
                                <span className={`font-medium ${amountValue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {amountValue > 0 ? '+' : ''}{formatCurrency(amountValue)}
                                </span>
                            </div>
                            <div className="border-t pt-2 flex justify-between">
                                <span className="font-medium">Novo Saldo</span>
                                <span className="font-bold">{formatCurrency(newBalance)}</span>
                            </div>
                        </div>

                        {/* Warning for significant changes */}
                        {isSignificant && !isNegativeAdjustment && (
                            <div className="flex gap-2 items-start border-t pt-3">
                                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                    <strong>Atenção:</strong> Este ajuste aumentará sua dívida em mais de 10%.
                                    Certifique-se de que os dados estão corretos.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                        className="flex-1"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || !amount || !description.trim()}
                        className="flex-1"
                    >
                        {isSubmitting ? 'Registrando...' : 'Registrar Ajuste'}
                    </Button>
                </div>
            </form>
        </ResponsiveDialog>
    );
}
