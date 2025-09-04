// src/app/dashboard/admin/layout.tsx
'use client';

import { ReactNode } from "react";
import { useUser } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user?.isAdmin) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user?.isAdmin) {
    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <Alert variant="destructive" className="max-w-md">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Acesso Negado</AlertTitle>
                <AlertDescription>
                    Você não tem permissão para acessar esta área.
                    <div className="mt-4">
                        <Button asChild>
                            <Link href="/dashboard">Voltar para o Dashboard</Link>
                        </Button>
                    </div>
                </AlertDescription>
            </Alert>
        </div>
    );
  }

  return <>{children}</>;
}
