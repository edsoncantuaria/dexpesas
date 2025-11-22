'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AnimatePresence } from 'framer-motion';
import { MigrationChoiceStep } from './migration-choice-step';
import { AccountsStep } from './accounts-step';
import { InvestmentsStep } from './investments-step';
import { CardsStep } from './cards-step';
import { CardHistoryStep } from './card-history-step';
import { PreviewStep } from './preview-step';
import { CompletionStep } from './completion-step';
import { MigrationProgress } from './migration-progress';
import { useMigrationPersistence } from '@/hooks/use-migration-persistence';

type MigrationStep = 'choice' | 'accounts' | 'investments' | 'cards' | 'card-history' | 'preview' | 'completion';

interface MigrationData {
    accounts: Array<{
        nome: string;
        instituicao: string;
        tipo: 'corrente' | 'poupanca' | 'investimento';
        saldoInicial: number;
        accountNumber?: string;
        agencyNumber?: string;
        notes?: string;
    }>;
    cards: Array<{
        id?: string;
        nome: string;
        limite: number;
        diaFechamento: number;
        diaVencimento: number;
        bandeira: 'visa' | 'mastercard' | 'elo' | 'amex';
        paymentAccountId?: string;
        notes?: string;
    }>;
    cardHistory: Record<number, Array<{
        month: string;
        totalAmount: number;
        isClosed: boolean;
        isPaid: boolean;
    }>>;
}

interface MigrationWizardProps {
    isOpen: boolean;
    onComplete: () => void;
}

export function MigrationWizard({ isOpen, onComplete }: MigrationWizardProps) {
    const [currentStep, setCurrentStep] = useState<MigrationStep>('choice');
    const [migrationData, setMigrationData] = useState<MigrationData>({
        accounts: [],
        cards: [],
        cardHistory: {},
    });

    const { saveData, loadData, clearData, isLoaded } = useMigrationPersistence();

    // Load saved data on mount
    useEffect(() => {
        if (isLoaded && isOpen) {
            const saved = loadData();
            if (saved) {
                setMigrationData({
                    accounts: saved.accounts || [],
                    cards: saved.cards || [],
                    cardHistory: saved.cardHistory || {},
                });
                if (saved.currentStep && saved.currentStep !== 'choice') {
                    setCurrentStep(saved.currentStep as MigrationStep);
                }
            }
        }
    }, [isLoaded, isOpen]);

    // Save data whenever it changes
    useEffect(() => {
        if (isLoaded && currentStep !== 'choice') {
            saveData({
                ...migrationData,
                currentStep,
            });
        }
    }, [migrationData, currentStep, isLoaded]);

    const handleChoice = (choice: 'simplified' | 'manual' | 'later') => {
        if (choice === 'simplified') {
            setCurrentStep('accounts');
        } else if (choice === 'manual' || choice === 'later') {
            clearData();
            onComplete();
        }
    };

    const handleAccountsComplete = (accounts: MigrationData['accounts']) => {
        setMigrationData(prev => ({ ...prev, accounts }));
        setCurrentStep('investments');
    };

    const handleInvestmentsComplete = (investments: MigrationData['accounts']) => {
        const allAccounts = [...migrationData.accounts, ...investments];
        setMigrationData(prev => ({ ...prev, accounts: allAccounts }));
        setCurrentStep('cards');
    };

    const handleCardsComplete = (cards: MigrationData['cards']) => {
        setMigrationData(prev => ({ ...prev, cards }));
        if (cards.length > 0) {
            setCurrentStep('card-history');
        } else {
            setCurrentStep('preview');
        }
    };

    const handleCardHistoryComplete = (history: MigrationData['cardHistory']) => {
        setMigrationData(prev => ({ ...prev, cardHistory: history }));
        setCurrentStep('preview');
    };

    const handlePreviewEdit = (step: string) => {
        setCurrentStep(step as MigrationStep);
    };

    const handlePreviewConfirm = () => {
        setCurrentStep('completion');
    };

    const handleFinalComplete = () => {
        clearData();
        onComplete();
    };

    const handleBack = () => {
        const steps: MigrationStep[] = ['choice', 'accounts', 'investments', 'cards', 'card-history', 'preview', 'completion'];
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex > 0) {
            setCurrentStep(steps[currentIndex - 1]);
        }
    };

    const getStepNumber = (): number => {
        const stepMap: Record<MigrationStep, number> = {
            'choice': 0,
            'accounts': 1,
            'investments': 2,
            'cards': 3,
            'card-history': 4,
            'preview': 5,
            'completion': 6,
        };
        return stepMap[currentStep];
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                <VisuallyHidden>
                    <DialogTitle>Assistente de Migração de Dados</DialogTitle>
                </VisuallyHidden>
                <div className="p-6">
                    {currentStep !== 'choice' && currentStep !== 'completion' && currentStep !== 'preview' && (
                        <MigrationProgress
                            currentStep={getStepNumber()}
                            totalSteps={6}
                        />
                    )}

                    <AnimatePresence mode="wait">
                        {currentStep === 'choice' && (
                            <MigrationChoiceStep key="choice" onChoice={handleChoice} />
                        )}

                        {currentStep === 'accounts' && (
                            <AccountsStep
                                key="accounts"
                                onComplete={handleAccountsComplete}
                                onBack={handleBack}
                                initialData={migrationData.accounts.length > 0 ? migrationData.accounts : undefined}
                            />
                        )}

                        {currentStep === 'investments' && (
                            <InvestmentsStep
                                key="investments"
                                onComplete={handleInvestmentsComplete}
                                onBack={handleBack}
                            />
                        )}

                        {currentStep === 'cards' && (
                            <CardsStep
                                key="cards"
                                onComplete={handleCardsComplete}
                                onBack={handleBack}
                                initialData={migrationData.cards.length > 0 ? migrationData.cards : undefined}
                                accounts={migrationData.accounts}
                            />
                        )}

                        {currentStep === 'card-history' && (
                            <CardHistoryStep
                                key="card-history"
                                cards={migrationData.cards}
                                onComplete={handleCardHistoryComplete}
                                onBack={handleBack}
                            />
                        )}

                        {currentStep === 'preview' && (
                            <PreviewStep
                                key="preview"
                                migrationData={migrationData}
                                onEdit={handlePreviewEdit}
                                onConfirm={handlePreviewConfirm}
                                onBack={handleBack}
                            />
                        )}

                        {currentStep === 'completion' && (
                            <CompletionStep
                                key="completion"
                                migrationData={migrationData}
                                onComplete={handleFinalComplete}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
}
