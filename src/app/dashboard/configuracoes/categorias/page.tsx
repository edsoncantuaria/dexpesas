// src/app/dashboard/configuracoes/categorias/page.tsx
'use client';

import { CategoryClassificationSettings } from '@/components/settings/category-classification-settings';
import { Button } from '@/components/ui/button';
import { ChevronLeft, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function CategoryClassificationsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/configuracoes">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Classificação de Categorias</h1>
                        <p className="text-muted-foreground">
                            Personalize como suas categorias são organizadas para investimentos
                        </p>
                    </div>
                </div>
            </div>

            <CategoryClassificationSettings />
        </div>
    );
}
