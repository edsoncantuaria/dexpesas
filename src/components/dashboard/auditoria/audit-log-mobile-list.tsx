
// src/components/dashboard/auditoria/audit-log-mobile-list.tsx
'use client';

import type { AuditLog } from '@/lib/definitions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronsRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AuditLogDetails } from '@/components/dashboard/auditoria/audit-log-details';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AnimatePresence, motion } from 'framer-motion';

interface AuditLogMobileListProps {
    logs: AuditLog[];
}

const actionTranslations: Record<string, string> = {
    CREATE_ACCOUNT: 'Criação de Conta',
    UPDATE_ACCOUNT: 'Atualização de Conta',
    DELETE_ACCOUNT: 'Exclusão de Conta',
    TRANSFER_FUNDS: 'Transferência entre Contas',
    CREATE_CARD: 'Criação de Cartão',
    UPDATE_CARD: 'Atualização de Cartão',
    DELETE_CARD: 'Exclusão de Cartão',
    PAY_CARD_BILL: 'Pagamento de Fatura',
    CREATE_TRANSACTION: 'Criação de Transação',
    UPDATE_TRANSACTION: 'Atualização de Transação',
    DELETE_TRANSACTION: 'Exclusão de Transação',
    TOGGLE_PAID_STATUS: 'Alteração de Status Pgto.',
    CREATE_FROM_IMPORTED: 'Criação via Extrato',
    CREATE_BUDGET: 'Criação de Orçamento',
    UPDATE_BUDGET: 'Atualização de Orçamento',
    DELETE_BUDGET: 'Exclusão de Orçamento',
    CREATE_GOAL: 'Criação de Meta',
    UPDATE_GOAL: 'Atualização de Meta',
    DELETE_GOAL: 'Exclusão de Meta',
    ADD_GOAL_CONTRIBUTION: 'Contribuição para Meta',
    FINALIZE_GOAL: 'Finalização de Meta',
    RESCUE_GOAL: 'Resgate de Meta',
    UPDATE_AUTOMATION: 'Atualização de Automação',
    RUN_AUTOMATION: 'Execução de Automação',
    CREATE_CATEGOZATION_RULE: 'Criação de Regra de Categoria',
    DELETE_CATEGOZATION_RULE: 'Exclusão de Regra de Categoria',
    DELETE_ALL_CATEGORIZATION_RULES: 'Exclusão de Todas as Regras',
    RUN_AI_ANALYSIS: 'Execução de Análise IA',
    RUN_AI_OCR: 'Leitura de Recibo com IA',
    UPLOAD_STATEMENT: 'Upload de Extrato',
    MATCH_TRANSACTION: 'Conciliação Manual',
    DISCARD_TRANSACTION: 'Descarte de Transação (Extrato)',
    FINALIZE_RECONCILIATION: 'Finalização de Reconciliação',
};

const entityTranslations: Record<string, string> = {
    ACCOUNT: 'Conta',
    CARD: 'Cartão',
    TRANSACTION: 'Transação',
    BUDGET: 'Orçamento',
    GOAL: 'Meta',
    AUTOMATION: 'Automação',
    CATEGORIZATION_RULE: 'Regra de Categoria',
    AI_ANALYSIS: 'Análise IA',
    RECONCILIATION: 'Reconciliação',
};

const statusTranslations: Record<string, string> = {
    SUCCESS: 'Sucesso',
    FAILURE: 'Falha',
};

const translate = (key: string, map: Record<string, string>): string => {
    return map[key] || key;
};

export function AuditLogMobileList({ logs }: AuditLogMobileListProps) {
    return (
        <div className="space-y-3">
            <AnimatePresence>
            {logs.map((log, index) => (
                <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                <Collapsible asChild>
                    <Card className="transition-shadow hover:shadow-md">
                        <CardContent className="p-4 space-y-2">
                             <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{translate(log.action, actionTranslations)}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {translate(log.entity, entityTranslations)} 
                                        <span className="text-xs text-muted-foreground/70"> ({log.entityId.substring(0, 8)}...)</span>
                                    </p>
                                </div>
                                <Badge variant={log.status === 'SUCCESS' ? 'default' : 'destructive'}>
                                    {translate(log.status, statusTranslations)}
                                </Badge>
                             </div>
                             <Separator />
                             <div className="flex justify-between items-center">
                                <p className="text-xs text-muted-foreground">{format(new Date(log.createdAt), "dd/MM/yy HH:mm:ss", { locale: ptBR })}</p>
                                {log.details && (
                                     <CollapsibleTrigger asChild>
                                        <Button variant="ghost" size="sm" className="transition-colors">Detalhes <ChevronsRight className="h-4 w-4 ml-1"/></Button>
                                    </CollapsibleTrigger>
                                )}
                             </div>

                             <CollapsibleContent>
                                <div className="p-3 mt-2 rounded-md bg-muted/50">
                                  <AuditLogDetails details={log.details} />
                                </div>
                             </CollapsibleContent>
                        </CardContent>
                    </Card>
                </Collapsible>
                </motion.div>
            ))}
            </AnimatePresence>
        </div>
    );
}
    
    