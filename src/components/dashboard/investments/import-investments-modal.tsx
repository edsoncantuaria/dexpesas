'use client';

import { useState } from 'react';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface ImportInvestmentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ImportInvestmentsModal({ isOpen, onClose, onSuccess }: ImportInvestmentsModalProps) {
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/investments/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setResult(res.data);
            toast({ title: 'Importação concluída!' });
            if (res.data.success > 0) {
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 2000);
            }
        } catch (error) {
            console.error(error);
            toast({ title: 'Erro na importação', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ResponsiveDialog
            isOpen={isOpen}
            setIsOpen={onClose}
            title="Importar da B3"
            description="Faça o upload do arquivo Excel ou CSV exportado da área do investidor da B3."
        >
            {!result ? (
                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-center w-full">
                        <Label
                            htmlFor="dropzone-file"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50"
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-semibold">Clique para enviar</span> ou arraste o arquivo
                                </p>
                                <p className="text-xs text-muted-foreground">XLSX ou CSV</p>
                            </div>
                            <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept=".xlsx,.xls,.csv" />
                        </Label>
                    </div>
                    {file && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                            <FileSpreadsheet className="h-4 w-4" />
                            {file.name}
                        </div>
                    )}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button onClick={handleUpload} disabled={!file || loading}>
                            {loading ? 'Processando...' : 'Importar'}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="py-4 space-y-4">
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                        <CheckCircle2 className="h-5 w-5" />
                        Processamento Concluído
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-green-50 p-3 rounded-md border border-green-100">
                            <span className="block text-green-700 font-bold text-lg">{result.success}</span>
                            <span className="text-green-600">Registros importados</span>
                        </div>
                        <div className="bg-red-50 p-3 rounded-md border border-red-100">
                            <span className="block text-red-700 font-bold text-lg">{result.errors}</span>
                            <span className="text-red-600">Erros</span>
                        </div>
                    </div>
                    {result.details && result.details.length > 0 && (
                        <div className="bg-slate-50 p-3 rounded-md text-xs max-h-32 overflow-y-auto border">
                            <p className="font-semibold mb-1">Detalhes:</p>
                            {result.details.map((msg: string, i: number) => (
                                <div key={i} className="text-muted-foreground">{msg}</div>
                            ))}
                        </div>
                    )}
                    <div className="flex justify-end pt-4">
                        <Button onClick={onClose}>Fechar</Button>
                    </div>
                </div>
            )}
        </ResponsiveDialog>
    );
}

