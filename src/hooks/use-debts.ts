import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface Debt {
    id: string;
    name: string;
    debtType: string;
    originalAmount: number;
    currentBalance: number;
    interestRate: number;
    minimumPayment: number;
    status: string;
    lastPaymentAt?: Date;
    card?: {
        id: string;
        nome: string;
        lastFourDigits: string;
        bandeira: string;
    };
    category?: {
        id: string;
        nome: string;
        icon: string;
        color?: string;
    };
}

export interface CreateDebtData {
    name: string;
    debtType: string;
    originalAmount: number;
    currentBalance: number;
    interestRate: number;
    minimumPayment: number;
    cardId?: string;
    categoryId?: string;
    strategy?: string;
    targetPayoffDate?: Date;
    extraMonthlyPayment?: number;
}

export interface DebtPaymentData {
    amount: number;
    paymentDate?: Date;
    transactionId?: string;
    isExtraPayment?: boolean;
    notes?: string;
}

export interface DebtAdjustmentData {
    amount: number;
    reason: 'LATE_FEE' | 'RENEGOTIATION' | 'INTEREST_INCREASE' | 'OTHER';
    description: string;
}

export interface DebtTrend {
    debtId: string;
    debtName: string;
    isSnowballing: boolean;
    monthlyChangeRate: number;
    projectedNextMonth: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    alerts: string[];
    avgMonthlyPayment?: number;
}

export interface DebtTrends {
    summary: {
        totalDebts: number;
        snowballingDebts: number;
        highRiskDebts: number;
    };
    debts: DebtTrend[];
}

export interface DebtRecommendations {
    suggestedStrategy: 'SNOWBALL' | 'AVALANCHE' | 'HYBRID' | 'NONE';
    priorityDebts: string[];
    suggestedExtraPayment: number;
    avgMonthlyIncome: number;
    currentDTI: number;
    reasoning: string[];
    warnings: string[];
}

export interface DebtAnalytics {
    totalDebt: number;
    totalMonthlyMin: number;
    averageMonthlyIncome: number;
    dti: number;
    projectedInterest: {
        snowball: number;
        avalanche: number;
        annualCurrent: number;
    };
    payoffDates: {
        snowball: string;
        avalanche: string;
    };
}

export interface ScenarioSimulation {
    scenarios: Array<{
        name: string;
        strategy: string;
        extraMonthly: number;
        totalMonths: number;
        totalInterest: number;
        payoffDate: Date;
        monthlyPayment: number;
    }>;
    bestOption: any;
    savings: number;
}

export function useDebts() {
    const [debts, setDebts] = useState<Debt[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const fetchDebts = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/debts');
            setDebts(response.data);
        } catch (error) {
            console.error('Error fetching debts:', error);
            toast({
                title: 'Erro ao carregar dívidas',
                description: 'Não foi possível carregar suas dívidas.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const createDebt = useCallback(async (data: CreateDebtData) => {
        try {
            const response = await api.post('/debts', data);
            setDebts((prev) => [...prev, response.data]);
            toast({
                title: 'Dívida criada',
                description: 'Sua dívida foi adicionada com sucesso.',
            });
            // Auto-reload to ensure fresh data
            await fetchDebts();
            return response.data;
        } catch (error) {
            console.error('Error creating debt:', error);
            toast({
                title: 'Erro ao criar dívida',
                description: 'Não foi possível criar a dívida.',
                variant: 'destructive',
            });
            throw error;
        }
    }, [fetchDebts, toast]);

    const updateDebt = useCallback(async (id: string, data: Partial<CreateDebtData>) => {
        try {
            const response = await api.put(`/debts/${id}`, data);
            setDebts((prev) => prev.map((d) => (d.id === id ? response.data : d)));
            toast({
                title: 'Dívida atualizada',
                description: 'Sua dívida foi atualizada com sucesso.',
            });
            return response.data;
        } catch (error) {
            console.error('Error updating debt:', error);
            toast({
                title: 'Erro ao atualizar dívida',
                description: 'Não foi possível atualizar a dívida.',
                variant: 'destructive',
            });
            throw error;
        }
    }, [toast]);

    const deleteDebt = useCallback(async (id: string) => {
        try {
            await api.delete(`/debts/${id}`);
            setDebts((prev) => prev.filter((d) => d.id !== id));
            toast({
                title: 'Dívida removida',
                description: 'Sua dívida foi removida com sucesso.',
            });
        } catch (error) {
            console.error('Error deleting debt:', error);
            toast({
                title: 'Erro ao remover dívida',
                description: 'Não foi possível remover a dívida.',
                variant: 'destructive',
            });
            throw error;
        }
    }, [toast]);

    const recordPayment = useCallback(async (id: string, paymentData: DebtPaymentData) => {
        try {
            const response = await api.post(`/debts/${id}/payments`, paymentData);
            toast({
                title: 'Pagamento registrado',
                description: 'Seu pagamento foi registrado com sucesso.',
            });
            // Refresh debts to get updated balance
            await fetchDebts();
            return response.data;
        } catch (error) {
            console.error('Error recording payment:', error);
            toast({
                title: 'Erro ao registrar pagamento',
                description: 'Não foi possível registrar o pagamento.',
                variant: 'destructive',
            });
            throw error;
        }
    }, [fetchDebts, toast]);

    const recordAdjustment = useCallback(async (id: string, adjustmentData: DebtAdjustmentData) => {
        try {
            const response = await api.post(`/debts/${id}/adjustments`, adjustmentData);
            toast({
                title: 'Ajuste registrado',
                description: 'O ajuste foi registrado com sucesso.',
            });
            // Refresh debts to get updated balance
            await fetchDebts();
            return response.data;
        } catch (error) {
            console.error('Error recording adjustment:', error);
            toast({
                title: 'Erro ao registrar ajuste',
                description: 'Não foi possível registrar o ajuste.',
                variant: 'destructive',
            });
            throw error;
        }
    }, [fetchDebts, toast]);

    const getTrends = useCallback(async (): Promise<DebtTrends> => {
        try {
            const response = await api.get('/debts/trends');
            return response.data;
        } catch (error) {
            console.error('Error fetching trends:', error);
            throw error;
        }
    }, []);

    const getRecommendations = useCallback(async (): Promise<DebtRecommendations> => {
        try {
            const response = await api.get('/debts/recommendations');
            return response.data;
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            throw error;
        }
    }, []);

    const getPaymentHistory = useCallback(async (id: string) => {
        try {
            const response = await api.get(`/debts/${id}/payment-history`);
            return response.data;
        } catch (error) {
            console.error('Error fetching payment history:', error);
            throw error;
        }
    }, []);

    const simulateScenarios = useCallback(async (scenarios: Array<{ strategy?: string; extraMonthly?: number; name?: string }>): Promise<ScenarioSimulation> => {
        try {
            const response = await api.post('/debts/simulate', { scenarios });
            return response.data;
        } catch (error) {
            console.error('Error simulating scenarios:', error);
            throw error;
        }
    }, []);

    const getAnalytics = useCallback(async (): Promise<DebtAnalytics> => {
        try {
            const response = await api.get('/debts/analytics');
            return response.data;
        } catch (error) {
            console.error('Error fetching analytics:', error);
            throw error;
        }
    }, []);

    return {
        debts,
        isLoading,
        fetchDebts,
        createDebt,
        updateDebt,
        deleteDebt,
        recordPayment,
        recordAdjustment,
        getTrends,
        getRecommendations,
        getPaymentHistory,
        simulateScenarios,
        getAnalytics,
    };
}
