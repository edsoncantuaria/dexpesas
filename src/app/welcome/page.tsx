// src/app/welcome/page.tsx
'use client';

import { useState, useEffect, type ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BrainCircuit, CheckCircle, CreditCard, Gamepad2, Landmark, Loader2, PartyPopper, Rocket, Target, User as UserIcon, Wallet, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AddAccountForm } from '@/components/dashboard/contas/add-account-form';
import { AddCardForm } from '@/components/dashboard/cartoes/add-card-form';
import type { Account, Card as CardType, Category } from '@/lib/definitions';
import type { LucideIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { cn } from '@/lib/utils';


const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.8,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.8,
  }),
};

type OnboardingStepConfig = {
  component: ComponentType<any>;
  props: Record<string, any>;
  skipNav?: boolean;
};

type InfoSlide = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const GAMIFIED_FULL_INTRO: InfoSlide[] = [
  {
    icon: Gamepad2,
    title: 'Sua jornada no Dexpesas começa!',
    description: 'Transforme suas finanças em uma aventura épica com missões, conquistas e feedback em tempo real.',
  },
  {
    icon: BrainCircuit,
    title: 'Como funciona o modo Jornada',
    description: 'Complete tarefas financeiras, ganhe XP, suba de nível e desbloqueie novas classes e habilidades.',
  },
];

const GAMIFIED_LITE_INTRO: InfoSlide[] = [
  {
    icon: BrainCircuit,
    title: 'Modo Lite ativado',
    description: 'Você acompanha XP e conquistas com uma linguagem direta e sem metáforas exageradas.',
  },
  {
    icon: Shield,
    title: 'Equilíbrio entre foco e motivação',
    description: 'Receba incentivos visuais e alertas essenciais sem transformar tudo em RPG completo.',
  },
];

const CLASSIC_INTRO: InfoSlide[] = [
  {
    icon: Wallet,
    title: 'Bem-vindo ao Dexpesas!',
    description: 'Organize suas finanças com clareza desde o primeiro acesso e veja tudo em um só lugar.',
  },
  {
    icon: Landmark,
    title: 'Controle financeiro profissional',
    description: 'Painéis objetivos, sem linguagem gamificada, focados em saldos, contas e metas reais.',
  },
];

const GAMIFIED_FULL_OUTRO: InfoSlide[] = [
  {
    icon: Rocket,
    title: 'Evolua seu Herói Financeiro',
    description: 'Pague contas, economize e conclua metas para ganhar XP e desbloquear novas conquistas.',
  },
  {
    icon: PartyPopper,
    title: 'A aventura te aguarda!',
    description: 'Tudo pronto para começar. Clique abaixo e entre no reino financeiro do Dexpesas.',
  },
];

const GAMIFIED_LITE_OUTRO: InfoSlide[] = [
  {
    icon: CheckCircle,
    title: 'Painel Lite pronto',
    description: 'Você terá lembretes motivadores e indicadores-chave sem excessos visuais.',
  },
  {
    icon: Rocket,
    title: 'Continue evoluindo',
    description: 'O XP continua registrando seu progresso, mas o foco fica nas decisões financeiras.',
  },
];

const CLASSIC_OUTRO: InfoSlide[] = [
  {
    icon: Shield,
    title: 'Modo financeiro clássico ativado',
    description: 'Interface tradicional, com alertas e relatórios objetivos para decisões rápidas.',
  },
  {
    icon: CheckCircle,
    title: 'Tudo pronto para começar',
    description: 'Seu painel já está preparado. Clique abaixo para acessar o dashboard.',
  },
];

