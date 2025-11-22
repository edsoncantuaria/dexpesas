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
import { CardClosingInfoDialog } from '@/components/dashboard/cartoes/card-closing-info-dialog';

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
        closingDayGap: 7,
        diaVencimento: 10,
        bandeira: 'visa' as 'visa' | 'mastercard' | 'elo' | 'amex',
        paymentAccountId: 'none',
        notes: '',
    }]);

    const handleSubmit = () => {
        if (hasCards) {
            // Validate cards
            const validCards = cards.filter(card => card.nome && card.limite > 0);

            // Check for invalid closing gap (minimum 7 days)
            const invalidCards = validCards.filter(card => {
                return card.closingDayGap < 7 || card.closingDayGap > 14;
            });

            if (invalidCards.length > 0) {
                alert(
                    'Atenção: O período de fechamento deve ser entre 7 e 14 dias antes do vencimento. ' +
                    'Por favor, corrija os cartões destacados.'
                );
                return;
            }

            // Calcular diaFechamento para cada cartão antes de enviar
            const cardsWithClosingDay = validCards.map(card => {
                let calculatedClosingDay = card.diaVencimento - card.closingDayGap;
                if (calculatedClosingDay <= 0) {
                    calculatedClosingDay += 30;
                }
                return {
                    ...card,
                    diaFechamento: calculatedClosingDay
                };
            });

            onComplete(cardsWithClosingDay);
        } else {
            onComplete([]);
        }
    };

    const updateCard = (index: number, field: string, value: any) => {
        const newCards = [...cards];
        newCards[index] = { ...newCards[index], [field]: value };
        setCards(newCards);
    };

    const hasInvalidClosingGap = (card: any) => {
        return card.closingDayGap < 7 || card.closingDayGap > 14;
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
                        onClick={() => {
                            setHasCards(false);
                            onComplete([]); // Skip direto
                        }}
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
                                    closingDayGap: 7,
                                    diaVencimento: 10,
                                    bandeira: 'visa' as const,
                                    paymentAccountId: 'none',
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
                    const invalidClosingGap = hasInvalidClosingGap(card);
                    const invalidLimit = hasInvalidLimit(card);
                    const hasErrors = invalidClosingGap || invalidLimit;

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
                                    <Label>Dia do Vencimento da Fatura *</Label>
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
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Dia em que a fatura vence (1 a 31)
                                    </p>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <Label>Quantos dias antes fecha? *</Label>
                                        <CardClosingInfoDialog />
                                    </div>
                                    <Select
                                        value={String(card.closingDayGap || 7)}
                                        onValueChange={(v) => updateCard(index, 'closingDayGap', Number(v))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px]">
                                            {Array.from({ length: 8 }, (_, i) => i + 7).map(days => (
                                                <SelectItem key={days} value={String(days)}>
                                                    {days} dias antes
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Dias antes do vencimento que a fatura fecha (7 a 14)
                                    </p>
                                    {invalidClosingGap && (
                                        <p className="text-xs text-red-600 mt-1">
                                            Entre 7 e 14 dias
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
                                            <SelectItem value="none">Nenhuma</SelectItem>
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

                            {invalidClosingGap && (
                                <Alert className="border-red-500">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                    <AlertDescription>
                                        <strong>Período inválido:</strong> O período de fechamento deve ser entre 7 e 14 dias antes do vencimento.
                                        Exemplo: Se vence dia 15 e fecha 7 dias antes, a fatura fecha no dia 8.
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
