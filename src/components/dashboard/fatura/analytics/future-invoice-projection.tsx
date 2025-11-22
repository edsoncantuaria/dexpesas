import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ProjectionData {
    month: string;
    fullDate: string;
    amount: number;
    isEstimated: boolean;
}

interface FutureInvoiceProjectionProps {
    data: ProjectionData[];
    limit: number;
}

export function FutureInvoiceProjection({ data, limit }: FutureInvoiceProjectionProps) {
    if (!data || data.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Projeção de Faturas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {data.map((item) => {
                    const percentage = Math.min((item.amount / limit) * 100, 100);
                    const isHigh = percentage > 80;

                    return (
                        <div key={item.fullDate} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">{item.month}</span>
                                <span className="text-muted-foreground">
                                    {item.isEstimated && <span className="text-xs mr-2 italic">(Estimado)</span>}
                                    R$ {item.amount.toFixed(2)}
                                </span>
                            </div>
                            <Progress value={percentage} className={isHigh ? "bg-red-100 [&>div]:bg-red-500" : ""} />
                            <div className="text-xs text-muted-foreground text-right">
                                {percentage.toFixed(1)}% do limite
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
