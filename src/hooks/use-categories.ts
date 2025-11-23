import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from './use-toast';

export interface Category {
    id: string;
    nome: string;
    label: string;
    icon?: string;
    type: 'receita' | 'despesa';
    parentCategoryId?: string | null;
    userId?: string | null;
    subcategories?: Category[];
}

export function useCategories() {
    return useQuery<Category[]>({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get('/categories');
            return response.data;
        },
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (category: Partial<Category>) => {
            const response = await api.post('/categories', category);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast({
                title: 'Categoria criada',
                description: 'A nova categoria foi criada com sucesso.',
            });
        },
        onError: () => {
            toast({
                title: 'Erro ao criar',
                description: 'Não foi possível criar a categoria.',
                variant: 'destructive',
            });
        },
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...data }: Partial<Category> & { id: string }) => {
            const response = await api.put(`/categories/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast({
                title: 'Categoria atualizada',
                description: 'A categoria foi atualizada com sucesso.',
            });
        },
        onError: () => {
            toast({
                title: 'Erro ao atualizar',
                description: 'Não foi possível atualizar a categoria.',
                variant: 'destructive',
            });
        },
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast({
                title: 'Categoria excluída',
                description: 'A categoria foi excluída com sucesso.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao excluir',
                description: error.response?.data?.message || 'Não foi possível excluir a categoria.',
                variant: 'destructive',
            });
        },
    });
}
