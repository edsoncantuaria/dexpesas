'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, ShieldCheck, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type OnboardingSlide = {
    id: number;
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
    ambientColor: string;
};

const SLIDES: OnboardingSlide[] = [
    {
        id: 1,
        title: "Controle Total",
        description: "Gerencie suas finanças com precisão e clareza. Saiba exatamente para onde vai cada centavo.",
        icon: ShieldCheck,
        color: "text-emerald-500",
        ambientColor: "bg-emerald-500/30",
    },
    {
        id: 2,
        title: "Gamificação",
        description: "Transforme economia em diversão. Suba de nível, cumpra missões e ganhe recompensas.",
        icon: Trophy,
        color: "text-amber-500",
        ambientColor: "bg-amber-500/30",
    },
    {
        id: 3,
        title: "Design Premium",
        description: "Uma experiência visual incrível, fluida e intuitiva, feita para você.",
        icon: Sparkles,
        color: "text-purple-500",
        ambientColor: "bg-purple-500/30",
    },
];

interface OnboardingScreenProps {
    onLoginClick: () => void;
}

export function OnboardingScreen({ onLoginClick }: OnboardingScreenProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const progressValue = useMotionValue(0);

    const progressWidth = useTransform(progressValue, [0, 100], ['0%', '100%']);

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, []);

    const prevSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
    }, []);

    // Auto-play logic
    useEffect(() => {
        if (isPaused) return;

        const duration = 5000;
        const startTime = Date.now();

        const animateProgress = () => {
            if (isPaused) return;
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            progressValue.set(progress);

            if (progress < 100) {
                requestAnimationFrame(animateProgress);
            } else {
                nextSlide();
            }
        };

        const animationFrame = requestAnimationFrame(animateProgress);

        return () => cancelAnimationFrame(animationFrame);
    }, [currentSlide, isPaused, nextSlide, progressValue]);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 50;
        if (info.offset.x < -threshold) {
            nextSlide();
        } else if (info.offset.x > threshold) {
            prevSlide();
        }
    };

    return (
        <div
            className="flex flex-col items-center justify-center w-full max-w-md mx-auto space-y-8 relative z-10"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
        >
            {/* Ambient Background */}
            <motion.div
                animate={{
                    className: SLIDES[currentSlide].ambientColor
                }}
                transition={{ duration: 1 }}
                className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[100px] opacity-40 -z-10 pointer-events-none"
                )}
            />

            {/* Carousel Area */}
            <div className="relative w-full h-[420px] flex flex-col items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait" custom={currentSlide}>
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -100, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={handleDragEnd}
                        className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-8 p-6 cursor-grab active:cursor-grabbing"
                    >
                        {/* Icon Card */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className={cn(
                                "p-8 rounded-[2rem] bg-card/40 backdrop-blur-md border border-white/10 shadow-2xl ring-1 ring-white/5",
                                "transition-all duration-500 hover:scale-105 hover:bg-card/50"
                            )}
                        >
                            {(() => {
                                const Icon = SLIDES[currentSlide].icon;
                                return <Icon className={cn("w-28 h-28 drop-shadow-lg", SLIDES[currentSlide].color)} strokeWidth={1.5} />;
                            })()}
                        </motion.div>

                        {/* Text Content */}
                        <div className="space-y-4 max-w-xs">
                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent"
                            >
                                {SLIDES[currentSlide].title}
                            </motion.h2>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-muted-foreground text-lg leading-relaxed font-medium"
                            >
                                {SLIDES[currentSlide].description}
                            </motion.p>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Indicators & Progress */}
                <div className="absolute bottom-0 flex flex-col items-center gap-4 w-full">
                    <div className="flex gap-3">
                        {SLIDES.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className="relative h-1.5 rounded-full overflow-hidden bg-primary/20 transition-all duration-300"
                                style={{ width: currentSlide === index ? '2rem' : '0.5rem' }}
                                aria-label={`Go to slide ${index + 1}`}
                            >
                                {currentSlide === index && !isPaused && (
                                    <motion.div
                                        className="absolute inset-0 bg-primary"
                                        layoutId="progress"
                                        style={{ width: progressWidth }}
                                    />
                                )}
                                {currentSlide === index && isPaused && (
                                    <div className="absolute inset-0 bg-primary w-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="w-full space-y-4 pt-4 px-4">
                <Link href="/register" className="w-full block">
                    <Button size="lg" className="w-full text-lg h-14 rounded-2xl shadow-lg shadow-primary/20 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        Criar Conta
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>

                <Button
                    variant="ghost"
                    size="lg"
                    className="w-full text-base h-12 rounded-2xl hover:bg-card/50 transition-colors"
                    onClick={onLoginClick}
                >
                    Já tenho conta
                </Button>
            </div>
        </div>
    );
}
