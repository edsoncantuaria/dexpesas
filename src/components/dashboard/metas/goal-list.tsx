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
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';


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
        setPresignedUrl(imageUrl || null);
      }
    };
    fetchUrl();
  }, [imageUrl]);

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  return imageUrl && presignedUrl ? (
    <img src={presignedUrl} alt={goalName} className="h-48 w-full object-cover" />
  ) : (
    <div className="h-48 w-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
      <PiggyBank className="h-20 w-20 text-primary/40" />
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
        {goals.map((goal, index) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            index={index}
            onEdit={onEdit}
            onDelete={() => setDeletingGoal(goal)}
            onAddContribution={onAddContribution}
            onFinalize={onFinalize}
            onViewDetails={onViewDetails}
            onRescue={onRescue}
            router={router}
          />
        ))}
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

function GoalCard({
  goal,
  index,
  onEdit,
  onDelete,
  onAddContribution,
  onFinalize,
  onViewDetails,
  onRescue,
  router
}: {
  goal: Goal;
  index: number;
  onEdit: (goal: Goal) => void;
  onDelete: () => void;
  onAddContribution: (goal: Goal) => void;
  onFinalize: (goal: Goal) => void;
  onViewDetails: (goal: Goal) => void;
  onRescue: (goal: Goal) => void;
  router: any;
}) {
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-100, 0, 100],
    ['rgb(239 68 68 / 0.2)', 'transparent', 'rgb(59 130 246 / 0.2)']
  );

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x < -threshold) {
      onDelete();
    } else if (info.offset.x > threshold) {
      if (goal.status !== 'COMPLETED') {
        onAddContribution(goal);
      }
    }
  };

  const isFamilyGoal = Boolean(goal.clanId);
  const targetAmount = Number(goal.targetAmount);
  const currentAmount = Number(goal.currentAmount);
  const percentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
  const deadline = goal.deadline ? new Date(goal.deadline) : null;
  const timeRemaining = deadline && isAfter(deadline, new Date()) ? formatDistanceToNowStrict(deadline, { addSuffix: true, locale: ptBR }) : null;
  const isCompleted = goal.status === 'COMPLETED';
  const isReadyToFinalize = !isCompleted && currentAmount >= targetAmount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      style={{ background }}
      className={cn("relative rounded-2xl", isCompleted && "opacity-75")}
    >
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileHover={{ scale: 1.03, rotateY: 3 }}
        transition={{ duration: 0.3 }}
        className="relative group cursor-grab active:cursor-grabbing"
      >
        <Card
          onClick={() => onViewDetails(goal)}
          className="shadow-xl transition-all flex flex-col w-full hover:shadow-2xl hover:border-primary/50 cursor-pointer bg-card overflow-hidden rounded-2xl border-white/10"
        >
          <div className="relative">
            <GoalImage imageUrl={goal.imageUrl} goalName={goal.name} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            <div className="absolute top-3 right-3 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm border-none text-white"
                    onClick={e => e.stopPropagation()}
                  >
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
                        onClick={onDelete}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />Excluir
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {isCompleted && (
              <Badge variant="default" className="absolute top-3 left-3 bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg">
                <CheckCircle className="mr-2 h-4 w-4" /> Concluída
              </Badge>
            )}
            {isFamilyGoal && !isCompleted && (
              <Badge variant="secondary" className="absolute top-3 left-3 flex items-center gap-1 shadow-lg backdrop-blur-sm">
                <Users className="h-3 w-3" />
                Família
              </Badge>
            )}
          </div>

          <CardContent className="relative z-10 flex-grow flex flex-col justify-between p-5 space-y-4">
            <div className="space-y-2">
              {isFamilyGoal && (
                <div className="flex items-center justify-between rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2 text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-primary">
                    <Users className="h-3.5 w-3.5" />
                    Meta colaborativa
                  </span>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push('/dashboard/cells');
                    }}
                  >
                    Abrir Modo Família
                  </Button>
                </div>
              )}
              <CardTitle className="font-headline text-xl [text-shadow:_1px_1px_2px_rgb(0_0_0_/_0.1)]">{goal.name}</CardTitle>
              {deadline && timeRemaining && (
                <p className="text-xs text-muted-foreground">Prazo: {format(deadline, 'dd/MM/yyyy')} ({timeRemaining})</p>
              )}
              {goal.projectionDate && !isCompleted && (
                <p className="text-xs italic text-muted-foreground">Projeção: {format(new Date(goal.projectionDate), 'dd/MM/yyyy', { locale: ptBR })}</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm font-semibold">
                <p className="text-primary">
                  {currentAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <p className="text-muted-foreground">
                  {targetAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>

              <div className="relative h-3 rounded-full overflow-hidden bg-muted/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percentage, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 + 0.3 }}
                  className={cn(
                    "h-full bg-gradient-to-r",
                    percentage >= 100 ? "from-emerald-500 to-green-600" :
                      percentage >= 75 ? "from-blue-500 to-cyan-600" :
                        percentage >= 50 ? "from-amber-500 to-yellow-600" :
                          "from-primary to-primary/80"
                  )}
                  style={{
                    boxShadow: percentage >= 100 ? '0 0 10px rgba(16, 185, 129, 0.5)' :
                      percentage >= 75 ? '0 0 10px rgba(59, 130, 246, 0.3)' : 'none'
                  }}
                />
              </div>

              <p className="text-xs text-center text-muted-foreground font-medium">
                {Math.min(percentage, 100).toFixed(1)}% alcançado
              </p>
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
              <Button
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/30"
                onClick={(e) => { e.stopPropagation(); onFinalize(goal); }}
              >
                <Trophy className="mr-2 h-4 w-4" />
                Finalizar Objetivo
              </Button>
            ) : !isCompleted && (
              <Button
                className="w-full shadow-md hover:shadow-lg transition-shadow"
                variant="secondary"
                onClick={(e) => { e.stopPropagation(); onAddContribution(goal); }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Contribuição
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
