'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format, parse, eachMonthOfInterval, isBefore, startOfMonth, addMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CardHistoryStepProps {
    cards: any[];
    onComplete: (history: any) => void;
    onBack: () => void;
    initialData?: Record<number, any[]>;
}

export function CardHistoryStep({ cards, onComplete, onBack, initialData }: CardHistoryStepProps) {
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [lastMonthInput, setLastMonthInput] = useState('');
    const [monthsToCollect, setMonthsToCollect] = useState<Date[]>([]);
    const [showMonthForm, setShowMonthForm] = useState(false);
    const [cardHistories, setCardHistories] = useState<Record<number, any[]>>({});
    const [monthData, setMonthData] = useState<Record<string, {
        totalAmount: number;
        isClosed: boolean;
        isPaid: boolean;
    }>>({});
    const [hasSkipped, setHasSkipped] = useState(false);

    // Restore saved data
    useEffect(() => {
        if (initialData && Object.keys(initialData).length > 0) {
            setCardHistories(initialData);
        }
    }, [initialData]);

    // Restore local state for current card from cardHistories
    useEffect(() => {
        const savedHistory = cardHistories[currentCardIndex];
        if (savedHistory && savedHistory.length > 0) {
            // Reconstruct state from saved history
            const lastMonthStr = savedHistory[savedHistory.length - 1].month;
            setLastMonthInput(lastMonthStr);

            const lastMonth = parse(lastMonthStr, 'yyyy-MM', new Date());
            const today = startOfMonth(new Date());
            const months = eachMonthOfInterval({
                start: today,
                end: lastMonth,
            });
            setMonthsToCollect(months);

            const restoredMonthData: typeof monthData = {};
            savedHistory.forEach((item: any) => {
                restoredMonthData[item.month] = {
                    totalAmount: item.totalAmount,
                    isClosed: item.isClosed,
                    isPaid: item.isPaid
                };
            });
            setMonthData(restoredMonthData);
            setShowMonthForm(true);
        } else {
            // Reset if no saved data for this card
            setLastMonthInput('');
            setMonthsToCollect([]);
            setMonthData({});
            setShowMonthForm(false);
        }
    }, [currentCardIndex, cardHistories]);

    // Se não há cartões, pular esta etapa automaticamente (apenas uma vez)
    useEffect(() => {
        if ((!cards || cards.length === 0) && !hasSkipped) {
            setHasSkipped(true);
            onComplete({});
        }
    }, [cards, hasSkipped, onComplete]);

    // Se não há cartões e já pulou, não renderizar nada
    if (!cards || cards.length === 0) {
        return null;
    }

    const currentCard = cards[currentCardIndex];

    const handleLastMonthSubmit = () => {
        try {
            // Parse YYYY-MM format
            const lastMonth = parse(lastMonthInput, 'yyyy-MM', new Date());
            const today = startOfMonth(new Date());

            // Generate list of months from current month to last month
            const months = eachMonthOfInterval({
                start: today,
                end: lastMonth,
            });

            setMonthsToCollect(months);
            setShowMonthForm(true);

            // Initialize month data
            const initialData: typeof monthData = {};
            months.forEach(month => {
                const key = format(month, 'yyyy-MM');
                initialData[key] = { totalAmount: 0, isClosed: false, isPaid: false };
            });
            setMonthData(initialData);
        } catch (error) {
            alert('Formato de data inválido. Use YYYY-MM (ex: 2024-11)');
        }
    };

    const updateMonthData = (monthKey: string, field: string, value: any) => {
        setMonthData(prev => ({
            ...prev,
            [monthKey]: {
                ...prev[monthKey],
                [field]: value,
            }
        }));
    };

    const handleCardHistoryComplete = () => {
        // Save history for this card
        const history = monthsToCollect.map(month => {
            const key = format(month, 'yyyy-MM');
            return {
                month: key,
                ...monthData[key],
            };
        });

        const updatedHistories = {
            ...cardHistories,
            [currentCardIndex]: history,
        };

        setCardHistories(updatedHistories);

        // Move to next card or complete
        if (currentCardIndex < cards.length - 1) {
            setCurrentCardIndex(currentCardIndex + 1);
            setLastMonthInput('');
            setShowMonthForm(false);
            setMonthsToCollect([]);
            setMonthData({});
        } else {
            // All cards done, compile and return
            // Pass the histories keyed by index (0, 1, 2...) which CompletionStep expects
            onComplete(updatedHistories);
        }
    };

    const skipCurrentCard = () => {
        if (currentCardIndex < cards.length - 1) {
            setCurrentCardIndex(currentCardIndex + 1);
            setLastMonthInput('');
            setShowMonthForm(false);
            setMonthsToCollect([]);
            setMonthData({});
        } else {
            onComplete(cardHistories);
        }
    };

    const isOverLimit = (monthKey: string) => {
        const data = monthData[monthKey];
        return data && data.totalAmount > currentCard.limite;
    };

    if (!showMonthForm) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold">Histórico de Faturas</h2>
                    <p className="text-muted-foreground">
                        Cartão {currentCardIndex + 1} de {cards.length}: <strong>{currentCard.nome}</strong>
                    </p>
                </div>

                <Alert>
                    <CalendarIcon className="h-4 w-4" />
                    <AlertDescription>
                        Informe qual foi o <strong>último mês de fatura</strong> que você quer registrar.
                        Vamos pedir os valores mensais desde o mês atual até o mês informado.
                    </AlertDescription>
                </Alert>

                <div className="space-y-3">
                    <Label>Último Mês de Fatura</Label>
                    <div className="flex gap-2">
                        <Select
                            value={lastMonthInput ? lastMonthInput.split('-')[1] : undefined}
                            onValueChange={(month) => {
                                const year = lastMonthInput ? lastMonthInput.split('-')[0] : new Date().getFullYear().toString();
                                setLastMonthInput(`${year}-${month}`);
                            }}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Mês" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="01">Janeiro</SelectItem>
                                <SelectItem value="02">Fevereiro</SelectItem>
                                <SelectItem value="03">Março</SelectItem>
                                <SelectItem value="04">Abril</SelectItem>
                                <SelectItem value="05">Maio</SelectItem>
                                <SelectItem value="06">Junho</SelectItem>
                                <SelectItem value="07">Julho</SelectItem>
                                <SelectItem value="08">Agosto</SelectItem>
                                <SelectItem value="09">Setembro</SelectItem>
                                <SelectItem value="10">Outubro</SelectItem>
                                <SelectItem value="11">Novembro</SelectItem>
                                <SelectItem value="12">Dezembro</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={lastMonthInput ? lastMonthInput.split('-')[0] : undefined}
                            onValueChange={(year) => {
                                const month = lastMonthInput ? lastMonthInput.split('-')[1] : format(new Date(), 'MM');
                                setLastMonthInput(`${year}-${month}`);
                            }}
                        >
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Ano" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 4 }, (_, i) => {
                                    const year = new Date().getFullYear() + i;
                                    return (
                                        <SelectItem key={year} value={String(year)}>
                                            {year}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Selecione até quando você tem faturas ou parcelas a pagar neste cartão.
                    </p>
                </div>

                <div className="flex justify-between">
                    <Button variant="outline" onClick={onBack}>Voltar</Button>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={skipCurrentCard}>
                            Pular Este Cartão
                        </Button>
                        <Button
                            onClick={handleLastMonthSubmit}
                            disabled={!lastMonthInput}
                        >
                            Continuar
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Valores das Faturas</h2>
                <p className="text-muted-foreground">
                    <strong>{currentCard.nome}</strong> - Informe o valor total de cada mês
                </p>
            </div>

            <Alert>
                <AlertDescription className="text-sm">
                    Estes valores representam apenas o <strong>total gasto</strong> em cada mês.
                    Novos gastos registrados no app refletirão corretamente a partir de agora.
                </AlertDescription>
            </Alert>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {monthsToCollect.map((month, index) => {
                    const monthKey = format(month, 'yyyy-MM');
                    const data = monthData[monthKey] || { totalAmount: 0, isClosed: false, isPaid: false };
                    const overLimit = isOverLimit(monthKey);

                    return (
                        <div key={monthKey} className={`p-4 border rounded-lg space-y-3 ${overLimit ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : ''}`}>
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium capitalize">
                                    {format(month, 'MMMM yyyy', { locale: ptBR })}
                                </h4>
                                {overLimit && (
                                    <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 text-sm">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span>Limite Especial</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label>Valor Total (R$)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={data.totalAmount || ''}
                                    onChange={(e) => updateMonthData(monthKey, 'totalAmount', Number(e.target.value))}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {isSameMonth(month, new Date()) && (
                                    <>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`closed-${monthKey}`}
                                                checked={data.isClosed}
                                                onCheckedChange={(checked) => updateMonthData(monthKey, 'isClosed', checked)}
                                                disabled={data.isPaid} // Disable if paid (must be closed)
                                            />
                                            <label
                                                htmlFor={`closed-${monthKey}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Já fechou?
                                            </label>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`paid-${monthKey}`}
                                                checked={data.isPaid}
                                                onCheckedChange={(checked) => {
                                                    updateMonthData(monthKey, 'isPaid', checked);
                                                    if (checked) {
                                                        updateMonthData(monthKey, 'isClosed', true);
                                                    }
                                                }}
                                            />
                                            <label
                                                htmlFor={`paid-${monthKey}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Já pagou?
                                            </label>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {Object.values(monthData).some(d => d.totalAmount > currentCard.limite) && (
                <Alert className="border-orange-500">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription>
                        <strong>Limite Especial Detectado:</strong> Um ou mais meses ultrapassaram o limite de R$ {currentCard.limite.toFixed(2)}.
                        Isso será registrado corretamente no sistema.
                    </AlertDescription>
                </Alert>
            )}

            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={() => {
                        setShowMonthForm(false);
                        setMonthData({});
                    }}
                >
                    Voltar
                </Button>
                <Button onClick={handleCardHistoryComplete}>
                    {currentCardIndex < cards.length - 1 ? 'Próximo Cartão' : 'Concluir Histórico'}
                </Button>
            </div>
        </div>
    );
}
