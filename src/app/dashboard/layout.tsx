// src/app/dashboard/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { MainNav } from '@/components/dashboard/navigation/main-nav';
import { Header } from '@/components/dashboard/header';
import { TransactionFormProvider } from '@/contexts/TransactionFormContext';
import { AddTransactionDialog } from '@/components/dashboard/transacoes/add-transaction-dialog';
import { UserProvider, useUser } from '@/contexts/UserContext';
import { MigrationWizard } from '@/components/onboarding/migration-wizard/migration-wizard';

function DashboardLayoutContent({ children }: { children: ReactNode }) {
  const { user, fetchUser } = useUser();
  const [showMigrationWizard, setShowMigrationWizard] = useState(false);

  // Effect removido para não mostrar o wizard automaticamente no início
  // O wizard agora é acessado apenas via Serviços


  const handleMigrationComplete = async () => {
    setShowMigrationWizard(false);
    await fetchUser(); // Atualiza estado do usuário
  };

  return (
    <>
      <div className="min-h-screen w-full bg-muted/30">
        <MainNav />
        <main className="md:pl-[5rem] pb-24 md:pb-0">
          <Header />
          <div className="p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
      <AddTransactionDialog />
      {showMigrationWizard && (
        <MigrationWizard
          isOpen={showMigrationWizard}
          onComplete={handleMigrationComplete}
        />
      )}
    </>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <TransactionFormProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </TransactionFormProvider>
    </UserProvider>
  );
}
