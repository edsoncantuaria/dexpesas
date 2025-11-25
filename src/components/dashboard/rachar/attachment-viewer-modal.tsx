'use client';

import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface AttachmentViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    attachmentUrl: string | null;
    title?: string;
}

export function AttachmentViewerModal({ isOpen, onClose, attachmentUrl, title }: AttachmentViewerModalProps) {
    if (!attachmentUrl) return null;

    const isPdf = attachmentUrl.toLowerCase().endsWith('.pdf');
    // Construct full URL if it's a relative path (stored in object storage)
    // Assuming api/storage/public/ prefix or similar. 
    // If the backend returns a full URL or a relative path, we need to handle it.
    // Based on FileUpload component, it returns 'objectName'.
    // We likely need a way to get the public URL. 
    // For now, assuming we can construct it or it's a full URL.
    // If it's just the object name, we might need an endpoint to get the signed URL or public URL.
    // Let's assume for now we serve it via /api/storage/public/{objectName}

    const fullUrl = attachmentUrl.startsWith('http')
        ? attachmentUrl
        : `/api/storage/public/${attachmentUrl}`;

    return (
        <ResponsiveDialog
            isOpen={isOpen}
            setIsOpen={(open) => !open && onClose()}
            title={title || "Comprovante"}
            description="Visualizar anexo da despesa."
        >
            <div className="flex flex-col items-center gap-4 p-4">
                <div className="relative w-full h-[60vh] min-h-[300px] bg-muted/20 rounded-lg overflow-hidden flex items-center justify-center border">
                    {isPdf ? (
                        <iframe
                            src={fullUrl}
                            className="w-full h-full"
                            title="PDF Viewer"
                        />
                    ) : (
                        <div className="relative w-full h-full">
                            <Image
                                src={fullUrl}
                                alt="Comprovante"
                                fill
                                className="object-contain"
                                unoptimized // Since we might be serving from local API or external
                            />
                        </div>
                    )}
                </div>

                <div className="flex gap-2 w-full justify-end">
                    <Button variant="outline" size="sm" asChild>
                        <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Abrir Original
                        </a>
                    </Button>
                    <Button size="sm" asChild>
                        <a href={fullUrl} download>
                            <Download className="mr-2 h-4 w-4" />
                            Baixar
                        </a>
                    </Button>
                </div>
            </div>
        </ResponsiveDialog>
    );
}
