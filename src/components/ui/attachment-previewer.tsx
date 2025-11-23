// src/components/ui/attachment-previewer.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from './button';
import { File as FileIcon, X, Loader2, Download, Eye, Image as ImageIcon } from 'lucide-react';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './skeleton';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { cn } from '@/lib/utils';

interface AttachmentPreviewerProps {
  objectName: string;
  onRemove: () => void;
  isAvatar?: boolean;
}

export function AttachmentPreviewer({ objectName, onRemove, isAvatar = false }: AttachmentPreviewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const fileName = objectName.split('/').pop();

  const handlePreview = async () => {
    // Se a URL já foi buscada, apenas abre o dialog
    if (previewUrl) {
      setIsDialogOpen(true);
      return;
    }
    // Se não, busca a URL e então abre o dialog
    setIsLoading(true);
    setIsDialogOpen(true);
    try {
      const response = await api.post('/storage/get-url', { objectName });
      setPreviewUrl(response.data.url);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar anexo' });
      setIsDialogOpen(false); // Fecha se der erro
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Pré-busca a URL para avatares para exibição imediata na UI
    const prefetchUrl = async () => {
      if (isAvatar && objectName) {
        try {
          const response = await api.post('/storage/get-url', { objectName });
          setPreviewUrl(response.data.url);
        } catch { /* falha silenciosa */ }
      }
    };
    prefetchUrl();
  }, [objectName, isAvatar]);

  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName || '');

  if (isAvatar) {
    return (
      <div className="relative w-full h-full">
        <Avatar className="w-full h-full">
          <AvatarImage src={previewUrl || undefined} />
          <AvatarFallback><ImageIcon className="h-1/2 w-1/2 text-muted-foreground" /></AvatarFallback>
        </Avatar>
        <Button variant="destructive" size="icon" className="absolute top-0 right-0 h-6 w-6 rounded-full transform translate-x-1/3 -translate-y-1/3" onClick={(e) => { e.preventDefault(); onRemove(); }}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-start justify-between rounded-lg border p-3 shadow-sm">
        <div className="flex flex-1 items-start gap-2 min-w-0">
          <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="break-all text-sm font-medium">{fileName}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePreview}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ResponsiveDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        title="Visualizador de Comprovante"
        description="Visualize ou baixe o anexo."
      >
        <div className="h-[75vh] flex items-center justify-center bg-muted rounded-md my-4">
          {isLoading && !previewUrl ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : previewUrl ? (
            isImage ? (
              <img src={previewUrl} alt="Comprovante" className="max-h-full max-w-full object-cover" />
            ) : (
              <iframe src={previewUrl} className="w-full h-full" title="Comprovante" />
            )
          ) : (
            <p>Não foi possível carregar o anexo.</p>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Fechar</Button>
          {previewUrl && (
            <a href={previewUrl} download={fileName} target="_blank" rel="noopener noreferrer">
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Baixar
              </Button>
            </a>
          )}
        </div>
      </ResponsiveDialog>
    </>
  );
}
