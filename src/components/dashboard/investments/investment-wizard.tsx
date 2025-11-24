'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, TrendingUp, ShieldCheck } from 'lucide-react';
import { useInvestments } from '@/hooks/use-investments';

interface InvestmentWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function InvestmentWizard({ isOpen, onClose, onSuccess }: InvestmentWizardProps) {
    const { createPortfolio, recordTrade } = useInvestments();
    const [step, setStep] = useState(1);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFinish = async () => {
        setLoading(true);
        try {
            // 1. Create Default Portfolio if needed (simplified)
            // In a real scenario, we'd check if it exists or ask for a name.
            // Here we assume a "Reserva de Emergência" portfolio for the beginner.
            await createPortfolio({ name: 'Minha Reserva', riskProfile: 'CONSERVATIVE' });

            // 2. We'd need the ID of the created portfolio. 
            // For this wizard demo, let's assume the user will manually record the trade 
            // or we'd need createPortfolio to return the ID.
            // Let's just show a success message guiding them to the next step for now,
            // or implement a smarter flow if createPortfolio returned the ID.

            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                {step === 1 && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Vamos começar a investir?</DialogTitle>
                            <DialogDescription>
                                Parabéns pela iniciativa! O primeiro passo é o mais importante.
                                Quanto você gostaria de investir hoje?
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-6">
                            <Label htmlFor="amount">Valor do Aporte (R$)</Label>
                            <Input
                                id="amount"
                                type="number"
                                className="text-lg mt-2"
                                placeholder="Ex: 100,00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={onClose}>Cancelar</Button>
                            <Button onClick={() => setStep(2)} disabled={!amount}>Continuar</Button>
                        </DialogFooter>
                    </>
                )}

                {step === 2 && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Sugestão para Iniciantes</DialogTitle>
                            <DialogDescription>
                                Para seu primeiro investimento de <strong>R$ {amount}</strong>, recomendamos segurança e liquidez.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Card className="border-primary bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
                                <CardContent className="flex items-center p-4 space-x-4">
                                    <ShieldCheck className="h-8 w-8 text-primary" />
                                    <div className="flex-1">
                                        <h4 className="font-bold">Tesouro Selic 2029</h4>
                                        <p className="text-sm text-muted-foreground">O investimento mais seguro do Brasil. Rende mais que a poupança e você pode sacar quando quiser.</p>
                                    </div>
                                    <CheckCircle2 className="h-6 w-6 text-primary" />
                                </CardContent>
                            </Card>

                            <Card className="cursor-pointer hover:bg-accent transition-colors opacity-60">
                                <CardContent className="flex items-center p-4 space-x-4">
                                    <TrendingUp className="h-8 w-8" />
                                    <div className="flex-1">
                                        <h4 className="font-bold">Fundo de Ações</h4>
                                        <p className="text-sm text-muted-foreground">Maior potencial de retorno, mas com mais risco. Recomendado para longo prazo.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                            <Button onClick={handleFinish} disabled={loading}>
                                {loading ? 'Criando...' : 'Confirmar Escolha'}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
