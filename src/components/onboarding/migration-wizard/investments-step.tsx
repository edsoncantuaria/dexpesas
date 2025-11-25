'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Upload, Wand2, HelpCircle, CheckCircle2 } from 'lucide-react';
import ImportInvestmentsModal from '@/components/dashboard/investments/import-investments-modal';
import InvestmentWizard from '@/components/dashboard/investments/investment-wizard';
import { InvestmentHelpDialog } from './investment-help-dialog';

interface InvestmentsStepProps {
    onComplete: (investments: any[]) => void;
    onBack: () => void;
    initialData?: any[];
}

export function InvestmentsStep({ onComplete, onBack, initialData }: InvestmentsStepProps) {
    const [hasInvestments, setHasInvestments] = useState<boolean | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isManualWizardOpen, setIsManualWizardOpen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [actionsCompleted, setActionsCompleted] = useState(0);

    const handleSkip = () => {
        onComplete([]);
    };

    const handleActionSuccess = () => {
        setActionsCompleted(prev => prev + 1);
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
                        Isso inclui ações, fundos imobiliários, tesouro direto e <strong>Caixinhas (Nubank)</strong> ou reservas financeiras.
                    </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-2">
                    <Button
                        size="lg"
                        onClick={() => setHasInvestments(true)}
                        className="h-24 text-lg"
                    >
                        Sim, tenho investimentos
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={handleSkip}
                        className="h-24 text-lg"
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
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Adicionar Investimentos</h2>
                    <p className="text-muted-foreground">Escolha como deseja adicionar seus ativos.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsHelpOpen(true)}>
                    <HelpCircle className="h-6 w-6 text-muted-foreground" />
                </Button>
            </div>

            {actionsCompleted > 0 && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                        {actionsCompleted} ação(ões) realizada(s). Você pode adicionar mais ou continuar.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4">
                <Button
                    variant="outline"
                    className="h-auto p-6 flex flex-col items-start gap-2 hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={() => setIsImportModalOpen(true)}
                >
                    <div className="flex items-center gap-2 font-bold text-lg">
                        <Upload className="h-5 w-5" />
                        Importar da B3
                    </div>
                    <p className="text-sm text-muted-foreground text-left font-normal">
                        Baixe o Excel na área do investidor da B3 e envie aqui. A forma mais rápida para Ações e FIIs.
                    </p>
                </Button>

                <Button
                    variant="outline"
                    className="h-auto p-6 flex flex-col items-start gap-2 hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={() => setIsManualWizardOpen(true)}
                >
                    <div className="flex items-center gap-2 font-bold text-lg">
                        <Wand2 className="h-5 w-5" />
                        Adicionar Manualmente
                    </div>
                    <p className="text-sm text-muted-foreground text-left font-normal">
                        Ideal para <strong>Caixinhas Nubank</strong>, Renda Fixa ou se você está começando agora.
                    </p>
                </Button>
            </div>

            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setHasInvestments(null)}>Voltar</Button>
                <Button onClick={() => onComplete([])} size="lg">
                    {actionsCompleted > 0 ? 'Concluir e Continuar' : 'Pular esta etapa'}
                </Button>
            </div>

            <ImportInvestmentsModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={handleActionSuccess}
            />

            <InvestmentWizard
                isOpen={isManualWizardOpen}
                onClose={() => setIsManualWizardOpen(false)}
                onSuccess={handleActionSuccess}
            />

            <InvestmentHelpDialog
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
            />
        </div>
    );
}
