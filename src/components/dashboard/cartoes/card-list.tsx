
'use client';

import type { Card as CardType } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
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

const brandColors: Record<string, string> = {
    visa: 'bg-blue-600',
    mastercard: 'bg-gray-800',
    elo: 'bg-yellow-500',
    amex: 'bg-cyan-600',
};

const getCardStyle = (cardName: string, brand: string): string => {
    const lowerCaseName = cardName.toLowerCase();

    // Prioridade para nomes de bancos/fintechs conhecidos
    if (/\bnubank\b/.test(lowerCaseName)) return 'bg-gradient-to-br from-purple-600 to-purple-800 text-white';
    if (/\binter\b/.test(lowerCaseName)) return 'bg-gradient-to-br from-orange-500 to-orange-600 text-white';
    if (/\b(c6|carbon)\b/.test(lowerCaseName)) return 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white';
    if (/\b(next)\b/.test(lowerCaseName)) return 'bg-gradient-to-br from-green-400 to-green-600 text-black';
    if (/\b(xp)\b/.test(lowerCaseName)) return 'bg-gradient-to-br from-gray-900 to-black text-amber-400';

    // Prioridade para categorias de cartão
    if (/\b(black|infinite|nanquim|ultravioleta)\b/.test(lowerCaseName)) {
        return 'bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white';
    }
    if (/\bplatinum\b/.test(lowerCaseName)) {
        return 'bg-gradient-to-br from-slate-600 via-slate-500 to-slate-700 text-white';
    }
    if (/\bgold\b/.test(lowerCaseName)) {
        return 'bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-black';
    }
    if (/\b(standard|classic|internacional)\b/.test(lowerCaseName)) {
        return brandColors[brand] || 'bg-gradient-to-br from-blue-700 to-blue-800 text-white';
    }

    // Fallback para um estilo padrão
    return 'bg-gradient-to-br from-primary to-primary/70 text-primary-foreground';
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
            {[...Array(2)].map((_, i) => (
                 <Skeleton key={i} className="h-52 w-full rounded-2xl" />
            ))}
        </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.id} className="relative group">
            <Link href={`/dashboard/fatura/${card.id}`} className="block">
              <Card className={cn(
                "shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] overflow-hidden h-52 flex flex-col justify-between p-5 rounded-2xl border-none",
                getCardStyle(card.nome, card.bandeira)
                )}>
                <CardHeader className="p-0 [text-shadow:_1px_1px_2px_rgb(0_0_0_/_0.4)]">
                    <div className="flex items-start justify-between">
                      <CardTitle className="font-mono text-lg">{card.nome}</CardTitle>
                      <p className="font-bold text-base uppercase">{card.bandeira}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-0 [text-shadow:_1px_1px_2px_rgb(0_0_0_/_0.2)]">
                  <div className="space-y-2">
                      <p className="font-mono tracking-widest text-lg">**** **** **** 1234</p>
                      <div className="flex justify-between text-xs opacity-80">
                          <p>Venc. {card.diaVencimento.toString().padStart(2, '0')}</p>
                          <p>Fecha {card.diaFechamento.toString().padStart(2, '0')}</p>
                      </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

             <div className="absolute top-4 right-4 z-10">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 bg-black/20 hover:bg-black/40 hover:text-white rounded-full">
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
                        onClick={(e) => { e.stopPropagation(); setDeletingCard(card); }}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
          </div>
        ))}
      </div>
      
      {/* Delete Card Dialog */}
      <DeleteCardDialog
        isOpen={!!deletingCard}
        onClose={() => setDeletingCard(null)}
        onConfirm={handleConfirmDelete}
        cardName={deletingCard?.nome || ''}
      />
    </>
  );
}
