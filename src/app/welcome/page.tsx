// src/app/welcome/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BrainCircuit, CheckCircle, CreditCard, Gamepad2, Landmark, PartyPopper, Rocket, Target, User as UserIcon, Wallet, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AddAccountForm } from '@/components/dashboard/contas/add-account-form';
import { AddCardForm } from '@/components/dashboard/cartoes/add-card-form';
import type { Account, Card as CardType } from '@/lib/definitions';
import type { LucideIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


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

export default function WelcomePage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setStep(prev => prev + newDirection);
  };

  const onboardingSteps = [
    {
      component: InfoStep,
      props: { 
        icon: Gamepad2,
        title: "Sua Jornada Financeira Começa!",
        description: "Prepare-se para transformar suas finanças em uma aventura épica. Vamos criar seu herói financeiro."
      }
    },
    {
      component: AddAccountStep,
      props: { 
          title: "Forje sua Arma Principal: A Conta",
          description: "Toda jornada precisa de um ponto de partida. Cadastre sua conta corrente para começar a rastrear seus tesouros.",
          onSave: async (data: Omit<Account, 'id'|'userId'>) => {
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
          isSubmitting: isSubmitting,
          onSkip: () => paginate(1),
      }
    },
     {
      component: AddCardStep,
      props: {
          title: "Equipe seu Escudo: O Cartão",
          description: "O cartão de crédito é uma ferramenta poderosa. Cadastre o seu para gerenciar seu poder de compra com sabedoria.",
          onSave: async (data: Omit<CardType, 'id'|'userId'|'bestDayToBuy' | 'currentInvoiceAmount' | 'availableLimit'>) => {
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
          isSubmitting: isSubmitting,
          onSkip: () => paginate(1),
      }
    },
    {
        component: AddProfileStep,
        props: {
            onSaveAndContinue: async (data: any) => {
                const hasData = Object.values(data).some(v => v !== null && v !== undefined && v !== '');
                if (hasData) {
                    setIsSubmitting(true);
                    try {
                        await api.put('/user/profile', data);
                        toast({ title: 'Arquétipo definido!' });
                    } catch (error) {
                        toast({ variant: 'destructive', title: 'Erro ao salvar perfil' });
                        setIsSubmitting(false); // Para o loading em caso de erro
                        return; // Não avança se der erro
                    } finally {
                        setIsSubmitting(false);
                    }
                }
                paginate(1);
            },
            isSubmitting: isSubmitting,
        }
    },
    {
      component: InfoStep,
      props: { 
        icon: Rocket,
        title: "Evolua seu Herói Financeiro",
        description: "Cada ação positiva, como pagar contas em dia e economizar, concede XP e aumenta o nível do seu herói, desbloqueando novas classes e habilidades."
      }
    },
     {
      component: InfoStep,
      props: { 
        icon: PartyPopper,
        title: "A Aventura te Aguarda!",
        description: "Tudo pronto para começar. Sua jornada para a maestria financeira começa agora. Clique abaixo para entrar no reino!"
      }
    }
  ];

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
  
  if (isCompleting) {
    return <LoadingScreen />
  }

  const { component: StepComponent, props: stepProps } = onboardingSteps[step];
  const isFinalStep = step === onboardingSteps.length - 1;
  const isFirstStep = step === 0;

  return (
    <div className="flex h-svh w-full flex-col items-center justify-between bg-background p-4 sm:p-6">
      <Logo />
      
      <div className="relative flex h-full w-full max-w-lg items-start sm:items-center justify-center overflow-hidden py-4">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute flex w-full flex-col items-center justify-start sm:justify-center"
          >
            <StepComponent {...stepProps} onNext={() => paginate(1)} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="w-full max-w-lg space-y-4">
        <div className="flex justify-center gap-2">
          {onboardingSteps.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > step ? 1 : -1);
                setStep(i);
              }}
              className={`h-2 rounded-full transition-all ${step === i ? 'w-6 bg-primary' : 'w-2 bg-muted hover:bg-muted-foreground/50'}`}
              aria-label={`Ir para o passo ${i + 1}`}
            />
          ))}
        </div>
        
        { ![2, 3].includes(step) && ( // Não renderiza a navegação padrão nos passos com formulário
             isFinalStep ? (
              <Button onClick={handleComplete} className="w-full" size="lg">
                Entrar no Reino
              </Button>
            ) : (
              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => paginate(-1)} disabled={isFirstStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                {isFirstStep ? (
                    <Button onClick={() => paginate(1)}>
                        Criar Herói
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button variant="secondary" onClick={() => paginate(1)}>
                        Continuar
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
              </div>
            )
        )}
      </div>
    </div>
  );
}


// Step Components

function InfoStep({ icon: Icon, title, description }: { icon: LucideIcon, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-12 w-12" />
        </div>
        <div className="space-y-2">
            <h1 className="text-2xl font-bold font-headline">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
        </div>
    </div>
  );
}

function AddAccountStep({ title, description, onSave, isSubmitting, onSkip }: { title: string, description: string, onSave: (data: any) => void, isSubmitting: boolean, onSkip: () => void }) {
  return (
    <div className="w-full max-h-[70vh] overflow-y-auto px-1 space-y-4">
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
        />
    </div>
  );
}

function AddCardStep({ title, description, onSave, isSubmitting, onSkip }: { title: string, description: string, onSave: (data: any) => void, isSubmitting: boolean, onSkip: () => void }) {
  return (
     <div className="w-full max-h-[70vh] overflow-y-auto px-1 space-y-4">
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

function AddProfileStep({ onSaveAndContinue, isSubmitting }: { onSaveAndContinue: (data: any) => void, isSubmitting: boolean }) {
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
    <div className="w-full max-h-[70vh] overflow-y-auto px-1 space-y-4">
        <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserIcon className="h-10 w-10" />
                </div>
            </div>
            <h2 className="text-xl font-bold font-headline">Defina seu Arquétipo (Opcional)</h2>
            <p className="text-sm text-muted-foreground">Suas escolhas moldam seu herói. Isso nos ajuda a personalizar suas futuras missões e dicas.</p>
        </div>
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSaveAndContinue)} className="space-y-4">
                <FormField control={form.control} name="professionalSituation" render={({ field }) => ( 
                  <FormItem><FormLabel>Situação Profissional</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ''}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Empregado (CLT)">Empregado (CLT)</SelectItem><SelectItem value="Autônomo/Freelancer">Autônomo/Freelancer</SelectItem><SelectItem value="Empresário/Sócio">Empresário/Sócio</SelectItem><SelectItem value="Servidor Público">Servidor Público</SelectItem><SelectItem value="Estudante">Estudante</SelectItem><SelectItem value="Aposentado/Pensionista">Aposentado/Pensionista</SelectItem><SelectItem value="Não se aplica">Não se aplica</SelectItem></SelectContent></Select><FormMessage /></FormItem> 
                )}/>
                <FormField control={form.control} name="monthlyIncomeRange" render={({ field }) => ( 
                  <FormItem><FormLabel>Faixa de Renda Mensal</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ''}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Até R$ 2.000">Até R$ 2.000</SelectItem><SelectItem value="R$ 2.001 - R$ 5.000">R$ 2.001 - R$ 5.000</SelectItem><SelectItem value="R$ 5.001 - R$ 10.000">R$ 5.001 - R$ 10.000</SelectItem><SelectItem value="R$ 10.001 - R$ 20.000">R$ 10.001 - R$ 20.000</SelectItem><SelectItem value="Acima de R$ 20.000">Acima de R$ 20.000</SelectItem><SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem></SelectContent></Select><FormMessage /></FormItem> 
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
