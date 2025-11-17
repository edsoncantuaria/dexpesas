import type { GamificationMode } from './definitions';

type AccountBookCopy = {
  title: string;
  highlightLabel: string;
  projectedLabel: string;
};

type JourneyMapCopy = {
  title: string;
  description: string;
  emptyState: string;
  buttonLabel: string;
};

type TimelineCopy = {
  title: string;
  description: string;
  emptyState: string;
};

type HeroCopy = {
  subtitle: string | ((levelLabel: string) => string);
  showXp: boolean;
  badgesLabel: string;
  familyLabel: string;
};

type CreditPactCopy = {
  title: string;
  description: string;
  emptyState: string;
};

type ChallengeTowerCopy = {
  title: string;
  description: string;
  emptyState: string;
  buttonLabel: string;
};

const copyMap: Record<
  'accountBook' | 'journeyMap' | 'timeline' | 'hero' | 'creditPact' | 'challengeTower',
  Record<GamificationMode, any>
> = {
  accountBook: {
    FULL: {
      title: 'O Livro de Contas',
      highlightLabel: 'Ouro na Bolsa',
      projectedLabel: 'Balanço Projetado',
    },
    LITE: {
      title: 'Resumo de Contas',
      highlightLabel: 'Saldo Consolidado',
      projectedLabel: 'Saldo Estimado',
    },
    OFF: {
      title: 'Saldo em Conta',
      highlightLabel: 'Saldo Consolidado',
      projectedLabel: 'Saldo Estimado',
    },
  } satisfies Record<GamificationMode, AccountBookCopy>,
  journeyMap: {
    FULL: {
      title: 'O Mapa da Jornada',
      description: 'Gerencie suas provisões e recursos.',
      emptyState: 'Nenhum orçamento épico definido para este mês.',
      buttonLabel: 'Criar orçamento agora',
    },
    LITE: {
      title: 'Planejamento Mensal',
      description: 'Acompanhe seus orçamentos mais importantes.',
      emptyState: 'Nenhum orçamento favorito definido para este mês.',
      buttonLabel: 'Criar orçamento',
    },
    OFF: {
      title: 'Orçamentos',
      description: 'Monitore categorias essenciais do mês.',
      emptyState: 'Nenhum orçamento de Alimentação ou Lazer definido ainda.',
      buttonLabel: 'Criar orçamento',
    },
  } satisfies Record<GamificationMode, JourneyMapCopy>,
  timeline: {
    FULL: {
      title: 'Mural da Guilda',
      description: 'As últimas aventuras de seus companheiros.',
      emptyState: 'Nenhuma atividade recente na guilda.',
    },
    LITE: {
      title: 'Mural da Equipe',
      description: 'Acompanhe eventos e ações da sua família financeira.',
      emptyState: 'Nenhuma atualização recente da equipe.',
    },
    OFF: {
      title: 'Atualizações da Família',
      description: 'Veja os registros recentes das suas contas compartilhadas.',
      emptyState: 'Nenhuma atualização registrada nas contas compartilhadas.',
    },
  } satisfies Record<GamificationMode, TimelineCopy>,
  hero: {
    FULL: {
      subtitle: (label: string) => label,
      showXp: true,
      badgesLabel: 'Medalhas',
      familyLabel: 'Saldo familiar',
    },
    LITE: {
      subtitle: (label: string) => label,
      showXp: true,
      badgesLabel: 'Conquistas em destaque',
      familyLabel: 'Saldo familiar',
    },
    OFF: {
      subtitle: 'Resumo Financeiro',
      showXp: false,
      badgesLabel: 'Marcos recentes',
      familyLabel: 'Saldo da família',
    },
  } satisfies Record<GamificationMode, HeroCopy>,
  creditPact: {
    FULL: {
      title: 'O Pacto de Prata',
      description: 'Gerencie seu poder de crédito.',
      emptyState: 'Nenhum cartão de crédito cadastrado.',
    },
    LITE: {
      title: 'Central de Cartões',
      description: 'Acompanhe limites e próximas faturas.',
      emptyState: 'Nenhum cartão adicionado ainda.',
    },
    OFF: {
      title: 'Cartões de Crédito',
      description: 'Veja próximos vencimentos e limite disponível.',
      emptyState: 'Nenhum cartão cadastrado.',
    },
  } satisfies Record<GamificationMode, CreditPactCopy>,
  challengeTower: {
    FULL: {
      title: 'A Torre dos Desafios',
      description: 'Sua próxima grande missão.',
      emptyState: 'Nenhuma missão ativa. Defina uma nova meta para começar!',
      buttonLabel: 'Nova meta',
    },
    LITE: {
      title: 'Painel de Metas',
      description: 'Visualize suas metas financeiras em andamento.',
      emptyState: 'Nenhuma meta acompanhada neste momento.',
      buttonLabel: 'Criar meta',
    },
    OFF: {
      title: 'Objetivos Financeiros',
      description: 'Acompanhe o progresso das suas metas.',
      emptyState: 'Nenhuma meta ativa. Crie sua próxima meta.',
      buttonLabel: 'Nova meta',
    },
  } satisfies Record<GamificationMode, ChallengeTowerCopy>,
};

export function getGamificationCopy<
  K extends keyof typeof copyMap,
  T = (typeof copyMap)[K][GamificationMode]
>(key: K, mode: GamificationMode): T {
  const group = copyMap[key];
  return (group[mode] ?? group.FULL) as T;
}
