// src/components/ui/file-upload.tsx
'use client';

import { UploadCloud, Loader2 } from 'lucide-react';
import { useDropzone, type DropzoneOptions } from 'react-dropzone';
import { Card } from './card';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/error-handler';

interface FileUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  onValueChange: (value: string | null) => void;
  options?: DropzoneOptions;
}

export function FileUpload({ onValueChange, options, className, ...props }: FileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/storage/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Retorna apenas o objectName, que será armazenado no formulário
      onValueChange(response.data.objectName);
      toast({ title: 'Arquivo enviado com sucesso!' });
    } catch (error) {
      handleApiError(error, toast, 'Erro no Upload');
      onValueChange(null);
    } finally {
      setIsLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'application/pdf': [],
    },
    ...options,
  });

  return (
    <div className={cn('grid gap-2', className)} {...props}>
      <Card
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed bg-muted/50 transition-colors',
          isDragActive && 'border-primary bg-primary/10'
        )}
      >
        <div className="flex cursor-pointer flex-col items-center justify-center p-6 text-center">
          <input {...getInputProps()} />
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            Arraste e solte ou <span className="font-semibold text-primary">clique para enviar</span>.
          </p>
          <p className="text-xs text-muted-foreground">PNG, JPG ou PDF.</p>
        </div>
      </Card>
    </div>
  );
}
