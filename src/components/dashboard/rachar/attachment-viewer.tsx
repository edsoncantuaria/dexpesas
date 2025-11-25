'use client';

import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';

interface AttachmentViewerProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
    description: string;
}

export function AttachmentViewer({ isOpen, onClose, url, description }: AttachmentViewerProps) {
    return (
        <ResponsiveDialog
            isOpen={isOpen}
            setIsOpen={onClose}
            title="Comprovante"
            description={`Anexo de: ${description}`}
        >
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-full aspect-[3/4] max-h-[60vh] bg-muted rounded-lg overflow-hidden">
                    <Image
                        src={url}
                        alt="Comprovante"
                        fill
                        className="object-contain"
                    />
                </div>
                <div className="flex gap-2 w-full">
                    <Button variant="outline" className="flex-1" onClick={() => window.open(url, '_blank')}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Abrir Original
                    </Button>
                </div>
            </div>
        </ResponsiveDialog>
    );
}
