'use client';

import { useState, useEffect } from 'react';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
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
        const loadSavedData = async () => {
            if (isLoaded && isOpen) {
                const saved = await loadData();
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
        };

        loadSavedData();
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
        <ResponsiveDialog
            isOpen={isOpen}
            setIsOpen={() => { }}
            title="Migração Inicial de Dados Financeiros"
            description="Configure suas contas, cartões e investimentos para começar."
            hideClose
        >
            <div className="p-0 py-4 max-h-[80vh] overflow-y-auto">
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
                            initialData={
                                migrationData.accounts.length > 0
                                    ? migrationData.accounts.filter(acc => acc.tipo !== 'investimento')
                                    : undefined
                            }
                        />
                    )}

                    {currentStep === 'investments' && (
                        <InvestmentsStep
                            key="investments"
                            onComplete={handleInvestmentsComplete}
                            onBack={handleBack}
                            initialData={
                                migrationData.accounts.length > 0
                                    ? migrationData.accounts.filter(acc => acc.tipo === 'investimento')
                                    : undefined
                            }
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
                            initialData={migrationData.cardHistory}
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
        </ResponsiveDialog>
    );
}
