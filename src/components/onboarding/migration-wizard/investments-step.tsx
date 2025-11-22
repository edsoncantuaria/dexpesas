'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info } from 'lucide-react';

interface InvestmentsStepProps {
    onComplete: (investments: any[]) => void;
    onBack: () => void;
    initialData?: any[];
}

export function InvestmentsStep({ onComplete, onBack, initialData }: InvestmentsStepProps) {
    const [hasInvestments, setHasInvestments] = useState<boolean | null>(
        initialData && initialData.length > 0 ? true : null
    );
    const [investmentCount, setInvestmentCount] = useState(initialData?.length || 1);
    const [investments, setInvestments] = useState(
        initialData && initialData.length > 0
            ? initialData
            : [{
                nome: '',
                instituicao: '',
                tipo: 'investimento' as const,
                saldoInicial: 0
            }]
    );

    const handleSubmit = () => {
        if (hasInvestments) {
            onComplete(investments);
        } else {
            onComplete([]);
        }
    };

    const updateInvestment = (index: number, field: string, value: any) => {
        const newInvestments = [...investments];
        newInvestments[index] = { ...newInvestments[index], [field]: value };
        setInvestments(newInvestments);
    };

    if (hasInvestments === null) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold">Investimentos</h2>
                    <p className="text-muted-foreground">Você possui investimentos?</p>
                </div>

                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        Ao criar como conta de investimento, esse valor já entrará no seu patrimônio.
                        Depois, na aba Investimentos, você poderá gerenciar aportes futuros.
                    </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-2">
                    <Button
                        size="lg"
                        onClick={() => setHasInvestments(true)}
                        className="h-24"
                    >
                        Sim, tenho investimentos
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={() => {
                            setHasInvestments(false);
                            onComplete([]); // Skip direto
                        }}
                        className="h-24"
                    >
                        Não tenho investimentos
                    </Button>
                </div>

                <div className="flex justify-between">
                    <Button variant="outline" onClick={onBack}>Voltar</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Investimentos</h2>
                <p className="text-muted-foreground">Quantos investimentos você tem?</p>
            </div>

            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Informe o <strong>valor líquido total</strong> de cada investimento.
                </AlertDescription>
            </Alert>

            <div className="space-y-4">
                <div>
                    <Label>Quantidade de Investimentos</Label>
                    <Select
                        value={String(investmentCount)}
                        onValueChange={(v) => {
                            const count = Number(v);
                            setInvestmentCount(count);
                            setInvestments(Array.from({ length: count }, (_, i) =>
                                investments[i] || { nome: '', instituicao: '', tipo: 'investimento' as const, saldoInicial: 0 }
                            ));
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[1, 2, 3, 4, 5].map(n => (
                                <SelectItem key={n} value={String(n)}>
                                    {n} investimento{n > 1 ? 's' : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {investments.map((inv, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                        <h4 className="font-medium">Investimento #{index + 1}</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Nome</Label>
                                <Input
                                    placeholder="Ex: Tesouro Direto"
                                    value={inv.nome}
                                    onChange={(e) => updateInvestment(index, 'nome', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Instituição</Label>
                                <Input
                                    placeholder="Ex: Nubank"
                                    value={inv.instituicao}
                                    onChange={(e) => updateInvestment(index, 'instituicao', e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Valor Total Líquido (R$)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={inv.saldoInicial || ''}
                                onChange={(e) => updateInvestment(index, 'saldoInicial', Number(e.target.value))}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between">
                <Button variant="outline" onClick={() => setHasInvestments(null)}>Voltar</Button>
                <Button onClick={handleSubmit}>Próximo</Button>
            </div>
        </div>
    );
}
