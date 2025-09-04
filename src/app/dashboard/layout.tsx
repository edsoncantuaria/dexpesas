// src/app/dashboard/layout.tsx
'use client';

import type { ReactNode } from 'react';
import { MainNav } from '@/components/dashboard/navigation/main-nav';
import { Header } from '@/components/dashboard/header';
import { TransactionFormProvider } from '@/contexts/TransactionFormContext';
import { AddTransactionDialog } from '@/components/dashboard/transacoes/add-transaction-dialog';
import { UserProvider } from '@/contexts/UserContext'; 

function DashboardLayoutContent({ children }: { children: ReactNode }) {
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
