
// src/app/dashboard/configuracoes/page.tsx
'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Settings, ShieldCheck, Repeat, Loader2, Palette, FileClock, LayoutDashboard, Tags } from 'lucide-react';
import { useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User } from '@/lib/definitions';
import api from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/components/theme-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';


// Schemas para cada formulário
const accountInfoSchema = z.object({
  email: z.string().email('Email inválido.'),
  username: z.string().min(3, 'Usuário deve ter pelo menos 3 caracteres.'),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória.'),
    newPassword: z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres.'),
}).refine(data => data.currentPassword !== data.newPassword, {
    message: 'A nova senha deve ser diferente da atual.',
    path: ['newPassword'],
});

const preferencesSchema = z.object({
    futureProjectionCount: z.coerce.number().min(1, "Mínimo de 1 projeção.").max(50, "Máximo de 50 projeções."),
    daysUntilDueReminder: z.coerce.number(),
    enableAchievementNotifications: z.boolean(),
    enableBudgetNotifications: z.boolean(),
    enableLimitAlerts: z.boolean(),
    enableUpcomingPaymentNotifications: z.boolean(),
    enableOcr: z.boolean(),
    enableDailySummary: z.boolean(),
    enableBudgetSuggestion: z.boolean(),
    enableReconciliationAi: z.boolean(),
    enableGoalProjection: z.boolean(),
    habilitarDescricaoInteligente: z.boolean(),
});


function SectionFooter({ isSubmitting, isDirty }: { isSubmitting: boolean, isDirty: boolean }) {
  return (
    <CardFooter>
      <div className="flex w-full justify-end">
          <TooltipProvider>
              <Tooltip>
                  <TooltipTrigger asChild>
                      <div>
                          <Button type="submit" disabled={isSubmitting || !isDirty}>
                              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Salvar Alterações
                          </Button>
                      </div>
                  </TooltipTrigger>
                  {!isDirty && (
                      <TooltipContent>
                          <p>Nenhuma alteração para salvar.</p>
                      </TooltipContent>
                  )}
              </Tooltip>
          </TooltipProvider>
      </div>
    </CardFooter>
  )
}

function AccountInfoForm({ user }: { user: User }) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof accountInfoSchema>>({
    resolver: zodResolver(accountInfoSchema),
    defaultValues: { email: user.email, username: user.username },
  });

  const onSubmit: SubmitHandler<z.infer<typeof accountInfoSchema>> = async (data) => {
    try {
      await api.put('/user/account-info', data);
      toast({ title: 'Informações da conta atualizadas!' });
      form.reset(data, { keepDirty: false });
    } catch(error) {
       toast({ variant: 'destructive', title: 'Erro ao atualizar', description: 'Email ou usuário já pode estar em uso.' });
    }
  };

  return (
     <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
         <Card>
            <CardHeader>
                <CardTitle>Informações da Conta</CardTitle>
                <CardDescription>Gerencie seu e-mail e nome de usuário.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem> )}/>
              <FormField control={form.control} name="username" render={({ field }) => ( <FormItem><FormLabel>Nome de Usuário</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
            </CardContent>
             <SectionFooter isSubmitting={form.formState.isSubmitting} isDirty={form.formState.isDirty} />
         </Card>
      </form>
    </Form>
  )
}

