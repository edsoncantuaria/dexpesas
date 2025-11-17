// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { GamificationProfile } from '@/components/dashboard/gamification-profile';
import { Achievements } from '@/components/dashboard/achievements';
import type { Achievement, GamificationProfile as GamificationProfileType, Transaction, UnlockedAchievement, User, Account } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { isWithinInterval, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownLeft, ArrowUpRight, Filter, Loader2, Sparkles, Volume2, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useGamificationMode } from '@/hooks/use-gamification-mode';
import { useClassicModeNotice } from '@/hooks/use-classic-mode-notice';

interface DailySummary {
    summary: string;
    audioDataUri: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<GamificationProfileType | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<DailySummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isGamificationEnabled, setIsGamificationEnabled] = useState(true);
  const [isGamificationLoading, setIsGamificationLoading] = useState(false);
  const { toast } = useToast();
  const { isClassic, isLite } = useGamificationMode();
  const prefersFinancialCopy = isClassic || isLite;
  const { showClassicNotice, dismissClassicNotice } = useClassicModeNotice({
    isClassicModeActive: !isGamificationEnabled,
    userId: user?.id,
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const fetchGamificationData = useCallback(
    async (enabled: boolean) => {
      if (!enabled) {
        setProfile(null);
        setUnlockedAchievements([]);
        setAllAchievements([]);
        setIsGamificationLoading(false);
        return;
      }

      setIsGamificationLoading(true);
      try {
        const [profileData, unlockedRes, achievementsRes] = await Promise.all([
          api.get('/gamification/profile'),
          api.get('/achievements/unlocked'),
          api.get('/achievements/all'),
        ]);
        setProfile(profileData.data);
        setUnlockedAchievements(unlockedRes.data);
        setAllAchievements(achievementsRes.data);
      } catch (error) {
        console.warn('Erro ao carregar dados de gamificação (Resumo Diário)', error);
        toast({
          variant: 'destructive',
          title: 'Gamificação indisponível',
          description: 'Resumo diário carregado sem dados de gamificação.',
        });
        setProfile(null);
        setUnlockedAchievements([]);
        setAllAchievements([]);
      } finally {
        setIsGamificationLoading(false);
      }
    },
    [toast]
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [
            userData, 
            transactionsData, 
            accRes,
        ] = await Promise.all([
            api.get('/user'),
            api.get('/transactions/all'),
            api.get('/accounts'),
        ]);
        const nextUser = userData.data;
        setUser(nextUser);
        setAllTransactions(transactionsData.data);
        setAccounts(accRes.data);

        const mode = nextUser.gamificationMode ?? 'FULL';
        const shouldEnable = mode !== 'OFF';
        setIsGamificationEnabled(shouldEnable);
        fetchGamificationData(shouldEnable);
    } catch(error) {
        toast({
            variant: 'destructive',
            title: 'Erro ao carregar dashboard',
            description: 'Não foi possível buscar as informações do servidor.'
        });
        setProfile(null);
        setUnlockedAchievements([]);
        setAllAchievements([]);
    } finally {
        setIsLoading(false);
    }
  }, [fetchGamificationData, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleGenerateSummary = async () => {
        setIsGeneratingSummary(true);
        setSummaryError(null);
        setSummaryData(null);
        try {
            const response = await api.post('/ai/daily-summary');
            setSummaryData(response.data);
        } catch (err) {
            setSummaryError('Não foi possível gerar o resumo diário.');
            toast({
                variant: 'destructive',
                title: 'Erro na Geração do Resumo',
                description: 'Tente novamente mais tarde.',
            });
        } finally {
            setIsGeneratingSummary(false);
        }
    };


  const transactionsForPeriod = useMemo(() => {
    if (!dateRange?.from) return allTransactions;
    
    return allTransactions.filter(t => {
      const transactionDate = new Date(t.data);
      return isWithinInterval(transactionDate, { 
        start: dateRange.from!, 
        end: dateRange.to || dateRange.from! 
      });
    });
  }, [allTransactions, dateRange]);
  
  const summary = useMemo(() => {
    const paidTransactions = transactionsForPeriod.filter(t => t.pago);
    
    const income = paidTransactions.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + Number(t.valor), 0);
    const expense = paidTransactions.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + Number(t.valor), 0);

    const incomeForecast = transactionsForPeriod.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + Number(t.valor), 0);
    const expenseForecast = transactionsForPeriod.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + Number(t.valor), 0);

    const totalBalanceFromAccounts = accounts.reduce((acc, account) => acc + Number(account.saldo), 0);
    
    return { income, expense, incomeForecast, expenseForecast, totalBalanceFromAccounts };
  }, [transactionsForPeriod, accounts]);

  const handleSetDateRange = (preset: 'this_month' | 'last_month' | 'last_30_days') => {
      const today = new Date();
      let from: Date;
      let to: Date = today;

      switch(preset) {
        case 'this_month':
            from = startOfMonth(today);
            to = endOfMonth(today);
            break;
        case 'last_month':
            const lastMonthDate = subMonths(today, 1);
            from = startOfMonth(lastMonthDate);
            to = endOfMonth(lastMonthDate);
            break;
        case 'last_30_days':
            from = subMonths(today, 1);
            break;
      }
      setDateRange({ from, to });
  };
  
  const handleClearFilter = () => {
    setDateRange(undefined);
  }

  if (isLoading || !user) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
        <div>
            <h1 className="text-2xl font-bold">Olá, {user.name.split(' ')[0]}!</h1>
            <p className="text-muted-foreground">
              {prefersFinancialCopy ? 'Bem-vindo(a) de volta ao seu painel financeiro.' : 'Bem-vindo(a) de volta à sua jornada.'}
            </p>
        </div>
        {user.enableDailySummary && (
            <div className="flex-shrink-0">
                <Button onClick={handleGenerateSummary} disabled={isGeneratingSummary}>
                    {isGeneratingSummary ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Gerar Resumo do Dia
                </Button>
            </div>
        )}
       </div>
       
       {summaryData && (
         <UICard>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Waves className="h-6 w-6 text-primary" />
                    <div>
                        <CardTitle className="font-headline text-xl">Seu Boletim Financeiro</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert>
                     <Sparkles className="h-4 w-4" />
                    <AlertTitle>Análise do Dia</AlertTitle>
                    <AlertDescription className="whitespace-pre-wrap font-mono">
                        {summaryData.summary}
                    </AlertDescription>
                </Alert>
                <div className="p-4 bg-muted/50 rounded-lg flex flex-col items-center gap-4">
                   <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                     <Volume2 className="h-4 w-4" />
                     <span>Ouça seu resumo</span>
                   </div>
                    <audio controls src={summaryData.audioDataUri} className="w-full">
                        Seu navegador não suporta o elemento de áudio.
                    </audio>
                </div>
            </CardContent>
        </UICard>
       )}
       {summaryError && (
            <Alert variant="destructive">
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{summaryError}</AlertDescription>
            </Alert>
        )}

       <UICard className="rounded-2xl shadow-lg bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Balanço Atual</CardTitle>
             <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Filter className="h-5 w-5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                    <div className="grid gap-4">
                         <div className="grid gap-2">
                             <div className="flex flex-wrap gap-2">
                                <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleSetDateRange('this_month')}>Este Mês</Button>
                                <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleSetDateRange('last_month')}>Mês Passado</Button>
                                <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleSetDateRange('last_30_days')}>Últimos 30 dias</Button>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Período Personalizado</Label>
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={1}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleClearFilter} variant="ghost" className="w-full">Limpar</Button>
                            <Button onClick={() => setIsFilterOpen(false)} className="w-full">Aplicar</Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="text-center py-2">
                  <div className="text-4xl font-bold">
                      {Number(summary.totalBalanceFromAccounts).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <p className="text-sm text-muted-foreground">
                      Saldo total em contas
                  </p>
              </div>
              <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center text-green-500 gap-2">
                      <ArrowUpRight className="h-5 w-5 flex-shrink-0"/>
                      <div>
                          <p className="text-xs text-muted-foreground font-semibold">Receitas (período)</p>
                          <p className="font-bold text-lg">{Number(summary.income).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                           <p className="text-xs text-muted-foreground">Previsto: {Number(summary.incomeForecast).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      </div>
                  </div>
                  <div className="flex items-center text-red-500 gap-2">
                      <ArrowDownLeft className="h-5 w-5 flex-shrink-0"/>
                      <div className='text-right'>
                          <p className="text-xs text-muted-foreground font-semibold">Despesas (período)</p>
                          <p className="font-bold text-lg">{Number(summary.expense).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                          <p className="text-xs text-muted-foreground">Previsto: {Number(summary.expenseForecast).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      </div>
                  </div>
              </div>
          </CardContent>
      </UICard>

       {showClassicNotice && (
         <Alert className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <AlertTitle>Modo financeiro clássico</AlertTitle>
              <AlertDescription>Os elementos de gamificação ficam ocultos, mas seu progresso continua sendo registrado nos bastidores.</AlertDescription>
            </div>
            <Button variant="outline" size="sm" onClick={dismissClassicNotice}>
              Entendido
            </Button>
         </Alert>
       )}

       {isGamificationEnabled && (
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2">
               {profile ? (
                 <GamificationProfile profile={profile} />
               ) : (
                 <UICard className="h-full flex items-center justify-center">
                   <CardContent className="text-sm text-muted-foreground">
                     {isGamificationLoading ? 'Carregando perfil de progresso...' : 'Dados de gamificação indisponíveis.'}
                   </CardContent>
                 </UICard>
               )}
            </div>
            <div className="lg:col-span-1">
              <Achievements 
                  unlockedAchievements={unlockedAchievements} 
                  allAchievements={allAchievements} 
              />
            </div>
         </div>
       )}
    </div>
  );
}
