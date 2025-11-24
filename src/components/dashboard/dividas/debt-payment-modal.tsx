'use client';

import { useState } from 'react';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { CalendarIcon, DollarSign, TrendingDown, Link2, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { type DebtPaymentData } from '@/hooks/use-debts';
import { useAccounts } from '@/hooks/use-accounts';

interface DebtPaymentModalProps {
    debt: {
        id: string;
        name: string;
        currentBalance: number;
        interestRate: number;
        categoryId?: string;
    };
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onSubmit: (data: DebtPaymentData) => Promise<void>;
}

export function DebtPaymentModal({ debt, isOpen, setIsOpen, onSubmit }: DebtPaymentModalProps) {
    const { accounts } = useAccounts();
    const [amount, setAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState<Date>(new Date());
    const [notes, setNotes] = useState('');
    const [isExtraPayment, setIsExtraPayment] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Integration options
    const [createTransaction, setCreateTransaction] = useState(true);
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');

    const amountValue = parseFloat(amount) || 0;

    // Simple interest calculation
    const monthlyRate = Number(debt.interestRate) / 100;
    const estimatedInterest = Math.min(Number(debt.currentBalance) * monthlyRate, amountValue);
    const estimatedPrincipal = Math.max(0, amountValue - estimatedInterest);
    const newBalance = Math.max(0, Number(debt.currentBalance) - estimatedPrincipal);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (amountValue <= 0) return;

        setIsSubmitting(true);
        try {
            // Prepare payment data
            const paymentData: DebtPaymentData = {
                amount: amountValue,
                paymentDate,
                isExtraPayment,
                notes: notes.trim() || undefined
            };

            // If creating transaction, we'll need to create it first and link
            if (createTransaction && selectedAccountId) {
                // Create transaction via API
                try {
                    const transactionResponse = await fetch('/api/transactions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            tipo: 'despesa',
                            valor: amountValue,
                            descricao: `Pagamento: ${debt.name}`,
                            data: paymentDate,
                            contaId: selectedAccountId,
                            categoriaId: debt.categoryId || null,
                            observacoes: notes.trim() || `Pagamento de dívida: ${debt.name}`
                        })
                    });

                    if (transactionResponse.ok) {
                        const transaction = await transactionResponse.json();
                        paymentData.transactionId = transaction.id;
                    }
                } catch (err) {
                    console.error('Error creating transaction:', err);
                    // Continue even if transaction creation fails
                }
            }

            await onSubmit(paymentData);

            // Reset form
            setAmount('');
            setNotes('');
            setIsExtraPayment(false);
            setPaymentDate(new Date());
            setCreateTransaction(true);
            setSelectedAccountId('');
            setIsOpen(false);
        } catch (error) {
            console.error('Error submitting payment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ResponsiveDialog
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            title="Registrar Pagamento"
            description={`Registre um pagamento para ${debt.name}`}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Amount Input */}
                <div className="space-y-2">
                    <Label htmlFor="amount">Valor do Pagamento *</Label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="pl-10"
                            required
                        />
                    </div>
                </div>

                {/* Payment Date */}
                <div className="space-y-2">
                    <Label>Data do Pagamento</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'w-full justify-start text-left font-normal',
                                    !paymentDate && 'text-muted-foreground'
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {paymentDate ? format(paymentDate, 'PPP', { locale: ptBR }) : 'Selecione a data'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={paymentDate}
                                onSelect={(date) => date && setPaymentDate(date)}
                                initialFocus
                                locale={ptBR}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <Separator />

                {/* Integration Section */}
                <div className="space-y-4 rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Link2 className="h-4 w-4" />
                        <span>Integração com Sistema</span>
                    </div>

                    {/* Create Transaction Toggle */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-0.5 flex-1">
                            <Label htmlFor="create-trans" className="text-sm font-normal">
                                Criar Transação Automaticamente
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Registra o pagamento também como despesa na conta selecionada
                            </p>
                        </div>
                        <Switch
                            id="create-trans"
                            checked={createTransaction}
                            onCheckedChange={setCreateTransaction}
                        />
                    </div>

                    {/* Account Selector */}
                    {createTransaction && (
                        <div className="space-y-2">
                            <Label htmlFor="account">Conta de Pagamento</Label>
                            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                <SelectTrigger id="account">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="Selecione a conta" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map((account) => (
                                        <SelectItem key={account.id} value={account.id}>
                                            <div className="flex items-center gap-2">
                                                <span>{account.nome}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    ({account.tipo})
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                    {accounts.length === 0 && (
                                        <div className="px-2 py-1 text-xs text-muted-foreground">
                                            Nenhuma conta cadastrada
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <Separator />

                {/* Extra Payment Toggle */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="extra-payment">Pagamento Extra</Label>
                        <p className="text-sm text-muted-foreground">
                            Marque se este for um pagamento além do mínimo
                        </p>
                    </div>
                    <Switch
                        id="extra-payment"
                        checked={isExtraPayment}
                        onCheckedChange={setIsExtraPayment}
                    />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <Label htmlFor="notes">Observações (opcional)</Label>
                    <Textarea
                        id="notes"
                        placeholder="Adicione notas sobre este pagamento..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                    />
                </div>

                {/* Calculation Preview */}
                {amountValue > 0 && (
                    <div className="rounded-lg bg-muted p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <TrendingDown className="h-4 w-4" />
                            <span>Previsão do Pagamento</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Juros (estimado)</span>
                                <span className="text-red-500 font-medium">{formatCurrency(estimatedInterest)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Principal</span>
                                <span className="text-green-600 font-medium">{formatCurrency(estimatedPrincipal)}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between">
                                <span className="font-medium">Novo Saldo</span>
                                <span className="font-bold">{formatCurrency(newBalance)}</span>
                            </div>
                            {newBalance <= 0 && (
                                <div className="text-green-600 font-medium text-center pt-2 flex items-center justify-center gap-2">
                                    🎉 Dívida Quitada!
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isSubmitting}
                        className="flex-1"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || amountValue <= 0 || (createTransaction && !selectedAccountId)}
                        className="flex-1"
                    >
                        {isSubmitting ? 'Registrando...' : 'Registrar Pagamento'}
                    </Button>
                </div>
            </form>
        </ResponsiveDialog>
    );
}
