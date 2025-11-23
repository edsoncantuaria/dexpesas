'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, FileDown, Database, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { handleApiError } from '@/lib/error-handler';

interface ExportMenuProps {
    filters?: any;
}

export function ExportMenu({ filters }: ExportMenuProps) {
    const [isExporting, setIsExporting] = useState(false);
    const { toast } = useToast();

    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            const response = await api.post('/transactions/export', filters || {}, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'jornada_financeira_export.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast({
                title: 'Exportação Concluída',
                description: 'Arquivo CSV baixado com sucesso!'
            });
        } catch (error) {
            handleApiError(error, toast, 'Erro ao exportar CSV');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            const response = await api.post('/transactions/export-excel', filters || {}, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'relatorio_financeiro.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast({
                title: 'Exportação Concluída',
                description: 'Arquivo Excel baixado com sucesso!'
            });
        } catch (error) {
            handleApiError(error, toast, 'Erro ao exportar Excel');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const response = await api.post('/analytics/generate-pdf', filters || {}, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'relatorio_financeiro.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast({
                title: 'Relatório Gerado',
                description: 'Arquivo PDF baixado com sucesso!'
            });
        } catch (error) {
            handleApiError(error, toast, 'Erro ao gerar PDF');
        } finally {
            setIsExporting(false);
        }
    };

    const handleBackup = async () => {
        setIsExporting(true);
        try {
            const response = await api.get('/user/backup', {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const timestamp = new Date().toISOString().split('T')[0];
            link.setAttribute('download', `dexpesas_backup_${timestamp}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast({
                title: 'Backup Criado',
                description: 'Backup completo baixado com sucesso!'
            });
        } catch (error) {
            handleApiError(error, toast, 'Erro ao criar backup');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isExporting}>
                    {isExporting ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Exportando...
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4 mr-2" />
                            Exportar
                        </>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV} disabled={isExporting}>
                    <FileText className="h-4 w-4 mr-2" />
                    CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel} disabled={isExporting}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF} disabled={isExporting}>
                    <FileDown className="h-4 w-4 mr-2" />
                    PDF Report
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleBackup} disabled={isExporting}>
                    <Database className="h-4 w-4 mr-2" />
                    Backup Completo
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
