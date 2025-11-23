import React, { useState } from 'react';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator } from 'lucide-react';

export function CreditCardSimulators() {
    const [amount, setAmount] = useState('');
    const [months, setMonths] = useState('');
    const [rate, setRate] = useState('');
    const [result, setResult] = useState<any>(null);

    const calculateInstallments = () => {
        const p = parseFloat(amount);
        const n = parseInt(months);
        const i = parseFloat(rate) / 100;

        if (!p || !n || isNaN(i)) return;

        // Price Table Formula: PMT = P * [i(1+i)^n] / [(1+i)^n - 1]
        // If rate is 0, PMT = P / n
        let pmt = 0;
        if (i === 0) {
            pmt = p / n;
        } else {
            pmt = p * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
        }

        const total = pmt * n;
        const totalInterest = total - p;

        setResult({
            monthly: pmt,
            total: total,
            interest: totalInterest
        });
    };

    const calculateRevolving = () => {
        // Simple compound interest for revolving
        // A = P(1 + i)^n (n in days usually, but here let's assume months for simplicity or ask for days)
        // Let's assume rate is monthly and n is days.
        // i_daily = (1 + i_monthly)^(1/30) - 1

        const p = parseFloat(amount);
        const d = parseInt(months); // reusing months input as days
        const i_monthly = parseFloat(rate) / 100;

        if (!p || !d || isNaN(i_monthly)) return;

        const i_daily = Math.pow(1 + i_monthly, 1 / 30) - 1;
        const amountFinal = p * Math.pow(1 + i_daily, d);
        const interest = amountFinal - p;

        setResult({
            total: amountFinal,
            interest: interest,
            isRevolving: true
        });
    };

    return (
        <ResponsiveDialog
            trigger={
                <Button variant="outline" size="sm" className="gap-2">
                    <Calculator className="h-4 w-4" />
                    Simuladores
                </Button>
            }
        >
            <div className="space-y-2 mb-4">
                <h2 className="text-xl font-semibold">Simuladores de Crédito</h2>
            </div>
            <Tabs defaultValue="installments" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="installments">Parcelamento</TabsTrigger>
                    <TabsTrigger value="revolving">Rotativo</TabsTrigger>
                </TabsList>

                <TabsContent value="installments" className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Valor da Compra (R$)</Label>
                        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000.00" />
                    </div>
                    <div className="space-y-2">
                        <Label>Número de Parcelas</Label>
                        <Input type="number" value={months} onChange={(e) => setMonths(e.target.value)} placeholder="12" />
                    </div>
                    <div className="space-y-2">
                        <Label>Taxa de Juros Mensal (%)</Label>
                        <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="1.99" />
                    </div>
                    <Button onClick={calculateInstallments} className="w-full">Calcular</Button>

                    {result && !result.isRevolving && (
                        <div className="mt-4 p-4 bg-muted rounded-lg space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Parcela Mensal:</span>
                                <span className="font-bold">R$ {result.monthly.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Final:</span>
                                <span className="font-bold">R$ {result.total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-red-500">
                                <span>Juros Totais:</span>
                                <span>R$ {result.interest.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="revolving" className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Saldo Devedor (R$)</Label>
                        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500.00" />
                    </div>
                    <div className="space-y-2">
                        <Label>Dias de Atraso</Label>
                        <Input type="number" value={months} onChange={(e) => setMonths(e.target.value)} placeholder="30" />
                    </div>
                    <div className="space-y-2">
                        <Label>Taxa do Rotativo Mensal (%)</Label>
                        <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="14.00" />
                    </div>
                    <Button onClick={calculateRevolving} className="w-full">Calcular</Button>

                    {result && result.isRevolving && (
                        <div className="mt-4 p-4 bg-muted rounded-lg space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Valor Original:</span>
                                <span>R$ {parseFloat(amount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-red-500">
                                <span>Juros Acumulados:</span>
                                <span>R$ {result.interest.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                <span>Total a Pagar:</span>
                                <span>R$ {result.total.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </ResponsiveDialog>
    );
}
