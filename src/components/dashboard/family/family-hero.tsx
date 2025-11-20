'use client';

import { motion } from 'framer-motion';
import { Clan } from '@/lib/definitions';
import { ClanIcon } from '@/components/dashboard/clans/clan-icon';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Info, Pencil, Users, Wallet, Shield } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';

interface FamilyHeroProps {
    cell: Clan;
    isLeader: boolean;
    onEdit: () => void;
    onRefresh: () => void;
    onInfo: () => void;
    totalBalance?: number;
    membersCount?: number;
}

export function FamilyHero({ cell, isLeader, onEdit, onRefresh, onInfo, totalBalance, membersCount }: FamilyHeroProps) {
    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-6">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="rounded-full ring-4 ring-white/20"
                    >
                        <ClanIcon iconUrl={cell.iconUrl} clanName={cell.name} size="lg" />
                    </motion.div>
                    <div className="space-y-2">
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-3xl font-bold tracking-tight sm:text-4xl"
                        >
                            {cell.name}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="max-w-lg text-blue-100"
                        >
                            {cell.description || 'Gerencie as finanças da sua família em um só lugar.'}
                        </motion.p>
                    </div>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {totalBalance !== undefined && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <Card className="border-none bg-white/10 backdrop-blur-md text-white">
                                <CardContent className="flex items-center gap-3 p-3 px-4">
                                    <div className="rounded-full bg-white/20 p-2">
                                        <Wallet className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-blue-200">Saldo da Família</p>
                                        <p className="text-lg font-bold">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBalance)}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="flex items-center gap-2"
                    >
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={onRefresh} className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white">
                                        <RefreshCcw className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Atualizar dados</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={onInfo} className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white">
                                        <Info className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Como funciona?</TooltipContent>
                            </Tooltip>
                            {isLeader && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={onEdit} className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white">
                                            <Pencil className="h-5 w-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Editar família</TooltipContent>
                                </Tooltip>
                            )}
                        </TooltipProvider>
                    </motion.div>
                </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-100 backdrop-blur-md">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Modo Família Ativo</span>
                </div>
                {membersCount !== undefined && (
                    <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-100 backdrop-blur-md">
                        <Users className="h-3.5 w-3.5" />
                        <span>{membersCount} Membros</span>
                    </div>
                )}
            </div>
        </div>
    );
}