export default function WelcomePage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gamificationMode, setGamificationMode] = useState<'FULL' | 'LITE' | 'OFF'>('FULL');
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  
  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setStep(prev => prev + newDirection);
  };
  const handleGamificationModeSelect = async (mode: 'FULL' | 'LITE' | 'OFF') => {
    setIsSubmitting(true);
    try {
        await api.put('/user/preferences', { gamificationMode: mode });
        setGamificationMode(mode);
        toast({ title: mode === 'OFF' ? 'Modo financeiro ativado' : 'Gamificação configurada!' });
        paginate(1);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Não foi possível salvar sua preferência' });
    } finally {
        setIsSubmitting(false);
    }
  };
  const isGamified = gamificationMode !== 'OFF';
  const isLite = gamificationMode === 'LITE';

  const introSlides = isGamified
    ? (isLite ? GAMIFIED_LITE_INTRO : GAMIFIED_FULL_INTRO)
    : CLASSIC_INTRO;
  const outroSlides = isGamified
    ? (isLite ? GAMIFIED_LITE_OUTRO : GAMIFIED_FULL_OUTRO)
    : CLASSIC_OUTRO;

  const introSteps: OnboardingStepConfig[] = introSlides.map((slide) => ({
    component: InfoStep,
    props: { ...slide, ctaLabel: 'Continuar' },
    skipNav: true,
  }));

  const outroSteps: OnboardingStepConfig[] = outroSlides.map((slide) => ({
    component: InfoStep,
    props: slide,
  }));

  const accountTitle = isGamified
    ? isLite
      ? 'Conecte suas contas principais'
      : 'Forje sua Arma Principal: A Conta'
    : 'Cadastre sua primeira conta';
  const accountDescription = isGamified
    ? isLite
      ? 'Integre as contas essenciais para acompanhar o saldo e ganhar XP conforme evolui.'
      : 'Toda jornada precisa de um ponto de partida. Cadastre sua conta corrente para rastrear seus tesouros.'
    : 'Conecte sua conta principal para acompanhar saldos e movimentações em um só lugar.';

  const cardTitle = isGamified
    ? isLite
      ? 'Adicione seu cartão principal'
      : 'Equipe seu Escudo: O Cartão'
    : 'Adicione seu cartão';
  const cardDescription = isGamified
    ? isLite
      ? 'Cadastre o cartão de crédito para controlar limites e alertas, mantendo o modo Lite.'
      : 'O cartão de crédito é uma ferramenta poderosa. Cadastre o seu para gerenciar seu poder de compra com sabedoria.'
    : 'Cadastre seu cartão de crédito para acompanhar limites, faturas e despesas com precisão.';

  const profileTitle = isGamified
    ? isLite
      ? 'Preferências Lite (Opcional)'
      : 'Defina seu Arquétipo (Opcional)'
    : 'Conte um pouco sobre você';
  const profileDescription = isGamified
    ? isLite
      ? 'Algumas preferências ajudam a ajustar XP e sugestões sem exagero épico.'
      : 'Suas escolhas moldam seu herói. Isso nos ajuda a personalizar missões e dicas.'
    : 'Algumas informações ajudam a personalizar recomendações e projeções.';

  const planTitle = isGamified
    ? isLite
      ? 'Monte seu plano Lite'
      : 'Monte sua estratégia financeira'
    : 'Monte seu plano financeiro';
  const planDescription = isGamified
    ? isLite
      ? 'Informe renda, metas e categorias favoritas para receber alertas motivadores sem exageros.'
      : 'Defina renda, metas e categorias favoritas para destravar missões personalizadas.'
    : 'Informe renda, metas e categorias principais para personalizar seu dashboard.';

  const setupSteps: OnboardingStepConfig[] = [
    {
      component: AddAccountStep,
      skipNav: true,
      props: {
        title: accountTitle,
        description: accountDescription,
        onSave: async (data: Omit<Account, 'id' | 'userId'>) => {
          setIsSubmitting(true);
          try {
            await api.post('/accounts', data);
            toast({ title: 'Conta criada com sucesso!' });
            paginate(1);
          } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao criar conta' });
          } finally {
            setIsSubmitting(false);
          }
        },
        isSubmitting,
        onSkip: () => paginate(1),
      },
    },
    {
      component: AddCardStep,
      skipNav: true,
      props: {
        title: cardTitle,
        description: cardDescription,
        onSave: async (data: Omit<CardType, 'id' | 'userId' | 'bestDayToBuy' | 'currentInvoiceAmount' | 'availableLimit'>) => {
          setIsSubmitting(true);
          try {
            await api.post('/cards', data);
            toast({ title: 'Cartão adicionado com sucesso!' });
            paginate(1);
          } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao adicionar cartão' });
          } finally {
            setIsSubmitting(false);
          }
        },
        isSubmitting,
        onSkip: () => paginate(1),
      },
    },
    {
      component: AddProfileStep,
      skipNav: true,
      props: {
        title: profileTitle,
        description: profileDescription,
        onSaveAndContinue: async (data: any) => {
          const hasData = Object.values(data).some((v) => v !== null && v !== undefined && v !== '');
          if (hasData) {
            setIsSubmitting(true);
            try {
              await api.put('/user/profile', data);
              toast({ title: isGamified ? 'Arquétipo definido!' : 'Perfil atualizado!' });
            } catch (error) {
              toast({ variant: 'destructive', title: 'Erro ao salvar perfil' });
              setIsSubmitting(false);
              return;
            } finally {
              setIsSubmitting(false);
            }
          }
          paginate(1);
        },
        isSubmitting,
      },
    },
    {
      component: FinancialSetupStep,
      skipNav: true,
      props: {
        title: planTitle,
        description: planDescription,
        onSave: async ({ fixedMonthlyIncome, favoriteCategoryIds, mainGoal }: { fixedMonthlyIncome: number; favoriteCategoryIds: string[]; mainGoal: string }) => {
          const hasIncome = fixedMonthlyIncome > 0;
          const hasGoal = !!mainGoal;
          const hasCategories = favoriteCategoryIds.length > 0;
          if (!hasIncome && !hasGoal && !hasCategories) {
            paginate(1);
            return;
          }
          setIsSubmitting(true);
          try {
            const requests: Promise<any>[] = [];
            if (hasIncome || hasGoal) {
              requests.push(
                api.put('/user/profile', {
                  fixedMonthlyIncome: hasIncome ? fixedMonthlyIncome : null,
                  mainFinancialGoal: hasGoal ? mainGoal : null,
                })
              );
            }
            if (hasCategories) {
              requests.push(api.put('/user/preferences', { favoriteCategoryIds }));
            }
            await Promise.all(requests);
            toast({ title: 'Preferências financeiras salvas!' });
            paginate(1);
          } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao salvar preferências' });
          } finally {
            setIsSubmitting(false);
          }
        },
        isSubmitting,
      },
    },
  ];

  const onboardingSteps: OnboardingStepConfig[] = [
    {
      component: GamificationModeStep,
      skipNav: true,
      props: {
        selectedMode: gamificationMode,
        onConfirm: handleGamificationModeSelect,
        isSubmitting,
      },
    },
    ...introSteps,
    ...setupSteps,
    ...outroSteps,
  ];

  useEffect(() => {
    const bootstrapMode = async () => {
      try {
        const response = await api.get('/user');
        const normalizedMode = (response.data?.gamificationMode ?? 'FULL') as 'FULL' | 'LITE' | 'OFF';
        setGamificationMode(normalizedMode);
      } catch (error) {
        console.error('Erro ao carregar preferências do usuário no onboarding', error);
      } finally {
        setIsBootstrapping(false);
      }
    };

    bootstrapMode();
  }, []);

  useEffect(() => {
    setStep((prev) => Math.min(prev, onboardingSteps.length - 1));
  }, [onboardingSteps.length]);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await api.post('/user/complete-onboarding');
      router.push('/dashboard');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao finalizar',
        description: 'Não foi possível salvar sua preferência. Tente novamente.',
      });
      setIsCompleting(false);
    }
  };
  
  if (isCompleting || isBootstrapping) {
    return <LoadingScreen />;
  }

  const currentIndex = Math.min(step, onboardingSteps.length - 1);
  const currentStep = onboardingSteps[currentIndex];
  const StepComponent = currentStep.component;
  const stepProps = currentStep.props;
  const hideDefaultNav = currentStep.skipNav;
  const isFinalStep = currentIndex === onboardingSteps.length - 1;
  const isFirstStep = currentIndex === 0;
  const finalCtaLabel = !isGamified ? 'Ir para o painel' : isLite ? 'Ir para o painel' : 'Entrar no Reino';
  const startCtaLabel = !isGamified ? 'Começar' : isLite ? 'Começar no modo Lite' : 'Criar Herói';

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6">
        <Logo className="justify-center" />

        <div className="flex-1">
          <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border bg-card/80 px-4 py-6 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-card/70 h-[70vh] min-h-[460px] max-h-[720px]">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={step}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="h-full w-full overflow-y-auto pr-1 sm:pr-2"
              >
                <StepComponent {...stepProps} onNext={() => paginate(1)} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="w-full rounded-3xl border bg-card/80 p-4 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-card/70">
          <div className="flex flex-wrap justify-center gap-2">
            {onboardingSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setDirection(i > currentIndex ? 1 : -1);
                  setStep(i);
                }}
                className={`h-2 rounded-full transition-all ${currentIndex === i ? 'w-6 bg-primary' : 'w-2 bg-muted hover:bg-muted-foreground/50'}`}
                aria-label={`Ir para o passo ${i + 1}`}
              />
            ))}
          </div>

          {!hideDefaultNav &&
            (isFinalStep ? (
              <Button onClick={handleComplete} className="mt-4 w-full" size="lg">
                {finalCtaLabel}
              </Button>
            ) : (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="ghost"
                  onClick={() => paginate(-1)}
                  disabled={isFirstStep}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                {isFirstStep ? (
                  <Button className="w-full sm:w-auto" onClick={() => paginate(1)}>
                    {startCtaLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="secondary" className="w-full sm:w-auto" onClick={() => paginate(1)}>
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}


// Step Components
const GAMIFICATION_MODE_OPTIONS: Array<{
  value: 'FULL' | 'LITE' | 'OFF';
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    value: 'FULL',
    title: 'Modo Jornada',
    description: 'Experiência completa com missões, conquistas, chefes e progressão RPG.',
    icon: Gamepad2,
  },
  {
    value: 'LITE',
    title: 'Modo Lite',
    description: 'Elementos de gamificação leves (XP e conquistas) sem os eventos épicos.',
    icon: BrainCircuit,
  },
  {
    value: 'OFF',
    title: 'Modo Financeiro',
    description: 'Interface 100% focada em finanças. Sem metáforas de jogo, mas progresso guardado.',
    icon: Wallet,
  },
];

function GamificationModeStep({
  selectedMode,
  onConfirm,
  isSubmitting,
}: {
  selectedMode: 'FULL' | 'LITE' | 'OFF';
  onConfirm: (mode: 'FULL' | 'LITE' | 'OFF') => void;
  isSubmitting: boolean;
}) {
  const [value, setValue] = useState<'FULL' | 'LITE' | 'OFF'>(selectedMode);

  useEffect(() => {
    setValue(selectedMode);
  }, [selectedMode]);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Passo 1</p>
        <h1 className="text-2xl font-bold font-headline">Como você quer usar o Dexpesas?</h1>
        <p className="text-muted-foreground">
          Você pode mudar essa escolha depois em Configurações.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {GAMIFICATION_MODE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setValue(option.value)}
              className={cn(
                'rounded-2xl border p-4 text-left transition-all hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isActive ? 'border-primary bg-primary/5 shadow-lg' : 'border-muted'
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={cn('p-2 rounded-full', isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-semibold">{option.title}</span>
              </div>
              <p className="text-sm text-muted-foreground">{option.description}</p>
            </button>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button disabled={!value || isSubmitting} onClick={() => value && onConfirm(value)}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continuar
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function InfoStep({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onNext,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  onNext?: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 text-center px-2">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-12 w-12" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold font-headline">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {ctaLabel && onNext && (
        <Button size="lg" className="mt-2" onClick={onNext}>
          {ctaLabel}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function AddAccountStep({ title, description, onSave, isSubmitting, onSkip }: { title: string, description: string, onSave: (data: any) => void, isSubmitting: boolean, onSkip: () => void }) {
  return (
    <div className="w-full space-y-4 px-1">
        <div className="text-center mb-6">
             <div className="flex justify-center mb-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Landmark className="h-10 w-10" />
                </div>
            </div>
            <h2 className="text-xl font-bold font-headline">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <AddAccountForm 
            onSuccess={onSave}
            onClose={onSkip}
            isSubmitting={isSubmitting}
            cancelLabel="Pular"
        />
    </div>
  );
}

function AddCardStep({ title, description, onSave, isSubmitting, onSkip }: { title: string, description: string, onSave: (data: any) => void, isSubmitting: boolean, onSkip: () => void }) {
  return (
     <div className="w-full space-y-4 px-1">
        <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Shield className="h-10 w-10" />
                </div>
            </div>
            <h2 className="text-xl font-bold font-headline">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <AddCardForm
            onSuccess={onSave}
            onClose={onSkip}
            isSubmitting={isSubmitting}
            cancelLabel="Pular"
        />
    </div>
  );
}

const profileSchema = z.object({
  professionalSituation: z.string().optional().nullable(),
  monthlyIncomeRange: z.string().optional().nullable(),
  investmentProfile: z.string().optional().nullable(),
  mainFinancialGoal: z.string().optional().nullable(),
});

function AddProfileStep({ onSaveAndContinue, isSubmitting, title, description }: { onSaveAndContinue: (data: any) => void, isSubmitting: boolean, title: string, description: string }) {
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      professionalSituation: null,
      monthlyIncomeRange: null,
      investmentProfile: null,
      mainFinancialGoal: null,
    },
  });

  return (
    <div className="w-full space-y-4 px-1">
        <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserIcon className="h-10 w-10" />
                </div>
            </div>
            <h2 className="text-xl font-bold font-headline">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSaveAndContinue)} className="space-y-4">
                <FormField control={form.control} name="professionalSituation" render={({ field }) => ( 
                  <FormItem><FormLabel>Situação Profissional</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ''}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Empregado (CLT)">Empregado (CLT)</SelectItem><SelectItem value="Autônomo/Freelancer">Autônomo/Freelancer</SelectItem><SelectItem value="Empresário/Sócio">Empresário/Sócio</SelectItem><SelectItem value="Servidor Público">Servidor Público</SelectItem><SelectItem value="Estudante">Estudante</SelectItem><SelectItem value="Aposentado/Pensionista">Aposentado/Pensionista</SelectItem><SelectItem value="Não se aplica">Não se aplica</SelectItem></SelectContent></Select><FormMessage /></FormItem> 
                )}/>
                <FormField control={form.control} name="monthlyIncomeRange" render={({ field }) => ( 
                  <FormItem><FormLabel>Faixa de Renda Mensal</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ''}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Até R$ 2.000">Até R$ 2.000</SelectItem><SelectItem value="R$ 2.001 - R$ 5.000">R$ 2.001 - R$ 5.000</SelectItem><SelectItem value="R$ 5.001 - R$ 10.000">R$ 5.001 - R$ 10.000</SelectItem><SelectItem value="R$ 10.001 - R$ 20.000">R$ 10.001 - R$ 20.000</SelectItem><SelectItem value="Acima de R$ 20.000">Acima de R$ 20.000</SelectItem><SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem></SelectContent></Select><FormMessage /></FormItem> 
                )}/>
                <FormField control={form.control} name="investmentProfile" render={({ field }) => ( 
                  <FormItem><FormLabel>Perfil de Investidor</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ''}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Conservador">Conservador</SelectItem><SelectItem value="Moderado">Moderado</SelectItem><SelectItem value="Arrojado">Arrojado</SelectItem><SelectItem value="Ainda não sei">Ainda não sei</SelectItem></SelectContent></Select><FormMessage /></FormItem> 
                )}/>
                <FormField control={form.control} name="mainFinancialGoal" render={({ field }) => ( 
                  <FormItem><FormLabel>Principal Objetivo</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ''}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Quitar dívidas">Quitar dívidas</SelectItem><SelectItem value="Montar reserva">Montar reserva</SelectItem><SelectItem value="Investir mais">Investir mais</SelectItem><SelectItem value="Realizar um sonho">Realizar um sonho</SelectItem><SelectItem value="Outro">Outro</SelectItem></SelectContent></Select><FormMessage /></FormItem> 
                )}/>
                <div className="pt-4 flex justify-between">
                    <Button type="button" variant="secondary" onClick={() => onSaveAndContinue({})}>Pular</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        Salvar e Continuar
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </form>
        </Form>
    </div>
  );
}

type FinancialSetupStepProps = {
    onSave: (payload: { fixedMonthlyIncome: number; favoriteCategoryIds: string[]; mainGoal: string }) => Promise<void>;
    isSubmitting: boolean;
    title: string;
    description: string;
};

function FinancialSetupStep({ onSave, isSubmitting, title, description }: FinancialSetupStepProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [favoriteCategoryIds, setFavoriteCategoryIds] = useState<string[]>([]);
    const [fixedIncome, setFixedIncome] = useState(0);
    const [mainGoal, setMainGoal] = useState('');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get('/categories');
                setCategories(response.data.filter((cat: Category) => cat.type === 'despesa'));
            } catch (error) {
                console.error('Erro ao carregar categorias para onboarding', error);
            }
        };
        fetchCategories();
    }, []);

    const toggleCategory = (categoryId: string) => {
        setFavoriteCategoryIds((prev) =>
            prev.includes(categoryId)
                ? prev.filter((id) => id !== categoryId)
                : prev.length >= 5
                    ? prev
                    : [...prev, categoryId]
        );
    };

    const handleContinue = () => {
        onSave({
            fixedMonthlyIncome: fixedIncome,
            favoriteCategoryIds,
            mainGoal,
        });
    };

    const recommendedCategories = categories.slice(0, 8);

    return (
        <div className="w-full space-y-4 px-1">
        <div className="text-center mb-4 space-y-2">
            <h2 className="text-xl font-bold font-headline">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="space-y-4">
                <div>
                    <p className="text-sm font-semibold mb-1">Renda mensal fixa</p>
                    <CurrencyInput value={fixedIncome} onValueChange={(value) => setFixedIncome(Number(value))} />
                </div>
                <div>
                    <p className="text-sm font-semibold mb-1">Meta principal</p>
                    <Select value={mainGoal} onValueChange={setMainGoal}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Quitar dívidas">Quitar dívidas</SelectItem>
                            <SelectItem value="Montar reserva">Montar reserva</SelectItem>
                            <SelectItem value="Investir mais">Investir mais</SelectItem>
                            <SelectItem value="Viajar">Viajar</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold">Categorias favoritas</p>
                        <span className="text-xs text-muted-foreground">Escolha até 5</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {recommendedCategories.map((category) => (
                            <button
                                key={category.id}
                                type="button"
                                onClick={() => toggleCategory(category.id)}
                                className={cn(
                                    'rounded-full border px-3 py-1 text-xs transition-colors',
                                    favoriteCategoryIds.includes(category.id)
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-transparent hover:bg-muted'
                                )}
                            >
                                {category.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between pt-2">
                <Button type="button" variant="secondary" onClick={() => onSave({ fixedMonthlyIncome: 0, favoriteCategoryIds: [], mainGoal })}>
                    Pular
                </Button>
                <Button onClick={handleContinue} disabled={isSubmitting}>
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
