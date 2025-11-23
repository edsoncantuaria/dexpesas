
// src/components/dashboard/auditoria/audit-log-table.tsx
'use client';

import { useState } from 'react';
import type { AuditLog } from '@/lib/definitions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronsRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { AuditLogDetails } from '@/components/dashboard/auditoria/audit-log-details';
import { cn } from '@/lib/utils';

interface AuditLogTableProps {
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

function AuditLogRow({ log }: { log: AuditLog }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <TableRow className="transition-colors hover:bg-muted/50">
                <TableCell className="font-medium">{translate(log.action, actionTranslations)}</TableCell>
                <TableCell>
                    <span className="text-muted-foreground">{translate(log.entity, entityTranslations)}</span>
                    <span className="text-xs text-muted-foreground/70"> ({log.entityId.substring(0, 8)}...)</span>
                </TableCell>
                <TableCell>{format(new Date(log.createdAt), "dd/MM/yy HH:mm:ss", { locale: ptBR })}</TableCell>
                <TableCell>
                    <Badge variant={log.status === 'SUCCESS' ? 'default' : 'destructive'}>
                        {translate(log.status, statusTranslations)}
                    </Badge>
                </TableCell>
                <TableCell className="text-right">
                    {log.details && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="transition-colors"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            Ver Detalhes
                            {isOpen ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                        </Button>
                    )}
                </TableCell>
            </TableRow>
            {log.details && (
                <TableRow className={cn("hover:bg-transparent border-0", !isOpen && "hidden")}>
                    <TableCell colSpan={5} className="p-0 border-0">
                        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                                <div className="p-4 bg-muted/50">
                                    <AuditLogDetails details={log.details} />
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
    return (
        <div className="border rounded-md overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Ação</TableHead>
                        <TableHead>Entidade</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Detalhes</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log) => (
                        <AuditLogRow key={log.id} log={log} />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

