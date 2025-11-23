'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { AuditLog } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/error-handler';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, FileClock, ShieldCheck, Wallet, ArrowRightLeft, Layers } from 'lucide-react';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';
import { AuditLogTable } from '@/components/dashboard/auditoria/audit-log-table';
import { AuditLogMobileList } from '@/components/dashboard/auditoria/audit-log-mobile-list';
import { AuditFilters } from '@/components/dashboard/auditoria/audit-filters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRange } from 'react-day-picker';

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

    // Filters
    const [activeTab, setActiveTab] = useState("all");
    const [search, setSearch] = useState("");
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [entityFilter, setEntityFilter] = useState("");

    const { toast } = useToast();
    const isMobile = useIsMobile();

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', '20');

            if (search) params.append('search', search);
            if (dateRange?.from) params.append('startDate', dateRange.from.toISOString());
            if (dateRange?.to) params.append('endDate', dateRange.to.toISOString());

            // Tab logic overrides entity filter if specific tab is selected
            if (activeTab !== 'all') {
                if (activeTab === 'transactions') params.append('entity', 'TRANSACTION');
                else if (activeTab === 'accounts') params.append('entity', 'ACCOUNT');
                else if (activeTab === 'security') params.append('entity', 'USER'); // Assuming USER/AUTH related
            } else if (entityFilter) {
                params.append('entity', entityFilter);
            }

            const response = await api.get<AuditLogResponse>(`/audit?${params.toString()}`);
            setLogs(response.data.data);
            setPagination(response.data.pagination);
        } catch (error) {
            handleApiError(error, toast, 'Erro ao carregar auditoria');
        } finally {
            setIsLoading(false);
        }
    }, [page, search, dateRange, activeTab, entityFilter, toast]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [search, dateRange, activeTab, entityFilter]);

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
            return (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <FileClock className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">Nenhum registro encontrado</h3>
                    <p className="text-muted-foreground max-w-sm mt-2">
                        Tente ajustar seus filtros ou busque por outro termo.
                    </p>
                </div>
            );
        }

        if (isMobile) {
            return <AuditLogMobileList logs={logs} />;
        }

        return <AuditLogTable logs={logs} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/dashboard/configuracoes">
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Trilha de Auditoria</h1>
                        <p className="text-muted-foreground">Monitore todas as atividades da sua conta.</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
                    <TabsTrigger value="all">Geral</TabsTrigger>
                    <TabsTrigger value="transactions">Transações</TabsTrigger>
                    <TabsTrigger value="accounts">Contas</TabsTrigger>
                    <TabsTrigger value="security">Segurança</TabsTrigger>
                </TabsList>

                <div className="space-y-4">
                    <AuditFilters
                        onSearchChange={setSearch}
                        onDateRangeChange={setDateRange}
                        onEntityChange={setEntityFilter}
                        className={activeTab !== 'all' ? 'hidden md:flex' : ''} // Hide extra entity filter if tab is specific
                    />

                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Registros</CardTitle>
                                    <CardDescription>
                                        {pagination?.total || 0} eventos encontrados
                                    </CardDescription>
                                </div>
                                {/* Pagination Controls Top (Optional) */}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 md:p-6 pt-0">
                            {renderContent()}
                        </CardContent>
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between border-t p-4">
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
                            </div>
                        )}
                    </Card>
                </div>
            </Tabs>
        </div>
    );
}

