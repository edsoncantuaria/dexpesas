import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, Target, Wallet, ArrowRightLeft } from "lucide-react";
import Link from "next/link";

export function QuickActions() {
    return (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <Link href="/dashboard/transacoes">
                <Button variant="outline" className="h-auto flex-col gap-2 p-4 min-w-[100px] hover:bg-primary/5 hover:border-primary/50 transition-all">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <PlusCircle className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium">Nova Despesa</span>
                </Button>
            </Link>

            <Link href="/dashboard/contas">
                <Button variant="outline" className="h-auto flex-col gap-2 p-4 min-w-[100px] hover:bg-primary/5 hover:border-primary/50 transition-all">
                    <div className="p-2 bg-orange-500/10 rounded-full">
                        <Wallet className="h-5 w-5 text-orange-500" />
                    </div>
                    <span className="text-xs font-medium">Contas</span>
                </Button>
            </Link>

            <Link href="/dashboard/transacoes">
                <Button variant="outline" className="h-auto flex-col gap-2 p-4 min-w-[100px] hover:bg-primary/5 hover:border-primary/50 transition-all">
                    <div className="p-2 bg-blue-500/10 rounded-full">
                        <ArrowRightLeft className="h-5 w-5 text-blue-500" />
                    </div>
                    <span className="text-xs font-medium">Transações</span>
                </Button>
            </Link>

            <Link href="/dashboard/metas">
                <Button variant="outline" className="h-auto flex-col gap-2 p-4 min-w-[100px] hover:bg-primary/5 hover:border-primary/50 transition-all">
                    <div className="p-2 bg-green-500/10 rounded-full">
                        <Target className="h-5 w-5 text-green-500" />
                    </div>
                    <span className="text-xs font-medium">Metas</span>
                </Button>
            </Link>

            <Link href="/dashboard/relatorios">
                <Button variant="outline" className="h-auto flex-col gap-2 p-4 min-w-[100px] hover:bg-primary/5 hover:border-primary/50 transition-all">
                    <div className="p-2 bg-purple-500/10 rounded-full">
                        <FileText className="h-5 w-5 text-purple-500" />
                    </div>
                    <span className="text-xs font-medium">Relatórios</span>
                </Button>
            </Link>
        </div>
    );
}
