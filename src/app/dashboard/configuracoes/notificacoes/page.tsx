'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { handleApiError } from '@/lib/error-handler';
import { Bell, Calendar, Target, AlertTriangle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface NotificationPreferences {
    billReminders?: boolean;
    budgetAlerts?: boolean;
    goalReminders?: boolean;
    unusualTransactions?: boolean;
}

export default function NotificationsPage() {
    const [preferences, setPreferences] = useState<NotificationPreferences>({
        billReminders: true,
        budgetAlerts: true,
        goalReminders: true,
        unusualTransactions: true
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const response = await api.get('/user');
                const userPrefs = response.data.notificationPreferences || {};
                setPreferences({
                    billReminders: userPrefs.billReminders ?? true,
                    budgetAlerts: userPrefs.budgetAlerts ?? true,
                    goalReminders: userPrefs.goalReminders ?? true,
                    unusualTransactions: userPrefs.unusualTransactions ?? true
                });
            } catch (error) {
                handleApiError(error, toast, 'Erro ao carregar preferências');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPreferences();
    }, [toast]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.put('/user/preferences', {
                notificationPreferences: preferences
            });

            toast({
                title: 'Preferências Salvas',
                description: 'Suas configurações de notificação foram atualizadas.'
            });
        } catch (error) {
            handleApiError(error, toast, 'Erro ao salvar preferências');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggle = (key: keyof NotificationPreferences) => {
        setPreferences(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    if (isLoading) {
        return (
            <div className="container max-w-4xl py-8 space-y-6">
                <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-16" />
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl py-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
                <p className="text-muted-foreground mt-2">
                    Configure quais alertas inteligentes você deseja receber
                </p>
            </div>

            {/* Preferences Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Alertas Inteligentes
                    </CardTitle>
                    <CardDescription>
                        Os alertas são verificados diariamente às 9h da manhã
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Bill Reminders */}
                    <div className="flex items-start justify-between space-x-4">
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                <Label htmlFor="billReminders" className="font-medium">
                                    Lembretes de Contas
                                </Label>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Receba notificações 1, 3 e 7 dias antes do vencimento de contas pendentes
                            </p>
                        </div>
                        <Switch
                            id="billReminders"
                            checked={preferences.billReminders}
                            onCheckedChange={() => handleToggle('billReminders')}
                        />
                    </div>

                    {/* Budget Alerts */}
                    <div className="flex items-start justify-between space-x-4">
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-orange-500" />
                                <Label htmlFor="budgetAlerts" className="font-medium">
                                    Alertas de Orçamento
                                </Label>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Seja notificado quando atingir 80% e 100% do limite de um orçamento
                            </p>
                        </div>
                        <Switch
                            id="budgetAlerts"
                            checked={preferences.budgetAlerts}
                            onCheckedChange={() => handleToggle('budgetAlerts')}
                        />
                    </div>

                    {/* Goal Reminders */}
                    <div className="flex items-start justify-between space-x-4">
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-green-500" />
                                <Label htmlFor="goalReminders" className="font-medium">
                                    Lembretes de Metas
                                </Label>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Receba um lembrete se passar 30 dias sem contribuir para uma meta ativa
                            </p>
                        </div>
                        <Switch
                            id="goalReminders"
                            checked={preferences.goalReminders}
                            onCheckedChange={() => handleToggle('goalReminders')}
                        />
                    </div>

                    {/* Unusual Transactions */}
                    <div className="flex items-start justify-between space-x-4">
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                <Label htmlFor="unusualTransactions" className="font-medium">
                                    Transações Incomuns
                                </Label>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Seja alertado sobre despesas significativamente maiores que sua média (2x ou mais)
                            </p>
                        </div>
                        <Switch
                            id="unusualTransactions"
                            checked={preferences.unusualTransactions}
                            onCheckedChange={() => handleToggle('unusualTransactions')}
                        />
                    </div>

                    {/* Save Button */}
                    <div className="pt-4 border-t flex justify-end">
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                'Salvar Preferências'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <Bell className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Como funciona?
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Os alertas inteligentes são processados automaticamente todos os dias às 9h.
                                Você receberá notificações push no app quando houver eventos importantes.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
