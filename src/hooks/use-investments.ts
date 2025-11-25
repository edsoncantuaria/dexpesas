import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

export interface PortfolioOverview {
    totalInvested: number;
    totalCurrentValue: number;
    totalPnL: number;
    totalReturnPercent: number;
    allocation: {
        fixedIncome: number;
        variableIncome: number;
        crypto: number;
        other: number;
    };
    portfolios: {
        id: string;
        name: string;
        value: number;
    }[];
}

export interface TradeInput {
    portfolioId: string;
    assetId: string;
    type: 'BUY' | 'SELL' | 'DIVIDEND';
    quantity: number;
    price: number;
    date: string;
    fees?: number;
}

export function useInvestments() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const fetchOverview = useCallback(async (): Promise<PortfolioOverview | null> => {
        try {
            setLoading(true);
            const res = await api.get('/investments/overview');
            return res.data;
        } catch (error) {
            console.error('Failed to fetch investment overview', error);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchPortfolios = useCallback(async () => {
        try {
            const res = await api.get('/investments/portfolios');
            return res.data;
        } catch (error) {
            console.error('Failed to fetch portfolios', error);
            return [];
        }
    }, []);

    const createPortfolio = useCallback(async (data: { name: string; riskProfile?: string }) => {
        try {
            setLoading(true);
            await api.post('/investments/portfolios', data);
            toast({ title: 'Portfólio criado com sucesso!' });
            return true;
        } catch (error) {
            toast({ title: 'Erro ao criar portfólio', variant: 'destructive' });
            return false;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const recordTrade = useCallback(async (tradeData: TradeInput) => {
        try {
            setLoading(true);
            await api.post('/investments/trades', tradeData);
            toast({ title: 'Movimentação registrada!' });
            return true;
        } catch (error) {
            toast({ title: 'Erro ao registrar movimentação', variant: 'destructive' });
            return false;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const getRecommendations = useCallback(async () => {
        try {
            const res = await api.get('/investments/recommendations');
            return res.data;
        } catch (error) {
            console.error('Failed to fetch recommendations', error);
            return null;
        }
    }, []);

    const simulateScenarios = useCallback(async (scenarios: any[]) => {
        try {
            const res = await api.post('/investments/simulate', { scenarios });
            return res.data;
        } catch (error) {
            console.error('Failed to simulate', error);
            return [];
        }
    }, []);

    return {
        loading,
        fetchOverview,
        fetchPortfolios,
        createPortfolio,
        recordTrade,
        getRecommendations,
        simulateScenarios,
    };
}
