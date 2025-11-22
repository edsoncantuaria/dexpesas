'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardsStepProps {
    onComplete: (cards: any[]) => void;
    onBack: () => void;
    initialData?: any[];
    accounts?: any[]; // Para vincular conta de pagamento
}

export function CardsStep({ onComplete, onBack, initialData, accounts = [] }: CardsStepProps) {
    const [hasCards, setHasCards] = useState<boolean | null>(initialData ? true : null);
    const [cardCount, setCardCount] = useState(initialData?.length || 1);
    const [cards, setCards] = useState(initialData || [{
        nome: '',
        limite: 0,
        diaFechamento: 1,
        diaVencimento: 10,
        bandeira: 'visa' as 'visa' | 'mastercard' | 'elo' | 'amex',
        paymentAccountId: '',
        notes: '',
    }]);

    const handleSubmit = () => {
        if (hasCards) {
            // Validate cards
            const validCards = cards.filter(card => card.nome && card.limite > 0);

            // Check for invalid date combinations
            const invalidDateCards = validCards.filter(
                card => card.diaVencimento <= card.diaFechamento
            );

            if (invalidDateCards.length > 0) {
                alert(
                    'Atenção: O dia de vencimento deve ser DEPOIS do dia de fechamento. ' +
                    'Por favor, corrija os cartões destacados.'
                );
                return;
            }

            onComplete(validCards);
        } else {
            onComplete([]);
        }
    };

    const updateCard = (index: number, field: string, value: any) => {
        const newCards = [...cards];
        newCards[index] = { ...newCards[index], [field]: value };
        setCards(newCards);
    };

    const hasInvalidDates = (card: any) => {
        return card.diaVencimento <= card.diaFechamento;
    };

    const hasInvalidLimit = (card: any) => {
        return card.limite <= 0;
    };

    if (hasCards === null) {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
            >
                <div>
                    <h2 className="text-2xl font-bold">Cartões de Crédito</h2>
                    <p className="text-muted-foreground">Você possui cartões de crédito?</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Button
                        size="lg"
                        onClick={() => setHasCards(true)}
                        className="h-24"
                    >
                        Sim, tenho cartões
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={() => setHasCards(false)}
                        className="h-24"
                    >
                        Não tenho cartões
                    </Button>
                </div>

                <div className="flex justify-between">
                    <Button variant="outline" onClick={onBack}>Voltar</Button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div>
                <h2 className="text-2xl font-bold">Cartões de Crédito</h2>
                <p className="text-muted-foreground">Quantos cartões você tem?</p>
            </div>

            <div className="space-y-4">
                <div>
                    <Label>Quantidade de Cartões</Label>
                    <Select
                        value={String(cardCount)}
                        onValueChange={(v) => {
                            const count = Number(v);
                            setCardCount(count);
                            setCards(Array.from({ length: count }, (_, i) =>
                                cards[i] || {
                                    nome: '',
                                    limite: 0,
                                    diaFechamento: 1,
                                    diaVencimento: 10,
                                    bandeira: 'visa' as const,
                                    paymentAccountId: '',
                                    notes: '',
                                }
                            ));
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[1, 2, 3, 4, 5, 6].map(n => (
                                <SelectItem key={n} value={String(n)}>
                                    {n} cartão{n > 1 ? 'ões' : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {cards.map((card, index) => {
                    const invalidDates = hasInvalidDates(card);
                    const invalidLimit = hasInvalidLimit(card);
                    const hasErrors = invalidDates || invalidLimit;

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={cn(
                                "p-4 border rounded-lg space-y-4",
                                hasErrors && "border-red-500 bg-red-50 dark:bg-red-950/20"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-primary" />
                                <h4 className="font-medium">Cartão #{index + 1}</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <Label>Nome do Cartão *</Label>
                                    <Input
                                        placeholder="Ex: Nubank"
                                        value={card.nome}
                                        onChange={(e) => updateCard(index, 'nome', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label>Limite (R$) *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        placeholder="0.00"
                                        value={card.limite || ''}
                                        onChange={(e) => updateCard(index, 'limite', Number(e.target.value))}
                                    />
                                    {invalidLimit && (
                                        <p className="text-xs text-red-600 mt-1">
                                            Limite deve ser maior que R$ 0
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label>Bandeira *</Label>
                                    <Select
                                        value={card.bandeira}
                                        onValueChange={(v) => updateCard(index, 'bandeira', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="visa">Visa</SelectItem>
                                            <SelectItem value="mastercard">Mastercard</SelectItem>
                                            <SelectItem value="elo">Elo</SelectItem>
                                            <SelectItem value="amex">American Express</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Dia de Fechamento *</Label>
                                    <Select
                                        value={String(card.diaFechamento)}
                                        onValueChange={(v) => updateCard(index, 'diaFechamento', Number(v))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px]">
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                                <SelectItem key={day} value={String(day)}>
                                                    Dia {day}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Dia de Vencimento *</Label>
                                    <Select
                                        value={String(card.diaVencimento)}
                                        onValueChange={(v) => updateCard(index, 'diaVencimento', Number(v))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px]">
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                                <SelectItem key={day} value={String(day)}>
                                                    Dia {day}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {invalidDates && (
                                        <p className="text-xs text-red-600 mt-1">
                                            Vencimento deve ser DEPOIS do fechamento
                                        </p>
                                    )}
                                </div>
                            </div>

                            {accounts.length > 0 && (
                                <div>
                                    <Label className="text-muted-foreground">Conta de Pagamento (opcional)</Label>
                                    <Select
                                        value={card.paymentAccountId}
                                        onValueChange={(v) => updateCard(index, 'paymentAccountId', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione uma conta..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Nenhuma</SelectItem>
                                            {accounts.map((account: any, idx: number) => (
                                                <SelectItem key={idx} value={String(idx)}>
                                                    {account.nome} ({account.instituicao})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Conta usada para pagar este cartão
                                    </p>
                                </div>
                            )}

                            <div>
                                <Label className="text-muted-foreground">Observações (opcional)</Label>
                                <Textarea
                                    placeholder="Adicione notas sobre este cartão..."
                                    value={card.notes}
                                    onChange={(e) => updateCard(index, 'notes', e.target.value)}
                                    className="resize-none"
                                    rows={2}
                                    maxLength={200}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {card.notes?.length || 0}/200
                                </p>
                            </div>

                            {invalidDates && (
                                <Alert className="border-red-500">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                    <AlertDescription>
                                        <strong>Data inválida:</strong> O vencimento deve ocorrer DEPOIS do fechamento.
                                        Exemplo: Fecha dia 15, vence dia 25.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            <div className="flex justify-between">
                <Button variant="outline" onClick={() => setHasCards(null)}>Voltar</Button>
                <Button onClick={handleSubmit}>Próximo</Button>
            </div>
        </motion.div>
    );
}
