
// src/app/dashboard/auditoria/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { AuditLog } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/error-handler';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, FileClock } from 'lucide-react';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';
import { AuditLogTable } from '@/components/dashboard/auditoria/audit-log-table';
import { AuditLogMobileList } from '@/components/dashboard/auditoria/audit-log-mobile-list';

interface AuditLogResponse {
    data: AuditLog[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export default function AuditoriaPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [pagination, setPagination] = useState<AuditLogResponse['pagination'] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const { toast } = useToast();
    const isMobile = useIsMobile();

    const fetchLogs = useCallback(async (pageNum: number) => {
        setIsLoading(true);
        try {
            const response = await api.get<AuditLogResponse>(`/audit?page=${pageNum}&limit=20`);
            setLogs(response.data.data);
            setPagination(response.data.pagination);
        } catch (error) {
            handleApiError(error, toast, 'Erro ao carregar auditoria');
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchLogs(page);
    }, [fetchLogs, page]);

    const handleNextPage = () => {
        if (pagination && page < pagination.totalPages) {
            setPage(page + 1);
        }
    };

    const handlePrevPage = () => {
        if (page > 1) {
            setPage(page - 1);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <LoadingScreen />
                </div>
            );
        }
        if (logs.length === 0) {
            return <p className="text-center text-muted-foreground py-8">Nenhum registro de auditoria encontrado.</p>;
        }

        if (isMobile) {
            return <AuditLogMobileList logs={logs} />;
        }

        return <AuditLogTable logs={logs} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/configuracoes">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex items-center gap-3">
                    <FileClock className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Trilha de Auditoria</h1>
                        <p className="text-muted-foreground">Histórico de atividades da sua conta.</p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Registros de Atividade</CardTitle>
                    <CardDescription>
                        Aqui estão listadas as últimas ações realizadas na sua conta, da mais recente para a mais antiga.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
                {pagination && pagination.totalPages > 1 && (
                    <CardFooter className="flex items-center justify-between border-t pt-4">
                        <span className="text-sm text-muted-foreground">
                            Página {pagination.page} de {pagination.totalPages}
                        </span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={page === 1}>
                                <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={page === pagination.totalPages}>
                                Próxima <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}

