'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface PortfolioListProps {
    portfolios: {
        id: string;
        name: string;
        value: number;
    }[];
}

export default function PortfolioList({ portfolios }: PortfolioListProps) {
    if (portfolios.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                    <p className="text-muted-foreground mb-4">Você ainda não tem carteiras criadas.</p>
                    <Button variant="outline">Criar Primeira Carteira</Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {portfolios.map((portfolio) => (
                <Card key={portfolio.id} className="hover:bg-accent/5 transition-colors cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-medium">{portfolio.name}</CardTitle>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(portfolio.value)}
                        </div>
                        <p className="text-xs text-muted-foreground">Valor atual</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
