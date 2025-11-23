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

    const createDebt = async (data: CreateDebtData) => {
        try {
            const response = await api.post('/debts', data);
            setDebts((prev) => [...prev, response.data]);
            toast({
                title: 'Dívida criada',
                description: 'Sua dívida foi adicionada com sucesso.',
            });
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
    };

    const updateDebt = async (id: string, data: Partial<CreateDebtData>) => {
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
    };

    const deleteDebt = async (id: string) => {
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
    };

    const getAnalytics = async (): Promise<DebtAnalytics> => {
        try {
            const response = await api.get('/debts/analytics');
            return response.data;
        } catch (error) {
            console.error('Error fetching analytics:', error);
            throw error;
        }
    };

    return {
        debts,
        isLoading,
        fetchDebts,
        createDebt,
        updateDebt,
        deleteDebt,
        getAnalytics,
    };
}
