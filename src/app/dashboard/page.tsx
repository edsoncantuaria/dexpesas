// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import type { User, GamificationProfile, Account, Card as CardType, Goal, Budget, Achievement, UnlockedAchievement, AuditLog, Boss, Clan, Transaction, CellBudget, CellFund } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { HeroProfile } from '@/components/dashboard/hero-profile';
import { AccountBookCard } from '@/components/dashboard/mission-cards/account-book-card';
import { JourneyMapCard } from '@/components/dashboard/mission-cards/journey-map-card';
import { CreditPactCard } from '@/components/dashboard/mission-cards/credit-pact-card';
import { ChallengeTowerCard } from '@/components/dashboard/mission-cards/challenge-tower-card';
import { TimelineCard } from '@/components/dashboard/progresso/timeline-card';
import { BossBattleCard } from '@/components/dashboard/boss/boss-battle-card';
import { MonthlyMissionBoard } from '@/components/dashboard/mission-cards/monthly-mission-board';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useClassicModeNotice } from '@/hooks/use-classic-mode-notice';
import { CellSummaryCard } from '@/components/dashboard/overview/cell-summary-card';
import { SmartSummary } from '@/components/dashboard/smart-summary';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { PrivacyProvider } from '@/contexts/PrivacyContext';

const cardComponents: { [key: string]: React.ComponentType<any> } = {
  account_book: AccountBookCard,
  journey_map: JourneyMapCard,
  credit_pact: CreditPactCard,
  challenge_tower: ChallengeTowerCard,
};

