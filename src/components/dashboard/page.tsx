// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import type {
  User,
  GamificationProfile,
  Account,
  Card as CardType,
  Goal,
  Budget,
  Achievement,
  UnlockedAchievement,
  AuditLog,
  Boss,
  Clan,
  FinancialOverview,
} from '@/lib/definitions';
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
import { format } from 'date-fns';
import { MonthlyOverviewCard } from '@/components/dashboard/overview/monthly-overview-card';
import { AlertsCard } from '@/components/dashboard/overview/alerts-card';
import { FamilySummaryCard } from '@/components/dashboard/overview/family-summary-card';
import { SecurityStatusCard } from '@/components/dashboard/overview/security-status-card';
import { useTransactionForm } from '@/contexts/TransactionFormContext';
import { AddTransactionButton } from '@/components/dashboard/transacoes/AddTransactionButton';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
  const [transactions, setTransactions] = useState<Transaction[]>([]); // Estado para transações
  const [clan, setClan] = useState<Clan | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [timelineLogs, setTimelineLogs] = useState<AuditLog[]>([]);
  const [activeBoss, setActiveBoss] = useState<Boss | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [layout, setLayout] = useState<string[]>(['account_book', 'journey_map', 'credit_pact', 'challenge_tower']);
  const [overview, setOverview] = useState<FinancialOverview | null>(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
  const { toast } = useToast();
  const { openForm } = useTransactionForm();
  const isMobile = useIsMobile();

  const fetchData = useCallback(async () => {
    // Não reseta o loading em re-fetches para evitar piscar na tela
    try {
        const currentMonth = format(new Date(), 'yyyy-MM');
        const [
            userData, 
            profileData, 
            accountsData,
            cardsData,
            goalsData,
            budgetsData,
            unlockedAchievementsData,
            allAchievementsData,
            timelineData,
            bossData,
            transactionsData, // Busca as transações do mês atual
        ] = await Promise.all([
            api.get('/user'),
            api.get('/gamification/profile'),
            api.get('/accounts'),
            api.get('/cards'),
            api.get('/goals'),
            api.get(`/budgets?month=${currentMonth}`),
            api.get('/achievements/unlocked'),
            api.get('/achievements/all'),
            api.get('/audit/timeline'),
            api.get('/bosses'),
            api.get(`/transactions?month=${currentMonth}&includePending=true`), // Busca transações do mês atual
        ]);

        const user = userData.data;
        setUser(user);
        setProfile(profileData.data);
        setAccounts(accountsData.data);
        setCards(cardsData.data);
        setGoals(goalsData.data);
        setBudgets(budgetsData.data);
        setTransactions(transactionsData.data); // Armazena as transações
        setUnlockedAchievements(unlockedAchievementsData.data);
        setAllAchievements(allAchievementsData.data);
        setTimelineLogs(timelineData.data);
        setActiveBoss(bossData.data?.[0] || null);
        
        if (user.clanId) {
           try {
                const clanRes = await api.get(`/familia/${user.clanId}`);
                setClan(clanRes.data);
           } catch (clanError) {
                console.warn("Não foi possível buscar os dados da família. O usuário pode ter saído.", clanError);
                setClan(null); // Garante que o estado do clã seja limpo se não for encontrado
           }
        } else {
            setClan(null); // Garante que o clã seja nulo se não houver clanId
        }
        
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

    } catch(error) {
        toast({
            variant: 'destructive',
            title: 'Erro ao carregar dashboard',
            description: 'Não foi possível buscar as informações do servidor.'
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  const fetchOverview = useCallback(async () => {
    try {
      const response = await api.get('/dashboard/overview');
      setOverview(response.data);
    } catch (error) {
      console.error('Erro ao carregar resumo financeiro', error);
    } finally {
      setIsOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchOverview();

    // Listener para o evento global de atualização
    window.addEventListener('transaction-updated', fetchData);
    window.addEventListener('transaction-updated', fetchOverview);
    window.addEventListener('accounts-updated', fetchData);
    window.addEventListener('accounts-updated', fetchOverview);

    return () => {
        window.removeEventListener('transaction-updated', fetchData);
        window.removeEventListener('transaction-updated', fetchOverview);
        window.removeEventListener('accounts-updated', fetchData);
        window.removeEventListener('accounts-updated', fetchOverview);
    }
  }, [fetchData, fetchOverview]);
  
  if (isLoading || !user || !profile) {
    return <LoadingScreen />;
  }
  
  const cardDataProps: { [key: string]: any } = {
    account_book: { accounts, transactions }, // Passa as transações para o card
    journey_map: { budgets },
    credit_pact: { cards },
    challenge_tower: { goal: goals.find(g => g.status === 'IN_PROGRESS') },
  };

  const enabledCards = layout.map(id => ({ id, component: cardComponents[id] })).filter(item => item.component);


  return (
    <div className="space-y-6">
      <HeroProfile 
        user={user} 
        profile={profile} 
        clan={clan}
        allAchievements={allAchievements}
        unlockedAchievements={unlockedAchievements}
        familyBalance={overview?.familySummary?.clan.balance ?? null}
      />

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => openForm()}>
          Nova transação
        </Button>
        <Link href="/dashboard/transacoes?add=true&mode=ocr">
          <Button variant="secondary">
            Scan de fatura
          </Button>
        </Link>
      </div>

      <MonthlyOverviewCard overview={isOverviewLoading ? null : overview} />

      {activeBoss && <BossBattleCard boss={activeBoss} />}

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
            <AlertsCard alerts={overview?.alerts ?? []} />
        </div>
        <div className="lg:col-span-1 space-y-6">
            {!user.hideFamilyMode && overview?.familySummary && (
              <FamilySummaryCard summary={overview.familySummary} onHideFamily={fetchOverview} />
            )}
            <SecurityStatusCard security={overview?.security ?? null} />
            <div className="h-full">
                <TimelineCard logs={timelineLogs} />
            </div>
        </div>
      </div>

      {isMobile && <AddTransactionButton onClick={openForm} />}
    </div>
  );
}


export default function DashboardPage() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <DashboardPageContent />
        </Suspense>
    )
}
