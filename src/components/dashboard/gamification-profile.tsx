import type { GamificationProfile as GamificationProfileType } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { categoryDetails } from '@/lib/data';
import Link from 'next/link';
import { ArrowRight, BarChart, Droplets, Dumbbell, Gamepad2, GraduationCap, HeartPulse, Home, ShoppingCart, Utensils } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type GamificationProfileProps = {
  profile: GamificationProfileType;
};

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
};

const attributeToIconMap = new Map(categoryDetails.map(cat => [cat.nome, iconMap[cat.icon]]));

const SkullIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M8 10h.01" />
        <path d="M16 10h.01" />
        <path d="M7 14c.5-1 2-2 5-2s4.5 1 5 2" />
        <path d="M12 2a9 9 0 0 0-9 9c0 4.42 2.67 8.17 6.33 9.54" />
        <path d="M21 11c0 4.42-2.67 8.17-6.33 9.54" />
        <path d="M12.01 20.55c.67.13 1.33.2 2 .2 4.42 0 8-3.58 8-8 0-4.09-3.04-7.44-7-7.93" />
        <path d="M12.01 20.55c-.67.13-1.33.2-2 .2-4.42 0-8-3.58-8-8 0-4.09 3.04-7.44 7-7.93" />
    </svg>
);


export function GamificationProfile({ profile }: GamificationProfileProps) {
  const { level, xp, xpTarget, xpToNextLevel, heroClass: _heroClass, xpProgressPercent: _xpProgressPercent, ...attributes } = profile;
  const xpGoal = xpTarget ?? (xp + (xpToNextLevel ?? 0)) || 1;
  const normalizedXp = Math.min(xp, xpGoal);
  const xpPercentage = (normalizedXp / xpGoal) * 100;
  
  const topAttributes = Object.entries(attributes)
    .filter(([key]) => key !== 'id' && key !== 'userId')
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <Link href="/dashboard/progresso" className="block group">
      <Card className="shadow-md h-full transition-all group-hover:shadow-xl group-hover:border-primary/50">
        <CardHeader>
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div>
              <CardTitle className="font-headline text-xl flex items-center gap-2">
                Seu Progresso
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </CardTitle>
              <CardDescription>Level {level} - Clique para ver mais</CardDescription>
            </div>
                <div className="text-right w-full sm:w-1/3">
                   <p className="text-sm font-semibold">
                     {xp.toLocaleString('pt-BR')} / {xpGoal.toLocaleString('pt-BR')} XP
                   </p>
                   <Progress value={xpPercentage} className="h-2 mt-1" aria-label={`${xpPercentage.toFixed(0)}% para o próximo nível`} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <h3 className="font-headline text-lg mb-4">Top Atributos Financeiros</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {topAttributes.map(([key, value]) => {
                const isVicio = key === 'Vicios';
                const Icon = isVicio ? SkullIcon : attributeToIconMap.get(key as any);
                const maxPoints = 500; // Example max value for progress bar
                const percentage = (value / maxPoints) * 100;
                return (
                  <div key={key} className="flex flex-col gap-2 p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      {Icon && <Icon className={cn("h-6 w-6", isVicio ? "text-destructive" : "text-primary")} />}
                      <span className="font-semibold">{key}</span>
                    </div>
                     <div className="flex items-center gap-2">
                       <Progress value={percentage} className={cn("h-2 flex-1", isVicio && "[&>div]:bg-destructive")} />
                       <span className={cn("font-mono text-sm font-bold", isVicio ? "text-destructive" : "text-primary")}>{value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
        </CardContent>
      </Card>
    </Link>
  );
}
