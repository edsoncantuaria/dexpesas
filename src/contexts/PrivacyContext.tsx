import { createContext, useContext, useState, ReactNode } from 'react';

type PrivacyContextType = {
    showBalance: boolean;
    togglePrivacy: () => void;
};

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function PrivacyProvider({ children }: { children: ReactNode }) {
    const [showBalance, setShowBalance] = useState(true);

    const togglePrivacy = () => setShowBalance(prev => !prev);

    return (
        <PrivacyContext.Provider value={{ showBalance, togglePrivacy }}>
            {children}
        </PrivacyContext.Provider>
    );
}

export function usePrivacy() {
    const context = useContext(PrivacyContext);
    if (!context) {
        throw new Error('usePrivacy must be used within PrivacyProvider');
    }
    return context;
}
