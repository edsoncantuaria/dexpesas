import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Category } from '@/lib/definitions';
import { toast } from '@/hooks/use-toast';

export function useSubcategories(parentId?: string) {
    const queryClient = useQueryClient();

    const { data: subcategories, isLoading } = useQuery({
        queryKey: ['subcategories', parentId],
        queryFn: async () => {
            if (!parentId) return [];
            const response = await api.get<Category[]>(`/categories/${parentId}/subcategories`);
            return response.data;
        },
        enabled: !!parentId,
    });

    const createSubcategory = useMutation({
        mutationFn: async (data: { nome: string; label: string; icon?: string; parentId: string }) => {
            const response = await api.post<Category>(`/categories/${data.parentId}/subcategories`, data);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['subcategories', variables.parentId] });
            queryClient.invalidateQueries({ queryKey: ['categories'] }); // Also invalidate main list
            toast({ title: 'Sucesso', description: 'Subcategoria criada com sucesso!' });
        },
        onError: () => {
            toast({ title: 'Erro', description: 'Erro ao criar subcategoria', variant: 'destructive' });
        }
    });

    const updateSubcategory = useMutation({
        mutationFn: async (data: { id: string; label: string; icon?: string }) => {
            const response = await api.put<Category>(`/subcategories/${data.id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subcategories'] });
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast({ title: 'Sucesso', description: 'Subcategoria atualizada com sucesso!' });
        },
        onError: () => {
            toast({ title: 'Erro', description: 'Erro ao atualizar subcategoria', variant: 'destructive' });
        }
    });

    const deleteSubcategory = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/subcategories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subcategories'] });
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast({ title: 'Sucesso', description: 'Subcategoria excluída com sucesso!' });
        },
        onError: (error: any) => {
            if (error.response?.data?.count) {
                toast({ title: 'Erro', description: `Não é possível excluir: existem ${error.response.data.count} transações nesta subcategoria.`, variant: 'destructive' });
            } else {
                toast({ title: 'Erro', description: 'Erro ao excluir subcategoria', variant: 'destructive' });
            }
        }
    });

    return {
        subcategories,
        isLoading,
        createSubcategory,
        updateSubcategory,
        deleteSubcategory
    };
}
