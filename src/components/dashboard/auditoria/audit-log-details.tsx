
// src/components/dashboard/auditoria/audit-log-details.tsx
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Mapa de tradução para os nomes dos campos
const fieldTranslations: Record<string, string> = {
    id: 'ID',
    valor: 'Valor',
    descricao: 'Descrição',
    tipo: 'Tipo',
    data: 'Data',
    metodoPagamento: 'Método de Pagamento',
    pago: 'Pago',
    installment: 'Parcelado',
    installmentId: 'ID da Parcela',
    installmentNumber: 'Nº da Parcela',
    totalInstallments: 'Total de Parcelas',
    withInterest: 'Com Juros',
    interestRate: 'Taxa de Juros',
    valorTotal: 'Valor Total',
    totalWithInterest: 'Total com Juros',
    recurrenceType: 'Tipo de Recorrência',
    recorrenciaId: 'ID da Recorrência',
    attachmentUrl: 'URL do Anexo',
    isReconciled: 'Conciliado',
    finalizedGoalId: 'ID da Meta Finalizada',
    userId: 'ID do Usuário',
    accountId: 'ID da Conta',
    cardId: 'ID do Cartão',
    categoryId: 'ID da Categoria',
    importedTransactionId: 'ID da Transação Importada',
    nome: 'Nome',
    instituicao: 'Instituição',
    saldoInicial: 'Saldo Inicial',
    limite: 'Limite',
    diaFechamento: 'Dia de Fechamento',
    diaVencimento: 'Dia de Vencimento',
    bandeira: 'Bandeira',
    enabled: 'Ativado',
    config: 'Configuração',
    keyword: 'Palavra-chave',
    conditionType: 'Tipo de Condição',
};

// Mapa para traduzir valores específicos
const valueTranslations: Record<string, string> = {
    // RecurrenceType
    WEEKLY: 'Semanal',
    BIWEEKLY: 'Quinzenal',
    MONTHLY: 'Mensal',
    BIMONTHLY: 'Bimestral',
    TRIMONTHLY: 'Trimestral',
    SEMIANNUALLY: 'Semestral',
    // AccountType
    corrente: 'Conta Corrente',
    poupanca: 'Poupança',
    investimento: 'Investimento',
    // TransactionType
    receita: 'Receita',
    despesa: 'Despesa',
    // PaymentMethod
    debito: 'Débito',
    credito: 'Crédito',
    pix: 'PIX',
    dinheiro: 'Dinheiro'
};


// Função para formatar valores de forma legível
const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'Sem Dados';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    
    const stringValue = String(value);

    // Verifica se é um valor a ser traduzido
    if (valueTranslations[stringValue]) {
        return valueTranslations[stringValue];
    }
    
    // Tenta detectar se é uma data
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        try {
            // Formata para mostrar apenas a data
            return format(parseISO(value), "dd/MM/yyyy", { locale: ptBR });
        } catch (e) {
            // Se falhar, retorna o valor original
            return stringValue;
        }
    }
    
    if (typeof value === 'number') return value.toLocaleString('pt-BR');
    
    return stringValue;
};

// Função para traduzir o nome do campo
const translateField = (key: string): string => {
    return fieldTranslations[key] || key.charAt(0).toUpperCase() + key.slice(1);
}


export function AuditLogDetails({ details }: { details: any }) {
    if (!details) {
        return <p className="text-sm text-muted-foreground">Nenhum detalhe disponível para este evento.</p>;
    }

    const { before, after } = details;

    // Se for uma criação (só tem 'after')
    if (after && !before) {
        const fields = Object.keys(after);
        return (
            <div>
                <h4 className="font-semibold mb-2">Dados Criados:</h4>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Campo</TableHead>
                                <TableHead>Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields.map(key => (
                                <TableRow key={key}>
                                    <TableCell className="font-medium capitalize">{translateField(key)}</TableCell>
                                    <TableCell className="break-all"><Badge variant="outline">{formatValue(after[key])}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }
    
    // Se for uma exclusão (só tem 'before')
     if (before && !after) {
        const fields = Object.keys(before);
        return (
            <div>
                <h4 className="font-semibold mb-2 text-destructive">Dados Excluídos:</h4>
                 <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Campo</TableHead>
                                <TableHead>Valor Excluído</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields.map(key => (
                                <TableRow key={key}>
                                    <TableCell className="font-medium capitalize">{translateField(key)}</TableCell>
                                    <TableCell className="break-all"><Badge variant="destructive">{formatValue(before[key])}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }

    // Se for uma atualização (tem 'before' e 'after')
    const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
    const changedFields = Array.from(allKeys).filter(key => {
        // Ignora campos que não mudam de fato ou que são apenas de timestamp
        if (key === 'updatedAt') return false;
        const beforeValue = JSON.stringify(before[key]);
        const afterValue = JSON.stringify(after[key]);
        return beforeValue !== afterValue;
    });

    if (changedFields.length === 0) {
        return <p className="text-sm text-muted-foreground">Nenhuma alteração de dados detectada neste evento.</p>;
    }

    return (
        <div>
            <h4 className="font-semibold mb-2">Alterações Realizadas:</h4>
            {/* Versão para Desktop (Tabela) */}
            <div className="hidden md:block border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Campo</TableHead>
                            <TableHead>Valor Antigo</TableHead>
                            <TableHead>Valor Novo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {changedFields.map(key => (
                            <TableRow key={key}>
                                <TableCell className="font-medium capitalize">{translateField(key)}</TableCell>
                                <TableCell><span className="text-destructive break-all">{formatValue(before[key])}</span></TableCell>
                                <TableCell><span className="text-green-500 font-semibold break-all">{formatValue(after[key])}</span></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {/* Versão para Mobile (Lista) */}
            <div className="md:hidden space-y-4">
                 {changedFields.map((key, index) => (
                    <div key={key}>
                        <div className="p-2 rounded-md bg-muted/30">
                            <p className="font-medium capitalize text-sm">{translateField(key)}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-destructive text-xs line-through break-all">{formatValue(before[key])}</span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0"/>
                                <span className="text-green-500 text-xs font-semibold break-all">{formatValue(after[key])}</span>
                            </div>
                        </div>
                        {index < changedFields.length - 1 && <Separator className="my-2"/>}
                    </div>
                ))}
            </div>
        </div>
    );
}
    
    