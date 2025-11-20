
import { motion } from 'framer-motion';
import { GitCompareArrows, CheckCircle, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ReconcileHeroProps {
    status: 'idle' | 'processing' | 'active' | 'completed';
    metrics?: {
        balanceDifference: number;
        pendingItems: number;
        matchedItems: number;
        totalItems: number;
        accuracy: number;
    };
}

export function ReconcileHero({ status, metrics }: ReconcileHeroProps) {
    const isIdle = status === 'idle';
    const isActive = status === 'active';

    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-black/10 blur-3xl"></div>

            <div className="relative z-10 grid gap-8 lg:grid-cols-2">
                <div className="space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center gap-3"
                    >
                        <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-md">
                            <GitCompareArrows className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white">Reconciliação Bancária</h1>
                            <p className="text-indigo-100">Mantenha suas contas em perfeita harmonia.</p>
                        </div>
                    </motion.div>

                    {isIdle && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="max-w-md text-sm text-indigo-100/80"
                        >
                            Importe seu extrato bancário (OFX ou CSV) para identificar discrepâncias e garantir que seu saldo no Dexpesas esteja 100% correto.
                        </motion.div>
                    )}
                </div>

                {isActive && metrics && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="grid grid-cols-2 gap-4"
                    >
                        <Card className="border-none bg-white/10 p-4 backdrop-blur-md transition-transform hover:scale-105">
                            <div className="flex items-center gap-3">
                                <div className={cn("rounded-full p-2", metrics.balanceDifference === 0 ? "bg-green-500/20" : "bg-red-500/20")}>
                                    {metrics.balanceDifference === 0 ? (
                                        <CheckCircle className="h-5 w-5 text-green-300" />
                                    ) : (
                                        <AlertTriangle className="h-5 w-5 text-red-300" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-indigo-200">Diferença</p>
                                    <p className="text-lg font-bold text-white">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.balanceDifference)}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card className="border-none bg-white/10 p-4 backdrop-blur-md transition-transform hover:scale-105">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-blue-500/20 p-2">
                                    <Clock className="h-5 w-5 text-blue-300" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-indigo-200">Pendentes</p>
                                    <p className="text-lg font-bold text-white">{metrics.pendingItems} itens</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="col-span-2 border-none bg-white/10 p-4 backdrop-blur-md">
                            <div className="mb-2 flex items-center justify-between">
                                <p className="text-xs font-medium text-indigo-200">Progresso da Reconciliação</p>
                                <span className="text-xs font-bold text-white">{Math.round(metrics.accuracy)}%</span>
                            </div>
                            <Progress value={metrics.accuracy} className="h-2 bg-black/20" indicatorClassName="bg-white" />
                        </Card>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
