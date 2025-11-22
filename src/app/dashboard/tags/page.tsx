// src/app/dashboard/tags/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Tag } from '@/lib/definitions';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/error-handler';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Button } from '@/components/ui/button';
import { Tags as TagsIcon, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function TagsPage() {
    const [tags, setTags] = useState<(Tag & { _count: { transactions: number } })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
    const { toast } = useToast();

    const fetchTags = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/tags');
            setTags(response.data);
        } catch (error) {
            handleApiError(error, toast, 'Erro ao carregar tags');
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchTags();
    }, [fetchTags]);

    const handleDelete = async () => {
        if (!tagToDelete) return;

        try {
            await api.delete(`/tags/${tagToDelete.id}`);
            toast({ title: 'Tag removida com sucesso!', variant: 'destructive' });
            setTagToDelete(null);
            fetchTags(); // Recarrega a lista
        } catch (error) {
            handleApiError(error, toast, 'Erro ao remover tag');
        }
    };

    if (isLoading) {
        return <LoadingScreen />
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <TagsIcon className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Gerenciar Tags</h1>
                    <p className="text-muted-foreground">Organize e exclua suas tags personalizadas.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Suas Tags</CardTitle>
                    <CardDescription>
                        As tags são criadas automaticamente quando você as utiliza no formulário de transação pela primeira vez.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome da Tag</TableHead>
                                <TableHead>Vezes Usada</TableHead>
                                <TableHead className="text-right">Ação</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tags.length > 0 ? (
                                tags.map((tag) => (
                                    <TableRow key={tag.id}>
                                        <TableCell className="font-medium">{tag.name}</TableCell>
                                        <TableCell>{tag._count.transactions}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setTagToDelete(tag)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        Nenhuma tag criada ainda.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AlertDialog open={!!tagToDelete} onOpenChange={(open) => !open && setTagToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir a tag "{tagToDelete?.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. A tag será removida de todas as transações, mas as transações não serão excluídas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} asChild>
                            <Button variant="destructive">Sim, excluir tag</Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
