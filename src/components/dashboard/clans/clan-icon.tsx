// src/components/dashboard/clans/clan-icon.tsx
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield } from "lucide-react";

interface ClanIconProps {
  iconUrl?: string | null;
  clanName: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ClanIcon({ iconUrl, clanName, size = 'md' }: ClanIconProps) {
    const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchUrl = async () => {
            if (iconUrl && !iconUrl.startsWith('http')) {
                setIsLoading(true);
                try {
                    const response = await api.post('/storage/get-url', { objectName: iconUrl });
                    setPresignedUrl(response.data.url);
                } catch (error) {
                    console.error("Erro ao buscar URL do ícone do clã:", error);
                    setPresignedUrl(null);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setPresignedUrl(iconUrl || null);
            }
        };
        fetchUrl();
    }, [iconUrl]);
    
    const sizeClasses = {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-16 w-16 text-lg',
    }

    if (isLoading) {
        return <Skeleton className={cn("rounded-full", sizeClasses[size])} />;
    }

    return (
        <Avatar className={sizeClasses[size]}>
            <AvatarImage src={presignedUrl || undefined} alt={`Ícone do clã ${clanName}`} />
            <AvatarFallback className="bg-muted text-muted-foreground">
                <Shield className="h-1/2 w-1/2" />
            </AvatarFallback>
        </Avatar>
    )
}