function DashboardPageContent() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<GamificationProfile & { heroClass?: string } | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clan, setClan] = useState<Clan | null>(null);
  const [cellBudgets, setCellBudgets] = useState<CellBudget[]>([]);
  const [cellFunds, setCellFunds] = useState<CellFund[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [timelineLogs, setTimelineLogs] = useState<AuditLog[]>([]);
  const [activeBoss, setActiveBoss] = useState<Boss | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGamificationEnabled, setIsGamificationEnabled] = useState(true);
  const [isLiteMode, setIsLiteMode] = useState(false);
  const [isGamificationLoading, setIsGamificationLoading] = useState(false);
  const [layout, setLayout] = useState<string[]>(['account_book', 'journey_map', 'credit_pact', 'challenge_tower']);
  const { toast } = useToast();
  const { showClassicNotice, dismissClassicNotice } = useClassicModeNotice({
    isClassicModeActive: !isGamificationEnabled,
    userId: user?.id,
  });

  const fetchGamificationData = useCallback(
    async (enabled: boolean, currentUser?: User | null) => {
      if (!enabled) {
        setProfile(null);
        setUnlockedAchievements([]);
        setAllAchievements([]);
        setTimelineLogs([]);
        setActiveBoss(null);
        setClan(null);
        setIsGamificationLoading(false);
        return;
      }

      const userMode = currentUser?.gamificationMode ?? 'FULL';
      const shouldLoadExtendedModules = userMode !== 'LITE';

      if (!shouldLoadExtendedModules) {
        setTimelineLogs([]);
        setActiveBoss(null);
      }

      setIsGamificationLoading(true);
      try {
        const requestDefinitions = [
          {
            key: 'profile',
            enabled: true,
            request: () => api.get('/gamification/profile'),
            onSuccess: (res: any) => setProfile(res.data),
            onError: () => setProfile(null),
          },
          {
            key: 'unlockedAchievements',
            enabled: true,
            request: () => api.get('/achievements/unlocked'),
            onSuccess: (res: any) => setUnlockedAchievements(res.data),
            onError: () => setUnlockedAchievements([]),
          },
          {
            key: 'allAchievements',
            enabled: true,
            request: () => api.get('/achievements/all'),
            onSuccess: (res: any) => setAllAchievements(res.data),
            onError: () => setAllAchievements([]),
          },
          {
            key: 'timeline',
            enabled: shouldLoadExtendedModules,
            request: () => api.get('/audit/timeline'),
            onSuccess: (res: any) => setTimelineLogs(res.data),
            onError: () => setTimelineLogs([]),
          },
          {
            key: 'boss',
            enabled: shouldLoadExtendedModules,
            request: () => api.get('/bosses'),
            onSuccess: (res: any) => setActiveBoss(res.data?.[0] || null),
            onError: () => setActiveBoss(null),
          },
        ] as const;

        const activeRequests = requestDefinitions.filter((item) => item.enabled);
        const responses = await Promise.allSettled(
          activeRequests.map((item) => item.request())
        );

        let hadError = false;
        responses.forEach((result, index) => {
          const definition = activeRequests[index];
          if (result.status === 'fulfilled') {
            definition.onSuccess(result.value);
          } else {
            hadError = true;
            definition.onError();
            console.warn(`Erro ao carregar ${definition.key}`, result.reason);
          }
        });

        if (hadError) {
          toast({
            variant: 'destructive',
            title: 'Dados parciais carregados',
            description: 'Alguns recursos de gamificação não responderam, mas o dashboard foi carregado.',
          });
        }

        const resolvedCellId =
          currentUser?.clanId ||
          currentUser?.clanMembership?.clanId ||
          currentUser?.clanMemberships?.[0]?.clanId;

        if (resolvedCellId) {
          try {
            const [cellRes, budgetsRes, fundsRes] = await Promise.all([
              api.get(`/cells/${resolvedCellId}`),
              api.get(`/cells/${resolvedCellId}/budgets`),
              api.get(`/cells/${resolvedCellId}/funds`),
            ]);
            setClan(cellRes.data);
            setCellBudgets(budgetsRes.data);
            setCellFunds(fundsRes.data);
          } catch (clanError) {
            console.warn('Não foi possível buscar os dados da família. O usuário pode ter saído.', clanError);
            setClan(null);
            setCellBudgets([]);
            setCellFunds([]);
          }
        } else {
          setClan(null);
          setCellBudgets([]);
          setCellFunds([]);
        }
      } catch (error) {
        console.warn('Erro ao carregar dados de gamificação', error);
        toast({
          variant: 'destructive',
          title: 'Gamificação indisponível',
          description: 'Não foi possível carregar os recursos de gamificação.',
        });
        setProfile(null);
        setUnlockedAchievements([]);
        setAllAchievements([]);
        setTimelineLogs([]);
        setActiveBoss(null);
        setClan(null);
      } finally {
        setIsGamificationLoading(false);
      }
    },
    [toast]
  );

  const fetchData = useCallback(async () => {
    // Não reseta o loading em re-fetches para evitar piscar na tela
    try {
      const currentMonth = format(new Date(), 'yyyy-MM');
      const [
        userData,
        accountsData,
        cardsData,
        goalsData,
        budgetsData,
        transactionsData,
      ] = await Promise.all([
        api.get('/user'),
        api.get('/accounts'),
        api.get('/cards'),
        api.get('/goals'),
        api.get(`/budgets?month=${currentMonth}`),
        api.get(`/transactions?month=${currentMonth}&includePending=true`),
      ]);

      const user = userData.data;
      setUser(user);
      setAccounts(accountsData.data);
      setCards(cardsData.data);
      setGoals(goalsData.data);
      setBudgets(budgetsData.data);
      setTransactions(transactionsData.data);

      const mode = user.gamificationMode ?? 'FULL';
      const shouldEnable = mode !== 'OFF';
      setIsGamificationEnabled(shouldEnable);
      setIsLiteMode(mode === 'LITE');
      fetchGamificationData(shouldEnable, user);

      let userLayout: string[] = [];
      try {
        if (typeof user.dashboardLayout === 'string' && user.dashboardLayout.startsWith('[')) {
          userLayout = JSON.parse(user.dashboardLayout);
        }
      } catch (e) {
        console.error("Erro ao parsear layout do dashboard:", e);
      }

      if (userLayout && userLayout.length > 0) {
        setLayout(userLayout);
      } else {
        setLayout(Object.keys(cardComponents));
      }

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dashboard',
        description: 'Não foi possível buscar as informações do servidor.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [fetchGamificationData, toast]);

  useEffect(() => {
    fetchData();

    // Listener para o evento global de atualização
    window.addEventListener('transaction-updated', fetchData);
    window.addEventListener('accounts-updated', fetchData);

    return () => {
      window.removeEventListener('transaction-updated', fetchData);
      window.removeEventListener('accounts-updated', fetchData);
    }
  }, [fetchData]);

  if (isLoading || !user) {
    return <LoadingScreen />;
  }

  const cardDataProps: { [key: string]: any } = {
    account_book: { accounts, transactions },
    journey_map: { budgets },
    credit_pact: { cards },
    challenge_tower: { goals: goals.filter(g => g.status === 'IN_PROGRESS') },
  };

  const enabledCards = layout.map(id => ({ id, component: cardComponents[id] })).filter(item => item.component);


  return (
    <div className="space-y-6">
      {isGamificationEnabled && profile && (
        <HeroProfile
          user={user}
          profile={profile}
          clan={clan}
          allAchievements={allAchievements}
          unlockedAchievements={unlockedAchievements}
        />
      )}

      <SmartSummary accounts={accounts} transactions={transactions} budgets={budgets} cards={cards} />
      <QuickActions />

      {clan && (
        <CellSummaryCard cell={clan} funds={cellFunds} budgets={cellBudgets} />
      )}
      {isGamificationEnabled && !profile && (
        <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
          {isGamificationLoading ? 'Carregando progressos da sua jornada...' : 'Módulo de gamificação desativado para este usuário.'}
        </div>
      )}
      {showClassicNotice && (
        <Alert className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <AlertTitle>Modo financeiro clássico ativado</AlertTitle>
            <AlertDescription>
              Os cards épicos ficam ocultos, mas você pode reativar a gamificação nas configurações quando quiser.
            </AlertDescription>
          </div>
          <Button variant="outline" size="sm" onClick={dismissClassicNotice}>
            Entendido
          </Button>
        </Alert>
      )}
      {isGamificationEnabled && !isLiteMode && activeBoss && <BossBattleCard boss={activeBoss} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {enabledCards.map((item) => {
            const Component = item.component;
            return (
              <div key={item.id}>
                <Component {...cardDataProps[item.id]} />
              </div>
            )
          })}
        </div>
        {isGamificationEnabled && !isLiteMode && (
          <div className="lg:col-span-1 space-y-6">
            <MonthlyMissionBoard />
            <TimelineCard logs={timelineLogs} />
          </div>
        )}
      </div>
    </div>
  );
}


export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <PrivacyProvider>
        <DashboardPageContent />
      </PrivacyProvider>
    </Suspense>
  )
}