function PasswordForm() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const onPasswordSubmit: SubmitHandler<z.infer<typeof passwordSchema>> = async (data) => {
    try {
      await api.post('/user/change-password', data);
      toast({ title: 'Senha alterada com sucesso!' });
      form.reset();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao alterar senha', description: 'Verifique sua senha atual.' });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onPasswordSubmit)}>
         <Card>
            <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>Para sua segurança, recomendamos usar uma senha forte e única.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="currentPassword" render={({ field }) => ( <FormItem><FormLabel>Senha Atual</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem> )}/>
              <FormField control={form.control} name="newPassword" render={({ field }) => ( <FormItem><FormLabel>Nova Senha</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            </CardContent>
             <SectionFooter isSubmitting={form.formState.isSubmitting} isDirty={form.formState.isDirty} />
         </Card>
      </form>
    </Form>
  )
}

function PreferencesForm({ user }: { user: User }) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof preferencesSchema>>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      futureProjectionCount: user.futureProjectionCount,
      daysUntilDueReminder: user.daysUntilDueReminder || 3,
      enableAchievementNotifications: user.enableAchievementNotifications ?? true,
      enableBudgetNotifications: user.enableBudgetNotifications ?? true,
      enableLimitAlerts: user.enableLimitAlerts ?? true,
      enableUpcomingPaymentNotifications: user.enableUpcomingPaymentNotifications ?? true,
      enableOcr: user.enableOcr ?? false,
      enableDailySummary: user.enableDailySummary ?? false,
      enableBudgetSuggestion: user.enableBudgetSuggestion ?? false,
      enableReconciliationAi: user.enableReconciliationAi ?? false,
      enableGoalProjection: user.enableGoalProjection ?? false,
      habilitarDescricaoInteligente: user.habilitarDescricaoInteligente ?? true,
    }
  });

  const onSubmit = async (data: z.infer<typeof preferencesSchema>) => {
    try {
      await api.put('/user/preferences', data);
      toast({ title: 'Preferências salvas!' });
      form.reset(data, { keepDirty: false });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar preferências' });
    }
  };

  const isCustomProjection = ![1, 3, 6, 12, 24].includes(form.watch('futureProjectionCount'));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
           <CardHeader>
                <CardTitle>Gerais</CardTitle>
                <CardDescription>Configure o comportamento padrão do aplicativo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormItem>
                  <FormLabel>Período de Projeção Futura</FormLabel>
                  <CardDescription className="text-xs pb-3">Define quantas ocorrências de uma transação recorrente serão criadas à frente.</CardDescription>
                  <div className="flex flex-wrap gap-2">
                    {[1, 3, 6, 12, 24].map(val => (
                        <Button 
                            key={val}
                            type="button"
                            variant={form.watch('futureProjectionCount') === val ? 'default' : 'outline'}
                            onClick={() => form.setValue('futureProjectionCount', val, { shouldDirty: true })}
                        >
                            {val} {val === 1 ? 'mês' : 'meses'}
                        </Button>
                    ))}
                     <Button 
                        type="button"
                        variant={isCustomProjection ? 'default' : 'outline'}
                        onClick={() => form.setValue('futureProjectionCount', 4, { shouldDirty: true })} // Valor default para custom
                    >
                        Outro
                    </Button>
                  </div>
                  {isCustomProjection && (
                    <FormField
                      control={form.control}
                      name="futureProjectionCount"
                      render={({ field }) => (
                        <FormItem className="mt-4">
                           <FormControl>
                            <Input
                              type="number"
                              className="max-w-xs"
                              placeholder="Digite o n° de meses"
                              {...field}
                              onChange={e => field.onChange(Math.min(48, Number(e.target.value)))}
                              max={48}
                            />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </FormItem>
                <Separator/>
                 <FormField control={form.control} name="habilitarDescricaoInteligente" render={({ field }) => (<FormItem className="flex items-center justify-between rounded-lg border p-3"><div><FormLabel>Ativar autocompletar na descrição</FormLabel><CardDescription className="text-xs pr-4">Sugere transações passadas ao digitar a descrição.</CardDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl></FormItem>)}/>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>Escolha quais alertas e lembretes você deseja receber.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
               <FormField control={form.control} name="daysUntilDueReminder" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel>Lembrete de Conta a Vencer</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                      <FormControl><SelectTrigger className='w-40'><SelectValue/></SelectTrigger></FormControl>
                      <SelectContent>
                          <SelectItem value="1">1 dia antes</SelectItem>
                          <SelectItem value="3">3 dias antes</SelectItem>
                          <SelectItem value="5">5 dias antes</SelectItem>
                      </SelectContent>
                  </Select>
                  </FormItem>
              )}/>
              <FormField control={form.control} name="enableUpcomingPaymentNotifications" render={({ field }) => (<FormItem className="flex items-center justify-between rounded-lg border p-3"><FormLabel>Lembretes de Contas a Vencer</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl></FormItem>)}/>
              <FormField control={form.control} name="enableBudgetNotifications" render={({ field }) => (<FormItem className="flex items-center justify-between rounded-lg border p-3"><FormLabel>Alertas de Orçamento Excedido</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl></FormItem>)}/>
              <FormField control={form.control} name="enableLimitAlerts" render={({ field }) => (<FormItem className="flex items-center justify-between rounded-lg border p-3"><FormLabel>Alertas de Limite do Cartão</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl></FormItem>)}/>
              <FormField control={form.control} name="enableAchievementNotifications" render={({ field }) => (<FormItem className="flex items-center justify-between rounded-lg border p-3"><FormLabel>Notificações de Conquistas</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl></FormItem>)}/>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Funcionalidades com IA</CardTitle>
                <CardDescription>Ative ou desative os recursos de inteligência artificial para personalizar sua experiência.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <FormField control={form.control} name="enableOcr" render={({ field }) => (<FormItem className="flex items-center justify-between rounded-lg border p-3"><div><FormLabel>Leitura de Recibos com IA</FormLabel><CardDescription className="text-xs pr-4">Permite digitalizar recibos com a câmera para preencher transações.</CardDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl></FormItem>)}/>
              <FormField control={form.control} name="enableDailySummary" render={({ field }) => (<FormItem className="flex items-center justify-between rounded-lg border p-3"><div><FormLabel>Resumo Diário com Áudio</FormLabel><CardDescription className="text-xs pr-4">Permite gerar um resumo do seu dia em texto e áudio no dashboard.</CardDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl></FormItem>)}/>
              <FormField control={form.control} name="enableBudgetSuggestion" render={({ field }) => (<FormItem className="flex items-center justify-between rounded-lg border p-3"><div><FormLabel>Sugestão de Orçamento com IA</FormLabel><CardDescription className="text-xs pr-4">Permite que a IA sugira valores de orçamento baseados no seu histórico.</CardDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl></FormItem>)}/>
              <FormField control={form.control} name="enableReconciliationAi" render={({ field }) => (<FormItem className="flex items-center justify-between rounded-lg border p-3"><div><FormLabel>Sugestão de Categoria na Reconciliação</FormLabel><CardDescription className="text-xs pr-4">Permite que a IA sugira categorias ao criar transações a partir do extrato.</CardDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl></FormItem>)}/>
              <FormField control={form.control} name="enableGoalProjection" render={({ field }) => (<FormItem className="flex items-center justify-between rounded-lg border p-3"><div><FormLabel>Simulação de Metas com IA</FormLabel><CardDescription className="text-xs pr-4">Permite que a IA projete cenários para suas metas financeiras.</CardDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl></FormItem>)}/>
            </CardContent>
        </Card>

        <SectionFooter isSubmitting={form.formState.isSubmitting} isDirty={form.formState.isDirty} />
      </form>
    </Form>
  )
}

