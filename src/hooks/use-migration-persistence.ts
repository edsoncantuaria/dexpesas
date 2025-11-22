// src/hooks/use-migration-persistence.ts
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface MigrationData {
    accounts: any[];
    cards: any[];
    cardHistory: Record<number, any[]>;
    currentStep?: string;
}

export function useMigrationPersistence() {
    const [isLoaded, setIsLoaded] = useState(false);

    const saveData = async (data: Partial<MigrationData>) => {
        try {
            // Salvar no banco
            await api.post('/migration/draft', data);

            // Fallback: salvar também no localStorage
            try {
                localStorage.setItem('dexpesas_migration_fallback', JSON.stringify({
                    ...data,
                    timestamp: Date.now(),
                }));
            } catch (e) {
                console.warn('Failed to save to localStorage:', e);
            }
        } catch (error) {
            console.error('Failed to save migration data to database:', error);

            // Se falhar no banco, tenta salvar só no localStorage
            try {
                localStorage.setItem('dexpesas_migration_fallback', JSON.stringify({
                    ...data,
                    timestamp: Date.now(),
                }));
            } catch (e) {
                console.error('Failed to save to localStorage fallback:', e);
            }
        }
    };

    const loadData = async (): Promise<MigrationData | null> => {
        try {
            // Tentar carregar do banco primeiro
            const response = await api.get('/migration/draft');

            if (response.data.draft) {
                return response.data.draft;
            }

            // Se não tem no banco, tentar localStorage como fallback
            return loadFromLocalStorage();
        } catch (error) {
            console.error('Failed to load migration data from database:', error);

            // Fallback para localStorage
            return loadFromLocalStorage();
        }
    };

    const loadFromLocalStorage = (): MigrationData | null => {
        try {
            const stored = localStorage.getItem('dexpesas_migration_fallback');
            if (!stored) return null;

            const data = JSON.parse(stored);

            // Expire data after 7 days
            if (data.timestamp && Date.now() - data.timestamp > 7 * 24 * 60 * 60 * 1000) {
                clearLocalStorage();
                return null;
            }

            return data;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return null;
        }
    };

    const clearData = async () => {
        try {
            // Limpar do banco
            await api.delete('/migration/draft');
        } catch (error) {
            console.error('Failed to clear migration data from database:', error);
        }

        // Limpar localStorage também
        clearLocalStorage();
    };

    const clearLocalStorage = () => {
        try {
            localStorage.removeItem('dexpesas_migration_fallback');
        } catch (error) {
            console.error('Failed to clear localStorage:', error);
        }
    };

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    return {
        saveData,
        loadData,
        clearData,
        isLoaded,
    };
}
