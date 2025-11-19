import type { ClanRole } from '@/lib/definitions';

export const withdrawalRoleOptions: Record<ClanRole, { label: string; description: string }> = {
  LEADER: {
    label: 'Liderança',
    description: 'Somente o líder (ou líderes) pode sacar o dinheiro.',
  },
  ADMIN: {
    label: 'Administração',
    description: 'Admins também podem sacar — ótimo para casais que dividem a guarda da caixinha.',
  },
  MEMBER: {
    label: 'Todos os membros',
    description: 'Qualquer participante pode retirar se tiver permissão de movimentar fundos.',
  },
};

