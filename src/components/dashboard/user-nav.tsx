// src/components/dashboard/user-nav.tsx
'use client';

import Link from 'next/link';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { User as UserType } from '@/lib/definitions';
import { LifeBuoy, LogOut, Settings, User } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export function UserNav() {
  const [user, setUser] = useState<UserType | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
        const response = await api.get('/user');
        setUser(response.data);
        if (response.data.avatarUrl) {
            const presignedUrlRes = await api.post('/storage/get-url', { objectName: response.data.avatarUrl });
            setAvatarUrl(presignedUrlRes.data.url);
        } else {
            setAvatarUrl(null);
        }
    } catch(error) {
        // Se falhar, o middleware deve redirecionar para o login
        // console.error("Failed to fetch user for nav");
    }
  }, []);

  useEffect(() => {
    fetchUser();

    // Adiciona um listener para o evento 'profile-updated'
    const handleProfileUpdate = () => {
      fetchUser();
    };
    
    window.addEventListener('profile-updated', handleProfileUpdate);

    // Limpa o listener quando o componente for desmontado
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };

  }, [fetchUser]);

  const handleLogout = () => {
    Cookies.remove('auth_token');
    router.push('/');
    router.refresh();
  };

  if (!user) {
      return (
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
                <AvatarFallback>?</AvatarFallback>
            </Avatar>
        </Button>
      )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl || undefined} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              @{user.username}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
           <DropdownMenuItem asChild>
            <Link href="/dashboard/perfil">
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/configuracoes">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
           <a href="mailto:suporte@jornadafinanceira.com">
            <LifeBuoy className="mr-2 h-4 w-4" />
            <span>Suporte</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
