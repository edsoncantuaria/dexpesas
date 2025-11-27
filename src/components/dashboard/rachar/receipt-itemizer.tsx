'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SplitGroupMember } from '@/lib/definitions';
import { Check, User, ShoppingBag, Trash2, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ReceiptItem {
    id: string;
    description: string;
    amount: number;
    assignedTo: string[]; // Array of member IDs
}

interface ReceiptItemizerProps {
    items: { descricao: string; valor: number }[];
    members: SplitGroupMember[];
    onConfirm: (assignments: Record<string, number>) => void;
    onCancel: () => void;
}

export function ReceiptItemizer({ items: initialItems, members, onConfirm, onCancel }: ReceiptItemizerProps) {
    const [items, setItems] = useState<ReceiptItem[]>([]);
    const [selectedMemberId, setSelectedMemberId] = useState<string | 'ALL' | null>(null);

    useEffect(() => {
        setItems(initialItems.map((item, index) => ({
            id: `item-${index}`,
            description: item.descricao,
            amount: item.valor,
            assignedTo: []
        })));
    }, [initialItems]);

    const handleAssign = (itemId: string) => {
        if (!selectedMemberId) return;

        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                if (selectedMemberId === 'ALL') {
                    // Toggle ALL: if fully assigned to all, clear. Else, assign to all.
                    const allMemberIds = members.map(m => m.id);
                    const isFull = item.assignedTo.length === members.length;
                    return { ...item, assignedTo: isFull ? [] : allMemberIds };
                } else {
                    // Toggle specific member
                    const isAssigned = item.assignedTo.includes(selectedMemberId);
                    return {
                        ...item,
                        assignedTo: isAssigned
                            ? item.assignedTo.filter(id => id !== selectedMemberId)
                            : [...item.assignedTo, selectedMemberId]
                    };
                }
            }
            return item;
        }));
    };

    const calculateTotals = () => {
        const totals: Record<string, number> = {};
        members.forEach(m => totals[m.id] = 0);

        items.forEach(item => {
            if (item.assignedTo.length > 0) {
                const splitAmount = item.amount / item.assignedTo.length;
                item.assignedTo.forEach(memberId => {
                    totals[memberId] = (totals[memberId] || 0) + splitAmount;
                });
            }
        });

        return totals;
    };

    const handleConfirm = () => {
        const totals = calculateTotals();
        // Check if there are unassigned items
        const unassignedCount = items.filter(i => i.assignedTo.length === 0).length;
        if (unassignedCount > 0) {
            if (!confirm(`Existem ${unassignedCount} itens não atribuídos. Eles serão ignorados no cálculo. Deseja continuar?`)) {
                return;
            }
        }
        onConfirm(totals);
    };

    const totals = calculateTotals();
    const totalAssigned = Object.values(totals).reduce((a, b) => a + b, 0);
    const totalReceipt = items.reduce((a, b) => a + b.amount, 0);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Itemizar Recibo</h3>
                <div className="text-sm text-muted-foreground">
                    Total: R$ {totalReceipt.toFixed(2)}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[500px]">
                {/* Items List */}
                <Card className="md:col-span-2 flex flex-col h-full overflow-hidden">
                    <div className="p-3 border-b bg-muted/30 font-medium text-sm flex justify-between">
                        <span>Itens ({items.length})</span>
                        <span className={totalAssigned < totalReceipt ? "text-orange-500" : "text-green-500"}>
                            Atribuído: R$ {totalAssigned.toFixed(2)}
                        </span>
                    </div>
                    <ScrollArea className="flex-1 p-3">
                        <div className="space-y-2">
                            {items.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => handleAssign(item.id)}
                                    className={`
                                        flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors
                                        ${item.assignedTo.length > 0 ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'hover:bg-muted'}
                                        ${!selectedMemberId ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`p-2 rounded-full ${item.assignedTo.length > 0 ? 'bg-blue-100 text-blue-600' : 'bg-muted text-muted-foreground'}`}>
                                            <ShoppingBag className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium truncate">{item.description}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.assignedTo.length === 0
                                                    ? 'Não atribuído'
                                                    : item.assignedTo.length === members.length
                                                        ? 'Todos'
                                                        : `${item.assignedTo.length} pessoa(s)`}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="font-bold whitespace-nowrap">R$ {item.amount.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>

                {/* Members List */}
                <Card className="flex flex-col h-full overflow-hidden">
                    <div className="p-3 border-b bg-muted/30 font-medium text-sm">
                        Quem consumiu?
                    </div>
                    <ScrollArea className="flex-1 p-3">
                        <div className="space-y-2">
                            <div
                                onClick={() => setSelectedMemberId('ALL')}
                                className={`
                                    flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                                    ${selectedMemberId === 'ALL' ? 'ring-2 ring-primary border-primary' : 'hover:bg-muted'}
                                `}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                        <Users className="h-4 w-4" />
                                    </div>
                                    <span className="font-medium">Todos</span>
                                </div>
                            </div>

                            {members.map(member => (
                                <div
                                    key={member.id}
                                    onClick={() => setSelectedMemberId(member.id)}
                                    className={`
                                        flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                                        ${selectedMemberId === member.id ? 'ring-2 ring-primary border-primary' : 'hover:bg-muted'}
                                    `}
                                >
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.user?.avatarUrl || undefined} />
                                            <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{member.name}</span>
                                            <span className="text-xs text-muted-foreground">R$ {totals[member.id]?.toFixed(2) || '0.00'}</span>
                                        </div>
                                    </div>
                                    {selectedMemberId === member.id && <Check className="h-4 w-4 text-primary" />}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="p-3 border-t bg-muted/10">
                        <p className="text-xs text-center text-muted-foreground mb-2">
                            Selecione uma pessoa e clique nos itens que ela consumiu.
                        </p>
                    </div>
                </Card>
            </div>

            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button onClick={handleConfirm}>Confirmar Divisão</Button>
            </div>
        </div>
    );
}
