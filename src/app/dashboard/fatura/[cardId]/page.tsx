// src/app/dashboard/fatura/[cardId]/page.tsx
import { FaturaClientPage } from "@/components/dashboard/fatura/fatura-client-page";

/**
 * Server Component para a página de Fatura.
 * Responsável por receber os parâmetros da rota do servidor e passá-los
 * para o componente cliente que cuidará da renderização e interatividade.
 */
export default function FaturaPage({ params }: { params: { cardId: string } }) {
  const { cardId } = params;
  return <FaturaClientPage cardId={cardId} />;
}
