// src/app/dashboard/cartoes/page.tsx
'use client';

import { CreditCard, PlusCircle } from "lucide-react";
import { CardList } from "@/components/dashboard/cartoes/card-list";
import { useState, useEffect, useCallback } from "react";
import type { Card } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/api';
import { handleApiError } from '@/lib/error-handler';
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
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
            handleApiError(error, toast, 'Erro ao buscar cartões');
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchCards();
    }, [fetchCards]);

    const handleFormOpenChange = (open: boolean) => {
        setIsFormOpen(open);
        if (!open) {
            setEditingCard(null);
        }
    };

    const handleOpenForm = (card?: Card) => {
        setEditingCard(card || null);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        handleFormOpenChange(false);
    };

    const handleSaveCard = async (cardData: Omit<Card, 'id' | 'userId' | 'bestDayToBuy' | 'currentInvoiceAmount' | 'availableLimit'> & { id?: string }) => {
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
            handleApiError(error, toast, 'Erro ao salvar cartão');
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
                handleApiError(error, toast, 'Erro ao excluir cartão');
            }
        }
    };

    if (isLoading) {
        return <LoadingScreen />
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                        <CreditCard className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold font-headline bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                            Cartões
                        </h1>
                        <p className="text-muted-foreground mt-1">Gerencie seus cartões de crédito e acompanhe faturas.</p>
                    </div>
                </div>
                <ResponsiveDialog
                    isOpen={isFormOpen}
                    setIsOpen={handleFormOpenChange}
                    title={editingCard ? 'Editar Cartão' : 'Adicionar Novo Cartão'}
                    description={editingCard ? 'Atualize as informações do seu cartão.' : 'Preencha as informações para adicionar um novo cartão.'}
                    trigger={
                        <Button
                            onClick={() => handleOpenForm()}
                            className="w-full sm:w-auto shadow-lg shadow-primary/20"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Novo Cartão
                        </Button>
                    }
                >
                    <AddCardForm
                        card={editingCard}
                        onSuccess={handleSaveCard}
                        onClose={handleCloseForm}
                        isSubmitting={isSubmitting}
                    />
                </ResponsiveDialog>
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
