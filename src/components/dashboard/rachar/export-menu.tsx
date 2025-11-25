'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ExportMenuProps {
    groupId: string;
    groupName: string;
}

export function ExportMenu({ groupId, groupName }: ExportMenuProps) {
    const [isExporting, setIsExporting] = useState(false);
    const { toast } = useToast();

    const handleExport = async (format: 'pdf' | 'csv') => {
        setIsExporting(true);
        try {
            const response = await api.get(`/rachar/groups/${groupId}/export`, {
                params: { format },
                responseType: 'blob', // Important for file download
            });

            // Create a blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `grupo-${groupName}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast({
                title: 'Exportação concluída',
                description: `O arquivo ${format.toUpperCase()} foi baixado com sucesso.`,
            });
        } catch (error) {
            console.error('Erro ao exportar:', error);
            toast({
                variant: 'destructive',
                title: 'Erro na exportação',
                description: 'Não foi possível gerar o arquivo.',
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isExporting}>
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Download className="h-4 w-4 mr-2" />
                    )}
                    Exportar
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar como PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exportar como CSV
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
