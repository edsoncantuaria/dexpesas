// src/components/dashboard/fatura/invoice-reconciliation-dialog.tsx
'use client';

import { useState } from 'react';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/error-handler';
import { format } from 'date-fns';

interface InvoiceReconciliationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    cardId: string;
    invoiceMonth: Date;
    invoiceTotalExpenses: number;
    onComplete: () => void;
}

type ReconciliationStep = 'upload' | 'validating' | 'valid' | 'invalid' | 'processing' | 'completed';

interface ValidationResult {
    isValid: boolean;
    difference: number;
    manualTotal: number;
    ofxTotal: number;
}

export function InvoiceReconciliationDialog({
    isOpen,
    onClose,
    cardId,
    invoiceMonth,
    invoiceTotalExpenses,
    onComplete
}: InvoiceReconciliationDialogProps) {
    const [step, setStep] = useState<ReconciliationStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [reconciliationId, setReconciliationId] = useState<string | null>(null);
    const [importedCount, setImportedCount] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const { toast } = useToast();

    const month = format(invoiceMonth, 'yyyy-MM');

    const handleFileSelect = (selectedFile: File) => {
        // Validar extensão
        const fileName = selectedFile.name.toLowerCase();
        if (!fileName.endsWith('.ofx') && !fileName.endsWith('.csv')) {
            toast({
                variant: 'destructive',
                title: 'Arquivo inválido',
                description: 'Por favor, selecione um arquivo OFX ou CSV válido.'
            });
            return;
        }

        setFile(selectedFile);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setStep('validating');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('invoiceMonth', month);

            const response = await api.post(`/cards/${cardId}/invoice/reconcile`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setValidation(response.data.validation);
            setReconciliationId(response.data.reconciliation.id);
            setImportedCount(response.data.importedCount);

            if (response.data.validation.isValid) {
                setStep('valid');
                toast({
                    title: 'Valores conferem! ✅',
                    description: 'O total do arquivo OFX bate com as despesas manuais.',
                    className: 'bg-green-100 dark:bg-green-800'
                });
            } else {
                setStep('invalid');
                toast({
                    variant: 'destructive',
                    title: 'Valores não conferem',
                    description: 'O total do OFX é diferente das despesas manuais.'
                });
            }

        } catch (error) {
            setStep('upload');
            setFile(null);
            handleApiError(error, toast, 'Erro no upload');
        }
    };

    const handleFinalize = async () => {
        if (!reconciliationId) return;

        setStep('processing');

        try {
            const response = await api.post(`/cards/${cardId}/invoice/finalize-reconciliation`, {
                reconciliationId,
                invoiceMonth: month
            });

            setStep('completed');
            toast({
                title: 'Reconciliação concluída! 🎉',
                description: `${response.data.result.deletedCount} despesas removidas, ${response.data.result.importedCount} transações importadas.`,
                className: 'bg-green-100 dark:bg-green-800'
            });

            // Aguardar 2 segundos e fechar
            setTimeout(() => {
                onComplete();
                handleClose();
            }, 2000);

        } catch (error) {
            setStep('valid');
            handleApiError(error, toast, 'Erro ao finalizar reconciliação');
        }
    };

    const handleCancel = async () => {
        if (reconciliationId) {
            try {
                await api.delete(`/cards/${cardId}/invoice/cancel-reconciliation/${reconciliationId}`);
            } catch (error) {
                console.error('Erro ao cancelar:', error);
            }
        }
        handleClose();
    };

    const handleClose = () => {
        setStep('upload');
        setFile(null);
        setValidation(null);
        setReconciliationId(null);
        setImportedCount(0);
        onClose();
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <ResponsiveDialog
            isOpen={isOpen}
            setIsOpen={handleCancel}
            title="Reconciliar Fatura com OFX"
            description={`Faça upload do arquivo OFX/CSV da fatura de ${format(invoiceMonth, 'MMMM/yyyy')}`}
        >
            <div className="space-y-4 py-4">
                {/* STEP: Upload */}
                {step === 'upload' && (
                    <>
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${file
                                ? 'border-green-500 bg-green-50 dark:bg-green-950'
                                : isDragging
                                    ? 'border-primary bg-primary/5'
                                    : 'border-muted-foreground/25 hover:border-primary/50'
                                }`}
                            onDrop={handleDrop}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                        >
                            {file ? (
                                <>
                                    <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
                                    <p className="text-sm font-bold text-green-700 dark:text-green-400 mb-1">
                                        Arquivo selecionado ✓
                                    </p>
                                    <p className="text-xs text-green-600 dark:text-green-500 mb-4">
                                        {file.name}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-sm font-medium mb-2">
                                        Arraste o arquivo OFX/CSV aqui
                                    </p>
                                    <p className="text-xs text-muted-foreground mb-4">
                                        ou clique para selecionar
                                    </p>
                                </>
                            )}
                            <input
                                type="file"
                                accept=".ofx,.csv"
                                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload">
                                <Button
                                    type="button"
                                    variant={file ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                >
                                    {file ? 'Trocar Arquivo' : 'Selecionar Arquivo'}
                                </Button>
                            </label>
                        </div>

                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Atenção:</strong> Esta ação irá <strong>deletar permanentemente TODAS as despesas manuais</strong> da fatura de {format(invoiceMonth, 'MMMM/yyyy')} e substituí-las pelas transações do arquivo OFX.
                            </AlertDescription>
                        </Alert>

                        <div className="bg-muted p-3 rounded-lg space-y-1">
                            <p className="text-sm font-medium">Total de despesas manuais:</p>
                            <p className="text-2xl font-bold">{formatCurrency(invoiceTotalExpenses)}</p>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={handleCancel} variant="ghost" className="flex-1">
                                Cancelar
                            </Button>
                            <Button onClick={handleUpload} disabled={!file} className="flex-1">
                                <Upload className="mr-2 h-4 w-4" />
                                Fazer Upload
                            </Button>
                        </div>
                    </>
                )}

                {/* STEP: Validating */}
                {step === 'validating' && (
                    <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <p className="text-sm font-medium">Processando arquivo...</p>
                    </div>
                )}

                {/* STEP: Valid */}
                {step === 'valid' && validation && (
                    <>
                        <div className="flex items-center justify-center py-6">
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                        </div>

                        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-900 dark:text-green-100">
                                <strong>Valores conferem!</strong> Os totais batem perfeitamente.
                            </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-muted p-3 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">Despesas Manuais</p>
                                <p className="text-lg font-bold">{formatCurrency(validation.manualTotal)}</p>
                            </div>
                            <div className="bg-muted p-3 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">Total OFX</p>
                                <p className="text-lg font-bold">{formatCurrency(validation.ofxTotal)}</p>
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                                <strong>{importedCount}</strong> transações serão importadas
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={handleCancel} variant="ghost" className="flex-1">
                                Cancelar
                            </Button>
                            <Button onClick={handleFinalize} variant="default" className="flex-1 bg-green-600 hover:bg-green-700">
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Confirmar e Substituir
                            </Button>
                        </div>
                    </>
                )}

                {/* STEP: Invalid */}
                {step === 'invalid' && validation && (
                    <>
                        <div className="flex items-center justify-center py-6">
                            <XCircle className="h-16 w-16 text-destructive" />
                        </div>

                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Valores não conferem!</strong> Diferença de {formatCurrency(validation.difference)}
                            </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-muted p-3 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">Despesas Manuais</p>
                                <p className="text-lg font-bold">{formatCurrency(validation.manualTotal)}</p>
                            </div>
                            <div className="bg-muted p-3 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">Total OFX</p>
                                <p className="text-lg font-bold text-destructive">{formatCurrency(validation.ofxTotal)}</p>
                            </div>
                        </div>

                        <Button onClick={handleCancel} variant="outline" className="w-full">
                            Fechar
                        </Button>
                    </>
                )}

                {/* STEP: Processing */}
                {step === 'processing' && (
                    <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <p className="text-sm font-medium">Finalizando reconciliação...</p>
                        <p className="text-xs text-muted-foreground">Deletando despesas e importando transações</p>
                    </div>
                )}

                {/* STEP: Completed */}
                {step === 'completed' && (
                    <div className="flex flex-col items-center justify-center py-8">
                        <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                        <p className="text-lg font-bold text-green-600">Reconciliação Concluída!</p>
                        <p className="text-sm text-muted-foreground">Atualizando dados...</p>
                    </div>
                )}
            </div>
        </ResponsiveDialog>
    );
}
