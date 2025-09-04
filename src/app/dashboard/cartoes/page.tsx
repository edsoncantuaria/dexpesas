// src/app/dashboard/cartoes/page.tsx
'use client';

import { CreditCard, PlusCircle } from "lucide-react";
import { CardList } from "@/components/dashboard/cartoes/card-list";
import { useState, useEffect, useCallback } from "react";
import type { Card } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/api';
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AddCardForm } from "@/components/dashboard/cartoes/add-card-form";


export default function CartoesPage() {
    const [cards, setCards] = useState<Card[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<Card | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const fetchCards = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/cards');
            setCards(response.data);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao buscar cartões',
                description: 'Não foi possível carregar a lista de cartões.'
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchCards();
    }, [fetchCards]);

    const handleOpenForm = (card?: Card) => {
        setEditingCard(card || null);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingCard(null);
    };

    const handleSaveCard = async (cardData: Omit<Card, 'id' | 'userId' | 'saldoFatura'> & { id?: string }) => {
        setIsSubmitting(true);
        const isEditing = !!editingCard;
        const method = isEditing ? 'put' : 'post';
        const url = isEditing ? `/cards/${editingCard!.id}` : '/cards';

        try {
            await api[method](url, cardData);
            await fetchCards();
            toast({ title: `Cartão ${isEditing ? 'atualizado' : 'adicionado'}!` });
            handleCloseForm();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao salvar cartão', description: error.response?.data?.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteCard = async (cardId: string) => {
        const cardToDelete = cards.find(c => c.id === cardId);
        if (cardToDelete) {
            try {
                await api.delete(`/cards/${cardId}`);
                await fetchCards();
                toast({
                    title: 'Cartão excluído!',
                    description: `O cartão "${cardToDelete.nome}" foi removido com sucesso.`,
                    variant: 'destructive'
                });
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Erro ao excluir cartão',
                    description: 'Não foi possível remover o cartão.'
                });
            }
        }
    };

    if (isLoading) {
        return <LoadingScreen />
    }
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Cartões</h1>
                    <p className="text-muted-foreground">Adicione, edite e visualize seus cartões de crédito.</p>
                </div>
                 <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenForm()} className="w-full sm:w-auto">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Novo Cartão
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingCard ? 'Editar Cartão' : 'Adicionar Novo Cartão'}</DialogTitle>
                            <DialogDescription>
                                {editingCard ? 'Atualize as informações do seu cartão.' : 'Preencha as informações para adicionar um novo cartão.'}
                            </DialogDescription>
                        </DialogHeader>
                        <AddCardForm
                            card={editingCard}
                            onSuccess={handleSaveCard}
                            onClose={handleCloseForm}
                            isSubmitting={isSubmitting}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <CardList 
                cards={cards}
                onEdit={handleOpenForm}
                onDelete={handleDeleteCard}
                isLoading={isLoading}
            />
        </div>
    );
}
