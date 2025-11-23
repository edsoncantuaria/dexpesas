'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingScreen } from '@/components/ui/loading-screen';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/error-handler';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';

interface SankeyNode {
    id: number;
    name: string;
}

interface SankeyLink {
    source: number;
    target: number;
    value: number;
}

interface SankeyData {
    nodes: SankeyNode[];
    links: SankeyLink[];
}

interface SankeyCashFlowChartProps {
    startDate?: Date;
    endDate?: Date;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function SankeyCashFlowChart({ startDate, endDate }: SankeyCashFlowChartProps) {
    const [data, setData] = useState<SankeyData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const params = new URLSearchParams();
                if (startDate) params.append('startDate', startDate.toISOString());
                if (endDate) params.append('endDate', endDate.toISOString());

                const response = await api.get<SankeyData>(`/transactions/cashflow-analysis?${params.toString()}`);
                setData(response.data);
            } catch (error) {
                handleApiError(error, toast, 'Erro ao carregar análise de fluxo de caixa');
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [startDate, endDate, toast]);

    const sankeyData = useMemo(() => {
        if (!data) return null;

        return {
            nodes: data.nodes.map(node => ({ name: node.name })),
            links: data.links
        };
    }, [data]);

    const customTooltip = ({ payload }: any) => {
        if (!payload || !payload.length) return null;

        const link = payload[0].payload;
        const sourceName = data?.nodes.find(n => n.id === link.source)?.name;
        const targetName = data?.nodes.find(n => n.id === link.target)?.name;

        return (
            <div className="bg-popover border rounded-lg p-3 shadow-lg">
                <p className="text-sm font-medium">{sourceName} → {targetName}</p>
                <p className="text-sm text-primary font-bold">{formatCurrency(link.value)}</p>
            </div>
        );
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Fluxo de Dinheiro</CardTitle>
                    <CardDescription>De onde vem e para onde vai</CardDescription>
                </CardHeader>
                <CardContent className="h-[500px] flex items-center justify-center">
                    <LoadingScreen />
                </CardContent>
            </Card>
        );
    }

    if (!data || data.nodes.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Fluxo de Dinheiro</CardTitle>
                    <CardDescription>De onde vem e para onde vai</CardDescription>
                </CardHeader>
                <CardContent className="h-[500px] flex items-center justify-center">
                    <p className="text-muted-foreground">
                        Não há dados suficientes para gerar o diagrama.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Fluxo de Dinheiro</CardTitle>
                <CardDescription>
                    Visualização do fluxo financeiro: receitas → contas → despesas
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[500px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <Sankey
                            data={sankeyData!}
                            node={{ fill: 'hsl(var(--primary))', fillOpacity: 0.8 }}
                            link={{ stroke: 'hsl(var(--muted-foreground))', strokeOpacity: 0.3 }}
                            nodePadding={50}
                            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                        >
                            <Tooltip content={customTooltip} />
                        </Sankey>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 text-xs text-muted-foreground text-center">
                    <p>💡 Dica: As linhas representam o fluxo de dinheiro entre categorias de receita, contas e categorias de despesa.</p>
                </div>
            </CardContent>
        </Card>
    );
}
