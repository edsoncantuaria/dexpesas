// src/components/ui/ocr-upload-dialog.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UploadCloud, Loader2, PartyPopper } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { OcrData } from '@/lib/definitions';
import { Alert, AlertDescription, AlertTitle } from './alert';

interface OcrUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOcrComplete: (data: OcrData) => void;
}

// Função para comprimir a imagem e converter para base64
const processImage = (file: File, maxSize: number = 800): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                if (width > height) {
                    if (width > maxSize) { height *= maxSize / width; width = maxSize; }
                } else {
                    if (height > maxSize) { width *= maxSize / height; height = maxSize; }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Canvas context error.'));
                ctx.drawImage(img, 0, 0, width, height);
                // Retorna Data URI no formato JPEG
                resolve(canvas.toDataURL('image/jpeg', 0.9)); 
            };
            img.onerror = reject;
            if (event.target?.result) img.src = event.target.result as string;
            else reject(new Error("File reading error."));
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export function OcrUploadDialog({ isOpen, onClose, onOcrComplete }: OcrUploadDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const imageDataUri = await processImage(file);
      
      const response = await api.post('/ai/scan-receipt', { imageDataUri });
      
      onOcrComplete(response.data);
      toast({ title: 'Recibo analisado com sucesso!' });
      onClose();

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Analisar Recibo',
        description: 'Não foi possível extrair os dados da imagem.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.webp'] },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Digitalizar Recibo com IA</DialogTitle>
          <DialogDescription>
            Envie uma foto nítida do seu recibo ou nota fiscal. A IA tentará preencher os dados para você.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
            <div
                {...getRootProps()}
                className={cn(
                    'relative flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 text-center transition-colors',
                    isDragActive && 'border-primary bg-primary/10'
                )}
            >
                <input {...getInputProps()} />
                {isLoading ? (
                    <div className='flex flex-col items-center gap-4 text-primary'>
                        <Loader2 className="h-10 w-10 animate-spin" />
                        <p className='font-medium'>Analisando imagem...</p>
                    </div>
                ) : (
                    <div className='flex flex-col items-center gap-4 text-muted-foreground'>
                        <UploadCloud className="h-10 w-10" />
                        <p>Arraste uma imagem ou clique para selecionar</p>
                    </div>
                )}
            </div>
            <Alert className="mt-4">
                <PartyPopper className="h-4 w-4" />
                <AlertTitle>Dica de Ouro!</AlertTitle>
                <AlertDescription>
                    Para melhores resultados, use fotos bem iluminadas, com o recibo em uma superfície plana e sem muitos amassados.
                </AlertDescription>
            </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}
