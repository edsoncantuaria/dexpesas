// src/app/dashboard/servicos/page.tsx
'use client';

import Link from "next/link";
import { useMemo, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import {
    Grid3x3,
    Landmark,
    CreditCard,
    BarChart3,
    Trophy,
    Rocket,
    BrainCircuit,
    ChevronRight,
    Target,
    PiggyBank,
    Zap,
    BookText,
    GitCompareArrows,
    Tags,
    Users,
    Swords,
    TrendingUp,
    Shield,
    TriangleAlert,

    Calendar,
    Layers,
    TrendingDown,
    HelpCircle
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useGamificationMode } from '@/hooks/use-gamification-mode';
import { useUser } from '@/contexts/UserContext';
import { MigrationResumeCard } from '@/components/migration/migration-resume-card';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type ServiceItem = {
    href: string;
    title: string;
    description: string;
    Icon: LucideIcon;
    iconBgClass: string;
    modal?: {
        title: string;
        description: string;
        features: string[];
        integration: string;
    };
};

// Ordem revisada para melhor agrupamento e harmonia
const baseServiceItems: ServiceItem[] = [
    // Core Financeiro
    {
        href: '/dashboard/contas',
        title: 'Contas',
        description: 'Gerencie suas contas bancárias',
        Icon: Landmark,
        iconBgClass: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
    },
    {
        href: '/dashboard/cartoes',
        title: 'Cartões',
        description: 'Acompanhe seus cartões de crédito',
        Icon: CreditCard,
        iconBgClass: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
    },
    {
        href: '/dashboard/servicos/parcelas',
        title: 'Parcelas Futuras',
        description: 'Visualize todas as parcelas e recorrências',
        Icon: Calendar,
        iconBgClass: 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400'
    },
    {
        href: '/dashboard/subcategorias',
        title: 'Subcategorias',
        description: 'Gerencie subcategorias e ícones',
        Icon: Layers,
        iconBgClass: 'bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400'
    },
    {
        href: '/dashboard/metas',
        title: 'Metas',
        description: 'Acompanhe seus objetivos',
        Icon: PiggyBank,
        iconBgClass: 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400'
    },
    {
        href: '/dashboard/investimentos',
        title: 'Investimentos',
        description: 'Planner inteligente de sobras, Casa/Mercado e rentabilidade',
        Icon: TrendingUp,
        iconBgClass: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
    },
    // Ferramentas de Análise e Automação
    {
        href: '/dashboard/dividas',
        title: 'Gestão de Dívidas',
        description: 'Calculadora de quitação e planejamento',
        Icon: TrendingDown,
        iconBgClass: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400',
        modal: {
            title: 'Gestão de Dívidas',
            description: 'Ferramenta completa para planejar e visualizar a quitação de suas dívidas usando estratégias comprovadas.',
            features: [
                'Cadastro de múltiplas dívidas com juros e parcelas',
                'Comparação Snowball vs Avalanche',
                'Cálculo de juros e tempo de quitação',
                'Timeline visual de pagamento',
                'Simulação de pagamento extra'
            ],
            integration: 'Esta ferramenta é independente dos seus dados reais. Você pode usar para simular estratégias de pagamento sem afetar suas transações ou contas. É perfeito para planejar como quitar dívidas de cartões, empréstimos e financiamentos da forma mais eficiente.'
        }
    },
    {
        href: '/dashboard/orcamentos',
        title: 'Orçamentos',
        description: 'Controle seus gastos por categoria',
        Icon: Target,
        iconBgClass: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
    },
    {
        href: '/dashboard/relatorios',
        title: 'Relatórios',
        description: 'Visualize gráficos e análises',
        Icon: BarChart3,
        iconBgClass: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
    },
    {
        href: '/dashboard/reconcile',
        title: 'Reconciliação Bancária',
        description: 'Importe extratos e concilie contas',
        Icon: GitCompareArrows,
        iconBgClass: 'bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400'
    },
    {
        href: '/dashboard/automacoes',
        title: 'Automações',
        description: 'Configure regras inteligentes',
        Icon: Zap,
        iconBgClass: 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400'
    },
    // Ferramentas de IA
    {
        href: '/dashboard/habitos',
        title: 'Descoberta com IA',
        description: 'Analise seus hábitos financeiros',
        Icon: BrainCircuit,
        iconBgClass: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
    },
    {
        href: '/dashboard/regras',
        title: 'Regras de Categorização',
        description: 'Ensine o app a organizar seus gastos',
        Icon: BookText,
        iconBgClass: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400'
    },
    // Módulos de Gamificação e Social
    {
        href: '/dashboard/progresso',
        title: 'Progresso',
        description: 'Detalhes de Nível, XP e atributos',
        Icon: Rocket,
        iconBgClass: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
    },
    {
        href: '/dashboard/conquistas',
        title: 'Conquistas',
        description: 'Veja suas medalhas e progresso',
        Icon: Trophy,
        iconBgClass: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400'
    },
    {
        href: '/dashboard/cells',
        title: 'Modo Família',
        description: 'Gerencie orçamentos híbridos e rateios inteligentes',
        Icon: Users,
        iconBgClass: 'bg-gray-100 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400'
    },
];

export default function ServicesPage() {
    const { user, fetchUser } = useUser();
    const router = useRouter();
    const { isClassic, isLite } = useGamificationMode();
    const { toast } = useToast();
    const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

    const serviceItems = useMemo(() => {
        const liteOverrides: Record<string, Pick<ServiceItem, 'title' | 'description'>> = {
            '/dashboard/progresso': {
                title: 'Progresso Lite',
                description: 'Veja XP e atributos essenciais sem excessos épicos.',
            },
            '/dashboard/conquistas': {
                title: 'Conquistas em Destaque',
                description: 'Acompanhe medalhas principais e marcos recentes.',
            },
        };

        return baseServiceItems
            .filter(item => {
                if (isClassic && (item.href === '/dashboard/progresso' || item.href === '/dashboard/conquistas')) {
                    return false;
                }
                return true;
            })
            .map(item => {
                if (isLite && liteOverrides[item.href]) {
                    return { ...item, ...liteOverrides[item.href]! };
                }
                return item;
            });
    }, [isClassic, isLite]);

    const finalServiceItems = useMemo(() => {
        let items = serviceItems;

        if (user?.emailVerified === false) {
            items = items.map(item => (
                ['cells', 'investimentos', 'regras', 'habitos', 'automacoes', 'reconcile'].some(locked => item.href.includes(locked))
                    ? {
                        ...item,
                        title: item.title + ' 🔒',
                        iconBgClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }
                    : item
            ));
        }
        return items;
    }, [serviceItems, user]);

    const handleLockedClick = () => {
        toast({
            title: "Acesso Restrito",
            description: "Confirme seu e-mail para desbloquear este recurso.",
            variant: "destructive",
        });
    };

    const handleMigrationResume = async () => {
        await fetchUser(); // Atualiza o user context
        router.refresh(); // Força refresh da página para mostrar o wizard
    };

    const lockedRoutes = [
        '/dashboard/cells',
        '/dashboard/investimentos', // Corrected from '/dashboard/investments' to match baseServiceItems
        '/dashboard/regras',
        '/dashboard/habitos',
        '/dashboard/automacoes',
        '/dashboard/reconcile'
    ];

    const showMigrationCard = user?.hasCompletedMigration === 2;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Grid3x3 className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Serviços</h1>
                    <p className="text-muted-foreground">Todas as ferramentas para sua jornada financeira em um só lugar.</p>
                </div>
            </div>

            {showMigrationCard && (
                <MigrationResumeCard onResume={handleMigrationResume} />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {finalServiceItems.map((item) => {
                    const isLocked = !user?.emailVerified && lockedRoutes.some(route => item.href.includes(route));

                    if (isLocked) {
                        return (
                            <div
                                key={item.href}
                                className="group relative cursor-pointer"
                                onClick={handleLockedClick}
                            >
                                <div className="bg-card p-4 rounded-lg border flex items-center gap-4 h-full opacity-60 grayscale transition-all hover:opacity-80">
                                    <div className={`p - 3 rounded - lg ${item.iconBgClass} `}>
                                        <item.Icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center bg-background/10 backdrop-blur-[1px] rounded-lg group-hover:backdrop-blur-none transition-all">
                                        <div className="bg-background/80 p-2 rounded-full shadow-sm border group-hover:scale-110 transition-transform">
                                            <TriangleAlert className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <Link key={item.href} href={item.href}>
                            <div className="group h-full flex flex-col gap-3 rounded-lg border bg-card p-4 hover:shadow-md transition-all hover:border-primary/50">
                                <div className="flex items-start justify-between">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${item.iconBgClass}`}>
                                        <item.Icon className="w-5 h-5" />
                                    </div>
                                    {item.modal && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSelectedService(item);
                                            }}
                                            className="p-1 hover:bg-muted rounded-full transition-colors"
                                        >
                                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">{item.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground group-hover:text-primary transition-colors">
                                    <span>Acessar</span>
                                    <ChevronRight className="ml-1 h-4 w-4" />
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Modal de Explicação */}
            {selectedService?.modal && (
                <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
                    <DialogContent className="sm:max-w-[550px]">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${selectedService.iconBgClass}`}>
                                    <selectedService.Icon className="w-6 h-6" />
                                </div>
                                <DialogTitle className="text-2xl">{selectedService.modal.title}</DialogTitle>
                            </div>
                            <DialogDescription className="text-base">
                                {selectedService.modal.description}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 mt-4">
                            <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <Badge variant="outline">Funcionalidades</Badge>
                                </h4>
                                <ul className="space-y-2">
                                    {selectedService.modal.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm">
                                            <span className="text-primary mt-0.5">✓</span>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-muted/50 p-4 rounded-lg">
                                <h4 className="font-semibold mb-2 text-sm">Como se integra?</h4>
                                <p className="text-sm text-muted-foreground">
                                    {selectedService.modal.integration}
                                </p>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedService(null)}
                                    className="flex-1"
                                >
                                    Fechar
                                </Button>
                                <Link href={selectedService.href} className="flex-1">
                                    <Button className="w-full">
                                        Acessar Agora
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
