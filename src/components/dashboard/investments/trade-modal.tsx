'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInvestments } from '@/hooks/use-investments';

interface TradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function TradeModal({ isOpen, onClose, onSuccess }: TradeModalProps) {
    const { recordTrade, fetchPortfolios } = useInvestments();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        portfolioId: '', // Should be populated dynamically
        assetId: '', // Should be populated dynamically or free text for now
        type: 'BUY',
        quantity: '',
        price: '',
        date: new Date().toISOString().split('T')[0],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Mock portfolio ID if none selected (for demo purposes, assumes user has one)
        // In real app, we fetch portfolios and let user select.
        const portfolios = await fetchPortfolios();
        const portfolioId = formData.portfolioId || (portfolios.length > 0 ? portfolios[0].id : '');

        if (!portfolioId) {
            alert('Crie uma carteira primeiro!');
            setLoading(false);
            return;
        }

        const success = await recordTrade({
            portfolioId,
            assetId: 'mock-asset-id', // Needs asset selection logic
            type: formData.type as any,
            quantity: Number(formData.quantity),
            price: Number(formData.price),
            date: formData.date,
        });

        setLoading(false);
        if (success) {
            onSuccess();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Movimentação</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">Tipo</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(val) => setFormData({ ...formData, type: val })}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BUY">Compra</SelectItem>
                                <SelectItem value="SELL">Venda</SelectItem>
                                <SelectItem value="DIVIDEND">Dividendo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="quantity" className="text-right">Qtd</Label>
                        <Input
                            id="quantity"
                            type="number"
                            step="0.000001"
                            className="col-span-3"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">Preço</Label>
                        <Input
                            id="price"
                            type="number"
                            step="0.01"
                            className="col-span-3"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">Data</Label>
                        <Input
                            id="date"
                            type="date"
                            className="col-span-3"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
