'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/lib/api';
import { Loader2, Receipt, Users, DollarSign, Trash2, Edit } from 'lucide-react';

interface Activity {
    id: string;
    action: string;
    details: any;
    createdAt: string;
    user: {
        name: string;
        avatarUrl?: string;
    };
}

interface ActivityFeedProps {
    groupId: string;
}

export function ActivityFeed({ groupId }: ActivityFeedProps) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const response = await api.get(`/rachar/groups/${groupId}/activity`);
                setActivities(response.data);
            } catch (error) {
                console.error('Erro ao carregar atividade:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActivity();
    }, [groupId]);

    const getIcon = (action: string) => {
        switch (action) {
            case 'CREATE_EXPENSE':
                return <Receipt className="h-4 w-4 text-red-500" />;
            case 'UPDATE_EXPENSE':
                return <Edit className="h-4 w-4 text-blue-500" />;
            case 'DELETE_EXPENSE':
                return <Trash2 className="h-4 w-4 text-red-500" />;
            case 'SETTLE_DEBT':
                return <DollarSign className="h-4 w-4 text-green-500" />;
            case 'ADD_MEMBER':
                return <Users className="h-4 w-4 text-purple-500" />;
            default:
                return <Receipt className="h-4 w-4" />;
        }
    };

    const getDescription = (activity: Activity) => {
        const { action, details, user } = activity;
        switch (action) {
            case 'CREATE_EXPENSE':
                return (
                    <span>
                        <span className="font-semibold">{user.name}</span> adicionou a despesa "{details.description}" de R$ {Number(details.amount).toFixed(2)}.
                    </span>
                );
            case 'UPDATE_EXPENSE':
                return (
                    <span>
                        <span className="font-semibold">{user.name}</span> atualizou a despesa "{details.description}".
                    </span>
                );
            case 'DELETE_EXPENSE':
                return (
                    <span>
                        <span className="font-semibold">{user.name}</span> removeu uma despesa.
                    </span>
                );
            case 'SETTLE_DEBT':
                return (
                    <span>
                        <span className="font-semibold">{user.name}</span> registrou um pagamento de R$ {Number(details.amount).toFixed(2)}.
                    </span>
                );
            case 'ADD_MEMBER':
                return (
                    <span>
                        <span className="font-semibold">{user.name}</span> adicionou {details.memberName} ao grupo.
                    </span>
                );
            default:
                return <span>{user.name} realizou uma ação.</span>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Nenhuma atividade recente.
            </div>
        );
    }

    return (
        <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4 items-start">
                        <Avatar className="h-8 w-8 mt-1">
                            <AvatarFallback>{activity.user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                            <p className="text-sm leading-none">
                                {getDescription(activity)}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {getIcon(activity.action)}
                                <span>
                                    {formatDistanceToNow(new Date(activity.createdAt), {
                                        addSuffix: true,
                                        locale: ptBR,
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
