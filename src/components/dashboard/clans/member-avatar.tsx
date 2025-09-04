// src/components/dashboard/clans/member-avatar.tsx
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "lucide-react";

interface MemberAvatarProps {
  avatarUrl?: string | null;
  name: string;
  className?: string;
}

export function MemberAvatar({ avatarUrl, name, className }: MemberAvatarProps) {
    const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUrl = async () => {
            if (avatarUrl && !avatarUrl.startsWith('http')) {
                setIsLoading(true);
                try {
                    const response = await api.post('/storage/get-url', { objectName: avatarUrl });
                    setPresignedUrl(response.data.url);
                } catch (error) {
                    console.error(`Erro ao buscar URL do avatar para ${name}:`, error);
                    setPresignedUrl(null);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setPresignedUrl(avatarUrl || null);
                setIsLoading(false);
            }
        };
        fetchUrl();
    }, [avatarUrl, name]);
    
    if (isLoading) {
        return <Skeleton className={cn("rounded-full", className)} />;
    }

    return (
        <Avatar className={className}>
            <AvatarImage src={presignedUrl || undefined} alt={`Avatar de ${name}`} />
            <AvatarFallback>
                {name ? name.charAt(0).toUpperCase() : <User className="h-1/2 w-1/2"/>}
            </AvatarFallback>
        </Avatar>
    )
}
