// src/hooks/use-migration-persistence.ts
'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'dexpesas_migration_data';

interface MigrationData {
    accounts: any[];
    cards: any[];
    cardHistory: Record<number, any[]>;
    currentStep?: string;
    timestamp?: number;
}

export function useMigrationPersistence() {
    const [isLoaded, setIsLoaded] = useState(false);

    const saveData = (data: Partial<MigrationData>) => {
        try {
            const existing = loadData();
            const merged = {
                ...existing,
                ...data,
                timestamp: Date.now(),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch (error) {
            console.error('Failed to save migration data:', error);
        }
    };

    const loadData = (): MigrationData | null => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return null;

            const data = JSON.parse(stored);

            // Expire data after 7 days
            if (data.timestamp && Date.now() - data.timestamp > 7 * 24 * 60 * 60 * 1000) {
                clearData();
                return null;
            }

            return data;
        } catch (error) {
            console.error('Failed to load migration data:', error);
            return null;
        }
    };

    const clearData = () => {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Failed to clear migration data:', error);
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
