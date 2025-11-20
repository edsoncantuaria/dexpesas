// src/components/dashboard/cartoes/card-list.tsx
'use client';

import type { Card as CardType } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreVertical, Pencil, Trash2, TrendingUp, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { DeleteCardDialog } from './delete-card-dialog';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

const brandColors: Record<string, string> = {
  visa: 'bg-blue-600',
  mastercard: 'bg-gray-800',
  elo: 'bg-yellow-500',
  amex: 'bg-cyan-600',
};

const getCardStyle = (cardName: string, brand: string): string => {
  const lowerCaseName = cardName.toLowerCase();

  // Prioridade para nomes de bancos/fintechs conhecidos
  if (/\bnubank\b/.test(lowerCaseName)) return 'bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 text-white';
  if (/\binter\b/.test(lowerCaseName)) return 'bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white';
  if (/\b(c6|carbon)\b/.test(lowerCaseName)) return 'bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white';
  if (/\b(next)\b/.test(lowerCaseName)) return 'bg-gradient-to-br from-green-400 via-green-500 to-green-600 text-black';
  if (/\b(xp)\b/.test(lowerCaseName)) return 'bg-gradient-to-br from-gray-900 via-black to-gray-950 text-amber-400';

  // Prioridade para categorias de cartão
  if (/\b(black|infinite|nanquim|ultravioleta)\b/.test(lowerCaseName)) {
    return 'bg-gradient-to-br from-gray-900 via-black to-gray-950 text-white';
  }
  if (/\bplatinum\b/.test(lowerCaseName)) {
    return 'bg-gradient-to-br from-slate-600 via-slate-500 to-slate-700 text-white';
  }
  if (/\bgold\b/.test(lowerCaseName)) {
    return 'bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-black';
  }
  if (/\b(standard|classic|internacional)\b/.test(lowerCaseName)) {
    return brandColors[brand] || 'bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white';
  }

  // Fallback para um estilo padrão
  return 'bg-gradient-to-br from-primary via-primary/80 to-primary/60 text-primary-foreground';
};


type CardListProps = {
  cards: CardType[];
  onEdit: (card: CardType) => void;
  onDelete: (cardId: string) => void;
  isLoading: boolean;
};

export function CardList({ cards, onEdit, onDelete, isLoading }: CardListProps) {
  const [deletingCard, setDeletingCard] = useState<CardType | null>(null);

  const handleConfirmDelete = () => {
    if (!deletingCard) return;
    onDelete(deletingCard.id);
    setDeletingCard(null);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-56 w-full rounded-2xl" />
        ))}
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 text-center rounded-3xl border-2 border-dashed bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm">
        <div className="p-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
          <Wallet className="h-16 w-16 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className='text-2xl font-bold font-headline'>Nenhum Cartão Cadastrado</h3>
          <p className="text-muted-foreground max-w-md">
            Adicione seus cartões de crédito para acompanhar faturas e gastos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <CreditCardItem
            key={card.id}
            card={card}
            index={index}
            onEdit={onEdit}
            onDelete={() => setDeletingCard(card)}
          />
        ))}
      </div>

      <DeleteCardDialog
        isOpen={!!deletingCard}
        onClose={() => setDeletingCard(null)}
        onConfirm={handleConfirmDelete}
        cardName={deletingCard?.nome || ''}
      />
    </>
  );
}

function CreditCardItem({
  card,
  index,
  onEdit,
  onDelete
}: {
  card: CardType;
  index: number;
  onEdit: (card: CardType) => void;
  onDelete: () => void;
}) {
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-100, 0, 100],
    ['rgb(239 68 68 / 0.2)', 'transparent', 'rgb(59 130 246 / 0.2)']
  );

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 80;
    if (info.offset.x < -threshold) {
      onDelete();
    } else if (info.offset.x > threshold) {
      onEdit(card);
    }
  };

  const availableLimit = (card.limite || 0) - (card.currentInvoiceAmount || 0);
  const usagePercentage = card.limite ? ((card.currentInvoiceAmount || 0) / card.limite) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      style={{ background }}
      className="relative rounded-2xl"
    >
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileHover={{ scale: 1.03, rotateY: 5 }}
        transition={{ duration: 0.3 }}
        className="relative group cursor-grab active:cursor-grabbing"
      >
        <Link href={`/dashboard/fatura/${card.id}`} className="block">
          <Card className={cn(
            "shadow-xl transition-all hover:shadow-2xl overflow-hidden h-56 flex flex-col justify-between p-6 rounded-2xl border-none relative",
            getCardStyle(card.nome, card.bandeira)
          )}>
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            <CardHeader className="p-0 relative z-10 [text-shadow:_1px_1px_3px_rgb(0_0_0_/_0.5)]">
              <div className="flex items-start justify-between">
                <CardTitle className="font-mono text-xl font-bold">{card.nome}</CardTitle>
                <p className="font-bold text-sm uppercase tracking-wider opacity-90">{card.bandeira}</p>
              </div>
            </CardHeader>

            <CardContent className="p-0 relative z-10 space-y-4 [text-shadow:_1px_1px_2px_rgb(0_0_0_/_0.3)]">
              <p className="font-mono tracking-[0.3em] text-xl font-semibold">
                **** **** **** {card.lastFourDigits ?? '????'}
              </p>

              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-xs opacity-75">Fatura Atual</p>
                  <p className="font-bold text-lg">
                    {(card.currentInvoiceAmount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs opacity-75">Disponível</p>
                  <p className={cn(
                    "font-bold text-lg",
                    availableLimit < 0 ? "text-red-300" : ""
                  )}>
                    {availableLimit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>

              <div className="flex justify-between text-xs opacity-80">
                <p>Venc. {card.diaVencimento.toString().padStart(2, '0')}</p>
                <p>Fecha {card.diaFechamento.toString().padStart(2, '0')}</p>
                <p className={cn(
                  "font-semibold",
                  usagePercentage > 80 ? "text-red-300" : usagePercentage > 50 ? "text-yellow-300" : ""
                )}>
                  {usagePercentage.toFixed(0)}% usado
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <div className="absolute top-4 right-4 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white/90 bg-black/30 hover:bg-black/50 hover:text-white rounded-full backdrop-blur-sm transition-all"
                onClick={(e) => e.preventDefault()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(card); }}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    </motion.div>
  );
}
