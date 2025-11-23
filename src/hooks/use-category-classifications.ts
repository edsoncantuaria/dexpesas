// src/hooks/use-category-classifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from './use-toast';

export type CategoryClassificationType = 'ESSENTIAL' | 'LEISURE' | 'INVESTMENT' | 'OTHER';

export interface CategoryClassification {
    id: string;
    userId: string;
    categoryId: string;
    classification: CategoryClassificationType;
    createdAt: string;
    updatedAt: string;
    category: {
        id: string;
        nome: string;
        label: string;
        icon?: string;
        type: 'receita' | 'despesa';
    };
}

export interface ClassificationStats {
    total: number;
    essential: number;
    leisure: number;
    investment: number;
    other: number;
}

export function useCategoryClassifications() {
    return useQuery<CategoryClassification[]>({
        queryKey: ['category-classifications'],
        queryFn: async () => {
            const response = await api.get('/category-classifications');
            return response.data;
        },
    });
}

export function useClassificationStats() {
    return useQuery<ClassificationStats>({
        queryKey: ['category-classifications', 'statistics'],
        queryFn: async () => {
            const response = await api.get('/category-classifications/statistics');
            return response.data;
        },
    });
}

export function useUpdateClassification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ categoryId, classification }: { categoryId: string; classification: CategoryClassificationType }) => {
            const response = await api.put(`/category-classifications/${categoryId}`, { classification });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['category-classifications'] });
            toast({
                title: 'Classificação atualizada',
                description: 'A classificação da categoria foi atualizada com sucesso.',
            });
        },
        onError: () => {
            toast({
                title: 'Erro ao atualizar',
                description: 'Não foi possível atualizar a classificação da categoria.',
                variant: 'destructive',
            });
        },
    });
}

export function useBulkUpdateClassifications() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (classifications: Array<{ categoryId: string; classification: CategoryClassificationType }>) => {
            const response = await api.post('/category-classifications/bulk', { classifications });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['category-classifications'] });
            toast({
                title: 'Classificações atualizadas',
                description: 'As classificações foram atualizadas com sucesso.',
            });
        },
        onError: () => {
            toast({
                title: 'Erro ao atualizar',
                description: 'Não foi possível atualizar as classificações.',
                variant: 'destructive',
            });
        },
    });
}

export function useInitializeClassifications() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await api.post('/category-classifications/initialize');
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['category-classifications'] });
            toast({
                title: 'Classificações inicializadas',
                description: 'As classificações padrão foram configuradas.',
            });
        },
        onError: () => {
            toast({
                title: 'Erro ao inicializar',
                description: 'Não foi possível inicializar as classificações.',
                variant: 'destructive',
            });
        },
    });
}

export function useResetClassifications() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await api.post('/category-classifications/reset');
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['category-classifications'] });
            toast({
                title: 'Classificações resetadas',
                description: 'As classificações foram restauradas para os padrões.',
            });
        },
        onError: () => {
            toast({
                title: 'Erro ao resetar',
                description: 'Não foi possível resetar as classificações.',
                variant: 'destructive',
            });
        },
    });
}
