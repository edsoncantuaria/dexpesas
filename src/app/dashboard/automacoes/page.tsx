// src/app/dashboard/automacoes/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Account, Automation, Goal, Transaction } from '@/lib/definitions';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/error-handler';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Zap, Loader2, Play, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormField, FormItem, FormControl, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const roundUpSchema = z.object({
    enabled: z.boolean(),
    destination: z.string().min(1, 'Um destino é obrigatório.'),
});

type RecurringExpenseWithAutomation = Transaction & { automation: Automation | null };

/**
 * Componente isolado para a automação de Bill Pay.
 * Envolve o Switch e o Select em seu próprio Form Provider.
 */
function BillPayAutomationRow({ item, accounts, onToggle, onAccountChange, isSaving }: { item: RecurringExpenseWithAutomation, accounts: Account[], onToggle: (recorrenciaId: string, enabled: boolean) => void, onAccountChange: (recorrenciaId: string, accountId: string) => void, isSaving: boolean }) {
    const form = useForm({
        defaultValues: {
            enabled: item.automation?.enabled || false,
            sourceAccountId: (item.automation?.config as any)?.sourceAccountId || '',
        }
    });

    useEffect(() => {
        form.reset({
            enabled: item.automation?.enabled || false,
            sourceAccountId: (item.automation?.config as any)?.sourceAccountId || '',
        });
    }, [item.automation, form]);

    return (
        <Form {...form}>
            <TableRow key={item.id}>
                <TableCell className="font-medium">{item.descricao.replace(/\s\(\d+\/\d+\)$/, '')}</TableCell>
                <TableCell>{Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                <TableCell>
                    <Select
                        value={form.watch('sourceAccountId')}
                        onValueChange={(value) => {
                            form.setValue('sourceAccountId', value);
                            onAccountChange(item.recorrenciaId!, value);
                        }}
                        disabled={isSaving || !form.watch('enabled')}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Conta de Origem" />
                        </SelectTrigger>
                        <SelectContent>
                            {accounts.map(acc => (
                                <SelectItem key={acc.id} value={acc.id}>{acc.nome}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </TableCell>
                <TableCell className="text-right">
                    <Switch
                        checked={form.watch('enabled')}
                        onCheckedChange={(checked) => {
                            form.setValue('enabled', checked);
                            onToggle(item.recorrenciaId!, checked);
                        }}
                        disabled={isSaving}
                    />
                </TableCell>
            </TableRow>
        </Form>
    );
}

export default function AutomacoesPage() {
    const [roundUpAutomation, setRoundUpAutomation] = useState<Automation | null>(null);
    const [billPayAutomations, setBillPayAutomations] = useState<RecurringExpenseWithAutomation[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const { toast } = useToast();

    const roundUpForm = useForm<z.infer<typeof roundUpSchema>>({
        resolver: zodResolver(roundUpSchema),
        defaultValues: { enabled: false, destination: '' }
    });

    const fetchData = useCallback(async () => {
        try {
            const [autoRes, accRes, goalsRes, billPayRes] = await Promise.all([
                api.get('/automations'),
                api.get('/accounts'),
                api.get('/goals'),
                api.get('/automations/bill-pay-candidates'),
            ]);
            setRoundUpAutomation(autoRes.data.find((a: Automation) => a.type === 'ROUND_UP'));
            setAccounts(accRes.data);
            setGoals(goalsRes.data.filter((g: Goal) => g.status === 'IN_PROGRESS'));
            setBillPayAutomations(billPayRes.data);
        } catch (error) {
            handleApiError(error, toast, 'Erro ao buscar dados');
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        setIsLoading(true);
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (roundUpAutomation) {
            const config = roundUpAutomation.config || {};
            roundUpForm.reset({
                enabled: roundUpAutomation.enabled,
                destination: config.destinationAccountId || config.destinationGoalId || '',
            });
        }
    }, [roundUpAutomation, roundUpForm]);

    const handleUpdateAutomation = async (type: string, data: Partial<Automation> & { recorrenciaId?: string }) => {
        setIsSaving(true);
        try {
            const response = await api.patch(`/automations/${type}`, data);
            if (type === 'ROUND_UP') {
                setRoundUpAutomation(response.data);
            }
            toast({ title: 'Automação atualizada com sucesso!' });
            fetchData();
        } catch (error) {
            handleApiError(error, toast, 'Erro ao atualizar automação');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRunManually = async () => {
        setIsRunning(true);
        try {
            const response = await api.post('/automations/ROUND_UP/run');
            const { message, skipped } = response.data;
            if (skipped) {
                toast({ title: 'Aviso', description: message, variant: 'default' });
            } else {
                toast({ title: 'Automação Executada!', description: message });
            }
            fetchData();
        } catch (error: any) {
            handleApiError(error, toast, 'Erro na Execução');
        } finally {
            setIsRunning(false);
        }
    };

    if (isLoading) return <LoadingScreen />;
    if (!roundUpAutomation) return <div>Não foi possível carregar a automação.</div>;

    const { config, scheduleType, scheduleValue } = roundUpAutomation;
    const destinationId = config?.destinationAccountId || config?.destinationGoalId;

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Zap className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Automações</h1>
                    <p className="text-muted-foreground">Deixe o aplicativo trabalhar para você.</p>
                </div>
            </div>

            <Card>
                <Form {...roundUpForm}>
                    <form onSubmit={(e) => e.preventDefault()}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>Guardar o Troco (Cofrinho Digital)</CardTitle>
                                    <CardDescription>Arredonde suas compras e poupe a diferença automaticamente.</CardDescription>
                                </div>
                                <FormField
                                    control={roundUpForm.control}
                                    name="enabled"
                                    render={({ field }) => (
                                        <FormItem><FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={(checked) => {
                                                    field.onChange(checked);
                                                    handleUpdateAutomation('ROUND_UP', { enabled: checked });
                                                }}
                                                disabled={isSaving}
                                            />
                                        </FormControl></FormItem>
                                    )}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <p className="text-sm text-muted-foreground">
                                Quando ativado, o valor de cada compra no débito ou PIX será arredondado para o próximo real.
                                O valor acumulado será transferido para o destino escolhido conforme o agendamento.
                            </p>
                            <FormField
                                control={roundUpForm.control}
                                name="destination"
                                render={({ field }) => (
                                    <FormItem>
                                        <Label>Destino do "Cofrinho"</Label>
                                        <Select
                                            onValueChange={(id) => {
                                                field.onChange(id);
                                                const isGoal = goals.some(g => g.id === id);
                                                const newConfig = isGoal
                                                    ? { destinationGoalId: id, destinationAccountId: null }
                                                    : { destinationAccountId: id, destinationGoalId: null };
                                                handleUpdateAutomation('ROUND_UP', { config: newConfig });
                                            }}
                                            value={field.value}
                                            disabled={!roundUpForm.getValues('enabled') || isSaving}
                                        >
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Selecione para onde o dinheiro irá" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <Label className="px-2 py-1.5 text-xs font-semibold">Contas</Label>
                                                    {accounts.filter(a => ['poupanca', 'investimento'].includes(a.tipo)).map(acc => (
                                                        <SelectItem key={acc.id} value={acc.id}>{acc.nome} (Conta)</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                                <SelectGroup>
                                                    <Label className="px-2 py-1.5 text-xs font-semibold">Metas</Label>
                                                    {goals.map(goal => (
                                                        <SelectItem key={goal.id} value={goal.id}>{goal.name} (Meta)</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="space-y-4 rounded-lg border p-4">
                                <Label>Agendamento</Label>
                                <RadioGroup
                                    value={scheduleType || 'MANUAL'}
                                    onValueChange={(value) => handleUpdateAutomation('ROUND_UP', { scheduleType: value })}
                                    className="grid grid-cols-2 lg:grid-cols-4 gap-2"
                                    disabled={!roundUpForm.getValues('enabled') || isSaving}
                                >
                                    <FormItem><FormControl><RadioGroupItem value="MANUAL" className="sr-only peer" /></FormControl><FormLabel className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">Manual</FormLabel></FormItem>
                                    <FormItem><FormControl><RadioGroupItem value="WEEKLY" className="sr-only peer" /></FormControl><FormLabel className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">Semanal</FormLabel></FormItem>
                                    <FormItem><FormControl><RadioGroupItem value="MONTHLY" className="sr-only peer" /></FormControl><FormLabel className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">Mensal</FormLabel></FormItem>
                                    <FormItem><FormControl><RadioGroupItem value="THRESHOLD" className="sr-only peer" /></FormControl><FormLabel className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">Por Valor</FormLabel></FormItem>
                                </RadioGroup>
                                {scheduleType === 'THRESHOLD' && (
                                    <div className='pt-2'>
                                        <Label>Valor Mínimo para Transferência</Label>
                                        <CurrencyInput
                                            value={parseFloat(scheduleValue || '0')}
                                            onValueChange={(value) => handleUpdateAutomation('ROUND_UP', { scheduleValue: String(value) })}
                                        />
                                    </div>
                                )}
                                <Alert variant="default" className="text-xs">
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        {scheduleType === 'WEEKLY' && "A transferência será feita toda Sexta-feira."}
                                        {scheduleType === 'MONTHLY' && "A transferência será feita todo dia 1º."}
                                        {scheduleType === 'THRESHOLD' && "A transferência será feita quando o valor acumulado atingir o mínimo definido."}
                                        {(scheduleType === 'MANUAL' || !scheduleType) && "Você precisa clicar no botão abaixo para guardar o troco."}
                                    </AlertDescription>
                                </Alert>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-4">
                            <Button type="button" onClick={handleRunManually} disabled={isRunning || !roundUpForm.getValues('enabled') || !destinationId}>
                                {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                                {isRunning ? 'Executando...' : 'Executar Agora'}
                            </Button>
                            {roundUpAutomation.lastRun && (
                                <p className="text-xs text-muted-foreground">
                                    Última execução: {formatDistanceToNowStrict(new Date(roundUpAutomation.lastRun), { addSuffix: true, locale: ptBR })}
                                </p>
                            )}
                        </CardFooter>
                    </form>
                </Form>
            </Card>

            <Separator />

            <Card>
                <CardHeader>
                    <CardTitle>Pagamento Automático de Contas (Bill Pay)</CardTitle>
                    <CardDescription>Ative o pagamento automático para suas despesas recorrentes e nunca mais se preocupe com vencimentos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Despesa Recorrente</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Pagar com a conta</TableHead>
                                <TableHead className="text-right">Pag. Automático</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {billPayAutomations.length > 0 ? billPayAutomations.map(item => (
                                <BillPayAutomationRow
                                    key={item.id}
                                    item={item}
                                    accounts={accounts.filter(a => a.tipo === 'corrente')}
                                    onToggle={(recorrenciaId, enabled) => handleUpdateAutomation('BILL_PAY', { recorrenciaId, enabled })}
                                    onAccountChange={(recorrenciaId, accountId) => handleUpdateAutomation('BILL_PAY', { recorrenciaId, config: { sourceAccountId: accountId } })}
                                    isSaving={isSaving}
                                />
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Nenhuma despesa recorrente encontrada para automação.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter>
                    <Alert variant="default" className="text-xs">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            Ao ativar o pagamento automático, a despesa será marcada como "paga" no dia do seu vencimento. O valor será debitado da conta de origem selecionada.
                        </AlertDescription>
                    </Alert>
                </CardFooter>
            </Card>
        </div>
    );
}
