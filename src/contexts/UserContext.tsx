// src/contexts/UserContext.tsx
'use client';

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import type { User } from '@/lib/definitions';
import api from '@/lib/api';

interface ClanMembership {
    role: 'LEADER' | 'ADMIN' | 'MEMBER';
    clanId: string;
}

interface UserContextType {
  user: (User & { clanMembership?: ClanMembership | null; clanId?: string | null; }) | null;
  isLoading: boolean;
  fetchUser: () => Promise<void>; // Expor a função de busca
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserContextType['user']>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    // Não reseta isLoading para true aqui para evitar piscar na tela em re-fetches
    try {
      const response = await api.get('/user');
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user for context", error);
      setUser(null);
    } finally {
      // Garante que o loading inicial seja desativado após a primeira busca
      if (isLoading) {
        setIsLoading(false);
      }
    }
  }, [isLoading]); // A dependência isLoading garante que o setIsLoading(false) rode apenas na primeira vez

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);
  
  return (
    <UserContext.Provider value={{ user, isLoading, fetchUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
