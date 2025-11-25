// src/app/dashboard/layout.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
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
  const hasOpenedWizardRef = useRef(false);

  // Effect para mostrar o wizard automaticamente se a migração não foi feita (0)
  // Isso garante que ao clicar em "Retomar" (que seta 0), o wizard abra.
  useEffect(() => {
    if (user?.hasCompletedMigration === 0) {
      if (!hasOpenedWizardRef.current) {
        setShowMigrationWizard(true);
        hasOpenedWizardRef.current = true;
      }
    } else if (user?.hasCompletedMigration !== undefined) {
      hasOpenedWizardRef.current = false;
    }
  }, [user?.hasCompletedMigration]);

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
