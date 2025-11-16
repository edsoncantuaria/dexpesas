// src/app/dashboard/admin/page.tsx
'use client';

import Link from "next/link";
import { Shield, Trophy, Target, Gem, Skull, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type AdminServiceItem = {
    href: string;
    title: string;
    description: string;
    Icon: LucideIcon;
    iconBgClass: string;
};

const adminServiceItems: AdminServiceItem[] = [
    {
        href: '/dashboard/admin/conquistas',
        title: 'Gerenciar Conquistas',
        description: 'Crie e edite as medalhas do jogo.',
        Icon: Trophy,
        iconBgClass: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400'
    },
    {
        href: '/dashboard/admin/missions',
        title: 'Gerenciar Missões',
        description: 'Defina os desafios para os jogadores.',
        Icon: Target,
        iconBgClass: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
    },
     {
        href: '/dashboard/admin/items',
        title: 'Gerenciar Itens',
        description: 'Controle os itens e recompensas.',
        Icon: Gem,
        iconBgClass: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
    },
     {
        href: '/dashboard/admin/bosses',
        title: 'Gerenciar Chefes',
        description: 'Ative e edite as batalhas de chefe.',
        Icon: Skull,
        iconBgClass: 'bg-destructive/10 text-destructive'
    },
];

export default function AdminPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Painel do Game Master</h1>
                    <p className="text-muted-foreground">Bem-vindo, mestre! Gerencie o universo do Dexpesas.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {adminServiceItems.map((item) => (
                    <Link href={item.href} key={item.href} className="group">
                        <div className="bg-card p-4 rounded-lg border flex items-center gap-4 transition-all group-hover:border-primary group-hover:bg-primary/5 h-full">
                            <div className={`p-3 rounded-lg ${item.iconBgClass}`}>
                                <item.Icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold">{item.title}</h3>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