function AppearanceForm() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aparência</CardTitle>
        <CardDescription>Personalize a aparência do aplicativo.</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={theme}
          onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div>
            <RadioGroupItem value="light" id="light" className="sr-only peer" />
            <Label htmlFor="light" className={cn("flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary")}>
              <div className="w-full h-16 rounded-md bg-[#ecedef] flex items-center justify-center border"><div className="w-10 h-10 rounded-full bg-white"/></div>
              <span className="block w-full p-2 text-center font-normal">Claro</span>
            </Label>
          </div>
          <div>
            <RadioGroupItem value="dark" id="dark" className="sr-only peer" />
            <Label htmlFor="dark" className={cn("flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary")}>
              <div className="w-full h-16 rounded-md bg-[#020817] flex items-center justify-center border"><div className="w-10 h-10 rounded-full bg-[#09090b]"/></div>
              <span className="block w-full p-2 text-center font-normal">Escuro</span>
            </Label>
          </div>
          <div>
            <RadioGroupItem value="system" id="system" className="sr-only peer" />
            <Label htmlFor="system" className={cn("flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary")}>
              <div className="w-full h-16 rounded-md bg-gradient-to-r from-[#ecedef] from-50% to-[#020817] to-50% flex items-center justify-center border"><div className="w-10 h-10 rounded-full bg-gradient-to-r from-white from-50% to-[#09090b] to-50%"/></div>
              <span className="block w-full p-2 text-center font-normal">Sistema</span>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  )
}

