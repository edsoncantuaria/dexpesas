
// src/app/dashboard/clans/[clanId]/page.tsx
'use client';

import { Suspense } from 'react';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { ClanClientPage } from '@/components/dashboard/clans/clan-client-page';

/**
 * Server Component para a página de detalhes de um Clã.
 * Passa o ID do clã para o componente cliente que vai buscar os dados.
 */
export default function ClanDetailsPage({ params }: { params: { clanId: string } }) {
  const { clanId } = params;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <ClanClientPage clanId={clanId} />
    </Suspense>
  );
}
