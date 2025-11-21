// src/components/dashboard/progresso/all-attributes.tsx
import type { GamificationProfile as GamificationProfileType } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { categoryDetails } from '@/lib/data';
import type { LucideIcon } from 'lucide-react';
import { BarChart, Droplets, Dumbbell, Gamepad2, GraduationCap, HeartPulse, Home, ShoppingCart, Utensils, Wallet, ShieldCheck, Sword, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';


type AllAttributesProps = {
  profile: GamificationProfileType & { updatedAt: string };
};

// A mesma fórmula usada no backend para consistência
const xpNeeded = (level: number) => Math.floor(100 * Math.pow(level, 1.5));

const iconMap: Record<string, LucideIcon> = {
  Utensils,
  Gamepad2,
  Droplets,
  BarChart,
  Dumbbell,
  Home,
  HeartPulse,
  GraduationCap,
  ShoppingCart,
  Wallet,
  Sword,
  ShieldCheck,
  Sparkles, // Ícone para Sorte
};

const attributeToIconMap: Record<string, LucideIcon | undefined> = {
  ...new Map(categoryDetails.map(cat => [cat.nome, iconMap[cat.icon]])),
  Forca: Sword,
  Resistencia: ShieldCheck,
  Sabedoria: GraduationCap,
  Sorte: Sparkles,
};

const attributeDescriptions: Record<string, string> = {
  Forca: 'Baseado em sua Renda, Saúde e Esportes.',
  Resistencia: 'Baseado em Investimentos, Poupança e Seguros.',
  Sabedoria: 'Baseado em Educação, Livros e Cursos.',
  Sorte: 'Baseado em Caridade, Presentes e Pagamento de Dívidas.',
};


const SkullIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M8 10h.01" />
    <path d="M16 10h.01" />
    <path d="M7 14c.5-1 2-2 5-2s4.5 1 5 2" />
    <path d="M12 2a9 9 0 0 0-9 9c0 4.42 2.67 8.17 6.33 9.54" />
    <path d="M21 11c0 4.42-2.67 8.17-6.33 9.54" />
    <path d="M12.01 20.55c.67.13 1.33.2 2 .2 4.42 0 8-3.58 8-8 0-4.09-3.04-7.44 7-7.93" />
    <path d="M12.01 20.55c-.67.13-1.33.2-2 .2-4.42 0-8-3.58-8-8 0-4.09 3.04-7.44 7-7.93" />
  </svg>
);


export function AllAttributes({ profile }: AllAttributesProps) {
  const { level, xp, updatedAt, ...attributes } = profile;

  const xpForNextLevel = xpNeeded(level);
  const xpPercentage = (xp / xpForNextLevel) * 100;

  const primaryStats = Object.entries(attributes)
    .filter(([key]) => ['Forca', 'Resistencia', 'Sabedoria', 'Sorte'].includes(key));

  const secondaryStats = Object.entries(attributes)
    .filter(([key]) => !['id', 'userId', 'createdAt', 'updatedAt', 'heroClass', 'Forca', 'Resistencia', 'Sabedoria', 'Sorte'].includes(key) && typeof attributes[key as keyof typeof attributes] === 'number')
    .sort(([, a], [, b]) => (b as number) - (a as number));

  return (
    <Card className="shadow-md h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start flex-wrap gap-2">
          <div>
            <CardTitle className="font-headline text-xl">Level {level} - {profile.heroClass}</CardTitle>
            <CardDescription>Progresso de Experiência (XP)</CardDescription>
          </div>
          <div className="text-right w-full sm:w-1/3">
            <p className="text-sm font-semibold">{xp} / {xpForNextLevel} XP</p>
            <Progress value={xpPercentage} className="h-2 mt-1" aria-label={`${xpPercentage}% para o próximo nível`} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <h3 className="font-headline text-lg mb-4">Atributos Principais</h3>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 mb-6">
          {primaryStats.map(([key, value]) => {
            if (typeof value !== 'number') return null;
            const Icon = attributeToIconMap[key];
            return (
              <div key={key} className="flex flex-col gap-2 p-4 rounded-lg bg-muted/30 border border-accent/30 relative group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {Icon && <Icon className="h-6 w-6 text-accent" />}
                    <span className="font-semibold text-base">{key}</span>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground/50 hover:text-accent transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{attributeDescriptions[key]}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={value} className="h-2 flex-1 [&>div]:bg-accent" />
                  <span className="font-mono text-lg font-bold text-accent">{value}</span>
                </div>
              </div>
            )
          })}
        </div>

        <h3 className="font-headline text-lg mb-4">Atributos Secundários</h3>
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {secondaryStats.map(([key, value]) => {
            if (typeof value !== 'number') return null;
            const Icon = key === 'Vicios' ? SkullIcon : attributeToIconMap[key];
            const isVicio = key === 'Vicios';
            const maxPoints = 500;
            const percentage = (value / maxPoints) * 100;
            return (
              <div key={key} className="flex flex-col gap-2 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  {Icon && <Icon className={cn("h-5 w-5", isVicio ? "text-destructive" : "text-primary")} />}
                  <span className="font-semibold text-sm">{key}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={percentage} className={cn("h-1.5 flex-1", isVicio && "[&>div]:bg-destructive")} />
                  <span className={cn("font-mono text-sm font-bold", isVicio ? "text-destructive" : "text-primary")}>{value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Atributos atualizados em {format(new Date(updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
      </CardFooter>
    </Card>
  );
}
