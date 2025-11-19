// src/components/dashboard/metas/goal-list.tsx
'use client';

import type { Goal } from '@/lib/definitions';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { MoreVertical, Pencil, Trash2, PiggyBank, Plus, CheckCircle, Trophy, History, Undo2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';
import { DeleteGoalDialog } from './delete-goal-dialog';
import { formatDistanceToNowStrict, format, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';


type GoalListProps = {
  goals: Goal[];
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
  onAddContribution: (goal: Goal) => void;
  onFinalize: (goal: Goal) => void;
  onViewDetails: (goal: Goal) => void;
  onRescue: (goal: Goal) => void; 
};

function GoalImage({ imageUrl, goalName }: { imageUrl: string | null | undefined, goalName: string }) {
    const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchUrl = async () => {
            if (imageUrl && !imageUrl.startsWith('http')) {
                setIsLoading(true);
                try {
                    const response = await api.post('/storage/get-url', { objectName: imageUrl });
                    setPresignedUrl(response.data.url);
                } catch (error) {
                    console.error("Erro ao buscar URL da imagem da meta:", error);
                    setPresignedUrl(null);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setPresignedUrl(imageUrl);
            }
        };
        fetchUrl();
    }, [imageUrl]);

    if (isLoading) {
        return <Skeleton className="h-40 w-full" />;
    }

    return imageUrl && presignedUrl ? (
        <img src={presignedUrl} alt={goalName} className="h-40 w-full object-cover" />
    ) : (
        <div className="h-40 w-full bg-muted flex items-center justify-center">
            <PiggyBank className="h-16 w-16 text-muted-foreground/50" />
        </div>
    );
}


export function GoalList({ goals, onEdit, onDelete, onAddContribution, onFinalize, onViewDetails, onRescue }: GoalListProps) {
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);
  const router = useRouter();

  const handleConfirmDelete = () => {
    if (!deletingGoal) return;
    onDelete(deletingGoal.id);
    setDeletingGoal(null);
  };
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const isFamilyGoal = Boolean(goal.clanId);
          const targetAmount = Number(goal.targetAmount);
          const currentAmount = Number(goal.currentAmount);
          const percentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
          const deadline = goal.deadline ? new Date(goal.deadline) : null;
          const timeRemaining = deadline && isAfter(deadline, new Date()) ? formatDistanceToNowStrict(deadline, { addSuffix: true, locale: ptBR }) : null;
          const isCompleted = goal.status === 'COMPLETED';
          const isReadyToFinalize = !isCompleted && currentAmount >= targetAmount;

          return (
            <div key={goal.id} className={cn("relative group flex", isCompleted && "opacity-70")}>
              <Card onClick={() => onViewDetails(goal)} className="shadow-md transition-all flex flex-col w-full hover:shadow-xl hover:border-primary/50 cursor-pointer bg-card overflow-hidden">
                <div className="relative">
                    <GoalImage imageUrl={goal.imageUrl} goalName={goal.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                    <div className="absolute top-2 right-2 z-10">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-black/30 hover:bg-black/50 border-none text-white" onClick={e => e.stopPropagation()}>
                               <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                           {!isFamilyGoal && !isCompleted && <DropdownMenuItem onClick={() => onEdit(goal)}><Pencil className="mr-2 h-4 w-4" />Editar Meta</DropdownMenuItem>}
                           {!isFamilyGoal && currentAmount > 0 && !isCompleted && (
                             <DropdownMenuItem onClick={() => onRescue(goal)}>
                               <Undo2 className="mr-2 h-4 w-4" />Resgatar Valor
                             </DropdownMenuItem>
                           )}
                           <DropdownMenuItem onClick={() => onViewDetails(goal)}>
                             <History className="mr-2 h-4 w-4" />Ver Histórico
                           </DropdownMenuItem>
                           {isFamilyGoal ? (
                             <DropdownMenuItem disabled className="text-muted-foreground">
                               Gerencie no Modo Família
                             </DropdownMenuItem>
                           ) : (
                             <>
                               <DropdownMenuSeparator />
                               <DropdownMenuItem
                                 className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                 onClick={() => setDeletingGoal(goal)}
                               >
                                 <Trash2 className="mr-2 h-4 w-4" />Excluir
                               </DropdownMenuItem>
                             </>
                           )}
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                     {isCompleted && (
                        <Badge variant="default" className="absolute top-3 left-3 bg-green-500 hover:bg-green-600">
                           <CheckCircle className="mr-2 h-4 w-4"/> Concluída
                        </Badge>
                    )}
                    {isFamilyGoal && !isCompleted && (
                      <Badge variant="secondary" className="absolute top-3 left-3 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Família
                      </Badge>
                    )}
                </div>

                <CardContent className="flex-grow flex flex-col justify-between p-4 space-y-4">
                    <div className="space-y-1">
                        {isFamilyGoal && (
                            <div className="flex items-center justify-between rounded-md border border-dashed px-3 py-2 text-xs text-primary">
                                <span className="flex items-center gap-1 font-medium">
                                    <Users className="h-3.5 w-3.5" />
                                    Meta colaborativa
                                </span>
                                <Button
                                    variant="link"
                                    className="h-auto p-0 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push('/dashboard/cells');
                                    }}
                                >
                                    Abrir Modo Família
                                </Button>
                            </div>
                        )}
                        <CardTitle className="font-headline text-lg">{goal.name}</CardTitle>
                        {deadline && timeRemaining && (
                            <p className="text-xs text-muted-foreground mt-1">Prazo: {format(deadline, 'dd/MM/yyyy')} ({timeRemaining})</p>
                        )}
                        {goal.projectionDate && !isCompleted && (
                            <p className="text-xs italic text-muted-foreground mt-1">Projeção de Conclusão: {format(new Date(goal.projectionDate), 'dd/MM/yyyy', { locale: ptBR })}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <p className="text-primary">
                                {currentAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                            <p className="text-muted-foreground">
                                {targetAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                        <Progress value={Math.min(percentage, 100)} className="h-2" />
                    </div>

                    {isFamilyGoal ? (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push('/dashboard/cells');
                        }}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Abrir Modo Família
                      </Button>
                    ) : isReadyToFinalize ? (
                         <Button className="w-full bg-green-500 hover:bg-green-600" onClick={(e) => { e.stopPropagation(); onFinalize(goal);}}>
                            <Trophy className="mr-2 h-4 w-4" />
                            Finalizar Objetivo
                        </Button>
                    ) : !isCompleted && (
                         <Button className="w-full" variant="secondary" onClick={(e) => { e.stopPropagation(); onAddContribution(goal);}}>
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Contribuição
                        </Button>
                    )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
      
      <DeleteGoalDialog 
        isOpen={!!deletingGoal}
        onClose={() => setDeletingGoal(null)}
        onConfirm={handleConfirmDelete}
        goalName={deletingGoal?.name || ''}
      />
    </>
  );
}