// Componente principal da página
export default function ConfiguracoesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
        const response = await api.get('/user');
        setUser(response.data);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro ao carregar dados do usuário' });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (isLoading || !user) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Configurações</h1>
          <p className="text-muted-foreground">Gerencie suas informações, segurança e preferências.</p>
        </div>
      </div>
      <Tabs defaultValue="appearance" className="w-full flex flex-col md:flex-row gap-6 md:gap-8">
        <TabsList className="grid w-full md:w-48 grid-cols-2 md:grid-cols-1 h-auto shrink-0">
          <TabsTrigger value="appearance" className="justify-start gap-2"><Palette className="h-4 w-4"/> Aparência</TabsTrigger>
          <TabsTrigger value="dashboard" className="justify-start gap-2"><LayoutDashboard className="h-4 w-4"/> Dashboard</TabsTrigger>
          <TabsTrigger value="security" className="justify-start gap-2"><ShieldCheck className="h-4 w-4"/> Conta</TabsTrigger>
          <TabsTrigger value="preferences" className="justify-start gap-2"><Repeat className="h-4 w-4"/> Preferências</TabsTrigger>
        </TabsList>
        <div className="flex-1">
          <TabsContent value="appearance">
            <AppearanceForm />
          </TabsContent>
          <TabsContent value="dashboard">
             <Card>
                <CardHeader>
                    <CardTitle>Layout da Tela de Aventura</CardTitle>
                    <CardDescription>Reordene ou oculte os cards que aparecem em sua tela inicial para uma experiência totalmente personalizada.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Clique no botão abaixo para ir para a tela de customização.</p>
                    <Button asChild variant="outline">
                        <Link href="/dashboard/customizar">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Customizar Tela de Aventura
                        </Link>
                    </Button>
                </CardContent>
             </Card>
          </TabsContent>
          <TabsContent value="security" className="space-y-6">
              <AccountInfoForm user={user} />
              <PasswordForm />
              <Card>
                  <CardHeader>
                      <CardTitle>Gerenciar Tags</CardTitle>
                      <CardDescription>Edite ou exclua suas tags personalizadas de transações.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">Mantenha suas tags organizadas. Clique no botão abaixo para ir para a página de gerenciamento.</p>
                      <Button asChild variant="outline">
                          <Link href="/dashboard/tags">
                              <Tags className="mr-2 h-4 w-4" />
                              Gerenciar Tags
                          </Link>
                      </Button>
                  </CardContent>
              </Card>
              <Card>
                  <CardHeader>
                      <CardTitle>Trilha de Auditoria</CardTitle>
                      <CardDescription>Veja o histórico de todas as ações importantes realizadas na sua conta.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">Para sua segurança, todas as atividades são registradas. Clique no botão abaixo para visualizar o histórico completo.</p>
                      <Button asChild variant="outline">
                          <Link href="/dashboard/auditoria">
                              <FileClock className="mr-2 h-4 w-4" />
                              Ver Histórico de Auditoria
                          </Link>
                      </Button>
                  </CardContent>
              </Card>
          </TabsContent>
          <TabsContent value="preferences">
              <PreferencesForm user={user} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
