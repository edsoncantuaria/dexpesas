'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MigrationProgressProps {
    currentStep: number;
    totalSteps: number;
}

const stepLabels = [
    'Início',
    'Contas',
    'Investimentos',
    'Cartões',
    'Histórico',
    'Conclusão',
];

export function MigrationProgress({ currentStep, totalSteps }: MigrationProgressProps) {
    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
                {stepLabels.slice(0, totalSteps + 1).map((label, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                            index < currentStep && "bg-primary text-primary-foreground",
                            index === currentStep && "bg-primary/20 text-primary ring-2 ring-primary",
                            index > currentStep && "bg-muted text-muted-foreground"
                        )}>
                            {index < currentStep ? (
                                <Check className="h-5 w-5" />
                            ) : (
                                index + 1
                            )}
                        </div>
                        <span className={cn(
                            "text-xs mt-2 font-medium",
                            index === currentStep && "text-primary",
                            index !== currentStep && "text-muted-foreground"
                        )}>
                            {label}
                        </span>
                    </div>
                ))}
            </div>
            <div className="relative h-1 bg-muted rounded-full overflow-hidden">
                <div
                    className="absolute top-0 left-0 h-full bg-primary transition-all duration-300"
                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
            </div>
        </div>
    );
}
