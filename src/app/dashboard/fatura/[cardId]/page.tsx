// src/app/dashboard/fatura/[cardId]/page.tsx
import { FaturaClientPage } from "@/components/dashboard/fatura/fatura-client-page";

/**
 * Server Component para a página de Fatura.
 * Responsável por receber os parâmetros da rota do servidor e passá-los
 * para o componente cliente que cuidará da renderização e interatividade.
 */
export default async function FaturaPage({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  return <FaturaClientPage cardId={cardId} />;
}
